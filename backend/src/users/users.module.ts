import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpChallenge } from './otp-challenge.entity';
import { User } from './user.entity';
import { UsersSchemaService } from './users-schema.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, OtpChallenge])],
  providers: [UsersSchemaService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
