import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
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
import { OrientationVideo } from './orientation-video.entity';
import { ResourceGuide } from './resource-guide.entity';
import { SampleSession } from './sample-session.entity';

const CONTENT_COVER_UPLOAD_DIR = join(process.cwd(), 'uploads', 'content-covers');
const ALLOWED_COVER_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ResourceGuide)
    private readonly resources: Repository<ResourceGuide>,
    @InjectRepository(HealthArticle)
    private readonly articles: Repository<HealthArticle>,
    @InjectRepository(HealthVideo)
    private readonly videos: Repository<HealthVideo>,
    @InjectRepository(OrientationVideo)
    private readonly orientationVideos: Repository<OrientationVideo>,
    @InjectRepository(SampleSession)
    private readonly sampleSessions: Repository<SampleSession>,
  ) {}

  // ── Resources ─────────────────────────────────────────────

  listResources(publishedOnly = false) {
    return this.resources.find({
      where: publishedOnly ? { published: true } : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
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
        sortOrder: dto.sortOrder ?? (await this.nextSortOrder(this.resources)),
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
        sortOrder: dto.sortOrder ?? (await this.nextSortOrder(this.articles)),
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
        sortOrder: dto.sortOrder ?? (await this.nextSortOrder(this.videos)),
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

  // ── Orientation videos (Start Here) ───────────────────────

  listOrientationVideos(publishedOnly = false) {
    return this.orientationVideos.find({
      where: publishedOnly ? { published: true } : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getOrientationVideoBySlug(slug: string, publishedOnly = false) {
    const item = await this.orientationVideos.findOne({ where: { slug } });
    if (!item || (publishedOnly && !item.published)) {
      throw new NotFoundException('Orientation video not found.');
    }
    return item;
  }

  async createOrientationVideo(dto: CreateVideoDto) {
    await this.ensureUniqueSlug(this.orientationVideos, dto.slug);
    return this.orientationVideos.save(
      this.orientationVideos.create({
        slug: this.normalizeSlug(dto.slug),
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        description: dto.description.trim(),
        category: dto.category?.trim() || 'Orientation',
        duration: dto.duration?.trim() || '',
        coverUrl: dto.coverUrl?.trim() || '',
        videoUrl: dto.videoUrl?.trim() || null,
        sortOrder:
          dto.sortOrder ?? (await this.nextSortOrder(this.orientationVideos)),
        published: dto.published ?? true,
      }),
    );
  }

  async updateOrientationVideo(id: string, dto: UpdateVideoDto) {
    const item = await this.requireById(
      this.orientationVideos,
      id,
      'Orientation video',
    );
    if (dto.slug && dto.slug !== item.slug) {
      await this.ensureUniqueSlug(this.orientationVideos, dto.slug, id);
      item.slug = this.normalizeSlug(dto.slug);
    }
    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.subtitle !== undefined) item.subtitle = dto.subtitle.trim();
    if (dto.description !== undefined) item.description = dto.description.trim();
    if (dto.category !== undefined) {
      item.category = dto.category.trim() || 'Orientation';
    }
    if (dto.duration !== undefined) item.duration = dto.duration.trim();
    if (dto.coverUrl !== undefined) item.coverUrl = dto.coverUrl.trim();
    if (dto.videoUrl !== undefined) item.videoUrl = dto.videoUrl?.trim() || null;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) item.published = dto.published;
    return this.orientationVideos.save(item);
  }

  async deleteOrientationVideo(id: string) {
    const item = await this.requireById(
      this.orientationVideos,
      id,
      'Orientation video',
    );
    await this.orientationVideos.remove(item);
    return { success: true };
  }

  // ── Sample sessions (waiting trial members) ───────────────

  listSampleSessions(publishedOnly = false) {
    return this.sampleSessions.find({
      where: publishedOnly ? { published: true } : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getSampleSessionBySlug(slug: string, publishedOnly = false) {
    const item = await this.sampleSessions.findOne({ where: { slug } });
    if (!item || (publishedOnly && !item.published)) {
      throw new NotFoundException('Sample session not found.');
    }
    return item;
  }

  async createSampleSession(dto: CreateVideoDto) {
    await this.ensureUniqueSlug(this.sampleSessions, dto.slug);
    return this.sampleSessions.save(
      this.sampleSessions.create({
        slug: this.normalizeSlug(dto.slug),
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        description: dto.description.trim(),
        category: dto.category?.trim() || 'Sample Session',
        duration: dto.duration?.trim() || '',
        coverUrl: dto.coverUrl?.trim() || '',
        videoUrl: dto.videoUrl?.trim() || null,
        sortOrder:
          dto.sortOrder ?? (await this.nextSortOrder(this.sampleSessions)),
        published: dto.published ?? true,
      }),
    );
  }

  async updateSampleSession(id: string, dto: UpdateVideoDto) {
    const item = await this.requireById(
      this.sampleSessions,
      id,
      'Sample session',
    );
    if (dto.slug && dto.slug !== item.slug) {
      await this.ensureUniqueSlug(this.sampleSessions, dto.slug, id);
      item.slug = this.normalizeSlug(dto.slug);
    }
    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.subtitle !== undefined) item.subtitle = dto.subtitle.trim();
    if (dto.description !== undefined) item.description = dto.description.trim();
    if (dto.category !== undefined) {
      item.category = dto.category.trim() || 'Sample Session';
    }
    if (dto.duration !== undefined) item.duration = dto.duration.trim();
    if (dto.coverUrl !== undefined) item.coverUrl = dto.coverUrl.trim();
    if (dto.videoUrl !== undefined) item.videoUrl = dto.videoUrl?.trim() || null;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.published !== undefined) item.published = dto.published;
    return this.sampleSessions.save(item);
  }

  async deleteSampleSession(id: string) {
    const item = await this.requireById(
      this.sampleSessions,
      id,
      'Sample session',
    );
    await this.sampleSessions.remove(item);
    return { success: true };
  }

  uploadCoverImage(file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    const ext = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_COVER_EXT.has(ext)) {
      throw new BadRequestException(
        'Upload a JPG, PNG, WEBP, or GIF image.',
      );
    }

    if (!existsSync(CONTENT_COVER_UPLOAD_DIR)) {
      mkdirSync(CONTENT_COVER_UPLOAD_DIR, { recursive: true });
    }

    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(CONTENT_COVER_UPLOAD_DIR, filename), file.buffer);

    return { coverUrl: `/uploads/content-covers/${filename}` };
  }

  // ── helpers ───────────────────────────────────────────────

  private async nextSortOrder(repo: Repository<{ sortOrder: number }>) {
    const result = await repo
      .createQueryBuilder('item')
      .select('MAX(item.sortOrder)', 'max')
      .getRawOne<{ max: string | number | null }>();
    const max = result?.max == null ? -1 : Number(result.max);
    return Number.isFinite(max) ? max + 1 : 0;
  }

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
