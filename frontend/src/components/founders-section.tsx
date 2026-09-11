import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import buildingIcon from "@/assets/building.png";
import pokhriyalPhoto from "@/assets/Dr K P Pokhriyal.png";
import locationIcon from "@/assets/location.png";
import poornimaPhoto from "@/assets/poornima.png";
import pradeepPhoto from "@/assets/Pradeep_home-Founder.png";
import savitaPhoto from "@/assets/Savita.png";
import { AnimatedStatValue } from "@/components/animated-stat-value";

const iconGreen = "#1f6b3a";

function GreenMaskedIcon({
  src,
  className = "h-9 w-9",
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        backgroundColor: iconGreen,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

function SessionsIcon() {
  return <GreenMaskedIcon src={allAgeIcon.src} />;
}

function OrganisationsIcon() {
  return <GreenMaskedIcon src={buildingIcon.src} />;
}

function CitiesIcon() {
  return <GreenMaskedIcon src={locationIcon.src} />;
}

function ExperienceIcon() {
  return <GreenMaskedIcon src="/icons/daily.svg" />;
}

const teamMembers: {
  key: string;
  name: string;
  href: string;
  photo: StaticImageData;
  objectPosition: string;
  fit?: "cover" | "contain";
  scale?: number;
  titles: ReactNode;
}[] = [
  {
    key: "savita",
    name: "Savita Malhotra",
    href: "/about#savita",
    photo: savitaPhoto,
    objectPosition: "50% 48%",
    titles: (
      <>
        Senior Laughter Yoga Leader
        <br />
        Lifestyle Transformation Mentor
      </>
    ),
  },
  {
    key: "poornima",
    name: "Dr. Poornima Ramamurthy",
    href: "/about#poornima",
    photo: poornimaPhoto,
    objectPosition: "50% 8%",
    fit: "cover",
    titles: (
      <>
        Ph.D. in Yoga
        <br />
        Sound Healer · Movement Therapist
      </>
    ),
  },
  {
    key: "pokhriyal",
    name: "Dr. K. P. Pokhriyal",
    href: "/about#pokhriyal",
    photo: pokhriyalPhoto,
    objectPosition: "50% 100%",
    fit: "contain",
    scale: 1.25,
    titles: (
      <>
        Ph.D. in Yoga
        <br />
        Therapeutic Yoga &
        <br />
        Corporate Wellness Expert
      </>
    ),
  },
];

const stats: {
  key: string;
  target: number;
  label: ReactNode;
  icon: ReactNode;
}[] = [
  {
    key: "sessions",
    target: 10000,
    label: (
      <>
        Wellness
        <br />
        Sessions
      </>
    ),
    icon: <SessionsIcon />,
  },
  {
    key: "orgs",
    target: 1000,
    label: (
      <>
        Organisations
        <br />
        Served
      </>
    ),
    icon: <OrganisationsIcon />,
  },
  {
    key: "cities",
    target: 100,
    label: (
      <>
        Cities Across
        <br />
        India
      </>
    ),
    icon: <CitiesIcon />,
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
    icon: <ExperienceIcon />,
  },
];

export function FoundersSection() {
  return (
    <section className="w-full bg-white px-4 pt-1.5 pb-0 sm:px-6 lg:px-8 lg:pb-1">
      <div className="mx-auto w-full max-w-[1613px] rounded-[16px] bg-[#FBF9F5] px-5 py-8 sm:px-7 sm:py-9 lg:rounded-[18px] lg:px-9 lg:py-10">
        <h2 className="text-center font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[2rem] lg:text-[2.15rem]">
          Meet the Founders
        </h2>

        {/*
          Tablet (~640–1023): row1 photo|bio, row2 stats+link full width
          Laptop (lg+): photo left; bio+stats+link in one right column, vertically centered
        */}
        <div className="mt-8 grid items-center gap-5 sm:mt-9 sm:grid-cols-[200px_1fr] sm:gap-6 md:grid-cols-[240px_1fr] md:gap-8 lg:grid-cols-[300px_1fr] lg:gap-10 xl:grid-cols-[320px_1fr] xl:gap-12">
          <div className="relative mx-auto w-full max-w-[260px] overflow-hidden sm:mx-0 sm:max-w-none">
            <div className="relative h-[280px] w-full sm:h-[260px] md:h-[300px] lg:h-[340px]">
              <Image
                src={pradeepPhoto}
                alt="Pradeep Solanki, Founder of The Healing Mat"
                fill
                className="origin-bottom scale-[1.2] object-contain object-bottom"
                sizes="(max-width: 640px) 260px, (max-width: 1024px) 240px, 320px"
                priority={false}
              />
            </div>
          </div>

          <div className="contents min-w-0 lg:flex lg:min-h-[340px] lg:flex-col lg:justify-center">
            <div className="min-w-0 self-center text-center sm:text-left lg:self-start">
              <h3 className="font-serif text-[1.45rem] leading-tight font-bold text-black sm:text-[1.55rem] lg:text-[1.7rem]">
                Pradeep Solanki
              </h3>

              <p className="mt-2 text-[13px] font-semibold text-[#c47a2c] sm:text-[14px]">
                Founder&nbsp;&nbsp;|&nbsp;&nbsp;Lead Yoga Educator&nbsp;&nbsp;|&nbsp;&nbsp;Author
              </p>

              <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a968c] sm:text-[13px]">
                M.A. Yoga&nbsp;&nbsp;|&nbsp;&nbsp;Government Certified&nbsp;&nbsp;|&nbsp;&nbsp;E-RYT
                500&nbsp;&nbsp;|&nbsp;&nbsp;B.Tech&nbsp;&nbsp;|&nbsp;&nbsp;LL.B.
              </p>

              <p className="mt-4 text-[13px] leading-[1.6] text-[#5f6f64] sm:mt-4 sm:text-[14px] lg:mt-5 lg:text-[15px]">
                With 16+ years of experience in yoga and wellness, Pradeep has
                helped individuals and organisations make wellness a practical
                part of everyday life.
              </p>
            </div>

            <div className="flex flex-col items-center sm:col-span-2 lg:mt-7 lg:items-start">
              <ul className="grid w-full max-w-[560px] grid-cols-2 gap-y-5 sm:max-w-none sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <li
                    key={stat.key}
                    className={`flex flex-col items-center text-center lg:items-start lg:text-left ${
                      index > 0
                        ? "sm:border-l sm:border-[#d5ddd2] sm:pl-5 lg:pl-6"
                        : "sm:pr-5 lg:pr-6"
                    } ${index < 3 ? "max-sm:pr-4" : ""} ${index % 2 === 1 ? "max-sm:pl-4" : ""}`}
                  >
                    <span className="text-[#1f6b3a]">{stat.icon}</span>
                    <AnimatedStatValue
                      value={stat.target}
                      className="mt-2 text-[16px] font-bold text-[#1f6b3a] sm:text-[17px]"
                    />
                    <span className="mt-0.5 text-[11px] leading-snug font-semibold text-[#5f6f64] sm:text-[12px]">
                      {stat.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/about#pradeep"
                className="link-animate link-underline mt-6 inline-flex text-[14px] font-bold text-[#1f6b3a] sm:mt-7 sm:text-[15px]"
              >
                Know My Story
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <ul className="founders-team-grid mt-8 grid w-full gap-8 border-t border-[#e2e6df] pt-7 sm:mt-9 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 sm:pt-8 lg:mt-9 lg:grid-cols-3 lg:gap-x-0">
          {teamMembers.map((member, index) => (
            <li
              key={member.key}
              className={`flex min-w-0 items-center gap-3.5 sm:gap-4 ${
                index > 0
                  ? "lg:border-l lg:border-[#e2e6df] lg:pl-6 xl:pl-8"
                  : "lg:pr-6 xl:pr-8"
              } ${index === 1 ? "lg:pr-6 xl:pr-8" : ""} ${
                index === 2 ? "founders-team-solo" : ""
              }`}
            >
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full sm:h-[96px] sm:w-[96px]">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className={
                    member.fit === "contain" ? "object-contain" : "object-cover"
                  }
                  style={{
                    objectPosition: member.objectPosition,
                    transform:
                      member.scale && member.scale !== 1
                        ? `scale(${member.scale})`
                        : undefined,
                    transformOrigin: "center bottom",
                  }}
                  sizes="96px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] leading-snug font-bold break-words text-black hyphens-none sm:text-[16px]">
                  {member.name}
                </h4>
                <p className="mt-1 text-[12px] leading-[1.45] text-[#6b7a70] sm:text-[13px]">
                  {member.titles}
                </p>
                <Link
                  href={member.href}
                  className="link-animate link-underline mt-2.5 text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]"
                >
                  Know More
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
