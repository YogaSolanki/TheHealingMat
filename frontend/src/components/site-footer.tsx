"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FaFacebookF,
  FaPinterestP,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import {
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlinePhone,
} from "react-icons/hi";
import { RiInstagramFill } from "react-icons/ri";
import omIcon from "@/assets/om.png";
import { useAuthModal } from "@/components/auth-modal-provider";
import { SiteLogo } from "@/components/site-logo";
import { isDashboardPath, isMembershipBrowsePath } from "@/lib/member-routes";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_WHATSAPP_URL,
} from "@/lib/site-contact";

/** Explore column — no FAQs (those live under Get Started). */
const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/membership", label: "Membership" },
  { href: "/corporate", label: "Corporate Plans" },
  { href: "/guides", label: "Health Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Bottom legal bar only — never place these in Explore / Get Started. */
const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "#cookies", label: "Cookie Policy" },
  { href: "/health-and-safety", label: "Disclaimer" },
];

const socialLinks: {
  key: string;
  href: string;
  label: string;
  icon: IconType;
}[] = [
  {
    key: "instagram",
    href: "https://www.instagram.com/thehealingmat.official/",
    label: "Instagram",
    icon: RiInstagramFill,
  },
  {
    key: "facebook",
    href: "https://www.facebook.com/TheHealingMat.Official",
    label: "Facebook",
    icon: FaFacebookF,
  },
  {
    key: "youtube",
    href: "https://www.youtube.com/@the_healing_mat",
    label: "YouTube",
    icon: FaYoutube,
  },
  {
    key: "x",
    href: "https://x.com/the_healing_mat",
    label: "X",
    icon: FaXTwitter,
  },
  {
    key: "pinterest",
    href: "https://pin.it/5ieOmFhl4",
    label: "Pinterest",
    icon: FaPinterestP,
  },
];

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="link-underline text-[13px] font-medium text-[#1f6b3a] hover:text-[#1f6b3a]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GetStartedColumn() {
  const { openAuth } = useAuthModal();

  return (
    <div>
      <h3 className="text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
        Get Started
      </h3>
      <ul className="mt-2 space-y-1.5">
        <li>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="link-underline cursor-pointer text-[13px] font-medium text-[#1f6b3a] hover:text-[#1f6b3a]"
          >
            Start 14-Day Free Trial
          </button>
        </li>
        <li>
          <Link
            href="/membership"
            className="link-underline text-[13px] font-medium text-[#1f6b3a] hover:text-[#1f6b3a]"
          >
            Membership Plans
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="link-underline cursor-pointer text-[13px] font-medium text-[#1f6b3a] hover:text-[#1f6b3a]"
          >
            Member Login
          </button>
        </li>
        <li>
          <Link
            href="/dashboard/refer"
            className="link-underline text-[13px] font-medium text-[#1f6b3a] hover:text-[#1f6b3a]"
          >
            Refer & Earn
          </Link>
        </li>
        <li>
          <Link
            href="/faq"
            className="link-underline text-[13px] font-medium text-[#1f6b3a] hover:text-[#1f6b3a]"
          >
            FAQs
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const isMemberDashboard = isDashboardPath(pathname);
  const showTopBorder =
    pathname === "/corporate/enquiry" ||
    pathname === "/contact" ||
    pathname === "/faq" ||
    pathname === "/membership" ||
    pathname.startsWith("/membership/") ||
    isMembershipBrowsePath(pathname) ||
    isMemberDashboard;

  return (
    <footer
      className={`w-full bg-[#FBF9F5] ${
        showTopBorder ? "border-t border-[#d9e0d4]" : ""
      } ${isMemberDashboard ? "" : "mt-auto"}`}
    >
      {/* Approved structure: Brand | Explore | Get Started | Contact */}
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-x-4 gap-y-8 px-5 py-8 sm:gap-x-6 sm:px-6 sm:py-9 md:grid-cols-4 md:gap-0 md:px-6 md:py-9 lg:px-8 xl:px-10">
        <div className="col-span-2 flex flex-col items-start text-left md:col-span-1 md:pr-4 lg:pr-6 xl:pr-8">
          <div className="flex flex-col items-start">
            <SiteLogo />
            <span className="mt-1 hidden text-[11px] text-[#6b7c6e] sm:block sm:text-[12px]">
              Health Without Drama
            </span>
          </div>

          <p className="mt-2.5 max-w-[260px] text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
            Helping you build healthier habits through simple daily guidance.
          </p>

          <ul className="mt-3.5 flex flex-wrap items-center justify-start gap-2">
            {socialLinks.map((social) => (
              <li key={social.key}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#cfd8cf] bg-white text-[#1f6b3a] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f6b3a] hover:bg-[#eef6f0] hover:shadow-md"
                >
                  <social.icon className="h-[15px] w-[15px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 md:border-l md:border-[#dde3d8] md:px-4 lg:px-6 xl:px-8">
          <FooterLinkColumn title="Explore" links={exploreLinks} />
        </div>

        <div className="min-w-0 md:border-l md:border-[#dde3d8] md:px-4 lg:px-6 xl:px-8">
          <GetStartedColumn />
        </div>

        <div className="col-span-2 min-w-0 md:col-span-1 md:border-l md:border-[#dde3d8] md:pl-4 lg:pl-6 xl:pl-8">
          <h3 className="text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
            Contact Us
          </h3>
          <ul className="mt-2 space-y-2 text-[11px] text-[#1f6b3a] sm:text-[13px]">
            <li>
              <a
                href={`mailto:${SITE_EMAIL}`}
                className="inline-flex min-w-0 max-w-full cursor-pointer items-start gap-1.5 font-medium transition hover:text-[#1f6b3a] sm:items-center sm:gap-2"
              >
                <HiOutlineMail className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
                <span className="min-w-0 break-all">{SITE_EMAIL}</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${SITE_PHONE_TEL}`}
                className="inline-flex cursor-pointer items-center gap-1.5 font-medium transition hover:text-[#1f6b3a] sm:gap-2"
              >
                <HiOutlinePhone className="h-4 w-4 shrink-0" />
                {SITE_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a
                href={SITE_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-1.5 font-medium transition hover:text-[#1f6b3a] sm:gap-2"
              >
                <FaWhatsapp className="h-4 w-4 shrink-0" />
                WhatsApp Us
              </a>
            </li>
            <li className="inline-flex items-start gap-1.5 font-medium leading-snug sm:gap-2">
              <HiOutlineLocationMarker className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {SITE_ADDRESS_LINES.map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < SITE_ADDRESS_LINES.length - 1 ? <br /> : null}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#d9e0d4] bg-[#1f6b3a]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3 px-5 py-4 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-3 md:text-left lg:px-8 xl:px-10">
          <p className="text-[12px] text-[#d7e2d8]">
            © {new Date().getFullYear()} The Healing Mat. All Rights Reserved.
          </p>

          <ul className="flex max-w-[420px] flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] sm:max-w-none md:gap-x-0">
            {legalLinks.map((link, index) => (
              <li key={link.label} className="inline-flex items-center">
                {index > 0 ? (
                  <span
                    className="mx-1.5 hidden text-[#8aa38f] md:inline"
                    aria-hidden="true"
                  >
                    |
                  </span>
                ) : null}
                <Link
                  href={link.href}
                  className="font-medium text-[#d7e2d8] transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Image
            src={omIcon}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            aria-hidden="true"
          />
        </div>
      </div>
    </footer>
  );
}
