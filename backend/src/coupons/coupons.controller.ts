import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CouponsService } from './coupons.service';
import {
  AssignCouponDto,
  CreateCouponDto,
  GenerateCouponDto,
  UpdateCouponDto,
} from './dto/coupon.dto';

@Roles(Role.Admin)
@Controller('admin/coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list() {
    return this.coupons.list();
  }

  /** Preview a unique code — does not save to the database. */
  @Post('generate')
  generate(@Body() dto: GenerateCouponDto) {
    return this.coupons.generate(dto);
  }

  /** Persist a previously generated code. */
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  /** Lock a coupon to a member via their unique referral code (single-use by default). */
  @Patch(':id/assign')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCouponDto,
  ) {
    return this.coupons.assign(id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.remove(id);
  }
}
