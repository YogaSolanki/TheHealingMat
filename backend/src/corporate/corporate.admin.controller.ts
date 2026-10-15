import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CorporateService } from './corporate.service';
import {
  CreateCompanyDto,
  CreateCorporatePlanDto,
  MarkCorporatePlanPaidDto,
  UpdateCompanyDto,
} from './dto/corporate.dto';

@Controller('admin/corporate')
@Roles(Role.Admin)
export class CorporateAdminController {
  constructor(private readonly corporate: CorporateService) {}

  @Get('companies')
  listCompanies() {
    return this.corporate.listCompanies();
  }

  @Get('companies/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCompanies() {
    const file = await this.corporate.exportCompaniesCsv();
    return new StreamableFile(Buffer.from(file.csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.corporate.createCompany(dto);
  }

  @Get('companies/:id')
  getCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.corporate.getCompany(id);
  }

  @Get('companies/:id/export/coupons')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCompanyCoupons(@Param('id', ParseUUIDPipe) id: string) {
    const file = await this.corporate.exportCompanyCouponsCsv(id);
    return new StreamableFile(Buffer.from(file.csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Get('companies/:id/plans/:planId/export/users')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportPlanCouponUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    const file = await this.corporate.exportPlanCouponUsersCsv(id, planId);
    return new StreamableFile(Buffer.from(file.csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Patch('companies/:id')
  updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.corporate.updateCompany(id, dto);
  }

  @Post('companies/:id/plans')
  createPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCorporatePlanDto,
  ) {
    return this.corporate.createPlan(id, dto);
  }

  @Post('companies/:id/plans/:planId/mark-paid')
  markPlanPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: MarkCorporatePlanPaidDto,
  ) {
    return this.corporate.markPlanPaid(id, planId, dto);
  }

  @Get('companies/:id/plans/:planId/invoice')
  @Header('Content-Type', 'application/pdf')
  async downloadPlanInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    const invoice = await this.corporate.downloadPlanInvoice(id, planId);
    return new StreamableFile(invoice.pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${invoice.filename}"`,
    });
  }
}
