import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { Admin } from '../admins/admin.entity';
import { Region } from '../users/enums/region.enum';
import { OtpChallenge } from '../users/otp-challenge.entity';
import { User } from '../users/user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

export type PublicAdmin = {
  email: string;
  role: string;
};

export type PublicUser = {
  id: string;
  fullName: string;
  region: Region;
  mobile: string | null;
  email: string | null;
  referralCode: string;
  accessLink: string;
  hasUsedFreeTrial: boolean;
  role: string;
};

const OTP_TTL_SECONDS = 10 * 60;
const USER_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
/** bcrypt cost factor — higher = slower brute-force. */
const BCRYPT_ROUNDS = 12;
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(OtpChallenge)
    private readonly otps: Repository<OtpChallenge>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.admins.findOne({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.jwt.signAsync({
      sub: admin.id,
      typ: 'admin',
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 60 * 60 * 8,
      admin: this.toPublicAdmin(admin),
    };
  }

  async userLogin(dto: UserLoginDto) {
    const { destination } = this.resolveLoginDestination(dto);
    const user = await this.findUserWithPassword(dto.region, destination);

    const hash = user?.passwordHash ?? (await this.getDummyPasswordHash());
    const passwordMatches = await bcrypt.compare(dto.password, hash);

    if (!user || !user.passwordHash || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueUserToken(user, false);
  }

  async requestOtp(dto: RequestOtpDto) {
    if (dto.purpose !== 'login' && dto.purpose !== 'signup') {
      throw new BadRequestException('purpose must be login or signup');
    }

    const { destination, channel } = this.resolveDestination(dto);
    const existing = await this.findUserByDestination(dto.region, destination);

    if (dto.purpose === 'login' && !existing) {
      throw new BadRequestException(
        'No account found. Please sign up for a Free Trial first.',
      );
    }

    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    const challenge = await this.otps.save(
      this.otps.create({
        region: dto.region,
        channel,
        destination,
        purpose: dto.purpose,
        codeHash,
        expiresAt,
        verifiedAt: null,
        attempts: 0,
      }),
    );

    // V1 stub: no SMS/email provider yet — surface OTP in non-production.
    const isProd = this.config.get('NODE_ENV') === 'production';
    if (!isProd) {
      console.log(`[OTP] ${channel} → ${destination}: ${code}`);
    }

    return {
      challengeId: challenge.id,
      expiresIn: OTP_TTL_SECONDS,
      channel,
      destinationMasked: this.maskDestination(destination, channel),
      accountExists: Boolean(existing),
      ...(isProd ? {} : { devOtp: code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const challenge = await this.otps.findOne({
      where: { id: dto.challengeId },
    });

    if (!challenge) {
      throw new BadRequestException('Invalid or expired OTP challenge.');
    }
    if (challenge.verifiedAt) {
      throw new BadRequestException('OTP already used.');
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP expired. Request a new code.');
    }
    if (challenge.attempts >= 5) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    const matches = await bcrypt.compare(dto.code.trim(), challenge.codeHash);
    challenge.attempts += 1;

    if (!matches) {
      await this.otps.save(challenge);
      throw new UnauthorizedException('Incorrect OTP.');
    }

    challenge.verifiedAt = new Date();
    await this.otps.save(challenge);

    let user = await this.findUserByDestination(
      challenge.region,
      challenge.destination,
    );
    let isNewAccount = false;

    if (!user) {
      if (challenge.purpose === 'login') {
        throw new BadRequestException('No account found for this identity.');
      }

      const fullName = dto.fullName?.trim();
      if (!fullName || fullName.length < 2) {
        throw new BadRequestException('fullName is required for signup.');
      }
      if (!dto.password) {
        throw new BadRequestException('password is required for signup.');
      }

      user = await this.createUser({
        region: challenge.region,
        destination: challenge.destination,
        channel: challenge.channel,
        fullName,
        password: dto.password,
      });
      isNewAccount = true;
    }

    return this.issueUserToken(user, isNewAccount);
  }

  toPublicAdmin(admin: Admin): PublicAdmin {
    return {
      email: admin.email,
      role: admin.role,
    };
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      fullName: user.fullName,
      region: user.region,
      mobile: user.mobile,
      email: user.email,
      referralCode: user.referralCode,
      accessLink: this.buildAccessLink(user.accessLinkToken),
      hasUsedFreeTrial: user.hasUsedFreeTrial,
      role: user.role,
    };
  }

  private async issueUserToken(user: User, isNewAccount: boolean) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, typ: 'user' },
      { expiresIn: USER_TOKEN_TTL_SECONDS },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: USER_TOKEN_TTL_SECONDS,
      isNewAccount,
      user: this.toPublicUser(user),
    };
  }

  private resolveDestination(dto: RequestOtpDto): {
    destination: string;
    channel: 'sms' | 'email';
  } {
    if (dto.region === Region.India) {
      if (!dto.mobile) {
        throw new BadRequestException('mobile is required for India.');
      }
      return {
        destination: this.normalizeMobile(dto.mobile),
        channel: 'sms',
      };
    }

    if (!dto.email) {
      throw new BadRequestException('email is required for Outside India.');
    }
    return {
      destination: dto.email.trim().toLowerCase(),
      channel: 'email',
    };
  }

  private resolveLoginDestination(dto: UserLoginDto): {
    destination: string;
  } {
    if (dto.region === Region.India) {
      if (!dto.mobile) {
        throw new BadRequestException('mobile is required for India.');
      }
      return { destination: this.normalizeMobile(dto.mobile) };
    }

    if (!dto.email) {
      throw new BadRequestException('email is required for Outside India.');
    }
    return { destination: dto.email.trim().toLowerCase() };
  }

  private async findUserByDestination(region: Region, destination: string) {
    if (region === Region.India) {
      return this.users.findOne({ where: { mobile: destination } });
    }
    return this.users.findOne({ where: { email: destination } });
  }

  private async findUserWithPassword(region: Region, destination: string) {
    const qb = this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash');

    if (region === Region.India) {
      qb.where('user.mobile = :destination', { destination });
    } else {
      qb.where('user.email = :destination', { destination });
    }

    return qb.getOne();
  }

  private async createUser(input: {
    region: Region;
    destination: string;
    channel: 'sms' | 'email';
    fullName: string;
    password: string;
  }) {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = this.users.create({
      region: input.region,
      fullName: input.fullName,
      mobile: input.channel === 'sms' ? input.destination : null,
      email: input.channel === 'email' ? input.destination : null,
      passwordHash,
      referralCode: this.generateReferralCode(),
      accessLinkToken: randomBytes(16).toString('hex'),
      hasUsedFreeTrial: false,
      role: 'user',
    });

    return this.users.save(user);
  }

  private dummyHashPromise: Promise<string> | null = null;

  private getDummyPasswordHash() {
    // Prefer a real bcrypt hash so compare cost matches a real user lookup.
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = bcrypt.hash(
        `thm-dummy-${randomBytes(16).toString('hex')}`,
        BCRYPT_ROUNDS,
      );
    }
    return this.dummyHashPromise;
  }

  private generateOtpCode(): string {
    return String(randomInt(100000, 999999));
  }

  private generateReferralCode(): string {
    const raw = createHash('sha1')
      .update(randomBytes(12))
      .digest('hex')
      .slice(0, 6)
      .toUpperCase();
    return `THM-${raw}`;
  }

  private normalizeMobile(mobile: string): string {
    const trimmed = mobile.trim().replace(/[\s-]/g, '');
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    if (/^[6-9]\d{9}$/.test(trimmed)) {
      return `+91${trimmed}`;
    }
    return `+${trimmed}`;
  }

  private maskDestination(destination: string, channel: 'sms' | 'email') {
    if (channel === 'email') {
      const [local, domain] = destination.split('@');
      if (!domain) return '***';
      const visible = local.slice(0, 1);
      return `${visible}***@${domain}`;
    }
    if (destination.length <= 4) return '****';
    return `${destination.slice(0, 3)}****${destination.slice(-2)}`;
  }

  private buildAccessLink(token: string): string {
    const base = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${base.replace(/\/$/, '')}/access/${token}`;
  }
}
