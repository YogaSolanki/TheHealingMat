import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ContentService } from './content.service';
import {
  CreateArticleDto,
  CreateResourceDto,
  CreateVideoDto,
  UpdateArticleDto,
  UpdateResourceDto,
  UpdateVideoDto,
} from './dto/content.dto';

@Roles(Role.Admin)
@Controller('admin')
export class ContentAdminController {
  constructor(private readonly content: ContentService) {}

  @Get('resources')
  listResources() {
    return this.content.listResources(false);
  }

  @Post('resources')
  createResource(@Body() dto: CreateResourceDto) {
    return this.content.createResource(dto);
  }

  @Patch('resources/:id')
  updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.content.updateResource(id, dto);
  }

  @Delete('resources/:id')
  deleteResource(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteResource(id);
  }

  @Get('articles')
  listArticles() {
    return this.content.listArticles(false);
  }

  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto) {
    return this.content.createArticle(dto);
  }

  @Patch('articles/:id')
  updateArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.content.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  deleteArticle(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteArticle(id);
  }

  @Get('videos')
  listVideos() {
    return this.content.listVideos(false);
  }

  @Post('videos')
  createVideo(@Body() dto: CreateVideoDto) {
    return this.content.createVideo(dto);
  }

  @Patch('videos/:id')
  updateVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.content.updateVideo(id, dto);
  }

  @Delete('videos/:id')
  deleteVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.deleteVideo(id);
  }
}
