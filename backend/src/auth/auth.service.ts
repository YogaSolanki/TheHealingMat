import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from '../admins/admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

export type PublicAdmin = {
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    private readonly jwt: JwtService,
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
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 60 * 60 * 8,
      admin: this.toPublicAdmin(admin),
    };
  }

  toPublicAdmin(admin: Admin): PublicAdmin {
    return {
      email: admin.email,
      role: admin.role,
    };
  }
}
