import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteMembershipDto } from './dto/quote-membership.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Get('memberships/plans')
  async listPlans() {
    return this.payments.listPlans();
  }

  @Roles(Role.User)
  @Post('memberships/quote')
  @HttpCode(200)
  quote(@CurrentUser() user: User, @Body() dto: QuoteMembershipDto) {
    return this.payments.quote(user, dto);
  }

  @Roles(Role.User)
  @Get('memberships/me')
  myMembership(@CurrentUser() user: User) {
    return this.payments.getMyAccess(user);
  }

  @Roles(Role.User)
  @Get('memberships/:id/invoice')
  async membershipInvoice(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const invoice = await this.payments.getInvoice(user, id);
    if (invoice.type === 'razorpay') {
      return { url: invoice.url };
    }

    return new StreamableFile(invoice.pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${invoice.filename}"`,
    });
  }

  @Roles(Role.User)
  @Post('create-order')
  @HttpCode(200)
  createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.payments.createOrder(user, dto);
  }

  @Roles(Role.User)
  @Post('verify-payment')
  @HttpCode(200)
  verifyPayment(@CurrentUser() user: User, @Body() dto: VerifyPaymentDto) {
    return this.payments.verifyPayment(user, dto);
  }
}
