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

function isSundayDate(isoDate: string) {
  return dayLabelFromDate(isoDate) === 'Sunday';
}

function assertTimingMatchesDay(
  timing: { isSpecial?: boolean; isSundayQa?: boolean; label: string },
  classDate: string,
) {
  const sunday = isSundayDate(classDate);
  if (sunday && !timing.isSundayQa) {
    throw new BadRequestException(
      'On Sunday only Sunday Q&A session times can be scheduled.',
    );
  }
  if (!sunday && timing.isSundayQa) {
    throw new BadRequestException(
      'Sunday Q&A session times can only be scheduled on Sunday.',
    );
  }
}

/** Calendar "today" in Asia/Kolkata (class schedule business timezone). */
function todayIsoDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const SESSION_DURATION_MINUTES = 60;
const SPECIAL_SESSION_DURATION_MINUTES = 30;
const JOIN_EARLY_MINUTES = 15;
/** Ignore client clocks that are wildly wrong; fall back to server time. */
const CLIENT_CLOCK_SKEW_MS = 5 * 60 * 1000;

function parseSlotLabelMinutes(label: string): number | null {
  const match = label
    .trim()
    .replace(/\s+/g, ' ')
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function durationForMinutes(minutes: number) {
  const hour = Math.floor(minutes / 60);
  return hour >= 11 && hour < 12
    ? SPECIAL_SESSION_DURATION_MINUTES
    : SESSION_DURATION_MINUTES;
}

function istMinutesSinceMidnight(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  let hours = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minutes = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  // Some engines report midnight as 24.
  if (hours === 24) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Prefer client `at` when it is a valid time close to the server clock.
 * Always evaluate the join window in Asia/Kolkata.
 */
function resolveAt(atIso?: string | null) {
  const serverNow = new Date();
  if (!atIso?.trim()) return serverNow;
  const parsed = new Date(atIso);
  if (Number.isNaN(parsed.getTime())) return serverNow;
  if (Math.abs(parsed.getTime() - serverNow.getTime()) > CLIENT_CLOCK_SKEW_MS) {
    return serverNow;
  }
  return parsed;
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
    await this.ensureIsSpecialColumn();
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
    const specialTimingId = await this.timings.getSpecialTimingId();
    const rows = await this.classes
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.sessionTiming', 'timing')
      .where('c.classDate >= :from', { from })
      .orderBy('c.classDate', 'ASC')
      .addOrderBy('c.sessionTimeLabel', 'ASC')
      .getMany();

    return rows.map((row) =>
      this.toResponse(row, {
        isSpecial: Boolean(
          row.sessionTiming?.isSpecial ||
            row.isSpecial ||
            (specialTimingId && row.sessionTimingId === specialTimingId),
        ),
        isSundayQa: Boolean(row.sessionTiming?.isSundayQa),
      }),
    );
  }

  async create(dto: CreateScheduledClassDto) {
    await this.purgeExpiredClasses();

    const timing = await this.timings.requireActive(dto.sessionTimingId);
    const classDate = dto.classDate.trim().slice(0, 10);
    const dayLabel = dayLabelFromDate(classDate);
    const meetingUrl = dto.meetingUrl.trim();

    assertWithinScheduleWindow(classDate);
    assertTimingMatchesDay(timing, classDate);

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
        // Mirrored from timing for older rows; responses derive from timing.
        isSpecial: Boolean(timing.isSpecial),
      }),
    );
    return this.toResponse(saved, {
      isSpecial: Boolean(timing.isSpecial),
      isSundayQa: Boolean(timing.isSundayQa),
    });
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

    let timingIsSpecial = Boolean(row.sessionTiming?.isSpecial);
    let timingIsSundayQa = Boolean(row.sessionTiming?.isSundayQa);
    if (dto.sessionTimingId !== undefined) {
      const timing = await this.timings.requireActive(dto.sessionTimingId);
      row.sessionTimingId = timing.id;
      row.sessionTimeLabel = timing.label;
      row.isSpecial = Boolean(timing.isSpecial);
      timingIsSpecial = Boolean(timing.isSpecial);
      timingIsSundayQa = Boolean(timing.isSundayQa);
    }

    if (dto.meetingUrl !== undefined) {
      row.meetingUrl = dto.meetingUrl.trim();
    }

    assertWithinScheduleWindow(row.classDate);
    assertTimingMatchesDay(
      {
        label: row.sessionTimeLabel,
        isSpecial: timingIsSpecial,
        isSundayQa: timingIsSundayQa,
      },
      row.classDate,
    );

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
    return this.toResponse(saved, {
      isSpecial: timingIsSpecial,
      isSundayQa: timingIsSundayQa,
    });
  }

  async remove(id: string) {
    const row = await this.classes.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Scheduled class not found.');
    await this.classes.remove(row);
    return { success: true };
  }

  /**
   * Resolve the live meeting URL from today's Class Management schedule
   * using the current clock (client `at` if within skew, else server IST).
   * Only returns a URL when that scheduled class still exists and has a meeting link.
   * Never trusts a client-provided slot label or a global fallback URL.
   */
  async findLiveSessionAt(atIso?: string | null) {
    await this.purgeExpiredClasses();

    const at = resolveAt(atIso);
    const day = todayIsoDate(at);
    const minutesNow = istMinutesSinceMidnight(at);
    const todays = await this.classes.find({
      where: { classDate: day },
      relations: { sessionTiming: true },
      order: { sessionTimeLabel: 'ASC' },
    });

    if (todays.length === 0) {
      return {
        url: null as string | null,
        slot: null as string | null,
        next: null as { label: string; when: 'today' | 'tomorrow' } | null,
      };
    }

    const allSlots = todays
      .map((row) => {
        const minutes = parseSlotLabelMinutes(row.sessionTimeLabel);
        if (minutes == null) return null;
        // Regular, Special (Mon–Sat), and Sunday Q&A are all joinable.
        const isSpecial = Boolean(
          row.sessionTiming?.isSpecial || row.isSpecial,
        );
        const isSundayQa = Boolean(row.sessionTiming?.isSundayQa);
        return {
          label: row.sessionTimeLabel,
          minutes,
          durationMinutes:
            isSpecial || isSundayQa
              ? SPECIAL_SESSION_DURATION_MINUTES
              : durationForMinutes(minutes),
          meetingUrl: row.meetingUrl?.trim() || null,
          isSpecial,
          isSundayQa,
        };
      })
      .filter(
        (
          slot,
        ): slot is {
          label: string;
          minutes: number;
          durationMinutes: number;
          meetingUrl: string | null;
          isSpecial: boolean;
          isSundayQa: boolean;
        } => slot != null,
      )
      .sort((a, b) => a.minutes - b.minutes);

    // Prefer the latest-starting open window so Special / Q&A win when
    // join windows overlap an earlier regular slot.
    const openSlots = allSlots.filter((slot) => {
      const openAt = slot.minutes - JOIN_EARLY_MINUTES;
      const closeAt = slot.minutes + slot.durationMinutes;
      return minutesNow >= openAt && minutesNow < closeAt;
    });
    const running =
      openSlots.length === 0
        ? null
        : openSlots.reduce((best, slot) =>
            slot.minutes >= best.minutes ? slot : best,
          );

    if (running) {
      return {
        url: running.meetingUrl,
        slot: running.label,
        next: null as { label: string; when: 'today' | 'tomorrow' } | null,
      };
    }

    const upcomingToday = allSlots.find(
      (slot) => slot.minutes - JOIN_EARLY_MINUTES > minutesNow,
    );
    if (upcomingToday) {
      return {
        url: null as string | null,
        slot: null as string | null,
        next: { label: upcomingToday.label, when: 'today' as const },
      };
    }

    return {
      url: null as string | null,
      slot: null as string | null,
      next: allSlots[0]
        ? { label: allSlots[0].label, when: 'tomorrow' as const }
        : null,
    };
  }

  /** @deprecated Prefer findLiveSessionAt — kept for any leftover callers. */
  async findLiveMeetingUrl(preferredLabel?: string | null) {
    const live = await this.findLiveSessionAt(null);
    if (preferredLabel?.trim() && live.slot) {
      if (
        live.slot.toLowerCase() === preferredLabel.trim().toLowerCase()
      ) {
        return live.url;
      }
    }
    return live.url;
  }

  /** Session times actually scheduled for today (Class Management). */
  async listToday() {
    await this.purgeExpiredClasses();
    const today = todayIsoDate();
    const todays = await this.listTodayRows();
    const specialTimingId = await this.timings.getSpecialTimingId();
    const seen = new Set<string>();
    const sessions: {
      id: string;
      sessionTimingId: string;
      sessionTimeLabel: string;
      isSpecial: boolean;
      isSundayQa: boolean;
    }[] = [];

    for (const row of todays) {
      const key = row.sessionTimeLabel.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const isSundayQa = Boolean(row.sessionTiming?.isSundayQa);
      sessions.push({
        id: row.id,
        sessionTimingId: row.sessionTimingId,
        sessionTimeLabel: row.sessionTimeLabel,
        isSpecial: Boolean(
          row.sessionTiming?.isSpecial ||
            row.isSpecial ||
            (specialTimingId && row.sessionTimingId === specialTimingId),
        ),
        isSundayQa,
      });
    }

    return {
      date: today,
      dayLabel: dayLabelFromDate(today),
      sessions,
    };
  }

  private async listTodayRows() {
    const today = todayIsoDate();
    return this.classes.find({
      where: { classDate: today },
      relations: { sessionTiming: true },
      order: { sessionTimeLabel: 'ASC' },
    });
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

  private async ensureIsSpecialColumn() {
    try {
      await this.classes.query(`
        ALTER TABLE "scheduled_classes"
        ADD COLUMN IF NOT EXISTS "isSpecial" boolean NOT NULL DEFAULT false
      `);
    } catch {
      // Column may already exist via synchronize.
    }
  }

  private toResponse(
    row: ScheduledClass,
    flags?: { isSpecial?: boolean; isSundayQa?: boolean },
  ) {
    return {
      id: row.id,
      classDate: row.classDate,
      dayLabel: row.dayLabel,
      sessionTimingId: row.sessionTimingId,
      sessionTimeLabel: row.sessionTimeLabel,
      meetingUrl: row.meetingUrl,
      isSpecial:
        flags?.isSpecial ??
        Boolean(row.sessionTiming?.isSpecial) ??
        Boolean(row.isSpecial),
      isSundayQa:
        flags?.isSundayQa ?? Boolean(row.sessionTiming?.isSundayQa),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
