import type { StaticImageData } from "next/image";
import laptopImage from "@/assets/laptop.png";

export type HealthArticle = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  readTime: string;
  cover: StaticImageData;
};

export const healthArticles: HealthArticle[] = [
  {
    slug: "simple-habits-for-better-sleep",
    title: "Simple Habits for Better Sleep",
    subtitle: "Small changes that help you rest well",
    description:
      "Practical tips for winding down, settling the mind and building a bedtime routine that supports deeper, more restorative sleep.",
    category: "Sleep",
    readTime: "6 min read",
    cover: laptopImage,
  },
  {
    slug: "ease-everyday-stress",
    title: "Ease Everyday Stress",
    subtitle: "Calm tools you can use anytime",
    description:
      "Clear, useful ways to lower stress during a busy day — from breathing resets to simple movement breaks that fit into real life.",
    category: "Stress",
    readTime: "5 min read",
    cover: laptopImage,
  },
  {
    slug: "posture-and-desk-comfort",
    title: "Posture & Desk Comfort",
    subtitle: "Feel better while you work",
    description:
      "Easy posture and mobility ideas for people who sit a lot — reduce stiffness, support your back and stay comfortable through the day.",
    category: "Movement",
    readTime: "7 min read",
    cover: laptopImage,
  },
  {
    slug: "breathing-for-focus",
    title: "Breathing for Focus",
    subtitle: "Steady breath, clearer mind",
    description:
      "How simple breathing practices can help you focus, reset between tasks and feel more grounded without needing a long session.",
    category: "Breathing",
    readTime: "4 min read",
    cover: laptopImage,
  },
  {
    slug: "healthy-daily-routine",
    title: "A Healthier Daily Routine",
    subtitle: "Consistency over perfection",
    description:
      "Build everyday habits that support energy, digestion and wellbeing — one small, realistic step at a time.",
    category: "Lifestyle",
    readTime: "8 min read",
    cover: laptopImage,
  },
  {
    slug: "start-yoga-safely",
    title: "Start Yoga Safely",
    subtitle: "Begin with confidence",
    description:
      "What beginners should know before starting yoga — how to listen to your body, pace yourself and stay consistent without strain.",
    category: "Yoga",
    readTime: "6 min read",
    cover: laptopImage,
  },
];

export function getHealthArticle(slug: string): HealthArticle | undefined {
  return healthArticles.find((article) => article.slug === slug);
}
