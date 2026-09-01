import type { StaticImageData } from "next/image";
import mobileImage from "@/assets/mobile.png";

export type HealthVideo = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  duration: string;
  cover: StaticImageData;
};

export const healthVideos: HealthVideo[] = [
  {
    slug: "morning-mobility-flow",
    title: "Morning Mobility Flow",
    subtitle: "Wake up stiff joints gently",
    description:
      "A short guided sequence to loosen the body, improve circulation and start your day with ease — follow along at your own pace.",
    category: "Movement",
    duration: "12 min",
    cover: mobileImage,
  },
  {
    slug: "breathing-reset",
    title: "5-Minute Breathing Reset",
    subtitle: "Calm your system quickly",
    description:
      "A simple breathing practice you can use between meetings or whenever you need to settle your mind and return to focus.",
    category: "Breathing",
    duration: "5 min",
    cover: mobileImage,
  },
  {
    slug: "desk-stretch-break",
    title: "Desk Stretch Break",
    subtitle: "Move without leaving your chair",
    description:
      "Quick stretches for neck, shoulders and back — ideal for office days when you need relief without a full yoga session.",
    category: "Wellness",
    duration: "8 min",
    cover: mobileImage,
  },
  {
    slug: "evening-wind-down",
    title: "Evening Wind-Down Yoga",
    subtitle: "Prepare body and mind for rest",
    description:
      "Gentle postures and slow breathing to release the day and support a smoother transition into sleep.",
    category: "Yoga",
    duration: "15 min",
    cover: mobileImage,
  },
  {
    slug: "beginner-sun-salutations",
    title: "Beginner Sun Salutations",
    subtitle: "Learn the flow step by step",
    description:
      "A clear, guided introduction to Surya Namaskar — watch, pause and practise until the sequence feels natural.",
    category: "Yoga",
    duration: "10 min",
    cover: mobileImage,
  },
  {
    slug: "stress-relief-practice",
    title: "Stress Relief Practice",
    subtitle: "Release tension with guidance",
    description:
      "A calming practice combining light movement and breathwork to ease everyday stress and restore a sense of balance.",
    category: "Stress",
    duration: "14 min",
    cover: mobileImage,
  },
];

export function getHealthVideo(slug: string): HealthVideo | undefined {
  return healthVideos.find((video) => video.slug === slug);
}
