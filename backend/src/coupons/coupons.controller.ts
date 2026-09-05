import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, GenerateCouponDto } from './dto/coupon.dto';

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

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.remove(id);
  }
}
