import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateScheduledClassDto,
  UpdateScheduledClassDto,
} from './dto/scheduled-class.dto';
import { ScheduledClass } from './scheduled-class.entity';
import { SessionTimingsService } from './session-timings.service';

function dayLabelFromDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    throw new BadRequestException('classDate must be YYYY-MM-DD.');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new BadRequestException('classDate is not a valid calendar date.');
  }
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function todayIsoDate() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Max calendar days ahead admins may schedule (today + 6 = 7 days). */
const MAX_SCHEDULE_AHEAD_DAYS = 6;

function assertWithinScheduleWindow(classDate: string) {
  const today = todayIsoDate();
  const max = shiftIsoDate(today, MAX_SCHEDULE_AHEAD_DAYS);
  if (classDate < today) {
    throw new BadRequestException('Cannot schedule a class on a past date.');
  }
  if (classDate > max) {
    throw new BadRequestException(
      'Classes can only be scheduled within the next 7 days.',
    );
  }
}

/** Shift a YYYY-MM-DD calendar date by `days` (can be negative). */
function shiftIsoDate(isoDate: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Past calendar days are removed as soon as a new day starts (classDate < today). */
const CLASS_RETENTION_DAYS = 0;

@Injectable()
export class ScheduledClassesService implements OnModuleInit {
  constructor(
    @InjectRepository(ScheduledClass)
    private readonly classes: Repository<ScheduledClass>,
    private readonly timings: SessionTimingsService,
  ) {}

  async onModuleInit() {
    await this.purgeExpiredClasses();
    // Hourly sweep so yesterday's classes (and links) leave the DB even if
    // no admin request hits this service after midnight.
    setInterval(() => {
      void this.purgeExpiredClasses();
    }, 60 * 60 * 1000);
  }

  async list(options?: { from?: string }) {
    await this.purgeExpiredClasses();

    const from = options?.from?.trim() || todayIsoDate();
    const rows = await this.classes
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.sessionTiming', 'timing')
      .where('c.classDate >= :from', { from })
      .orderBy('c.classDate', 'ASC')
      .addOrderBy('c.sessionTimeLabel', 'ASC')
      .getMany();

    return rows.map((row) => this.toResponse(row));
  }

  async create(dto: CreateScheduledClassDto) {
    await this.purgeExpiredClasses();

    const timing = await this.timings.requireActive(dto.sessionTimingId);
    const classDate = dto.classDate.trim().slice(0, 10);
    const dayLabel = dayLabelFromDate(classDate);
    const meetingUrl = dto.meetingUrl.trim();

    assertWithinScheduleWindow(classDate);

    const clash = await this.classes.findOne({
      where: { classDate, sessionTimingId: timing.id },
    });
    if (clash) {
      throw new BadRequestException(
        'A class is already scheduled for that date and time.',
      );
    }

    const saved = await this.classes.save(
      this.classes.create({
        classDate,
        dayLabel,
        sessionTimingId: timing.id,
        sessionTimeLabel: timing.label,
        meetingUrl,
      }),
    );
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateScheduledClassDto) {
    await this.purgeExpiredClasses();

    const row = await this.classes.findOne({
      where: { id },
      relations: { sessionTiming: true },
    });
    if (!row) throw new NotFoundException('Scheduled class not found.');

    if (dto.classDate !== undefined) {
      row.classDate = dto.classDate.trim().slice(0, 10);
      row.dayLabel = dayLabelFromDate(row.classDate);
    }

    if (dto.sessionTimingId !== undefined) {
      const timing = await this.timings.requireActive(dto.sessionTimingId);
      row.sessionTimingId = timing.id;
      row.sessionTimeLabel = timing.label;
    }

    if (dto.meetingUrl !== undefined) {
      row.meetingUrl = dto.meetingUrl.trim();
    }

    assertWithinScheduleWindow(row.classDate);

    const clash = await this.classes.findOne({
      where: {
        classDate: row.classDate,
        sessionTimingId: row.sessionTimingId,
      },
    });
    if (clash && clash.id !== id) {
      throw new BadRequestException(
        'A class is already scheduled for that date and time.',
      );
    }

    const saved = await this.classes.save(row);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const row = await this.classes.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Scheduled class not found.');
    await this.classes.remove(row);
    return { success: true };
  }

  /**
   * Prefer today's class matching `preferredLabel` (running slot),
   * else any class scheduled for today, else null.
   */
  async findLiveMeetingUrl(preferredLabel?: string | null) {
    await this.purgeExpiredClasses();

    const today = todayIsoDate();
    const todays = await this.classes.find({
      where: { classDate: today },
      order: { sessionTimeLabel: 'ASC' },
    });
    if (todays.length === 0) return null;

    if (preferredLabel) {
      const exact = todays.find(
        (row) =>
          row.sessionTimeLabel.toLowerCase() ===
          preferredLabel.trim().toLowerCase(),
      );
      if (exact?.meetingUrl?.trim()) return exact.meetingUrl.trim();
    }

    const withUrl = todays.find((row) => row.meetingUrl?.trim());
    return withUrl?.meetingUrl?.trim() || null;
  }

  /** Delete classes whose calendar day has ended (classDate before today). */
  async purgeExpiredClasses() {
    const cutoff = shiftIsoDate(todayIsoDate(), -CLASS_RETENTION_DAYS);
    await this.classes
      .createQueryBuilder()
      .delete()
      .from(ScheduledClass)
      .where('classDate < :cutoff', { cutoff })
      .execute();
  }

  private toResponse(row: ScheduledClass) {
    return {
      id: row.id,
      classDate: row.classDate,
      dayLabel: row.dayLabel,
      sessionTimingId: row.sessionTimingId,
      sessionTimeLabel: row.sessionTimeLabel,
      meetingUrl: row.meetingUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
