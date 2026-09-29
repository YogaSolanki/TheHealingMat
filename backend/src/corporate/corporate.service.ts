import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { CouponsService } from '../coupons/coupons.service';
import { Coupon } from '../coupons/coupon.entity';
import { sendResendEmail } from '../mail/resend';
import { buildMembershipInvoicePdf } from '../payments/invoice-pdf';
import { InvoicesService } from '../payments/invoices.service';
import { MembershipPlansService } from '../payments/membership-plans.service';
import { OtpChallenge } from '../users/otp-challenge.entity';
import { Region } from '../users/enums/region.enum';
import { User } from '../users/user.entity';
import { Company } from './company.entity';
import { CorporateDomainVerification } from './corporate-domain-verification.entity';
import { CorporatePlan } from './corporate-plan.entity';
import {
  CreateCompanyDto,
  CreateCorporatePlanDto,
  RequestCorporateCouponOtpDto,
  UpdateCompanyDto,
  VerifyCorporateCouponOtpDto,
} from './dto/corporate.dto';

const OTP_TTL_SECONDS = 10 * 60;
const DOMAIN_VERIFY_TTL_MS = 30 * 60 * 1000;
const BCRYPT_ROUNDS = 12;
const OTP_MAX_SENDS_PER_DAY = 4;

@Injectable()
export class CorporateService implements OnModuleInit {
  private readonly logger = new Logger(CorporateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly coupons: CouponsService,
    private readonly invoices: InvoicesService,
    private readonly membershipPlans: MembershipPlansService,
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    @InjectRepository(CorporatePlan)
    private readonly plans: Repository<CorporatePlan>,
    @InjectRepository(CorporateDomainVerification)
    private readonly verifications: Repository<CorporateDomainVerification>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(OtpChallenge)
    private readonly otpChallenges: Repository<OtpChallenge>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        ALTER TABLE "coupons"
        ADD COLUMN IF NOT EXISTS "allowedDomains" text NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "coupons"
        ADD COLUMN IF NOT EXISTS "corporatePlanId" uuid NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "coupon_redemptions"
        ADD COLUMN IF NOT EXISTS "verifiedEmail" varchar NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "corporatePlanId" uuid NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "companyId" uuid NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "billToName" varchar NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "payment_orders"
        ADD COLUMN IF NOT EXISTS "verifiedEmail" varchar NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "payment_orders"
        ADD COLUMN IF NOT EXISTS "domainVerificationId" uuid NULL
      `);
    } catch (err) {
      this.logger.warn(
        `Could not ensure corporate schema columns: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async listCompanies() {
    const rows = await this.companies.find({ order: { createdAt: 'DESC' } });
    const planCounts = await this.plans
      .createQueryBuilder('plan')
      .select('plan.companyId', 'companyId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('plan.companyId')
      .getRawMany<{ companyId: string; count: string }>();
    const countByCompany = new Map(
      planCounts.map((row) => [row.companyId, Number(row.count) || 0]),
    );

    return {
      companies: rows.map((company) =>
        this.toCompanyRow(company, countByCompany.get(company.id) ?? 0),
      ),
    };
  }

  async getCompany(id: string) {
    const company = await this.requireCompany(id);
    const plans = await this.plans.find({
      where: { companyId: id },
      order: { createdAt: 'DESC' },
    });
    const detailed = [];
    for (const plan of plans) {
      detailed.push(await this.toPlanDetail(plan, company));
    }
    return {
      company: this.toCompanyDetail(company),
      plans: detailed,
    };
  }

  async createCompany(dto: CreateCompanyDto) {
    const companyName = dto.companyName.trim().replace(/\s+/g, ' ');
    const domains = this.normalizeDomains(dto.domains);
    if (domains.length === 0) {
      throw new BadRequestException('Add at least one company email domain.');
    }

    const company = await this.companies.save(
      this.companies.create({
        companyName,
        domains,
        gstNumber: dto.gstNumber?.trim() || null,
        state: dto.state?.trim() || null,
        billingEmail: dto.billingEmail?.trim().toLowerCase() || null,
        billingPhone: dto.billingPhone?.trim() || null,
        billingAddress: dto.billingAddress?.trim() || null,
      }),
    );
    return this.getCompany(company.id);
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = await this.requireCompany(id);
    if (dto.companyName != null) {
      company.companyName = dto.companyName.trim().replace(/\s+/g, ' ');
    }
    if (dto.domains != null) {
      const domains = this.normalizeDomains(dto.domains);
      if (domains.length === 0) {
        throw new BadRequestException('Add at least one company email domain.');
      }
      company.domains = domains;
    }
    if (dto.gstNumber !== undefined) {
      company.gstNumber = dto.gstNumber?.trim() || null;
    }
    if (dto.state !== undefined) {
      company.state = dto.state?.trim() || null;
    }
    if (dto.billingEmail !== undefined) {
      company.billingEmail = dto.billingEmail?.trim().toLowerCase() || null;
    }
    if (dto.billingPhone !== undefined) {
      company.billingPhone = dto.billingPhone?.trim() || null;
    }
    if (dto.billingAddress !== undefined) {
      company.billingAddress = dto.billingAddress?.trim() || null;
    }
    await this.companies.save(company);
    return this.getCompany(id);
  }

  async createPlan(companyId: string, dto: CreateCorporatePlanDto) {
    const company = await this.requireCompany(companyId);
    const catalog = await this.membershipPlans.requireActiveByMonths(
      dto.planMonths,
    );
    const employeeCount = dto.employeeCount;
    const companyPayPercent = dto.companyPayPercent;
    const listPricePerSeatPaise = catalog.listPricePaise;
    const totalListPricePaise = listPricePerSeatPaise * employeeCount;
    const companyAmountPaise = Math.round(
      (totalListPricePaise * companyPayPercent) / 100,
    );

    if (companyAmountPaise > 0) {
      if (!dto.paymentMethod?.trim() || !dto.paymentRef?.trim()) {
        throw new BadRequestException(
          'Payment method and reference are required when the company pays an amount.',
        );
      }
    }
    if (!dto.adminNote?.trim() || dto.adminNote.trim().length < 3) {
      throw new BadRequestException('Admin note is required.');
    }

    const billingLocation =
      dto.billingLocation?.trim() || company.state?.trim() || '';
    if (billingLocation.length < 2) {
      throw new BadRequestException(
        'Enter the company state / billing location for the invoice.',
      );
    }
    if (!company.state?.trim()) {
      company.state = billingLocation;
      await this.companies.save(company);
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid start date.');
    }
    const endsAt = new Date(startsAt.getTime());
    endsAt.setMonth(endsAt.getMonth() + dto.planMonths);

    const plan = await this.plans.save(
      this.plans.create({
        companyId: company.id,
        planMonths: dto.planMonths,
        planName: catalog.name || `${dto.planMonths}-Month Corporate Plan`,
        employeeCount,
        companyPayPercent,
        currency: 'INR',
        listPricePerSeatPaise,
        totalListPricePaise,
        companyAmountPaise,
        paymentMethod: dto.paymentMethod.trim(),
        paymentRef: dto.paymentRef.trim(),
        adminNote: dto.adminNote.trim(),
        couponId: null,
        invoiceId: null,
        invoiceNumber: null,
        startsAt,
        endsAt,
        status: 'confirmed',
      }),
    );

    // Employee coupon % = company share (user pays the rest).
    const coupon = await this.coupons.createCorporatePlanCoupon({
      companyName: company.companyName,
      planMonths: dto.planMonths,
      discountPercent: companyPayPercent,
      maxUses: employeeCount,
      allowedDomains: company.domains,
      corporatePlanId: plan.id,
    });
    plan.couponId = coupon.id;

    const companyDiscountPaise = Math.max(
      0,
      totalListPricePaise - companyAmountPaise,
    );
    const invoice = await this.invoices.ensureCorporatePlanInvoice({
      corporatePlanId: plan.id,
      companyId: company.id,
      companyName: company.companyName,
      currency: 'INR',
      listPricePaise: totalListPricePaise,
      discountPaise: companyDiscountPaise,
      amountPaidPaise: companyAmountPaise,
      paymentMethod: plan.paymentMethod || 'Other',
      paymentReference: plan.paymentRef,
      discountLabel:
        companyPayPercent < 100
          ? `Employee share ${100 - companyPayPercent}%`
          : 'Full company payment',
      issuedAt: new Date(),
    });
    if (invoice) {
      plan.invoiceId = invoice.id;
      plan.invoiceNumber = invoice.invoiceNumber;
    }

    await this.plans.save(plan);
    return this.getCompany(companyId);
  }

  async downloadPlanInvoice(companyId: string, planId: string) {
    const company = await this.requireCompany(companyId);
    const plan = await this.plans.findOne({
      where: { id: planId, companyId },
    });
    if (!plan) throw new NotFoundException('Corporate plan not found.');
    if (!plan.invoiceNumber || plan.companyAmountPaise <= 0) {
      throw new NotFoundException('No invoice for this corporate plan.');
    }

    const invoice =
      (await this.invoices.findByCorporatePlanId(plan.id)) ??
      (await this.invoices.findByInvoiceNumber(plan.invoiceNumber));
    if (!invoice) throw new NotFoundException('Invoice not found.');

    const pdf = await buildMembershipInvoicePdf({
      invoiceNo: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      paidAt: invoice.issuedAt,
      memberName: company.companyName,
      memberEmail: company.billingEmail,
      memberMobile: company.billingPhone,
      memberLocation: company.state,
      isInternational: false,
      planName: plan.planName,
      planMonths: plan.planMonths,
      listPricePaise: invoice.listPricePaise,
      discountPaise: invoice.discountPaise,
      discountLabel: invoice.discountLabel,
      amountPaidPaise: invoice.amountPaidPaise,
      currency: 'INR',
      paymentRef: invoice.paymentReference,
      paymentMethod: invoice.paymentMethod || 'Other',
      startsAt: plan.startsAt ?? invoice.issuedAt,
      endsAt: plan.endsAt ?? invoice.issuedAt,
      quantity: plan.employeeCount,
      unitPricePaise: plan.listPricePerSeatPaise,
    });

    return {
      pdf,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  }

  // ─── Member: domain OTP for corporate coupons ───────────────────────────

  /** Temporary fixed OTP until real domain email delivery is enabled. */
  private readonly corporateDomainOtp = '1111';

  async inspectCorporateCoupon(userId: string, couponCode: string) {
    const coupon = await this.coupons.findByCode(couponCode);
    if (!coupon || !this.coupons.isCorporateCoupon(coupon)) {
      return { isCorporate: false as const };
    }

    if (!coupon.active) {
      throw new BadRequestException('Invalid coupon');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid coupon');
    }
    if (coupon.usageCount >= coupon.maxUses) {
      throw new BadRequestException('Invalid coupon');
    }
    const alreadyUsed = await this.coupons
      .listRedemptionsForCoupon(coupon.id)
      .then((rows) => rows.some((row) => row.userId === userId));
    if (alreadyUsed) {
      throw new BadRequestException('Invalid coupon');
    }

    let planMonths: number | null = null;
    let planName: string | null = null;
    let companyName: string | null = null;
    let employeeCount: number | null = null;
    if (coupon.corporatePlanId) {
      const plan = await this.plans.findOne({
        where: { id: coupon.corporatePlanId },
      });
      if (plan) {
        planMonths = plan.planMonths;
        planName = plan.planName;
        employeeCount = plan.employeeCount;
        const company = await this.companies.findOne({
          where: { id: plan.companyId },
        });
        companyName = company?.companyName ?? null;
      }
    }

    return {
      isCorporate: true as const,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountLabel: coupon.discountLabel,
      allowedDomains: coupon.allowedDomains ?? [],
      planMonths,
      planName,
      companyName,
      employeeCount,
      remainingUses: Math.max(0, coupon.maxUses - coupon.usageCount),
    };
  }

  async requestCouponDomainOtp(userId: string, dto: RequestCorporateCouponOtpDto) {
    const coupon = await this.requireOpenCorporateCoupon(dto.couponCode);
    const email = dto.email.trim().toLowerCase();
    this.assertEmailMatchesDomains(email, coupon.allowedDomains ?? []);

    // Soft redeemability check without requiring verification id yet.
    if (!coupon.active || coupon.usageCount >= coupon.maxUses) {
      throw new BadRequestException('Invalid coupon');
    }
    const alreadyUsed = await this.coupons
      .listRedemptionsForCoupon(coupon.id)
      .then((rows) => rows.some((row) => row.userId === userId));
    if (alreadyUsed) {
      throw new BadRequestException('Invalid coupon');
    }

    const dayStart = this.startOfIstDay(new Date());
    const sendsToday = await this.otpChallenges.count({
      where: {
        destination: email,
        purpose: 'corporate_domain',
        createdAt: MoreThanOrEqual(dayStart),
      },
    });
    if (sendsToday >= OTP_MAX_SENDS_PER_DAY) {
      throw new BadRequestException(
        'Too many OTP requests for this email today. Try again tomorrow.',
      );
    }

    const code = this.corporateDomainOtp;
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
    await this.otpChallenges.save(
      this.otpChallenges.create({
        region: Region.OutsideIndia,
        channel: 'email',
        destination: email,
        purpose: 'corporate_domain',
        codeHash,
        expiresAt,
        verifiedAt: null,
        attempts: 0,
      }),
    );

    // Real domain email delivery comes later — use fixed OTP for now.
    this.logger.log(
      `[corporate-otp] ${email} → use OTP ${code} (email send disabled)`,
    );

    return {
      success: true,
      message: `Enter OTP ${code} to verify your work email.`,
      expiresInSeconds: OTP_TTL_SECONDS,
      email,
      allowedDomains: coupon.allowedDomains ?? [],
      /** UI hint while real email delivery is off. */
      devOtp: code,
    };
  }

  async verifyCouponDomainOtp(userId: string, dto: VerifyCorporateCouponOtpDto) {
    const coupon = await this.requireOpenCorporateCoupon(dto.couponCode);
    const email = dto.email.trim().toLowerCase();
    this.assertEmailMatchesDomains(email, coupon.allowedDomains ?? []);

    const challenge = await this.otpChallenges.findOne({
      where: {
        destination: email,
        purpose: 'corporate_domain',
        channel: 'email',
      },
      order: { createdAt: 'DESC' },
    });
    if (!challenge || challenge.verifiedAt) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('OTP has expired. Request a new one.');
    }
    if (challenge.attempts >= 5) {
      throw new UnauthorizedException('Too many incorrect attempts.');
    }

    const submitted = dto.code.trim();
    const ok =
      submitted === this.corporateDomainOtp ||
      (await bcrypt.compare(submitted, challenge.codeHash));
    if (!ok) {
      challenge.attempts += 1;
      await this.otpChallenges.save(challenge);
      throw new UnauthorizedException('Invalid coupon');
    }

    challenge.verifiedAt = new Date();
    await this.otpChallenges.save(challenge);

    await this.coupons.assertRedeemable(coupon, userId, { verifiedEmail: email });

    const verification = await this.verifications.save(
      this.verifications.create({
        userId,
        couponId: coupon.id,
        email,
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + DOMAIN_VERIFY_TTL_MS),
        usedAt: null,
      }),
    );

    return {
      success: true,
      domainVerificationId: verification.id,
      email,
      couponCode: coupon.code,
      expiresAt: verification.expiresAt.toISOString(),
    };
  }

  async markDomainVerificationUsed(verificationId: string) {
    const row = await this.verifications.findOne({
      where: { id: verificationId },
    });
    if (!row || row.usedAt) return;
    row.usedAt = new Date();
    await this.verifications.save(row);
  }

  // ─── helpers ────────────────────────────────────────────────────────────

  private async requireCompany(id: string) {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found.');
    return company;
  }

  private async requireOpenCorporateCoupon(code: string) {
    const coupon = await this.coupons.findByCode(code);
    if (!coupon || !this.coupons.isCorporateCoupon(coupon)) {
      throw new BadRequestException('Invalid coupon');
    }
    return coupon;
  }

  private normalizeDomains(domains: string[]) {
    const out: string[] = [];
    for (const raw of domains) {
      let d = raw.trim().toLowerCase();
      d = d.replace(/^@/, '').replace(/^https?:\/\//, '').split('/')[0] ?? d;
      if (d.startsWith('www.')) d = d.slice(4);
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) continue;
      if (!out.includes(d)) out.push(d);
    }
    return out;
  }

  private assertEmailMatchesDomains(email: string, domains: string[]) {
    const at = email.lastIndexOf('@');
    const domain = at >= 0 ? email.slice(at + 1).toLowerCase() : '';
    const allowed = domains.map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (!domain || !allowed.includes(domain)) {
      throw new BadRequestException(
        `Use a work email on an allowed company domain (${allowed.join(', ')}).`,
      );
    }
  }

  private startOfIstDay(date: Date) {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(date.getTime() + istOffsetMs);
    const start = new Date(
      Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()),
    );
    return new Date(start.getTime() - istOffsetMs);
  }

  private async sendDomainOtpEmail(input: { email: string; code: string }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from =
      this.config.get<string>('RESEND_FROM')?.trim() ||
      'The Healing Mat <hello@thehealingmat.yoga>';
    if (!apiKey) {
      this.logger.warn(
        `[OTP][dev-fallback] corporate domain → ${input.email}: ${input.code}`,
      );
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new ServiceUnavailableException(
          'Email OTP is temporarily unavailable.',
        );
      }
      return;
    }
    await sendResendEmail({
      apiKey,
      from,
      to: input.email,
      subject: 'Your work email verification code — The Healing Mat',
      text: `Your verification code is ${input.code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${input.code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  }

  private toCompanyRow(company: Company, planCount: number) {
    return {
      id: company.id,
      companyName: company.companyName,
      domains: company.domains ?? [],
      gstNumber: company.gstNumber,
      state: company.state,
      planCount,
      createdAt: company.createdAt.toISOString(),
    };
  }

  private toCompanyDetail(company: Company) {
    return {
      id: company.id,
      companyName: company.companyName,
      domains: company.domains ?? [],
      gstNumber: company.gstNumber,
      state: company.state,
      billingEmail: company.billingEmail,
      billingPhone: company.billingPhone,
      billingAddress: company.billingAddress,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  private async toPlanDetail(plan: CorporatePlan, company: Company) {
    let coupon: {
      id: string;
      code: string;
      userName: string;
      discountType: string;
      discountValue: number;
      discountLabel: string;
      maxUses: number;
      usageCount: number;
      remainingUses: number;
      active: boolean;
      allowedDomains: string[];
      corporatePlanId: string | null;
      createdAt: string;
    } | null = null;
    const redemptions: {
      id: string;
      userId: string;
      verifiedEmail: string | null;
      couponCode: string | null;
      createdAt: string;
      userName: string | null;
    }[] = [];

    if (plan.couponId) {
      const couponEntity = await this.couponRepo.findOne({
        where: { id: plan.couponId },
      });
      if (couponEntity) {
        coupon = {
          id: couponEntity.id,
          code: couponEntity.code,
          userName: couponEntity.userName,
          discountType: couponEntity.discountType,
          discountValue: couponEntity.discountValue,
          discountLabel: couponEntity.discountLabel,
          maxUses: couponEntity.maxUses,
          usageCount: couponEntity.usageCount,
          remainingUses: Math.max(
            0,
            couponEntity.maxUses - couponEntity.usageCount,
          ),
          active: couponEntity.active,
          allowedDomains: couponEntity.allowedDomains ?? [],
          corporatePlanId: couponEntity.corporatePlanId,
          createdAt: couponEntity.createdAt.toISOString(),
        };

        const rows = await this.coupons.listRedemptionsForCoupon(
          couponEntity.id,
        );
        for (const row of rows) {
          const user = await this.users.findOne({ where: { id: row.userId } });
          redemptions.push({
            id: row.id,
            userId: row.userId,
            verifiedEmail: row.verifiedEmail,
            couponCode: row.couponCode,
            createdAt: row.createdAt.toISOString(),
            userName: user?.fullName ?? null,
          });
        }
      }
    }

    return {
      id: plan.id,
      companyId: plan.companyId,
      companyName: company.companyName,
      planMonths: plan.planMonths,
      planName: plan.planName,
      employeeCount: plan.employeeCount,
      companyPayPercent: plan.companyPayPercent,
      currency: plan.currency,
      listPricePerSeatPaise: plan.listPricePerSeatPaise,
      totalListPricePaise: plan.totalListPricePaise,
      companyAmountPaise: plan.companyAmountPaise,
      paymentMethod: plan.paymentMethod,
      paymentRef: plan.paymentRef,
      adminNote: plan.adminNote,
      invoiceId: plan.invoiceId,
      invoiceNumber: plan.invoiceNumber,
      startsAt: plan.startsAt?.toISOString() ?? null,
      endsAt: plan.endsAt?.toISOString() ?? null,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      coupon,
      redemptions,
      seatsUsed: redemptions.length,
      seatsRemaining: Math.max(0, plan.employeeCount - redemptions.length),
    };
  }
}
