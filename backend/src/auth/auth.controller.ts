import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Admin } from '../admins/admin.entity';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Role } from './enums/role.enum';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/auth/login')
  @HttpCode(200)
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto);
  }

  @Roles(Role.Admin)
  @Get('admin/auth/me')
  adminMe(@CurrentAdmin() admin: Admin) {
    return this.authService.toPublicAdmin(admin);
  }

  @Public()
  @Post('auth/login')
  @HttpCode(200)
  userLogin(@Body() dto: UserLoginDto) {
    return this.authService.userLogin(dto);
  }

  @Public()
  @Post('auth/otp/request')
  @HttpCode(200)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('auth/otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('auth/password/reset')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Roles(Role.User)
  @Post('auth/password/change')
  @HttpCode(200)
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Roles(Role.User)
  @Post('auth/profile')
  @HttpCode(200)
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Public()
  @Get('auth/access/:slug')
  resolveAccessLink(@Param('slug') slug: string) {
    return this.authService.resolveAccessLink(slug);
  }

  @Public()
  @Get('auth/google')
  googleStart(
    @Query('intent') intent: string | undefined,
    @Query('ref') referralCode: string | undefined,
    @Res() res: Response,
  ) {
    try {
      return res.redirect(
        this.authService.getGoogleAuthUrl(intent, referralCode),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in is unavailable.';
      return res.redirect(this.authService.googleFrontendErrorRedirect(message));
    }
  }

  @Public()
  @Get('auth/google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.handleGoogleCallback({
        code,
        state,
        error,
      });
      return res.redirect(result.redirectUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed.';
      return res.redirect(this.authService.googleFrontendErrorRedirect(message));
    }
  }

  @Roles(Role.User)
  @Get('auth/me')
  me(@CurrentUser() user: User) {
    return this.authService.toPublicUser(user);
  }
}
