import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Region } from '../users/enums/region.enum';
import { User } from '../users/user.entity';
import {
  InvoiceCategory,
  formatInvoiceNumber,
  indianFinancialYear,
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

@Injectable()
export class InvoicesService implements OnModuleInit {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
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
        issuedAt,
      });

      return manager.save(invoice);
    });
  }

  /**
   * Allocate next running serial for a category within a financial year.
   * Must run inside an active transaction with a locked sequence row.
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
    const financialYear = indianFinancialYear(issuedAt);
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
