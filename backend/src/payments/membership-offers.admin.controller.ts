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
import {
  CreateMembershipOfferDto,
  UpdateMembershipOfferDto,
} from './dto/membership-offer.dto';
import { MembershipOffersService } from './membership-offers.service';
import { MembershipPlansService } from './membership-plans.service';

@Roles(Role.Admin)
@Controller('admin')
export class MembershipOffersAdminController {
  constructor(
    private readonly offers: MembershipOffersService,
    private readonly plans: MembershipPlansService,
  ) {}

  /** Base 3/6/12 plans (static catalog used when building an offer). */
  @Get('membership-plans')
  listPlans() {
    return this.plans.listAdmin();
  }

  @Get('membership-offers')
  listOffers() {
    return this.offers.listAdmin();
  }

  @Post('membership-offers')
  createOffer(@Body() dto: CreateMembershipOfferDto) {
    return this.offers.create(dto);
  }

  @Patch('membership-offers/:id')
  updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipOfferDto,
  ) {
    return this.offers.update(id, dto);
  }

  @Delete('membership-offers/:id')
  removeOffer(@Param('id', ParseUUIDPipe) id: string) {
    return this.offers.remove(id);
  }
}
