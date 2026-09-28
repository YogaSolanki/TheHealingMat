import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UpdateScheduledTopicDto,
  UpsertScheduledTopicDto,
} from './dto/scheduled-topic.dto';
import { ScheduledTopic } from './scheduled-topic.entity';

function dayLabelFromDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    throw new BadRequestException('topicDate must be YYYY-MM-DD.');
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
    throw new BadRequestException('topicDate is not a valid calendar date.');
  }
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function todayIsoDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

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

/** Normalize PG date / Date / ISO string to YYYY-MM-DD. */
function toIsoDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const raw = String(value).trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match?.[1] ?? raw.slice(0, 10);
}

const MAX_SCHEDULE_AHEAD_DAYS = 6;

function assertWithinScheduleWindow(topicDate: string) {
  const today = todayIsoDate();
  const max = shiftIsoDate(today, MAX_SCHEDULE_AHEAD_DAYS);
  if (topicDate < today) {
    throw new BadRequestException('Cannot schedule a topic on a past date.');
  }
  if (topicDate > max) {
    throw new BadRequestException(
      'Topics can only be scheduled within the next 7 days.',
    );
  }
}

@Injectable()
export class ScheduledTopicsService implements OnModuleInit {
  constructor(
    @InjectRepository(ScheduledTopic)
    private readonly topics: Repository<ScheduledTopic>,
  ) {}

  async onModuleInit() {
    await this.purgeExpiredTopics();
    setInterval(() => {
      void this.purgeExpiredTopics();
    }, 60 * 60 * 1000);
  }

  async list(options?: { from?: string }) {
    await this.purgeExpiredTopics();
    const from = options?.from?.trim() || todayIsoDate();
    const rows = await this.topics
      .createQueryBuilder('t')
      .where('t.topicDate >= :from', { from })
      .orderBy('t.topicDate', 'ASC')
      .getMany();
    return rows.map((row) => this.toResponse(row));
  }

  async upsert(dto: UpsertScheduledTopicDto) {
    await this.purgeExpiredTopics();
    const topicDate = dto.topicDate.trim().slice(0, 10);
    const topic = dto.topic.trim().slice(0, 200);
    if (!topic) {
      throw new BadRequestException('Topic cannot be empty.');
    }
    assertWithinScheduleWindow(topicDate);

    const existing = await this.topics.findOne({ where: { topicDate } });
    if (existing) {
      existing.topic = topic;
      existing.dayLabel = dayLabelFromDate(topicDate);
      const saved = await this.topics.save(existing);
      return this.toResponse(saved);
    }

    const saved = await this.topics.save(
      this.topics.create({
        topicDate,
        dayLabel: dayLabelFromDate(topicDate),
        topic,
      }),
    );
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateScheduledTopicDto) {
    await this.purgeExpiredTopics();
    const row = await this.topics.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Scheduled topic not found.');

    if (dto.topicDate !== undefined) {
      row.topicDate = dto.topicDate.trim().slice(0, 10);
      row.dayLabel = dayLabelFromDate(row.topicDate);
    }
    if (dto.topic !== undefined) {
      const topic = dto.topic.trim().slice(0, 200);
      if (!topic) throw new BadRequestException('Topic cannot be empty.');
      row.topic = topic;
    }

    assertWithinScheduleWindow(row.topicDate);

    const clash = await this.topics.findOne({
      where: { topicDate: row.topicDate },
    });
    if (clash && clash.id !== id) {
      throw new BadRequestException(
        'A topic is already scheduled for that date.',
      );
    }

    const saved = await this.topics.save(row);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const row = await this.topics.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Scheduled topic not found.');
    await this.topics.remove(row);
    return { success: true };
  }

  /** Topics shown on the member dashboard for today and tomorrow (IST). */
  async getTodayAndTomorrow() {
    await this.purgeExpiredTopics();
    const today = todayIsoDate();
    const tomorrow = shiftIsoDate(today, 1);
    const rows = await this.topics
      .createQueryBuilder('t')
      .where('t.topicDate IN (:...dates)', { dates: [today, tomorrow] })
      .getMany();
    const byDate = new Map(
      rows.map((row) => [toIsoDate(row.topicDate), row.topic?.trim() || '']),
    );
    return {
      todayTopic: byDate.get(today) || '',
      tomorrowTopic: byDate.get(tomorrow) || '',
    };
  }

  async purgeExpiredTopics() {
    const today = todayIsoDate();
    await this.topics
      .createQueryBuilder()
      .delete()
      .from(ScheduledTopic)
      .where('topicDate < :today', { today })
      .execute();
  }

  private toResponse(row: ScheduledTopic) {
    return {
      id: row.id,
      topicDate: toIsoDate(row.topicDate),
      dayLabel: row.dayLabel,
      topic: row.topic,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
