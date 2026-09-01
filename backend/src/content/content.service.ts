import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateArticleDto,
  CreateResourceDto,
  CreateVideoDto,
  UpdateArticleDto,
  UpdateResourceDto,
  UpdateVideoDto,
} from './dto/content.dto';
import { HealthArticle } from './health-article.entity';
import { HealthVideo } from './health-video.entity';
import { ResourceGuide } from './resource-guide.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ResourceGuide)
    private readonly resources: Repository<ResourceGuide>,
    @InjectRepository(HealthArticle)
    private readonly articles: Repository<HealthArticle>,
    @InjectRepository(HealthVideo)
    private readonly videos: Repository<HealthVideo>,
  ) {}

  // ── Resources ─────────────────────────────────────────────

  listResources(publishedOnly = false) {
    return this.resources.find({
      where: publishedOnly ? { published: true } : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getResourceBySlug(slug: string, publishedOnly = false) {
    const item = await this.resources.findOne({ where: { slug } });
    if (!item || (publishedOnly && !item.published)) {
      throw new NotFoundException('Resource not found.');
    }
    return item;
  }

  async createResource(dto: CreateResourceDto) {
    await this.ensureUniqueSlug(this.resources, dto.slug);
    return this.resources.save(
      this.resources.create({
        slug: this.normalizeSlug(dto.slug),
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        pages: dto.pages?.trim() || '',
        coverUrl: dto.coverUrl?.trim() || '',
        pdfUrl: dto.pdfUrl?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
      }),
    );
  }

  async updateResource(id: string, dto: UpdateResourceDto) {
    const item = await this.requireById(this.resources, id, 'Resource');
    if (dto.slug && dto.slug !== item.slug) {
      await this.ensureUniqueSlug(this.resources, dto.slug, id);
      item.slug = this.normalizeSlug(dto.slug);
    }
    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.subtitle !== undefined) item.subtitle = dto.subtitle.trim();
    if (dto.description !== undefined) item.description = dto.description.trim();
    if (dto.category !== undefined) item.category = dto.category.trim();
    if (dto.pages !== undefined) item.pages = dto.pages.trim();
    if (dto.coverUrl !== undefined) item.coverUrl = dto.coverUrl.trim();
    if (dto.pdfUrl !== undefined) item.pdfUrl = dto.pdfUrl?.trim() || null;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) item.published = dto.published;
    return this.resources.save(item);
  }

  async deleteResource(id: string) {
    const item = await this.requireById(this.resources, id, 'Resource');
    await this.resources.remove(item);
    return { success: true };
  }

  // ── Articles ──────────────────────────────────────────────

  listArticles(publishedOnly = false) {
    return this.articles.find({
      where: publishedOnly ? { published: true } : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getArticleBySlug(slug: string, publishedOnly = false) {
    const item = await this.articles.findOne({ where: { slug } });
    if (!item || (publishedOnly && !item.published)) {
      throw new NotFoundException('Article not found.');
    }
    return item;
  }

  async createArticle(dto: CreateArticleDto) {
    await this.ensureUniqueSlug(this.articles, dto.slug);
    return this.articles.save(
      this.articles.create({
        slug: this.normalizeSlug(dto.slug),
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        readTime: dto.readTime?.trim() || '',
        coverUrl: dto.coverUrl?.trim() || '',
        body: dto.body?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
      }),
    );
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    const item = await this.requireById(this.articles, id, 'Article');
    if (dto.slug && dto.slug !== item.slug) {
      await this.ensureUniqueSlug(this.articles, dto.slug, id);
      item.slug = this.normalizeSlug(dto.slug);
    }
    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.subtitle !== undefined) item.subtitle = dto.subtitle.trim();
    if (dto.description !== undefined) item.description = dto.description.trim();
    if (dto.category !== undefined) item.category = dto.category.trim();
    if (dto.readTime !== undefined) item.readTime = dto.readTime.trim();
    if (dto.coverUrl !== undefined) item.coverUrl = dto.coverUrl.trim();
    if (dto.body !== undefined) item.body = dto.body?.trim() || null;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) item.published = dto.published;
    return this.articles.save(item);
  }

  async deleteArticle(id: string) {
    const item = await this.requireById(this.articles, id, 'Article');
    await this.articles.remove(item);
    return { success: true };
  }

  // ── Videos ────────────────────────────────────────────────

  listVideos(publishedOnly = false) {
    return this.videos.find({
      where: publishedOnly ? { published: true } : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getVideoBySlug(slug: string, publishedOnly = false) {
    const item = await this.videos.findOne({ where: { slug } });
    if (!item || (publishedOnly && !item.published)) {
      throw new NotFoundException('Video not found.');
    }
    return item;
  }

  async createVideo(dto: CreateVideoDto) {
    await this.ensureUniqueSlug(this.videos, dto.slug);
    return this.videos.save(
      this.videos.create({
        slug: this.normalizeSlug(dto.slug),
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        duration: dto.duration?.trim() || '',
        coverUrl: dto.coverUrl?.trim() || '',
        videoUrl: dto.videoUrl?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
      }),
    );
  }

  async updateVideo(id: string, dto: UpdateVideoDto) {
    const item = await this.requireById(this.videos, id, 'Video');
    if (dto.slug && dto.slug !== item.slug) {
      await this.ensureUniqueSlug(this.videos, dto.slug, id);
      item.slug = this.normalizeSlug(dto.slug);
    }
    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.subtitle !== undefined) item.subtitle = dto.subtitle.trim();
    if (dto.description !== undefined) item.description = dto.description.trim();
    if (dto.category !== undefined) item.category = dto.category.trim();
    if (dto.duration !== undefined) item.duration = dto.duration.trim();
    if (dto.coverUrl !== undefined) item.coverUrl = dto.coverUrl.trim();
    if (dto.videoUrl !== undefined) item.videoUrl = dto.videoUrl?.trim() || null;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) item.published = dto.published;
    return this.videos.save(item);
  }

  async deleteVideo(id: string) {
    const item = await this.requireById(this.videos, id, 'Video');
    await this.videos.remove(item);
    return { success: true };
  }

  // ── helpers ───────────────────────────────────────────────

  private normalizeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async ensureUniqueSlug(
    repo: Repository<{ id: string; slug: string }>,
    slug: string,
    excludeId?: string,
  ) {
    const normalized = this.normalizeSlug(slug);
    if (!normalized) {
      throw new BadRequestException('Slug is required.');
    }
    const existing = await repo.findOne({ where: { slug: normalized } });
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('Slug is already in use.');
    }
  }

  private async requireById<T extends { id: string }>(
    repo: Repository<T>,
    id: string,
    label: string,
  ): Promise<T> {
    const item = await repo.findOne({ where: { id } as never });
    if (!item) {
      throw new NotFoundException(`${label} not found.`);
    }
    return item;
  }
}
