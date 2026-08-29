import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { FaFacebookF, FaLinkedinIn, FaPinterestP, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { HiOutlineMail, HiOutlineLocationMarker } from "react-icons/hi";
import { RiInstagramFill } from "react-icons/ri";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "#membership", label: "Membership" },
  { href: "#corporate", label: "Corporate Plans" },
  { href: "#guides", label: "Health Guides" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
  { href: "#faq", label: "FAQs" },
];

const getStartedLinks = [
  { href: "/trial", label: "Start 14-Day Free Trial" },
  { href: "#membership", label: "Membership Plans" },
  { href: "/trial", label: "Member Login" },
  { href: "#refer", label: "Refer & Earn" },
  { href: "#faq", label: "FAQs" },
];

const legalLinks = [
  { href: "#privacy", label: "Privacy Policy" },
  { href: "#refund", label: "Refund Policy" },
  { href: "#terms", label: "Terms & Conditions" },
  { href: "#cookies", label: "Cookie Policy" },
  { href: "#disclaimer", label: "Disclaimer" },
];

const socialLinks: { key: string; href: string; label: string; icon: IconType }[] = [
  { key: "instagram", href: "#", label: "Instagram", icon: RiInstagramFill },
  { key: "facebook", href: "#", label: "Facebook", icon: FaFacebookF },
  { key: "youtube", href: "#", label: "YouTube", icon: FaYoutube },
  { key: "linkedin", href: "#", label: "LinkedIn", icon: FaLinkedinIn },
  { key: "x", href: "#", label: "X", icon: FaXTwitter },
  { key: "pinterest", href: "#", label: "Pinterest", icon: FaPinterestP },
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
      <h3 className="text-[14px] font-bold text-[#1a3d2a] sm:text-[15px]">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="text-[13px] font-medium text-[#2f7a45] transition hover:text-[#1f6b3a]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full bg-[#FBF9F5]">
      <div className="mx-auto grid w-full max-w-[1140px] gap-6 px-4 py-7 sm:px-6 sm:py-8 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_1fr_1.2fr] lg:gap-0 lg:px-8 lg:py-8 xl:px-10">
        <div className="lg:pr-8">
          <Link href="/" className="inline-flex items-start gap-2">
            <Image
              src="/images/logo-mark.png"
              alt="The Healing Mat"
              width={42}
              height={42}
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />
            <span className="leading-[1.15]">
              <span className="block font-serif text-[1.1rem] font-bold tracking-tight text-[#1a3d2a] sm:text-[1.2rem]">
                The Healing Mat
              </span>
              <span className="mt-0.5 block text-[11px] text-[#6b7c6e] sm:text-[12px]">
                Health Without Drama
              </span>
            </span>
          </Link>

          <p className="mt-2.5 max-w-[230px] text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
            Helping you build healthier habits through simple daily guidance.
          </p>

          <ul className="mt-3.5 flex flex-wrap items-center gap-2">
            {socialLinks.map((social) => (
              <li key={social.key}>
                <Link
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#cfd8cf] bg-white text-[#2f7a45] transition hover:border-[#2f7a45] hover:bg-[#eef6f0]"
                >
                  <social.icon className="h-[15px] w-[15px]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:border-l lg:border-[#dde3d8] lg:px-8">
          <FooterLinkColumn title="Explore" links={exploreLinks} />
        </div>
        <div className="lg:border-l lg:border-[#dde3d8] lg:px-8">
          <FooterLinkColumn title="Get Started" links={getStartedLinks} />
        </div>

        <div className="lg:border-l lg:border-[#dde3d8] lg:pl-8">
          <h3 className="text-[14px] font-bold text-[#1a3d2a] sm:text-[15px]">
            Contact Us
          </h3>
          <ul className="mt-2 space-y-2 text-[13px] text-[#2f7a45]">
            <li>
              <a
                href="mailto:info@yogaease.yoga"
                className="inline-flex items-center gap-2 font-medium transition hover:text-[#1f6b3a]"
              >
                <HiOutlineMail className="h-4 w-4 shrink-0" />
                info@yogaease.yoga
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/918000045035"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-2 font-medium transition hover:text-[#1f6b3a]"
              >
                <FaWhatsapp className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-snug">
                  <span className="block">WhatsApp Us</span>
                  <span className="block">80000 45035</span>
                </span>
              </a>
            </li>
            <li className="inline-flex items-start gap-2 font-medium leading-snug">
              <HiOutlineLocationMarker className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                S1, 6th Floor, Aditya Gold Crest
                <br />
                Vaibhav Khand, Indirapuram
                <br />
                Ghaziabad – 201010
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#d9e0d4] bg-[#1a3d2a]">
        <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-2 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8 xl:px-10">
          <p className="text-[12px] text-[#d7e2d8]">
            © {new Date().getFullYear()} The Healing Mat. All Rights Reserved.
          </p>

          <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px]">
            {legalLinks.map((link, index) => (
              <li key={link.label} className="inline-flex items-center">
                {index > 0 ? (
                  <span className="mx-1.5 text-[#8aa38f]" aria-hidden="true">
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
            src="/images/logo-mark.png"
            alt=""
            width={22}
            height={22}
            className="h-[22px] w-[22px] object-contain brightness-0 invert opacity-90"
            aria-hidden="true"
          />
        </div>
      </div>
    </footer>
  );
}
