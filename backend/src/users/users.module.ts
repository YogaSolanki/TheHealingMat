import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpChallenge } from './otp-challenge.entity';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OtpChallenge])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
