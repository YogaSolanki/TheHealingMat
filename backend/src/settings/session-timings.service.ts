import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateSessionTimingDto,
  UpdateSessionTimingDto,
} from './dto/session-timing.dto';
import { ScheduledClass } from './scheduled-class.entity';
import { SessionTiming } from './session-timing.entity';

const DEFAULT_TIMINGS = [
  '6:30 AM',
  '7:30 AM',
  '8:30 AM',
  '11:30 AM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
] as const;

function normalizeTimeLabel(label: string) {
  const trimmed = label.trim().replace(/\s+/g, ' ');
  const match = trimmed.match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s?(AM|PM)$/i);
  if (!match) return trimmed;
  const hour = String(Number(match[1]));
  const minutes = match[2];
  const period = match[3].toUpperCase();
  return `${hour}:${minutes} ${period}`;
}

@Injectable()
export class SessionTimingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SessionTiming)
    private readonly timings: Repository<SessionTiming>,
    @InjectRepository(ScheduledClass)
    private readonly classes: Repository<ScheduledClass>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultsIfEmpty();
  }

  async list(includeInactive = true) {
    const rows = await this.timings.find({
      where: includeInactive ? undefined : { active: true },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async create(dto: CreateSessionTimingDto) {
    const label = normalizeTimeLabel(dto.label);
    const existing = await this.timings.findOne({ where: { label } });
    if (existing) {
      throw new BadRequestException('That session time already exists.');
    }

    const maxRow = await this.timings
      .createQueryBuilder('t')
      .select('MAX(t.sortOrder)', 'max')
      .getRawOne<{ max: string | null }>();
    const sortOrder =
      dto.sortOrder ?? (Number(maxRow?.max ?? Number.NaN) || -1) + 1;

    const saved = await this.timings.save(
      this.timings.create({
        label,
        sortOrder,
        active: dto.active ?? true,
      }),
    );
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateSessionTimingDto) {
    const row = await this.timings.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Session time not found.');

    if (dto.label !== undefined) {
      const label = normalizeTimeLabel(dto.label);
      const clash = await this.timings.findOne({ where: { label } });
      if (clash && clash.id !== id) {
        throw new BadRequestException('That session time already exists.');
      }
      row.label = label;
    }
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.active !== undefined) row.active = dto.active;

    const saved = await this.timings.save(row);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const row = await this.timings.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Session time not found.');

    const used = await this.classes.count({ where: { sessionTimingId: id } });
    if (used > 0) {
      throw new BadRequestException(
        'This time is used by scheduled classes. Deactivate it or remove those classes first.',
      );
    }

    await this.timings.remove(row);
    return { success: true };
  }

  async requireActive(id: string) {
    const row = await this.timings.findOne({ where: { id, active: true } });
    if (!row) {
      throw new BadRequestException(
        'Choose an active session time from Settings.',
      );
    }
    return row;
  }

  private async seedDefaultsIfEmpty() {
    const count = await this.timings.count();
    if (count > 0) return;

    await this.timings.save(
      DEFAULT_TIMINGS.map((label, index) =>
        this.timings.create({
          label,
          sortOrder: index,
          active: true,
        }),
      ),
    );
  }

  private toResponse(row: SessionTiming) {
    return {
      id: row.id,
      label: row.label,
      sortOrder: row.sortOrder,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
