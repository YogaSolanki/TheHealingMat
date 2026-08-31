"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  HiOutlineBookOpen,
  HiOutlineDeviceMobile,
  HiOutlineDownload,
  HiOutlineHeart,
  HiOutlinePlay,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
} from "react-icons/hi";
import guidesHero from "@/assets/guides-hero.png";
import handbooksImage from "@/assets/handbooks.png";
import matBanner from "@/assets/home-banner-bg.png";
import laptopImage from "@/assets/laptop.png";
import leafRight from "@/assets/leaf-right.png";
import mobileImage from "@/assets/mobile.png";
import pdfIcon from "@/assets/pdf.png";
import understandIcon from "@/assets/understand.png";

const cream = "#FBF9F5";

const trustItems: { key: string; label: ReactNode; icon: ReactNode }[] = [
  {
    key: "easy",
    label: (
      <>
        Easy to
        <br />
        Understand
      </>
    ),
    icon: (
      <Image
        src={understandIcon}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 object-contain sm:h-7 sm:w-7"
      />
    ),
  },
  {
    key: "save",
    label: (
      <>
        Save & Refer
        <br />
        Anytime
      </>
    ),
    icon: <HiOutlineDownload className="h-6 w-6 sm:h-7 sm:w-7" />,
  },
  {
    key: "learn",
    label: (
      <>
        Learn, Watch
        <br />& Practise
      </>
    ),
    icon: <HiOutlinePlay className="h-6 w-6 sm:h-7 sm:w-7" />,
  },
  {
    key: "ages",
    label: (
      <>
        For All Ages
        <br />& Stages
      </>
    ),
    icon: <HiOutlineUserGroup className="h-6 w-6 sm:h-7 sm:w-7" />,
  },
];

const contentTrustItems = [
  {
    key: "evidence",
    title: "Evidence-based content",
    body: "Trusted, practical & reliable",
    icon: <HiOutlineShieldCheck className="h-5 w-5" />,
  },
  {
    key: "save",
    title: "Save & access anytime",
    body: "Download and keep forever",
    icon: <HiOutlineDownload className="h-5 w-5" />,
  },
  {
    key: "device",
    title: "Learn on any device",
    body: "Phone, tablet or computer",
    icon: <HiOutlineDeviceMobile className="h-5 w-5" />,
  },
  {
    key: "journey",
    title: "For every step of your journey",
    body: "Beginner to advanced",
    icon: <HiOutlineHeart className="h-5 w-5" />,
  },
];

export function GuidesSection() {
  return (
    <div className="w-full" style={{ backgroundColor: cream }}>
      <HeroBlock />
      <ResourcesBand />
      <ArticlesBand />
      <VideosBand />
      <ContentTrustStrip />
      <GuidanceCta />
    </div>
  );
}

function HeroBlock() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative grid w-full items-stretch lg:grid-cols-2">
        <div className="relative z-10 order-2 flex items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-10 lg:order-1 lg:justify-center lg:px-8 lg:py-14 lg:text-left xl:px-12">
          <div className="mx-auto flex w-full max-w-[520px] flex-col items-center lg:mx-0 lg:items-start">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
              Health Guides
            </p>
            <h1 className="mt-3 font-serif text-[2.05rem] leading-[1.12] font-bold tracking-tight text-[#1f6b3a] sm:text-[2.6rem] lg:text-[2.9rem] xl:text-[3.25rem]">
              Practical Help for
              <br className="hidden sm:block" />{" "}
              <span className="whitespace-nowrap">Your Everyday Health</span>
            </h1>
            <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px] lg:text-[16px]">
              Simple resources, useful information and guided practices to help
              you understand your health, build better habits and take care of
              yourself every day.
            </p>

            <ul className="mt-8 grid w-full max-w-[440px] grid-cols-2 gap-x-4 gap-y-5 sm:mt-10 sm:grid-cols-4 sm:gap-x-2 lg:max-w-none">
              {trustItems.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d9e5d8] text-[#1f6b3a] sm:h-14 sm:w-14">
                    {item.icon}
                  </span>
                  <span className="text-[11px] leading-snug font-semibold text-[#3d4a40] sm:text-[12px]">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative order-1 aspect-[5/4] w-full sm:aspect-[16/11] lg:order-2 lg:aspect-auto lg:min-h-[560px] xl:min-h-[600px]">
          <div className="absolute inset-0">
            <Image
              src={guidesHero}
              alt="Woman reading a health guide at The Healing Mat"
              fill
              priority
              className="object-cover object-[50%_35%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-white to-transparent lg:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourcesBand() {
  return (
    <section id="resources" className="w-full">
      <div className="mx-auto grid w-full max-w-[1140px] items-center gap-8 px-5 py-12 sm:gap-10 sm:px-8 sm:py-14 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4]">
              <Image
                src={pdfIcon}
                alt=""
                aria-hidden="true"
                className="h-6 w-6 object-contain sm:h-7 sm:w-7"
              />
            </span>
            <div className="min-w-0 max-w-[400px]">
              <h2 className="font-serif text-[1.65rem] leading-[1.15] font-bold tracking-tight text-[#1f6b3a] sm:text-[1.9rem]">
                Resources
              </h2>
              <p className="mt-1.5 text-[11px] font-bold tracking-[0.14em] text-[#1f6b3a] uppercase sm:text-[12px]">
                Practical Guides You Can Read, Save & Keep
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
                Downloadable guides to help you understand yoga, movement,
                breathing, stress, sleep, lifestyle and everyday health better.
                Save them, revisit them, and keep what you need close at hand.
              </p>
              <Link
                href="#resources"
                className="btn-primary mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-2.5 text-[13px] font-bold text-white sm:mt-7 sm:text-[14px]"
              >
                Explore Resources
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="order-1 flex items-center justify-center lg:order-2 lg:justify-end">
          <Image
            src={handbooksImage}
            alt="Pranayama Handbook and Daily Asana Handbook"
            className="h-auto w-full max-w-[340px] object-contain sm:max-w-[400px] lg:max-w-[440px]"
            sizes="(max-width: 1024px) 400px, 440px"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function ArticlesBand() {
  return (
    <section
      id="articles"
      className="relative w-full bg-[#FFFCFA] shadow-[0_-18px_40px_-28px_rgba(70,55,35,0.16),0_18px_40px_-28px_rgba(70,55,35,0.12)]"
    >
      <div className="mx-auto w-full max-w-[1140px] px-5 py-12 sm:px-8 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3EBD9] text-[#8B6B3E]">
                <HiOutlineBookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0 max-w-[400px]">
                <h2 className="font-serif text-[1.65rem] leading-[1.15] font-bold tracking-tight text-[#8B6B3E] sm:text-[1.9rem]">
                  Health Articles
                </h2>
                <p className="mt-1.5 text-[11px] font-bold tracking-[0.14em] text-[#8B6B3E] uppercase sm:text-[12px]">
                  Simple Information for Better Everyday Health
                </p>
                <p className="mt-4 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
                  Helpful articles on common health concerns, daily habits and
                  practical ways to take better care of yourself — one step at a
                  time. Clear, useful and easy to apply in everyday life.
                </p>
                <Link
                  href="#articles"
                  className="btn-primary mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#8B6B3E] px-6 py-2.5 text-[13px] font-bold text-white sm:mt-7 sm:text-[14px] hover:!shadow-[0_12px_28px_rgba(139,107,62,0.3)]"
                >
                  Explore Health Articles
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <Image
              src={laptopImage}
              alt="Health article on laptop — Simple Habits for Better Sleep"
              className="h-auto w-full max-w-[360px] object-contain sm:max-w-[420px] lg:max-w-[460px]"
              sizes="(max-width: 1024px) 420px, 460px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function VideosBand() {
  return (
    <section
      id="videos"
      className="relative w-full shadow-[0_-16px_36px_-28px_rgba(40,60,45,0.12)]"
      style={{ backgroundColor: cream }}
    >
      <div className="mx-auto w-full max-w-[1140px] px-5 py-12 sm:px-8 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a]">
                <HiOutlinePlay className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0 max-w-[400px]">
                <h2 className="font-serif text-[1.65rem] leading-[1.15] font-bold tracking-tight text-[#1f6b3a] sm:text-[1.9rem]">
                  Health Videos
                </h2>
                <p className="mt-1.5 text-[11px] font-bold tracking-[0.14em] text-[#1f6b3a] uppercase sm:text-[12px]">
                  Sometimes It’s Easier to Watch, Understand & Practise
                </p>
                <p className="mt-4 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
                  Learn through guided videos you can follow anytime, anywhere —
                  at your own pace. From quick tips to full practices, see what
                  to do and follow along.
                </p>
                <Link
                  href="#videos"
                  className="btn-primary mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-2.5 text-[13px] font-bold text-white sm:mt-7 sm:text-[14px]"
                >
                  Explore Health Videos
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <Image
              src={mobileImage}
              alt="Health video on phone — guided yoga practice"
              className="h-auto w-full max-w-[340px] object-contain sm:max-w-[400px] lg:max-w-[440px]"
              sizes="(max-width: 1024px) 400px, 440px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentTrustStrip() {
  return (
    <section className="w-full bg-white px-5 pt-10 sm:px-8 sm:pt-12 lg:px-8">
      <ul className="mx-auto grid w-full max-w-[1140px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:gap-5">
        {contentTrustItems.map((item) => (
          <li
            key={item.key}
            className="flex flex-col items-center px-2 py-2 text-center sm:px-3"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a]">
              {item.icon}
            </span>
            <p className="mt-3 text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]">
              {item.title}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#5f6f64]">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GuidanceCta() {
  return (
    <section className="w-full bg-white px-5 pt-8 pb-10 sm:px-8 sm:pt-10 sm:pb-12 lg:px-8 lg:pb-14">
      <div
        className="relative mx-auto w-full max-w-[1254px] overflow-hidden rounded-[20px] border border-[#e6ebe3]"
        style={{ backgroundColor: cream }}
      >
        <Image
          src={leafRight}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 z-0 h-[85%] w-auto -translate-y-1/2 object-contain object-right opacity-40 sm:right-1 sm:opacity-45"
          sizes="180px"
        />

        <div className="relative z-10 grid items-center gap-4 sm:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr]">
          <div className="relative hidden h-full min-h-[160px] sm:block">
            <Image
              src={matBanner}
              alt="Yoga mat and props"
              fill
              className="object-cover object-left"
              sizes="240px"
            />
          </div>

          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-4 sm:py-6 lg:pr-28 xl:pr-36">
            <div className="min-w-0">
              <h2 className="font-serif text-[1.25rem] font-bold tracking-tight text-[#1f6b3a] sm:text-[1.4rem]">
                Want Guidance Beyond the Guides?
              </h2>
              <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                Make Health Part of Everyday Life. Health Guides can help you
                learn and get started. As a member of The Healing Mat, you can go
                further with live daily yoga classes, guided practices and
                wellness programmes designed to help you stay consistent.
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-semibold text-[#1f6b3a]">
                {["Simple", "Affordable", "Everyday"].map((label) => (
                  <li key={label} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[#1f6b3a] text-[9px] leading-none"
                    >
                      ✓
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/membership"
              className="btn-primary inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-3 text-[13px] font-bold text-white sm:w-auto sm:px-7 sm:text-[14px]"
            >
              Explore Membership
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
