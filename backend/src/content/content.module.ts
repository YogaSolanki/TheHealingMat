import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAdminController } from './content-admin.controller';
import { ContentPublicController } from './content-public.controller';
import { ContentSeedService } from './content-seed.service';
import { ContentService } from './content.service';
import { HealthArticle } from './health-article.entity';
import { HealthVideo } from './health-video.entity';
import { OrientationVideo } from './orientation-video.entity';
import { ResourceGuide } from './resource-guide.entity';
import { SampleSession } from './sample-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResourceGuide,
      HealthArticle,
      HealthVideo,
      OrientationVideo,
      SampleSession,
    ]),
  ],
  controllers: [ContentPublicController, ContentAdminController],
  providers: [ContentService, ContentSeedService],
  exports: [ContentService],
})
export class ContentModule {}




