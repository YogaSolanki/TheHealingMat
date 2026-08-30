import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import buildingIcon from "@/assets/building.png";
import founderPhoto from "@/assets/hero2.png";
import locationIcon from "@/assets/location.png";
import { AnimatedStatValue } from "@/components/animated-stat-value";

const iconGreen = "#2f7a45";

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
  titles: ReactNode;
}[] = [
  {
    key: "savita",
    name: "Savita Malhotra",
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
    target: 100000,
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
      <div className="mx-auto w-full max-w-none rounded-[16px] bg-[#FBF9F5] px-5 py-8 sm:px-8 sm:py-9 lg:rounded-[18px] lg:px-12 lg:py-10 xl:px-14">
        <div className="mx-auto grid w-full max-w-[1140px] items-center gap-7 sm:gap-9 lg:grid-cols-[560px_1fr] lg:gap-14 xl:max-w-[1180px] xl:grid-cols-[580px_1fr] xl:gap-16">
          <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[18px] bg-[#efe8da] lg:mx-0 lg:max-w-none">
            <div className="relative h-[480px] w-full sm:h-[500px] lg:h-[520px]">
              <Image
                src={founderPhoto}
                alt="Pradeep Solanki, Founder of The Healing Mat"
                fill
                className="object-cover object-[50%_20%]"
                sizes="(max-width: 1024px) 560px, 580px"
                priority={false}
              />
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight sm:text-[2rem] lg:text-[2.15rem]">
              <span className="text-[#1a3d2a]">Meet the </span>
              <span className="text-[#2f7a45]">Founders</span>
            </h2>

            <h3 className="mt-3 font-serif text-[1.45rem] leading-tight font-bold text-[#1a3d2a] sm:text-[1.6rem] lg:text-[1.7rem]">
              Pradeep Solanki
            </h3>

            <p className="mt-2 text-[13px] font-semibold text-[#2f7a45] sm:text-[14px]">
              Founder&nbsp;&nbsp;|&nbsp;&nbsp;Lead Yoga Educator&nbsp;&nbsp;|&nbsp;&nbsp;Author
            </p>

            <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a968c] sm:text-[13px]">
              M.A. Yoga&nbsp;&nbsp;|&nbsp;&nbsp;Government Certified&nbsp;&nbsp;|&nbsp;&nbsp;E-RYT
              500&nbsp;&nbsp;|&nbsp;&nbsp;B.Tech&nbsp;&nbsp;|&nbsp;&nbsp;LL.B.
            </p>

            <p className="mt-4 text-[13px] leading-[1.6] text-[#5f6f64] sm:mt-5 sm:text-[14px] lg:text-[15px]">
              With 16+ years of experience in yoga and wellness, Pradeep has
              helped individuals and organisations make wellness a practical
              part of everyday life.
            </p>

            <ul className="mt-7 grid grid-cols-2 sm:mt-8 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <li
                  key={stat.key}
                  className={`flex flex-col items-start text-left ${
                    index > 0
                      ? "sm:border-l sm:border-[#d5ddd2] sm:pl-5 lg:pl-6"
                      : "sm:pr-5 lg:pr-6"
                  } ${index < 3 ? "max-sm:pr-4" : ""} ${index % 2 === 1 ? "max-sm:pl-4" : ""}`}
                >
                  <span className="text-[#2f7a45]">{stat.icon}</span>
                  <AnimatedStatValue
                    value={stat.target}
                    className="mt-2 text-[16px] font-bold text-[#1a3d2a] sm:text-[17px]"
                  />
                  <span className="mt-0.5 text-[11px] leading-snug font-semibold text-[#5f6f64] sm:text-[12px]">
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="#"
              className="link-animate link-underline mt-7 text-[14px] font-bold text-[#2f7a45] sm:mt-8 sm:text-[15px]"
            >
              Know My Story
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <ul className="mx-auto mt-8 grid w-full max-w-[1040px] gap-8 border-t border-[#e2e6df] pt-7 sm:mt-9 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 sm:pt-8 lg:mt-9 lg:grid-cols-3 lg:gap-x-0">
          {teamMembers.map((member, index) => (
            <li
              key={member.key}
              className={`flex items-center gap-4 sm:gap-5 ${
                index > 0
                  ? "lg:border-l lg:border-[#e2e6df] lg:pl-10 xl:pl-12"
                  : "lg:pr-10 xl:pr-12"
              } ${index === 1 ? "lg:pr-10 xl:pr-12" : ""}`}
            >
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full bg-[#efe8da] sm:h-[96px] sm:w-[96px]">
                <Image
                  src={founderPhoto}
                  alt={member.name}
                  fill
                  className="object-cover object-[50%_18%]"
                  sizes="96px"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-[15px] leading-snug font-bold text-[#1a3d2a] sm:text-[16px] xl:whitespace-nowrap">
                  {member.name}
                </h4>
                <p className="mt-1 text-[12px] leading-[1.45] text-[#6b7a70] sm:text-[13px]">
                  {member.titles}
                </p>
                <Link
                  href="#"
                  className="link-animate link-underline mt-2.5 text-[13px] font-bold text-[#2f7a45] sm:text-[14px]"
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
