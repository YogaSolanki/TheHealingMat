import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from './contact-message.entity';
import { CorporateEnquiry } from './corporate-enquiry.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage, CorporateEnquiry])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
