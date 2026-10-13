import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  UpdateInvoiceFinancialYearDto,
  UpdateInvoiceNextSerialDto,
} from './dto/update-invoice-series.dto';
import { InvoicesService } from './invoices.service';

/**
 * Invoice FY + serial controls for Admin → Settings → Private space.
 * Numbers still auto-advance; April 1 starts a new FY unless an override is set.
 */
@Roles(Role.Admin)
@Controller('admin/private-space/invoice-series')
export class InvoiceSeriesAdminController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  overview() {
    return this.invoices.getInvoiceSeriesOverview();
  }

  @Patch('financial-year')
  updateFinancialYear(@Body() dto: UpdateInvoiceFinancialYearDto) {
    const raw = dto.financialYearOverride;
    const override =
      raw == null || String(raw).trim() === '' ? null : String(raw).trim();
    return this.invoices.setFinancialYearOverride(override);
  }

  @Patch('next-serial')
  updateNextSerial(@Body() dto: UpdateInvoiceNextSerialDto) {
    return this.invoices.setNextSerial({
      category: dto.category,
      nextSerial: dto.nextSerial,
      financialYear: dto.financialYear,
    });
  }
}
