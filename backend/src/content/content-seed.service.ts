import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthArticle } from './health-article.entity';
import { HealthVideo } from './health-video.entity';
import { ResourceGuide } from './resource-guide.entity';

const PLACEHOLDER =
  'https://placehold.co/800x600/E8F0E4/1f6b3a?text=The+Healing+Mat';

@Injectable()
export class ContentSeedService implements OnModuleInit {
  private readonly logger = new Logger(ContentSeedService.name);

  constructor(
    @InjectRepository(ResourceGuide)
    private readonly resources: Repository<ResourceGuide>,
    @InjectRepository(HealthArticle)
    private readonly articles: Repository<HealthArticle>,
    @InjectRepository(HealthVideo)
    private readonly videos: Repository<HealthVideo>,
  ) {}

  async onModuleInit() {
    await this.seedResources();
    await this.seedArticles();
    await this.seedVideos();
  }

  private async seedResources() {
    if ((await this.resources.count()) > 0) return;

    const rows = [
      {
        slug: 'pranayama-handbook',
        title: 'Pranayama Handbook',
        subtitle: 'Breathing practices for everyday calm',
        description:
          'A practical guide to simple breathing techniques you can use to settle the mind, support focus and build healthier daily habits.',
        category: 'Breathing',
        pages: '24 pages',
      },
      {
        slug: 'daily-asana-handbook',
        title: 'Daily Asana Handbook',
        subtitle: 'Movement for strength and mobility',
        description:
          'Clear asana guidance to help you move with awareness, build flexibility and stay consistent with your yoga practice.',
        category: 'Yoga & Movement',
        pages: '32 pages',
      },
      {
        slug: 'stress-sleep-guide',
        title: 'Stress & Sleep Guide',
        subtitle: 'Simple tools for rest and recovery',
        description:
          'Practical tips and gentle practices to ease everyday stress and support better, more restorative sleep.',
        category: 'Wellness',
        pages: '18 pages',
      },
      {
        slug: 'lifestyle-health-basics',
        title: 'Lifestyle Health Basics',
        subtitle: 'Small habits that add up',
        description:
          'An easy-to-keep guide on everyday lifestyle choices that support energy, digestion, posture and long-term wellbeing.',
        category: 'Lifestyle',
        pages: '20 pages',
      },
      {
        slug: 'beginner-yoga-starter',
        title: 'Beginner Yoga Starter',
        subtitle: 'Start simple. Stay consistent.',
        description:
          'A friendly starting point for new practitioners — what to expect, how to begin safely and how to build a steady routine.',
        category: 'Yoga & Movement',
        pages: '16 pages',
      },
      {
        slug: 'everyday-wellness-notes',
        title: 'Everyday Wellness Notes',
        subtitle: 'Save, revisit and keep close',
        description:
          'Short, useful notes on movement, breath, rest and daily health — designed to download, save and come back to whenever you need.',
        category: 'Wellness',
        pages: '12 pages',
      },
    ];

    for (const [index, row] of rows.entries()) {
      await this.resources.save(
        this.resources.create({
          ...row,
          coverUrl: PLACEHOLDER,
          pdfUrl: null,
          sortOrder: index,
          published: true,
        }),
      );
    }
    this.logger.log(`Seeded ${rows.length} resource guides`);
  }

  private async seedArticles() {
    if ((await this.articles.count()) > 0) return;

    const rows = [
      {
        slug: 'simple-habits-for-better-sleep',
        title: 'Simple Habits for Better Sleep',
        subtitle: 'Small changes that help you rest well',
        description:
          'Practical tips for winding down, settling the mind and building a bedtime routine that supports deeper, more restorative sleep.',
        category: 'Sleep',
        readTime: '6 min read',
      },
      {
        slug: 'ease-everyday-stress',
        title: 'Ease Everyday Stress',
        subtitle: 'Calm tools you can use anytime',
        description:
          'Clear, useful ways to lower stress during a busy day — from breathing resets to simple movement breaks that fit into real life.',
        category: 'Stress',
        readTime: '5 min read',
      },
      {
        slug: 'posture-and-desk-comfort',
        title: 'Posture & Desk Comfort',
        subtitle: 'Feel better while you work',
        description:
          'Easy posture and mobility ideas for people who sit a lot — reduce stiffness, support your back and stay comfortable through the day.',
        category: 'Movement',
        readTime: '7 min read',
      },
      {
        slug: 'breathing-for-focus',
        title: 'Breathing for Focus',
        subtitle: 'Steady breath, clearer mind',
        description:
          'How simple breathing practices can help you focus, reset between tasks and feel more grounded without needing a long session.',
        category: 'Breathing',
        readTime: '4 min read',
      },
      {
        slug: 'healthy-daily-routine',
        title: 'A Healthier Daily Routine',
        subtitle: 'Consistency over perfection',
        description:
          'Build everyday habits that support energy, digestion and wellbeing — one small, realistic step at a time.',
        category: 'Lifestyle',
        readTime: '8 min read',
      },
      {
        slug: 'start-yoga-safely',
        title: 'Start Yoga Safely',
        subtitle: 'Begin with confidence',
        description:
          'What beginners should know before starting yoga — how to listen to your body, pace yourself and stay consistent without strain.',
        category: 'Yoga',
        readTime: '6 min read',
      },
    ];

    for (const [index, row] of rows.entries()) {
      await this.articles.save(
        this.articles.create({
          ...row,
          coverUrl: PLACEHOLDER,
          body: null,
          sortOrder: index,
          published: true,
        }),
      );
    }
    this.logger.log(`Seeded ${rows.length} health articles`);
  }

  private async seedVideos() {
    if ((await this.videos.count()) > 0) return;

    const rows = [
      {
        slug: 'morning-mobility-flow',
        title: 'Morning Mobility Flow',
        subtitle: 'Wake up stiff joints gently',
        description:
          'A short guided sequence to loosen the body, improve circulation and start your day with ease — follow along at your own pace.',
        category: 'Movement',
        duration: '12 min',
      },
      {
        slug: 'breathing-reset',
        title: '5-Minute Breathing Reset',
        subtitle: 'Calm your system quickly',
        description:
          'A simple breathing practice you can use between meetings or whenever you need to settle your mind and return to focus.',
        category: 'Breathing',
        duration: '5 min',
      },
      {
        slug: 'desk-stretch-break',
        title: 'Desk Stretch Break',
        subtitle: 'Move without leaving your chair',
        description:
          'Quick stretches for neck, shoulders and back — ideal for office days when you need relief without a full yoga session.',
        category: 'Wellness',
        duration: '8 min',
      },
      {
        slug: 'evening-wind-down',
        title: 'Evening Wind-Down Yoga',
        subtitle: 'Prepare body and mind for rest',
        description:
          'Gentle postures and slow breathing to release the day and support a smoother transition into sleep.',
        category: 'Yoga',
        duration: '15 min',
      },
      {
        slug: 'beginner-sun-salutations',
        title: 'Beginner Sun Salutations',
        subtitle: 'Learn the flow step by step',
        description:
          'A clear, guided introduction to Surya Namaskar — watch, pause and practise until the sequence feels natural.',
        category: 'Yoga',
        duration: '10 min',
      },
      {
        slug: 'stress-relief-practice',
        title: 'Stress Relief Practice',
        subtitle: 'Release tension with guidance',
        description:
          'A calming practice combining light movement and breathwork to ease everyday stress and restore a sense of balance.',
        category: 'Stress',
        duration: '14 min',
      },
    ];

    for (const [index, row] of rows.entries()) {
      await this.videos.save(
        this.videos.create({
          ...row,
          coverUrl: PLACEHOLDER,
          videoUrl: null,
          sortOrder: index,
          published: true,
        }),
      );
    }
    this.logger.log(`Seeded ${rows.length} health videos`);
  }
}
