import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Admin } from '../admins/admin.entity';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
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

  @Roles(Role.User)
  @Get('auth/me')
  me(@CurrentUser() user: User) {
    return this.authService.toPublicUser(user);
  }
}
