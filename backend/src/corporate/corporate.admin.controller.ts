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

  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.corporate.createCompany(dto);
  }

  @Get('companies/:id')
  getCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.corporate.getCompany(id);
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
