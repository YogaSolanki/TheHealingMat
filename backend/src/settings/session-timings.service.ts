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
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
] as const;

/** Default time for the single, always-present special session slot. */
const DEFAULT_SPECIAL_LABEL = '11:30 AM';

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
    await this.ensureIsSpecialColumn();
    await this.ensureIsSundayQaColumn();
    await this.ensureIsTrialColumn();
    await this.ensureLabelUniquenessByKind();
    await this.seedDefaultsIfEmpty();
    await this.ensureSpecialTiming();
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
    const isSundayQa = Boolean(dto.isSundayQa);
    const isTrial = Boolean(dto.isTrial);
    this.assertExclusiveFlags(isSundayQa, isTrial, false);
    await this.assertLabelAvailable(label, isSundayQa, isTrial);

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
        isSpecial: false,
        isSundayQa,
        isTrial,
      }),
    );
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateSessionTimingDto) {
    const row = await this.timings.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Session time not found.');

    if (row.isSpecial) {
      if (dto.active === false) {
        throw new BadRequestException(
          'The special session timing cannot be deactivated.',
        );
      }
      if (dto.isSpecial === false) {
        throw new BadRequestException(
          'The special session timing cannot be removed. Edit its time instead.',
        );
      }
      if (dto.isSundayQa === true) {
        throw new BadRequestException(
          'The special session timing is Mon–Sat only. Add a separate Sunday Q&A time instead.',
        );
      }
      if (dto.isTrial === true) {
        throw new BadRequestException(
          'The special session timing is for membership classes. Add a separate Trial time instead.',
        );
      }
      if (dto.label !== undefined) {
        const label = normalizeTimeLabel(dto.label);
        await this.assertLabelAvailable(label, false, false, id);
        row.label = label;
      }
      row.active = true;
      row.isSpecial = true;
      row.isSundayQa = false;
      row.isTrial = false;
      const saved = await this.timings.save(row);
      return this.toResponse(saved);
    }

    if (dto.isSpecial === true) {
      throw new BadRequestException(
        'Special session timing is managed separately. Edit the Special session timing card instead.',
      );
    }

    const nextSundayQa =
      dto.isSundayQa !== undefined ? Boolean(dto.isSundayQa) : row.isSundayQa;
    const nextTrial =
      dto.isTrial !== undefined ? Boolean(dto.isTrial) : row.isTrial;
    const nextLabel =
      dto.label !== undefined ? normalizeTimeLabel(dto.label) : row.label;

    this.assertExclusiveFlags(nextSundayQa, nextTrial, false);

    if (
      nextLabel !== row.label ||
      nextSundayQa !== row.isSundayQa ||
      nextTrial !== row.isTrial
    ) {
      await this.assertLabelAvailable(nextLabel, nextSundayQa, nextTrial, id);
    }

    row.label = nextLabel;
    row.isSundayQa = nextSundayQa;
    row.isTrial = nextTrial;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.active !== undefined) row.active = dto.active;

    const saved = await this.timings.save(row);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const row = await this.timings.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Session time not found.');

    if (row.isSpecial) {
      throw new BadRequestException(
        'The special session timing cannot be deleted. Edit its time instead.',
      );
    }

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

  /** Id of the single special timing (always present after init). */
  async getSpecialTimingId(): Promise<string | null> {
    const row = await this.timings.findOne({
      where: { isSpecial: true, active: true },
    });
    return row?.id ?? null;
  }

  /** Ensure exactly one special timing exists and stays active. */
  private async ensureSpecialTiming() {
    const specials = await this.timings.find({
      where: { isSpecial: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    if (specials.length > 1) {
      for (const extra of specials.slice(1)) {
        extra.isSpecial = false;
        await this.timings.save(extra);
      }
    }

    const special = specials[0] ?? null;
    if (special) {
      let dirty = false;
      if (!special.active) {
        special.active = true;
        dirty = true;
      }
      if (special.isSundayQa) {
        special.isSundayQa = false;
        dirty = true;
      }
      if (special.isTrial) {
        special.isTrial = false;
        dirty = true;
      }
      if (dirty) await this.timings.save(special);
      return;
    }

    const preferred = await this.timings.findOne({
      where: { label: DEFAULT_SPECIAL_LABEL, isSundayQa: false, isTrial: false },
    });
    if (preferred) {
      preferred.isSpecial = true;
      preferred.active = true;
      preferred.isSundayQa = false;
      preferred.isTrial = false;
      await this.timings.save(preferred);
      return;
    }

    const maxRow = await this.timings
      .createQueryBuilder('t')
      .select('MAX(t.sortOrder)', 'max')
      .getRawOne<{ max: string | null }>();
    const sortOrder = (Number(maxRow?.max ?? Number.NaN) || -1) + 1;

    await this.timings.save(
      this.timings.create({
        label: DEFAULT_SPECIAL_LABEL,
        sortOrder,
        active: true,
        isSpecial: true,
        isSundayQa: false,
        isTrial: false,
      }),
    );
  }

  private assertExclusiveFlags(
    isSundayQa: boolean,
    isTrial: boolean,
    isSpecial: boolean,
  ) {
    if (isSundayQa && isTrial) {
      throw new BadRequestException(
        'A session time cannot be both Sunday Q&A and Trial. Create separate times.',
      );
    }
    if (isSpecial && (isSundayQa || isTrial)) {
      throw new BadRequestException(
        'The special session timing cannot also be Sunday Q&A or Trial.',
      );
    }
  }

  /**
   * Same clock time may exist once per kind: Mon–Sat membership, Trial, Sunday Q&A.
   */
  private async assertLabelAvailable(
    label: string,
    isSundayQa: boolean,
    isTrial: boolean,
    exceptId?: string,
  ) {
    const clash = await this.timings.findOne({
      where: { label, isSundayQa, isTrial },
    });
    if (clash && clash.id !== exceptId) {
      const kind = isSundayQa
        ? 'Sunday Q&A'
        : isTrial
          ? 'Trial'
          : 'Mon–Sat membership';
      throw new BadRequestException(`That ${kind} session time already exists.`);
    }
  }

  /** Drop legacy unique indexes; allow same clock for membership / trial / Sunday. */
  private async ensureLabelUniquenessByKind() {
    try {
      await this.timings.query(`
        DO $$
        DECLARE
          idx_name text;
        BEGIN
          FOR idx_name IN
            SELECT i.relname
            FROM pg_index x
            JOIN pg_class t ON t.oid = x.indrelid
            JOIN pg_class i ON i.oid = x.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (x.indkey)
            WHERE t.relname = 'session_timings'
              AND x.indisunique
              AND NOT x.indisprimary
              AND a.attname = 'label'
              AND (
                SELECT count(*) FROM unnest(x.indkey) AS k(attnum)
              ) = 1
          LOOP
            EXECUTE format('ALTER TABLE "session_timings" DROP CONSTRAINT IF EXISTS %I', idx_name);
            EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
          END LOOP;
        END $$;
      `);
    } catch {
      // Best-effort; synchronize / env may differ.
    }

    try {
      await this.timings.query(`
        DROP INDEX IF EXISTS "UQ_session_timings_label_sunday_qa"
      `);
    } catch {
      // Index may not exist.
    }

    try {
      await this.timings.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_session_timings_label_kind"
        ON "session_timings" ("label", "isSundayQa", "isTrial")
      `);
    } catch {
      // Index may already exist via synchronize.
    }
  }

  private async ensureIsSpecialColumn() {
    try {
      await this.timings.query(`
        ALTER TABLE "session_timings"
        ADD COLUMN IF NOT EXISTS "isSpecial" boolean NOT NULL DEFAULT false
      `);
    } catch {
      // Column may already exist via synchronize.
    }
  }

  private async ensureIsSundayQaColumn() {
    try {
      await this.timings.query(`
        ALTER TABLE "session_timings"
        ADD COLUMN IF NOT EXISTS "isSundayQa" boolean NOT NULL DEFAULT false
      `);
    } catch {
      // Column may already exist via synchronize.
    }
  }

  private async ensureIsTrialColumn() {
    try {
      await this.timings.query(`
        ALTER TABLE "session_timings"
        ADD COLUMN IF NOT EXISTS "isTrial" boolean NOT NULL DEFAULT false
      `);
    } catch {
      // Column may already exist via synchronize.
    }
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
          isSpecial: false,
          isSundayQa: false,
          isTrial: false,
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
      isSpecial: Boolean(row.isSpecial),
      isSundayQa: Boolean(row.isSundayQa),
      isTrial: Boolean(row.isTrial),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
