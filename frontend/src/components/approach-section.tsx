import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import ageingIcon from "@/assets/Ageing.png";
import backComfortIcon from "@/assets/back comfort.png";
import flexibilityIcon from "@/assets/Flexibility.png";
import yogaIcon from "@/assets/ic1.png";
import breathIcon from "@/assets/ic2.png";
import joyIcon from "@/assets/ic3.png";
import lotusIcon from "@/assets/ic4.png";
import brainIcon from "@/assets/ic5.png";
import habitsIcon from "@/assets/ic6.png";
import leafLeft from "@/assets/leaf-left.png";
import leafRight from "@/assets/leaf-right.png";
import lifestyleIcon from "@/assets/Lifestyle.png";
import sleepIcon from "@/assets/sleep.png";
import stressIcon from "@/assets/Stress.png";
import tickIcon from "@/assets/tick.png";
import weightManagementIcon from "@/assets/weight-managmenet.png";
import wellnessIcon from "@/assets/Wellness.png";

/** Tint mono icons to brand green #1f6b3a */
const brandGreenFilter =
  "brightness(0) saturate(100%) invert(29%) sepia(34%) saturate(900%) hue-rotate(95deg) brightness(92%) contrast(92%)";

function YogaIcon() {
  return (
    <Image
      src={yogaIcon}
      alt=""
      aria-hidden="true"
      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      sizes="64px"
    />
  );
}

function BreathIcon() {
  return (
    <Image
      src={breathIcon}
      alt=""
      aria-hidden="true"
      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      sizes="64px"
    />
  );
}

function JoyIcon() {
  return (
    <Image
      src={joyIcon}
      alt=""
      aria-hidden="true"
      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      sizes="64px"
    />
  );
}

function LotusIcon() {
  return (
    <Image
      src={lotusIcon}
      alt=""
      aria-hidden="true"
      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      sizes="64px"
    />
  );
}

function BrainIcon() {
  return (
    <Image
      src={brainIcon}
      alt=""
      aria-hidden="true"
      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      sizes="64px"
    />
  );
}

function HabitsIcon() {
  return (
    <Image
      src={habitsIcon}
      alt=""
      aria-hidden="true"
      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      sizes="64px"
    />
  );
}

function GoalCheckIcon() {
  return (
    <Image
      src={tickIcon}
      alt=""
      aria-hidden="true"
      className="h-6 w-6 object-contain sm:h-7 sm:w-7"
      sizes="28px"
    />
  );
}

function GoalAssetIcon({ src }: { src: StaticImageData }) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      className="h-6 w-6 object-contain sm:h-7 sm:w-7"
      style={{ filter: brandGreenFilter }}
      sizes="28px"
    />
  );
}

const practices: {
  key: string;
  title: ReactNode;
  description: string;
  icon: ReactNode;
}[] = [
  {
    key: "yoga",
    title: (
      <>
        Yoga &
        <br />
        Movement
      </>
    ),
    description: "Strength, flexibility and mobility",
    icon: <YogaIcon />,
  },
  {
    key: "pranayama",
    title: (
      <>
        Pranayama &
        <br />
        Breathing
      </>
    ),
    description: "Calm the mind and improve breathing",
    icon: <BreathIcon />,
  },
  {
    key: "laughter",
    title: (
      <>
        Laughter &
        <br />
        Joy
      </>
    ),
    description: "Bring more lightness and positivity",
    icon: <JoyIcon />,
  },
  {
    key: "relaxation",
    title: (
      <>
        Relaxation &
        <br />
        Sleep
      </>
    ),
    description: "Relax, recover and sleep better",
    icon: <LotusIcon />,
  },
  {
    key: "mindfulness",
    title: <>Mindfulness</>,
    description: "Build awareness and mental calm",
    icon: <BrainIcon />,
  },
  {
    key: "habits",
    title: (
      <>
        Healthy
        <br />
        Habits
      </>
    ),
    description: "Small practices for lasting wellbeing",
    icon: <HabitsIcon />,
  },
];

const goals: { key: string; label: ReactNode; icon?: ReactNode }[] = [
  {
    key: "weight",
    label: (
      <>
        Weight
        <br />
        Management
      </>
    ),
    icon: <GoalAssetIcon src={weightManagementIcon} />,
  },
  {
    key: "back",
    label: (
      <>
        Back & Neck
        <br />
        Comfort
      </>
    ),
    icon: <GoalAssetIcon src={backComfortIcon} />,
  },
  {
    key: "stress",
    label: (
      <>
        Stress
        <br />
        Relief
      </>
    ),
    icon: <GoalAssetIcon src={stressIcon} />,
  },
  {
    key: "sleep",
    label: (
      <>
        Better
        <br />
        Sleep
      </>
    ),
    icon: <GoalAssetIcon src={sleepIcon} />,
  },
  {
    key: "mobility",
    label: (
      <>
        Mobility &
        <br />
        Flexibility
      </>
    ),
    icon: <GoalAssetIcon src={flexibilityIcon} />,
  },
  {
    key: "ageing",
    label: (
      <>
        Healthy
        <br />
        Ageing
      </>
    ),
    icon: <GoalAssetIcon src={ageingIcon} />,
  },
  {
    key: "womens",
    label: (
      <>
        Women&apos;s
        <br />
        Wellness
      </>
    ),
    icon: <GoalAssetIcon src={wellnessIcon} />,
  },
  {
    key: "lifestyle",
    label: (
      <>
        Lifestyle
        <br />
        Health
      </>
    ),
    icon: <GoalAssetIcon src={lifestyleIcon} />,
  },
];

export function ApproachSection() {
  return (
    <section className="relative w-full overflow-x-clip bg-white px-4 pt-3 pb-0 sm:px-6 sm:pt-4 sm:pb-0 lg:px-8 lg:pt-5 lg:pb-1">
      <Image
        src={leafLeft}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-0 z-20 hidden h-auto w-[100px] select-none opacity-30 sm:block md:bottom-8 md:w-[120px] lg:bottom-10 lg:w-[140px] xl:w-[160px]"
        sizes="(max-width: 1024px) 120px, 160px"
        priority={false}
      />
      <Image
        src={leafRight}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-2 right-0 z-20 hidden h-auto w-[105px] select-none opacity-30 sm:block md:top-4 md:w-[125px] lg:top-6 lg:w-[145px] xl:w-[165px]"
        sizes="(max-width: 1024px) 125px, 165px"
        priority={false}
      />

      <div className="relative z-10 mx-auto w-full max-w-none">
        <div className="rounded-[16px] bg-[#FBF9F5] px-5 pt-8 pb-14 sm:px-8 sm:pt-10 sm:pb-16 lg:rounded-[18px] lg:px-12 lg:pt-12 lg:pb-[72px] xl:px-16">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="font-serif text-[1.55rem] font-bold tracking-tight text-black sm:text-[1.85rem] md:text-[2rem] lg:text-[2.15rem]">
              A Complete Approach to Everyday Health
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-[#7a8a7e] sm:mt-3.5 sm:text-[15px] lg:text-[15px]">
              Our sessions combine simple practices that support your body, mind
              and everyday wellbeing.
            </p>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-14 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12 lg:mt-14 lg:grid-cols-6 lg:gap-x-0">
            {practices.map((item, index) => (
              <li
                key={item.key}
                className={`flex flex-col items-center px-3 text-center sm:px-4 lg:px-6 xl:px-7 ${
                  index > 0 ? "lg:border-l lg:border-[#d9e0d6]" : ""
                }`}
              >
                <span className="text-[#1f6b3a]" aria-hidden="true">
                  {item.icon}
                </span>
                <h3 className="mt-4 text-[13px] leading-snug font-bold text-[#1f6b3a] sm:text-[14px] lg:text-[15px]">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-[135px] text-[11px] leading-snug text-[#8a968c] sm:text-[12px] lg:max-w-[150px] lg:text-[12.5px]">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-12 sm:mt-14 lg:mt-16">
            <h3 className="text-center text-[17px] font-semibold text-black sm:text-[19px] lg:text-[21px]">
              Support for everyday health goals
            </h3>

            <ul className="mx-auto mt-4 grid w-full max-w-[300px] grid-cols-2 gap-x-5 gap-y-3.5 sm:mt-5 sm:max-w-[640px] sm:grid-cols-4 sm:gap-x-6 sm:gap-y-4 lg:mt-5 lg:flex lg:max-w-[1280px] lg:flex-nowrap lg:items-start lg:justify-center lg:gap-x-12 xl:gap-x-14">
              {goals.map((goal) => (
                <li
                  key={goal.key}
                  className="flex items-start gap-1.5 text-left"
                >
                  <span className="mt-0.5 shrink-0">
                    {goal.icon ?? <GoalCheckIcon />}
                  </span>
                  <span className="text-[12px] leading-snug font-bold text-[#1f6b3a] sm:text-[12.5px] lg:whitespace-nowrap lg:text-[13px]">
                    {goal.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
