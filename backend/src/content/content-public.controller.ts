import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ContentService } from './content.service';

@Public()
@Controller()
export class ContentPublicController {
  constructor(private readonly content: ContentService) {}

  @Get('resources')
  listResources() {
    return this.content.listResources(true);
  }

  @Get('articles')
  listArticles() {
    return this.content.listArticles(true);
  }

  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string) {
    return this.content.getArticleBySlug(slug, true);
  }

  @Get('videos')
  listVideos() {
    return this.content.listVideos(true);
  }

  @Get('videos/:slug')
  getVideo(@Param('slug') slug: string) {
    return this.content.getVideoBySlug(slug, true);
  }

  @Get('orientation-videos')
  listOrientationVideos() {
    return this.content.listOrientationVideos(true);
  }

  @Get('orientation-videos/:slug')
  getOrientationVideo(@Param('slug') slug: string) {
    return this.content.getOrientationVideoBySlug(slug, true);
  }
}
