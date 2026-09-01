import type { StaticImageData } from "next/image";
import book1 from "@/assets/book1.png";
import book2 from "@/assets/book2.jpg";
import handbooksImage from "@/assets/handbooks.png";

export type ResourceGuide = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  pages: string;
  cover: StaticImageData;
  /** Placeholder until real PDF files are uploaded */
  pdfHref?: string;
};

export const resourceGuides: ResourceGuide[] = [
  {
    slug: "pranayama-handbook",
    title: "Pranayama Handbook",
    subtitle: "Breathing practices for everyday calm",
    description:
      "A practical guide to simple breathing techniques you can use to settle the mind, support focus and build healthier daily habits.",
    category: "Breathing",
    pages: "24 pages",
    cover: book1,
  },
  {
    slug: "daily-asana-handbook",
    title: "Daily Asana Handbook",
    subtitle: "Movement for strength and mobility",
    description:
      "Clear asana guidance to help you move with awareness, build flexibility and stay consistent with your yoga practice.",
    category: "Yoga & Movement",
    pages: "32 pages",
    cover: book2,
  },
  {
    slug: "stress-sleep-guide",
    title: "Stress & Sleep Guide",
    subtitle: "Simple tools for rest and recovery",
    description:
      "Practical tips and gentle practices to ease everyday stress and support better, more restorative sleep.",
    category: "Wellness",
    pages: "18 pages",
    cover: handbooksImage,
  },
  {
    slug: "lifestyle-health-basics",
    title: "Lifestyle Health Basics",
    subtitle: "Small habits that add up",
    description:
      "An easy-to-keep guide on everyday lifestyle choices that support energy, digestion, posture and long-term wellbeing.",
    category: "Lifestyle",
    pages: "20 pages",
    cover: book1,
  },
  {
    slug: "beginner-yoga-starter",
    title: "Beginner Yoga Starter",
    subtitle: "Start simple. Stay consistent.",
    description:
      "A friendly starting point for new practitioners — what to expect, how to begin safely and how to build a steady routine.",
    category: "Yoga & Movement",
    pages: "16 pages",
    cover: book2,
  },
  {
    slug: "everyday-wellness-notes",
    title: "Everyday Wellness Notes",
    subtitle: "Save, revisit and keep close",
    description:
      "Short, useful notes on movement, breath, rest and daily health — designed to download, save and come back to whenever you need.",
    category: "Wellness",
    pages: "12 pages",
    cover: handbooksImage,
  },
];

export function getResourceGuide(slug: string): ResourceGuide | undefined {
  return resourceGuides.find((guide) => guide.slug === slug);
}
