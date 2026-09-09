import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { SubmitCorporateEnquiryDto } from './dto/submit-corporate-enquiry.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(201)
  submit(@Body() dto: SubmitContactDto) {
    return this.contactService.submit(dto);
  }

  @Public()
  @Post('corporate')
  @HttpCode(201)
  submitCorporate(@Body() dto: SubmitCorporateEnquiryDto) {
    return this.contactService.submitCorporate(dto);
  }
}
