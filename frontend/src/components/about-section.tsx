import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import book1Cover from "@/assets/book1.png";
import book2Cover from "@/assets/book2.jpg";
import buildingIcon from "@/assets/building.png";
import calendarIcon from "@/assets/calander-icon.png";
import dilIcon from "@/assets/dil.png";
import founderPhoto from "@/assets/hero2.png";
import groupPhoto from "@/assets/group.png";
import helthIcon from "@/assets/helth.png";
import pokhriyalPhoto from "@/assets/Dr K P Pokhriyal.jpg";
import poornimaPhoto from "@/assets/poornima.jpg";
import pradeepPhoto from "@/assets/pradeep.jpg";
import savitaPhoto from "@/assets/Savita.png";
import yogaOnCallLogo from "@/assets/yogaonca.png";
import ic3Icon from "@/assets/ic3.png";
import leafRight from "@/assets/leaf-right.png";
import locationIcon from "@/assets/location.png";
import trustIcon from "@/assets/trust.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import { AnimatedStatValue } from "@/components/animated-stat-value";
import { TrialTrustRow } from "@/components/trial-trust-row";

const cream = "#FBF9F5";
const green = "#1f6b3a";

function AssetIcon({
  src,
  className = "h-10 w-10",
  color = green,
}: {
  src: StaticImageData | string;
  className?: string;
  color?: string;
}) {
  const url = typeof src === "string" ? src : src.src;
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${url})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${url})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

const experienceStats: {
  key: string;
  target: number;
  label: ReactNode;
  icon: StaticImageData | string;
}[] = [
  {
    key: "sessions",
    target: 10000,
    label: (
      <>
        Corporate
        <br />
        Wellness Sessions
      </>
    ),
    icon: yogaMenIcon,
  },
  {
    key: "orgs",
    target: 10000,
    label: (
      <>
        Organisations
        <br />
        Served
      </>
    ),
    icon: buildingIcon,
  },
  {
    key: "cities",
    target: 100,
    label: (
      <>
        Cities
        <br />
        Across India
      </>
    ),
    icon: locationIcon,
  },
  {
    key: "years",
    target: 16,
    label: (
      <>
        Years of
        <br />
        Experience
      </>
    ),
    icon: calendarIcon,
  },
];

const philosophyPillars: {
  key: string;
  title: string;
  body: string;
  icon: StaticImageData;
  color: string;
}[] = [
  {
    key: "integrate",
    title: "Integrate Health",
    body: "Make healthy practices part of everyday life.",
    icon: helthIcon,
    color: "#2f7a45",
  },
  {
    key: "consistent",
    title: "Stay Consistent",
    body: "Small, regular steps can create lasting change.",
    icon: trustIcon,
    color: "#2f7a45",
  },
  {
    key: "child",
    title: "Be a Child",
    body: "Move. Laugh. Explore. Enjoy.",
    icon: ic3Icon,
    color: "#2f7a45",
  },
  {
    key: "drama",
    title: "Health Without Drama",
    body: "Simple practices. Practical guidance. No unnecessary complexity.",
    icon: dilIcon,
    color: "#c9a227",
  },
];

export function AboutSection() {
  return (
    <div className="w-full bg-white">
      <HeroBlock />
      <ExperienceBlock />
      <PhilosophyBlock />
      <FoundersBlock />
      <TeamPurposeCta />
    </div>
  );
}

function HeroBlock() {
  return (
    <section className="w-full overflow-hidden" style={{ backgroundColor: cream }}>
      <div className="grid w-full items-stretch lg:grid-cols-2">
        <div className="order-2 flex items-center justify-center px-4 py-8 text-left sm:px-6 sm:py-12 lg:order-1 lg:justify-start lg:px-8 lg:py-14 xl:px-12">
          <div className="w-full max-w-[560px]">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
              About The Healing Mat
            </p>
            <h1 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold tracking-tight text-[#1a3d2a] sm:text-[2.2rem] lg:text-[2.55rem]">
              More Than Yoga.
              <br />
              A Simpler Approach to
              <br />
              Everyday Health.
            </h1>

            <div className="mt-5">
              <p className="text-[15px] font-bold text-[#1a3d2a] sm:text-[16px]">
                Health Without Drama
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
                The Healing Mat was created with a simple belief: better health
                should fit naturally into everyday life.
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
                We bring together experienced wellness professionals with one
                simple purpose — to help people build healthier habits through
                simple, practical and consistent wellness.
              </p>
            </div>

            <p className="mt-5 text-[14px] font-semibold text-[#1f6b3a] sm:text-[15px]">
              Simple. Practical. Consistent.
            </p>
          </div>
        </div>

        <div className="relative order-1 aspect-[4/3] w-full sm:aspect-[16/11] lg:order-2 lg:aspect-auto lg:min-h-[560px] xl:min-h-[620px]">
          <Image
            src={groupPhoto}
            alt="The Healing Mat founding team"
            fill
            priority
            className="object-cover object-[50%_30%]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}

function ExperienceBlock() {
  return (
    <section className="w-full bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div
        className="mx-auto max-w-[1440px] overflow-hidden rounded-[20px] border border-[#e6ebe3] px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9"
        style={{ backgroundColor: cream }}
      >
        <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between xl:gap-10">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left xl:max-w-[480px] xl:shrink-0">
            <a
              href="https://www.yogaoncall.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Yoga On Call — visit www.yogaoncall.com"
              className="flex shrink-0 flex-col items-center transition-opacity hover:opacity-85"
            >
              <Image
                src={yogaOnCallLogo}
                alt=""
                width={120}
                height={120}
                className="h-[96px] w-[96px] rounded-full object-cover shadow-sm sm:h-[112px] sm:w-[112px]"
              />
              <p className="mt-2.5 text-[12px] font-bold text-[#1a3d2a] sm:text-[13px]">
                Yoga On Call
              </p>
            </a>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[1.35rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.55rem]">
                Built on Years of Real-World Experience
              </h2>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                The Healing Mat is founded by the team behind Yoga On Call, a
                wellness organisation that delivered 10,000+ corporate wellness
                sessions to 10,000+ organisations across 100+ cities in India.
              </p>
            </div>
          </div>

          <ul className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-0 sm:gap-y-0 xl:max-w-[720px] xl:shrink-0">
            {experienceStats.map((stat, index) => (
              <li
                key={stat.key}
                className={`flex flex-col items-center px-2 text-center sm:px-4 lg:px-5 ${
                  index < experienceStats.length - 1
                    ? "sm:border-r sm:border-[#e6ebe3]"
                    : ""
                }`}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center sm:h-12 sm:w-12">
                  <AssetIcon
                    src={stat.icon}
                    className="h-full w-full"
                    color={green}
                  />
                </span>
                <AnimatedStatValue
                  value={stat.target}
                  className="mt-1.5 font-serif text-[1.45rem] leading-none font-bold text-[#1a3d2a] sm:text-[1.65rem]"
                />
                <p className="mt-1.5 text-[11px] leading-snug font-semibold text-[#5f6f64] sm:text-[12px]">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PhilosophyBlock() {
  return (
    <section className="w-full bg-white px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[960px] text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
          Our Philosophy
        </p>
        <h2 className="mt-2 font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.85rem] lg:text-[2rem]">
          Health Without Drama
        </h2>
        <p className="mx-auto mt-2.5 max-w-[640px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
          Better health comes from simple habits that naturally become part of
          everyday life.
        </p>
      </div>

      <ul className="mx-auto mt-8 grid max-w-[1100px] grid-cols-2 gap-x-0 gap-y-7 sm:mt-10 lg:grid-cols-4 lg:gap-x-0">
        {philosophyPillars.map((pillar, index) => (
          <li
            key={pillar.key}
            className={`flex flex-col items-center px-4 text-center sm:px-6 lg:px-7 ${
              index < philosophyPillars.length - 1
                ? "lg:border-r lg:border-[#e6ebe3]"
                : ""
            } ${
              index % 2 === 0 ? "max-lg:border-r max-lg:border-[#e6ebe3]" : ""
            }`}
          >
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
              style={{ backgroundColor: `${pillar.color}18` }}
            >
              <AssetIcon
                src={pillar.icon}
                className="h-8 w-8 sm:h-9 sm:w-9"
                color={pillar.color}
              />
            </span>
            <h3 className="mt-3 text-[14px] font-bold text-[#1a3d2a] sm:text-[15px]">
              {pillar.title}
            </h3>
            <p className="mt-1.5 max-w-[200px] text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
              {pillar.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FoundersBlock() {
  return (
    <section className="w-full bg-white px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
          Meet The Founders
        </p>
        <h2 className="mt-2 font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.85rem]">
          Different journeys. One purpose.
        </h2>
      </div>

      <div className="mx-auto mt-7 flex max-w-[1280px] flex-col gap-5 sm:mt-8 sm:gap-6">
        <PradeepCard />
        <SavitaCard />
        <PoornimaCard />
        <PokhriyalCard />
      </div>
    </section>
  );
}

function FounderPhoto({
  alt,
  src = founderPhoto,
  objectPosition = "50% 18%",
  large = false,
  fit = "cover",
  frameBg,
  scale = 1,
}: {
  alt: string;
  src?: StaticImageData;
  objectPosition?: string;
  large?: boolean;
  fit?: "cover" | "contain";
  frameBg?: string;
  scale?: number;
}) {
  const background =
    frameBg ?? (fit === "contain" ? "#ffffff" : "#efe9df");

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden ${
        large
          ? "aspect-[4/5] max-w-none md:aspect-auto md:h-full md:min-h-full"
          : "aspect-[4/5] max-w-[360px] rounded-[18px] shadow-[0_10px_24px_rgba(26,61,42,0.08)] md:mx-0 md:max-w-none"
      }`}
      style={{ backgroundColor: background }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={fit === "contain" ? "object-contain" : "object-cover"}
        style={{
          objectPosition,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin:
            objectPosition.includes("100%") || objectPosition.includes("bottom")
              ? "center bottom"
              : "center center",
        }}
        sizes={
          large
            ? "(max-width: 767px) 100vw, (max-width: 1024px) 280px, 420px"
            : "(max-width: 767px) 360px, 380px"
        }
      />
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-0.5 text-[12px] leading-snug text-[#5f6f64]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-[0.4em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f6b3a]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailPanel({
  title,
  children,
  contentClassName = "mt-1",
  plain = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  contentClassName?: string;
  plain?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        plain
          ? `min-w-0 ${className}`
          : `rounded-[14px] border border-[#e6ebe3] bg-transparent px-3 py-2.5 ${className}`
      }
    >
      <p className="text-[12px] font-bold tracking-[0.06em] text-[#1f6b3a] uppercase">
        {title}
      </p>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

function FounderShell({
  id,
  photo,
  photoSide = "left",
  photoLarge = false,
  photoWide = false,
  compact = false,
  children,
  details,
}: {
  id?: string;
  photo: ReactNode;
  photoSide?: "left" | "right";
  photoLarge?: boolean;
  photoWide?: boolean;
  compact?: boolean;
  children: ReactNode;
  details?: ReactNode;
}) {
  const isRight = photoSide === "right";
  const minH = compact
    ? "md:min-h-[380px] lg:min-h-[400px]"
    : photoWide
      ? "md:min-h-[480px] lg:min-h-[520px]"
      : photoLarge
        ? "md:min-h-[420px] lg:min-h-[460px]"
        : "";
  const photoCols = photoWide
    ? isRight
      ? "md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_520px]"
      : "md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[480px_minmax(0,1fr)] xl:grid-cols-[520px_minmax(0,1fr)]"
    : photoLarge
      ? isRight
        ? "md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]"
        : "md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]"
      : isRight
        ? "md:grid-cols-[minmax(0,1fr)_240px] lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]"
        : "md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]";

  return (
    <article
      id={id}
      className={`scroll-mt-24 overflow-hidden rounded-[22px] border border-[#e6ebe3] shadow-[0_6px_22px_rgba(26,61,42,0.04)] sm:scroll-mt-28 ${minH}`}
      style={{ backgroundColor: cream }}
    >
      <div
        className={`grid ${photoCols} ${
          photoLarge || photoWide
            ? `items-stretch gap-0 p-0 ${minH} md:items-stretch`
            : "items-start gap-4 p-4 sm:gap-5 sm:p-5 md:gap-5 md:p-5 lg:gap-6"
        }`}
      >
        <div
          className={`${isRight ? "order-1 md:order-2" : "order-1"} ${
            photoLarge || photoWide ? "md:h-full md:min-h-full" : ""
          }`}
        >
          {photo}
        </div>
        <div
          className={`min-w-0 ${isRight ? "order-2 md:order-1" : "order-2"} ${
            photoLarge || photoWide
              ? "flex min-h-0 flex-col p-4 sm:p-5 md:h-full md:min-h-full md:p-5"
              : ""
          }`}
        >
          {children}
          {details ? <div className="mt-3 space-y-3">{details}</div> : null}
        </div>
      </div>
    </article>
  );
}

function PradeepCard() {
  return (
    <FounderShell
      id="pradeep"
      photoLarge
      photo={
        <FounderPhoto
          alt="Pradeep Solanki"
          src={pradeepPhoto}
          objectPosition="50% 100%"
          large
        />
      }
    >
      <h3 className="font-serif text-[1.35rem] font-bold text-[#1a3d2a] sm:text-[1.55rem] lg:text-[1.75rem]">
        Pradeep Solanki
      </h3>

      <div className="mt-0.5 grid gap-3 md:grid-cols-[1.2fr_0.9fr] md:items-start md:gap-4">
        {/* Section 1 — About (starts at role line) */}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#c47a2c] sm:text-[13px]">
            Founder • Lead Yoga Educator • Author
          </p>
          <p className="mt-2 text-[12px] font-bold text-[#1a3d2a]">
            Why I&apos;m Here
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#5f6f64]">
            After 15 years in the corporate world, Pradeep&apos;s own experience
            with severe back pain — including hospitalisation in Switzerland and
            the possibility of spinal surgery — led him to yoga. The
            transformation he experienced changed the direction of his life and
            inspired him to help others make health a part of everyday life.
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5f6f64]">
            With 16+ years of experience in teaching yoga and wellness, Pradeep
            has helped people across different age groups make yoga a practical
            part of their lives.
          </p>
        </div>

        {/* Section 2 — aligns with role line */}
        <div className="flex min-w-0 flex-col max-md:border-t max-md:border-[#d9e5d8] max-md:pt-3 md:border-l md:border-[#d9e5d8] md:pl-3.5 lg:pl-4">
          <DetailPanel title="Qualifications" plain>
            <BulletList
              items={[
                "M.A. Yogic Sciences",
                "PG Diploma in Yoga & Naturopathy",
                "E-RYT 500 — Yoga Alliance, USA",
                "Government Certified — YCB Level 3",
                "B.Tech — Computer Science & Engineering",
                "LL.B.",
              ]}
            />
          </DetailPanel>
          <DetailPanel title="Beyond Work" plain className="mt-3">
            <p className="text-[12px] leading-snug text-[#5f6f64]">
              An adventure enthusiast, motivational speaker and lifelong
              learner, Pradeep enjoys exploring new places, sharing ideas and
              continuing to learn.
            </p>
          </DetailPanel>
        </div>
      </div>

      {/* Below — Books */}
      <div className="mt-auto pt-4">
        <DetailPanel title="Author" contentClassName="mt-0">
          <p className="text-[12px] leading-snug text-[#5f6f64]">
            Author of two books on yoga, wellness and practical health.
          </p>
          <div className="mt-1.5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-x-5">
            {[
              {
                cover: book2Cover,
                alt: "Mastering Corporate Yoga book cover",
                title: "Mastering Corporate Yoga",
                blurb: (
                  <>
                    Practical handbook for yoga trainers
                    <br />
                    and wellness professionals.
                  </>
                ),
              },
              {
                cover: book1Cover,
                alt: "Weight Loss Without the Drama book cover",
                title: "Weight Loss Without the Drama",
                blurb: (
                  <>
                    A simple approach through food, movement,
                    <br />
                    sleep and habits.
                  </>
                ),
              },
            ].map((book) => (
              <div
                key={book.title}
                className="grid grid-cols-[50px_minmax(0,1fr)] items-start gap-x-2.5"
              >
                <div className="relative h-[70px] w-[50px] overflow-hidden rounded-[6px] bg-[#efe9df] shadow-sm ring-1 ring-[#e6ebe3]">
                  <Image
                    src={book.cover}
                    alt={book.alt}
                    fill
                    className="object-cover object-top"
                    sizes="50px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] leading-snug font-bold text-[#1a3d2a]">
                    {book.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#5f6f64]">
                    {book.blurb}
                  </p>
                  <a
                    href="#"
                    className="link-underline mt-1 inline-flex text-[11px] font-bold text-[#2f7a45]"
                  >
                    Read on Amazon →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </DetailPanel>
      </div>
    </FounderShell>
  );
}

function SavitaCard() {
  return (
    <FounderShell
      id="savita"
      photoLarge
      compact
      photoSide="right"
      photo={
        <FounderPhoto
          alt="Savita Malhotra"
          src={savitaPhoto}
          objectPosition="50% 100%"
          large
          fit="contain"
          frameBg="#faf8f9"
          scale={1.25}
        />
      }
    >
      <h3 className="font-serif text-[1.35rem] font-bold text-[#1a3d2a] sm:text-[1.55rem] lg:text-[1.75rem]">
        Savita Malhotra
      </h3>

      <div className="mt-0.5 grid gap-3 md:grid-cols-[1.2fr_0.9fr] md:items-start md:gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#1f6b3a] sm:text-[13px]">
            Co-founder • Head of Laughter &amp; Wellness Programs
          </p>
          <p className="mt-2 text-[12px] font-bold text-[#1a3d2a]">
            From IT to Laughter, Wellness &amp; Joy
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#5f6f64]">
            Savita&apos;s journey has taken her through some very different
            chapters — from being a homemaker to working in the IT industry in
            the UK and USA for 12 years, and later discovering her passion for
            food, cooking and wellness.
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5f6f64]">
            Her journey with yoga and laughter began as a personal search for
            greater balance and well-being. What started personally soon became
            a passion for helping others experience the lighter, happier side of
            wellness.
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5f6f64]">
            Today, she brings her warmth, energy and experience to The Healing
            Mat, leading our laughter and wellness programs and creating
            sessions that help people connect, relax and enjoy taking care of
            themselves.
          </p>
        </div>

        <div className="flex min-w-0 flex-col max-md:border-t max-md:border-[#d9e5d8] max-md:pt-3 md:border-l md:border-[#d9e5d8] md:pl-3.5 lg:pl-4">
          <DetailPanel title="Education & Credentials" plain>
            <BulletList
              items={[
                "RYT 500",
                "Certified Laughter Yoga Leader",
                "M.A. in English",
                "M.A. in Psychology",
                "Yoga & Wellness Facilitator",
                "Corporate Wellness Specialist",
                "B.Com.",
              ]}
            />
          </DetailPanel>
          <DetailPanel title="A Little Savita Magic" plain className="mt-3">
            <p className="text-[12px] leading-snug font-bold text-[#1a3d2a]">
              “Laugh the Weight Away!”
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#5f6f64]">
              And yes, she once drove 250 km just for a plate of rajma.
            </p>
          </DetailPanel>
        </div>
      </div>

      <DriveFooter
        title="What Drives Her"
        body="To make wellness lighter, happier and more enjoyable."
      />
    </FounderShell>
  );
}

function DriveFooter({
  title,
  body,
  inline = false,
}: {
  title: string;
  body: string;
  /** Sit under bio text at column width instead of full card footer */
  inline?: boolean;
}) {
  return (
    <div
      className={
        inline ? "mt-0 w-full shrink-0 pt-4" : "mt-auto pt-4"
      }
    >
      <div
        className={`rounded-[14px] border border-[#e6ebe3] ${
          inline ? "px-2.5 py-2 sm:px-3" : "px-3 py-2.5 sm:px-4"
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center sm:h-5 sm:w-5">
            <AssetIcon
              src={dilIcon}
              className={inline ? "h-4 w-4" : "h-5 w-5"}
              color="#c47a2c"
            />
          </span>
          <div className="min-w-0">
            <p
              className={`font-bold text-[#1a3d2a] ${
                inline ? "text-[12px]" : "text-[13px]"
              }`}
            >
              {title}
            </p>
            <p
              className={`mt-0.5 leading-snug text-[#5f6f64] ${
                inline ? "text-[12px]" : "text-[13px]"
              }`}
            >
              {body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PoornimaCard() {
  return (
    <FounderShell
      id="poornima"
      photoLarge
      compact
      photo={
        <FounderPhoto
          alt="Dr. Poornima Ramamurthy"
          src={poornimaPhoto}
          objectPosition="50% 58%"
          large
          scale={1}
          frameBg="#b8b8bc"
        />
      }
    >
      <h3 className="mt-1.5 font-serif text-[1.35rem] font-bold text-[#1a3d2a] sm:mt-2 sm:text-[1.55rem] lg:text-[1.75rem]">
        Dr. Poornima Ramamurthy
      </h3>

      <div className="mt-0.5 grid min-h-0 flex-1 gap-3 md:grid-cols-[1.2fr_0.9fr] md:grid-rows-[minmax(0,1fr)_auto] md:items-stretch md:gap-x-4">
        <div className="order-1 flex min-w-0 flex-col justify-center md:row-start-1">
          <p className="text-[12px] font-semibold text-[#1f6b3a] sm:text-[13px]">
            Co-founder • Yoga Educator • Sound Healer • Movement Educator
          </p>
          <p className="mt-2 text-[12px] font-bold text-[#1a3d2a]">
            From Personal Practice to a Lifelong Journey
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#5f6f64]">
            Poornima turned to work on her own health and energy. What began as
            a personal practice gradually became a lifelong pursuit of learning,
            teaching and wellness.
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5f6f64]">
            With 15+ years of experience and a Ph.D. in Yoga, she has trained
            across several disciplines and brings them together to create
            wellness experiences that are varied, joyful and engaging.
          </p>
        </div>

        <div className="order-2 flex min-w-0 flex-col max-md:border-t max-md:border-[#d9e5d8] max-md:pt-3 md:row-span-2 md:border-l md:border-[#d9e5d8] md:pl-3.5 lg:pl-4">
          <DetailPanel title="Education & Credentials" plain>
            <BulletList
              items={[
                "Ph.D. in Yoga",
                "M.Sc. Yoga",
                "PG Diploma in Applied Yogic Sciences",
                "Yoga Therapist",
                "Sound Healing",
                "Movement Educator",
                "Certified Laughter Yoga Leader",
                "Corporate Yoga Trainer",
                "B.Com.",
              ]}
            />
          </DetailPanel>
          <DetailPanel title="A Little More About Poornima" plain className="mt-3">
            <BulletList
              items={[
                "Fluent in English, Hindi, Tamil and Telugu",
                "Has completed several 10–21 km marathons",
                "Karate Black Belt",
                "Enjoys playing the veena",
                "Believes learning never stops",
              ]}
            />
          </DetailPanel>
        </div>

        <div className="order-3 md:col-start-1 md:row-start-2">
          <DriveFooter
            inline
            title="What Drives Her"
            body="Learning keeps both the mind and the body alive."
          />
        </div>
      </div>
    </FounderShell>
  );
}

function PokhriyalCard() {
  return (
    <FounderShell
      id="pokhriyal"
      photoLarge
      compact
      photoSide="right"
      photo={
        <FounderPhoto
          alt="Dr. K. P. Pokhriyal"
          src={pokhriyalPhoto}
          objectPosition="50% 72%"
          large
          scale={1}
          frameBg="#f2f2f2"
        />
      }
    >
      <h3 className="mt-1.5 font-serif text-[1.35rem] font-bold text-[#1a3d2a] sm:mt-2 sm:text-[1.55rem] lg:text-[1.75rem]">
        Dr. K. P. Pokhriyal
      </h3>

      <div className="mt-0.5 grid min-h-0 flex-1 gap-3 md:grid-cols-[1.2fr_0.9fr] md:grid-rows-[minmax(0,1fr)_auto] md:items-stretch md:gap-x-4">
        <div className="order-1 flex min-w-0 flex-col justify-center md:row-start-1">
          <p className="text-[12px] font-semibold text-[#1f6b3a] sm:text-[13px]">
            Co-founder • Senior Corporate Wellness Consultant
          </p>
          <p className="mt-2 text-[12px] font-bold text-[#1a3d2a]">
            From Corporate Professional to Yoga Therapist
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#5f6f64]">
            Dr. K. P. Pokhriyal&apos;s journey into yoga grew from a corporate
            career into a deeper pursuit of health and wellness. Over the years,
            he developed a strong interest in understanding the body and mind
            and turned that interest into a career in therapeutic yoga and
            corporate wellness.
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5f6f64]">
            With 16+ years of conducting corporate wellness programmes across
            India, he brings together therapeutic yoga, Power Yoga, preventive
            wellness, meditation and stress management to help people understand
            their health and make practical changes.
          </p>
        </div>

        <div className="order-2 flex min-w-0 flex-col max-md:border-t max-md:border-[#d9e5d8] max-md:pt-3 md:row-span-2 md:border-l md:border-[#d9e5d8] md:pl-3.5 lg:pl-4">
          <DetailPanel title="Education & Qualifications" plain>
            <BulletList
              items={[
                "Ph.D. in Yoga",
                "M.A. in Yoga",
                "YCB Level 6",
                "PG Diploma in Yoga",
                "200 Hours RYT – Yoga Alliance",
                "Meditation & Yoga Nidra – Rishikesh",
                "Corporate Yoga Trainer",
              ]}
            />
          </DetailPanel>
          <DetailPanel title="A Little More About K. P." plain className="mt-3">
            <BulletList
              items={[
                "Passionate about trekking and exploring the mountains",
                "An avid reader and lifelong learner",
                "Enjoys travelling and discovering new places",
                "Mentors Ph.D. scholars and continues exploring yoga and wellness",
              ]}
            />
          </DetailPanel>
        </div>

        <div className="order-3 md:col-start-1 md:row-start-2">
          <DriveFooter
            inline
            title="What Drives Him"
            body="Healing begins with understanding, not just treatment."
          />
        </div>
      </div>
    </FounderShell>
  );
}

function TeamPeopleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-8 w-8 sm:h-9 sm:w-9"
      fill="#1f6b3a"
      aria-hidden="true"
    >
      <circle cx="24" cy="12.5" r="5.2" />
      <circle cx="12" cy="15" r="4.2" />
      <circle cx="36" cy="15" r="4.2" />
      <path d="M24 20.5c-5.8 0-10.5 3.6-10.5 8.2v2.8h21v-2.8c0-4.6-4.7-8.2-10.5-8.2Z" />
      <path d="M11.5 22.2c-4.2.4-7.5 3.2-7.5 6.8v2.5h7.2v-2.2c0-2.6 1.2-4.9 3.3-6.5-.9-.4-1.9-.6-3-.6Z" />
      <path d="M36.5 22.2c-1.1 0-2.1.2-3 .6 2.1 1.6 3.3 3.9 3.3 6.5v2.2H44v-2.5c0-3.6-3.3-6.4-7.5-6.8Z" />
    </svg>
  );
}

function TeamPurposeCta() {
  return (
    <section className="w-full px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
      <div
        className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[22px] px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9"
        style={{ backgroundColor: cream }}
      >
        <Image
          src={leafRight}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 hidden h-[90%] w-auto -translate-y-1/2 object-contain opacity-25 md:block"
          sizes="180px"
        />

        <div className="relative z-10 grid items-center gap-0 md:grid-cols-2 md:gap-0 lg:grid-cols-2">
          {/* One Team */}
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:gap-5 md:pr-8 md:text-left lg:pr-10">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] sm:h-16 sm:w-16">
              <TeamPeopleIcon />
            </span>
            <div className="min-w-0">
              <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#1f6b3a] uppercase sm:text-[12px] md:mt-0.5">
                One Team. One Purpose.
              </p>
              <h2 className="mt-1.5 max-w-[340px] font-serif text-[1.35rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.55rem] md:max-w-[360px]">
                Make better health easier to practise every day.
              </h2>
              <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-[#5f6f64] sm:text-[14px] md:max-w-[320px]">
                Different backgrounds. Different strengths. One shared
                purpose.
              </p>
            </div>
          </div>

          {/* Divider — phone horizontal / laptop vertical */}
          <div
            aria-hidden="true"
            className="my-6 h-px w-full bg-[#d9e5d8] md:hidden"
          />

          {/* Ready to Begin — centered on all sizes */}
          <div className="flex min-w-0 flex-col items-center text-center md:border-l md:border-[#d9e5d8] md:px-8 lg:px-10">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#1f6b3a] uppercase sm:text-[12px]">
              Ready To Begin?
            </p>
            <h2 className="mt-1.5 max-w-[340px] font-serif text-[1.2rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.35rem]">
              Start small. Stay consistent. Feel the difference.
            </h2>
            <Link
              href="/trial"
              className="btn-primary mt-5 inline-flex w-full max-w-[320px] items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-3.5 text-[14px] font-bold text-white md:w-auto md:px-7 md:text-[15px]"
            >
              Start Your 14-Day Free Trial
              <span aria-hidden="true">→</span>
            </Link>
            <TrialTrustRow
              centerLastWhenWrapped
              className="mt-4 max-md:flex-col max-md:items-center max-md:gap-y-1.5 md:justify-center md:gap-x-4 xl:gap-x-5"
              itemClassName="text-[#3d5c45]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
