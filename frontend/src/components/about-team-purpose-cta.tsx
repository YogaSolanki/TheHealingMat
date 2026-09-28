"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import leafRight from "@/assets/leaf-right.png";
import { StartTrialButton } from "@/components/start-trial-button";
import { TrialTrustRow } from "@/components/trial-trust-row";
import { getStoredToken } from "@/lib/auth-storage";
import { useMemberAccess } from "@/lib/member-access";

const cream = "#FBF9F5";

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

/**
 * Hide trial CTA for logged-in members (active, trial, scheduled, or expired).
 * Still show for guests and pending accounts with no membership history.
 */
export function AboutTeamPurposeCta() {
  const { access } = useMemberAccess();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, []);

  const hideForMember =
    signedIn &&
    (access.state === "active" ||
      access.state === "expired" ||
      access.state === "trial" ||
      access.state === "scheduled");

  if (hideForMember) return null;

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
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:gap-5 md:pr-8 md:text-left lg:pr-10">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] sm:h-16 sm:w-16">
              <TeamPeopleIcon />
            </span>
            <div className="min-w-0">
              <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-black uppercase sm:text-[12px] md:mt-0.5">
                One Team. One Purpose.
              </p>
              <h2 className="mt-1.5 max-w-[340px] font-serif text-[1.35rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.55rem] md:max-w-[360px]">
                Make better health easier to practise every day.
              </h2>
              <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-[#5f6f64] sm:text-[14px] md:max-w-[320px]">
                Different backgrounds. Different strengths. One shared
                purpose.
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="my-6 h-px w-full bg-[#d9e5d8] md:hidden"
          />

          <div className="flex min-w-0 flex-col items-center text-center md:border-l md:border-[#d9e5d8] md:px-8 lg:px-10">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#1f6b3a] uppercase sm:text-[12px]">
              Ready To Begin?
            </p>
            <h2 className="mt-1.5 max-w-[340px] font-serif text-[1.2rem] leading-tight font-bold tracking-tight text-black sm:text-[1.35rem]">
              Start small. Stay consistent. Feel the difference.
            </h2>
            <StartTrialButton className="btn-primary mt-5 inline-flex w-full max-w-[320px] items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-3.5 text-[14px] font-bold text-white md:w-auto md:px-7 md:text-[15px]">
              Start Your 14-Day Free Trial
              <span aria-hidden="true">→</span>
            </StartTrialButton>
            <TrialTrustRow
              centerLastWhenWrapped
              className="mt-4 max-md:flex-col max-md:items-center max-md:gap-y-1.5 md:justify-center md:gap-x-4 xl:gap-x-5"
              itemClassName="text-[#5f6f64]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
