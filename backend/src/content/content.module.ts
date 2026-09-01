import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAdminController } from './content-admin.controller';
import { ContentPublicController } from './content-public.controller';
import { ContentSeedService } from './content-seed.service';
import { ContentService } from './content.service';
import { HealthArticle } from './health-article.entity';
import { HealthVideo } from './health-video.entity';
import { ResourceGuide } from './resource-guide.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResourceGuide, HealthArticle, HealthVideo]),
  ],
  controllers: [ContentPublicController, ContentAdminController],
  providers: [ContentService, ContentSeedService],
  exports: [ContentService],
})
export class ContentModule {}




