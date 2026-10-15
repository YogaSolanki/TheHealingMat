import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { Region } from '../users/enums/region.enum';
import { User } from '../users/user.entity';
import {
  INVOICE_CATEGORIES,
  InvoiceCategory,
  formatInvoiceNumber,
  invoiceCategoryCode,
  invoiceCategoryLabel,
  isValidFinancialYearLabel,
} from './invoice-category';
import { Invoice } from './invoice.entity';
import { InvoiceSequence } from './invoice-sequence.entity';
import { Membership } from './membership.entity';

export type IssueMembershipInvoiceInput = {
  membership: Membership;
  user: User;
  paymentMethod: string;
  paymentReference: string | null;
  discountLabel?: string | null;
  /** Defaults from user.region (DM / EX). Pass Corporate for CO invoices. */
  category?: InvoiceCategory;
};

export type IssueCorporatePlanInvoiceInput = {
  corporatePlanId: string;
  companyId: string;
  companyName: string;
  currency: string;
  listPricePaise: number;
  discountPaise: number;
  /** Invoice total (company share). Not re-allocated when status flips to paid. */
  amountPaidPaise: number;
  paymentMethod: string | null;
  paymentReference: string | null;
  discountLabel?: string | null;
  issuedAt?: Date;
  /** Default unpaid — corporate invoices first, payment later. */
  paymentStatus?: 'unpaid' | 'paid';
  poNumber?: string | null;
  poDate?: string | null;
};

export type MarkCorporateInvoicePaidInput = {
  corporatePlanId: string;
  paymentMethod: string;
  paymentReference: string;
  paidAt?: Date;
};

@Injectable()
export class InvoicesService implements OnModuleInit {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(InvoiceSequence)
    private readonly sequences: Repository<InvoiceSequence>,
  ) {}

  async onModuleInit() {
    // Production DBs may lack these until synchronize/migration runs.
    try {
      await this.dataSource.query(`
        ALTER TABLE "memberships"
        ADD COLUMN IF NOT EXISTS "paymentMethod" varchar NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "memberships"
        ADD COLUMN IF NOT EXISTS "adminNote" text NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "membershipWhatsAppSentAt" timestamptz NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "membershipEmailSentAt" timestamptz NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "paymentStatus" varchar(16) DEFAULT 'paid'
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "paidAt" timestamptz NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "poNumber" varchar(120) NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "poDate" date NULL
      `);
    } catch (err) {
      this.logger.warn(
        `Could not ensure membership invoice columns: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  categoryForUserRegion(region: Region): InvoiceCategory {
    return region === Region.OutsideIndia
      ? InvoiceCategory.Export
      : InvoiceCategory.Domestic;
  }

  async findById(id: string) {
    return this.invoices.findOne({ where: { id } });
  }

  async findByMembershipId(membershipId: string) {
    return this.invoices.findOne({ where: { membershipId } });
  }

  async findByMembershipIds(membershipIds: string[]) {
    if (membershipIds.length === 0) return [];
    return this.invoices
      .createQueryBuilder('invoice')
      .where('invoice.membershipId IN (:...ids)', { ids: membershipIds })
      .getMany();
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    return this.invoices.findOne({ where: { invoiceNumber } });
  }

  /**
   * Issue (or return existing) invoice for a paid membership.
   * Returns null when amount paid is zero — no invoice / no serial consumed.
   */
  async ensureMembershipInvoice(
    input: IssueMembershipInvoiceInput,
  ): Promise<Invoice | null> {
    const { membership, user } = input;
    if (membership.amountPaidPaise <= 0) {
      return null;
    }

    const existing = await this.invoices.findOne({
      where: { membershipId: membership.id },
    });
    if (existing) return existing;

    const category =
      input.category ?? this.categoryForUserRegion(user.region);
    const issuedAt = membership.createdAt ?? new Date();

    return this.dataSource.transaction(async (manager) => {
      const again = await manager.findOne(Invoice, {
        where: { membershipId: membership.id },
      });
      if (again) return again;

      const allocated = await this.allocateNumber(category, issuedAt, manager);

      const invoice = manager.create(Invoice, {
        invoiceNumber: allocated.invoiceNumber,
        category,
        financialYear: allocated.financialYear,
        serial: allocated.serial,
        membershipId: membership.id,
        userId: user.id,
        currency: membership.currency || 'INR',
        listPricePaise: membership.listPricePaise,
        discountPaise: membership.discountPaise,
        amountPaidPaise: membership.amountPaidPaise,
        paymentReference: input.paymentReference,
        paymentMethod: input.paymentMethod,
        discountLabel: input.discountLabel?.trim() || null,
        paymentStatus: 'paid',
        paidAt: issuedAt,
        poNumber: null,
        poDate: null,
        issuedAt,
      });

      return manager.save(invoice);
    });
  }

  /**
   * Issue (or return existing) CO-sequence invoice for a corporate plan.
   * Allocates a number once. Later mark-paid updates the same row — never a new serial.
   * Returns null when company amount is zero.
   */
  async ensureCorporatePlanInvoice(
    input: IssueCorporatePlanInvoiceInput,
  ): Promise<Invoice | null> {
    if (input.amountPaidPaise <= 0) {
      return null;
    }

    const existing = await this.invoices.findOne({
      where: { corporatePlanId: input.corporatePlanId },
    });
    if (existing) return existing;

    const issuedAt = input.issuedAt ?? new Date();
    const category = InvoiceCategory.Corporate;
    const paymentStatus = input.paymentStatus ?? 'unpaid';
    const poNumber = input.poNumber?.trim() || null;
    const poDate = input.poDate?.trim() || null;

    return this.dataSource.transaction(async (manager) => {
      const again = await manager.findOne(Invoice, {
        where: { corporatePlanId: input.corporatePlanId },
      });
      if (again) return again;

      const allocated = await this.allocateNumber(category, issuedAt, manager);

      const invoice = manager.create(Invoice, {
        invoiceNumber: allocated.invoiceNumber,
        category,
        financialYear: allocated.financialYear,
        serial: allocated.serial,
        membershipId: null,
        corporatePlanId: input.corporatePlanId,
        companyId: input.companyId,
        userId: null,
        billToName: input.companyName,
        currency: input.currency || 'INR',
        listPricePaise: input.listPricePaise,
        discountPaise: input.discountPaise,
        amountPaidPaise: input.amountPaidPaise,
        paymentReference: input.paymentReference,
        paymentMethod: input.paymentMethod,
        discountLabel: input.discountLabel?.trim() || null,
        paymentStatus,
        paidAt: paymentStatus === 'paid' ? issuedAt : null,
        poNumber,
        poDate,
        issuedAt,
      });

      return manager.save(invoice);
    });
  }

  /**
   * Flip an existing corporate invoice unpaid → paid on the same invoice number.
   * Does not allocate a new serial.
   */
  async markCorporateInvoicePaid(
    input: MarkCorporateInvoicePaidInput,
  ): Promise<Invoice> {
    const method = input.paymentMethod.trim();
    const reference = input.paymentReference.trim();
    if (method.length < 2) {
      throw new BadRequestException('Payment method is required.');
    }
    if (reference.length < 2) {
      throw new BadRequestException('Payment reference is required.');
    }

    const invoice = await this.invoices.findOne({
      where: { corporatePlanId: input.corporatePlanId },
    });
    if (!invoice) {
      throw new BadRequestException('No invoice found for this corporate plan.');
    }

    if (invoice.paymentStatus === 'paid') {
      invoice.paymentMethod = method;
      invoice.paymentReference = reference;
      if (!invoice.paidAt) {
        invoice.paidAt = input.paidAt ?? new Date();
      }
      return this.invoices.save(invoice);
    }

    invoice.paymentStatus = 'paid';
    invoice.paymentMethod = method;
    invoice.paymentReference = reference;
    invoice.paidAt = input.paidAt ?? new Date();
    return this.invoices.save(invoice);
  }

  async findByCorporatePlanId(corporatePlanId: string) {
    return this.invoices.findOne({ where: { corporatePlanId } });
  }

  /** Admin private-space overview of FY + next numbers for DM / EX / CO. */
  async getInvoiceSeriesOverview() {
    const fy = await this.settings.getActiveInvoiceFinancialYear();
    const sequences = [];
    for (const category of INVOICE_CATEGORIES) {
      const row = await this.ensureSequenceRow(fy.financialYear, category);
      sequences.push({
        category,
        code: invoiceCategoryCode(category),
        label: invoiceCategoryLabel(category),
        financialYear: row.financialYear,
        nextSerial: row.nextSerial,
        nextInvoiceNumber: formatInvoiceNumber(
          row.financialYear,
          category,
          row.nextSerial,
        ),
        updatedAt: row.updatedAt.toISOString(),
      });
    }

    return {
      computedFinancialYear: fy.computedFinancialYear,
      activeFinancialYear: fy.financialYear,
      financialYearOverride: fy.override,
      autoReset:
        'When no override is set, the financial year advances automatically on 1 April (Asia/Kolkata). Each category (DM, EX, CO) restarts at 000001 for the new year.',
      sequences,
    };
  }

  async setFinancialYearOverride(override: string | null) {
    await this.settings.setInvoiceFinancialYearOverride(override);
    return this.getInvoiceSeriesOverview();
  }

  /**
   * Set the next serial that will be issued for a category in a FY.
   * Does not rewrite already-issued invoice numbers.
   */
  async setNextSerial(input: {
    category: InvoiceCategory;
    nextSerial: number;
    financialYear?: string;
  }) {
    const nextSerial = Math.floor(Number(input.nextSerial));
    if (!Number.isFinite(nextSerial) || nextSerial < 1) {
      throw new BadRequestException('Next serial must be a whole number ≥ 1.');
    }
    if (nextSerial > 999999) {
      throw new BadRequestException('Next serial cannot exceed 999999.');
    }

    const fy =
      input.financialYear?.trim() ||
      (await this.settings.getActiveInvoiceFinancialYear()).financialYear;
    if (!isValidFinancialYearLabel(fy)) {
      throw new BadRequestException(
        'Financial year must look like 26-27 (two-digit Apr–Mar label).',
      );
    }
    if (!INVOICE_CATEGORIES.includes(input.category)) {
      throw new BadRequestException('Unknown invoice category.');
    }

    await this.dataSource.transaction(async (manager) => {
      const seqRepo = manager.getRepository(InvoiceSequence);
      let seq = await seqRepo.findOne({
        where: { financialYear: fy, category: input.category },
        lock: { mode: 'pessimistic_write' },
      });
      if (!seq) {
        seq = seqRepo.create({
          financialYear: fy,
          category: input.category,
          nextSerial,
        });
      } else {
        seq.nextSerial = nextSerial;
      }
      await seqRepo.save(seq);
    });

    return this.getInvoiceSeriesOverview();
  }

  private async ensureSequenceRow(
    financialYear: string,
    category: InvoiceCategory,
  ): Promise<InvoiceSequence> {
    let seq = await this.sequences.findOne({
      where: { financialYear, category },
    });
    if (seq) return seq;
    try {
      await this.sequences.insert({
        financialYear,
        category,
        nextSerial: 1,
      });
    } catch {
      // Concurrent create — read below.
    }
    seq = await this.sequences.findOne({
      where: { financialYear, category },
    });
    if (!seq) {
      throw new Error(
        `Unable to create invoice sequence for ${financialYear}/${category}`,
      );
    }
    return seq;
  }

  /**
   * Allocate next running serial for a category within a financial year.
   * Must run inside an active transaction with a locked sequence row.
   * FY comes from admin override (if set) or Asia/Kolkata Indian FY for issuedAt.
   */
  async allocateNumber(
    category: InvoiceCategory,
    issuedAt: Date,
    manager: EntityManager,
  ): Promise<{
    invoiceNumber: string;
    financialYear: string;
    serial: number;
  }> {
    const { financialYear } =
      await this.settings.getActiveInvoiceFinancialYear(issuedAt);
    const seqRepo = manager.getRepository(InvoiceSequence);

    let seq = await seqRepo.findOne({
      where: { financialYear, category },
      lock: { mode: 'pessimistic_write' },
    });

    if (!seq) {
      try {
        await seqRepo.insert({
          financialYear,
          category,
          nextSerial: 1,
        });
      } catch {
        // Concurrent insert — row now exists; lock it below.
      }
      seq = await seqRepo.findOne({
        where: { financialYear, category },
        lock: { mode: 'pessimistic_write' },
      });
      if (!seq) {
        throw new Error(
          `Unable to allocate invoice sequence for ${financialYear}/${category}`,
        );
      }
    }

    const serial = seq.nextSerial;
    seq.nextSerial = serial + 1;
    await seqRepo.save(seq);

    return {
      invoiceNumber: formatInvoiceNumber(financialYear, category, serial),
      financialYear,
      serial,
    };
  }
}
