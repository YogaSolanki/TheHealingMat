import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Admin } from '../../admins/admin.entity';
import { User } from '../../users/user.entity';

export type JwtPayload = {
  sub: string;
  typ?: 'admin' | 'user';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<Admin | User> {
    const typ = payload.typ ?? 'admin';
    const id = payload.sub?.trim();
    // Avoid QueryFailedError 500 when `sub` is not a UUID (malformed token).
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRe.test(id)) {
      throw new UnauthorizedException('Please sign in.');
    }

    if (typ === 'user') {
      const user = await this.users.findOne({ where: { id } });
      if (!user) {
        throw new UnauthorizedException('Please sign in.');
      }
      return user;
    }

    const admin = await this.admins.findOne({ where: { id } });
    if (!admin) {
      throw new UnauthorizedException('Please sign in.');
    }
    return admin;
  }
}
