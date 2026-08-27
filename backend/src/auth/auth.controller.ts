import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Admin } from '../admins/admin.entity';
import { AuthService } from './auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Role } from './enums/role.enum';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto);
  }

  @Roles(Role.Admin)
  @Get('me')
  me(@CurrentAdmin() admin: Admin) {
    return this.authService.toPublicAdmin(admin);
  }
}
