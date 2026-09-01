import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(201)
  submit(@Body() dto: SubmitContactDto) {
    return this.contactService.submit(dto);
  }
}
