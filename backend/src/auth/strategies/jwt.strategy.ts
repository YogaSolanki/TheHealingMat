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

    if (typ === 'user') {
      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('Please sign in.');
      }
      return user;
    }

    const admin = await this.admins.findOne({ where: { id: payload.sub } });
    if (!admin) {
      throw new UnauthorizedException('Please sign in.');
    }
    return admin;
  }
}
