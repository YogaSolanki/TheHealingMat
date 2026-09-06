"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, type ReactNode, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlinePhone,
} from "react-icons/hi";
import buildingIcon from "@/assets/building.png";
import contactFormArt from "@/assets/contact-form.png";
import leafRight from "@/assets/leaf-right.png";
import mapIcon from "@/assets/map.png";
import studioImage from "@/assets/Studio.jpg";
import { ButtonLoader } from "@/components/site-loader";
import { submitContact } from "@/lib/api";

const cream = "#FBF9F5";

const PHONE_DISPLAY = "+91 80000 45035";
const PHONE_TEL = "+918000045035";
const WHATSAPP_URL = "https://wa.me/918000045035";
const EMAIL = "hello@thehealingmat.yoga";
const MAPS_QUERY =
  "51, 5th Floor, Aditya Gold Crest, Vaibhav Khand, Indirapuram, Ghaziabad, Uttar Pradesh 201010";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;

const fieldClass =
  "w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 py-3 text-sm text-[#1f6b3a] outline-none transition placeholder:text-[#9aa89e] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "mb-1.5 block text-sm font-medium text-[#3d4a3c]";

export function ContactSection() {
  return (
    <div className="w-full" style={{ backgroundColor: cream }}>
      <HeroWithCards />
      <ContactFormBlock />
      <CorporateBand />
      <VisitUsBlock />
    </div>
  );
}

function HeroWithCards() {
  const cards: {
    key: string;
    title: string;
    body: ReactNode;
    value: string;
    href: string;
    cta: string;
    icon: ReactNode;
    external: boolean;
  }[] = [
    {
      key: "call",
      title: "Call Us",
      body: "Have a question? Give us a call.",
      value: PHONE_DISPLAY,
      href: `tel:${PHONE_TEL}`,
      cta: "Call Us",
      icon: <HiOutlinePhone className="h-6 w-6" />,
      external: false,
    },
    {
      key: "whatsapp",
      title: "WhatsApp Us",
      body: (
        <>
          Prefer to chat?
          <br />
          Message us on WhatsApp.
        </>
      ),
      value: PHONE_DISPLAY,
      href: WHATSAPP_URL,
      cta: "Chat on WhatsApp",
      icon: <FaWhatsapp className="h-6 w-6" />,
      external: true,
    },
    {
      key: "email",
      title: "Email Us",
      body: "For questions or other enquiries.",
      value: EMAIL,
      href: `mailto:${EMAIL}`,
      cta: "Email Us",
      icon: <HiOutlineMail className="h-6 w-6" />,
      external: false,
    },
  ];

  return (
    <section className="relative w-full" style={{ backgroundColor: cream }}>
      <div className="relative grid w-full items-stretch overflow-hidden lg:grid-cols-2">
        <div className="relative z-10 order-2 flex min-h-0 items-center justify-center px-5 pt-5 pb-6 text-center sm:px-8 sm:pt-7 sm:pb-8 lg:order-1 lg:px-8 lg:py-0 xl:px-12">
          <div className="mx-auto flex w-full max-w-[480px] flex-col items-center text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-black uppercase sm:text-[13px] lg:text-[14px]">
              Contact Us
            </p>
            <h1 className="mt-2.5 font-serif text-[2.1rem] leading-[1.12] font-bold tracking-tight text-[#1f6b3a] sm:mt-3 sm:text-[3rem] lg:text-[3.4rem] xl:text-[3.6rem]">
              We’re Here
              <br />
              to Help.
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-relaxed font-semibold text-[#2c3a30] sm:mt-4 sm:max-w-[380px] sm:text-[16px] lg:text-[15px] xl:text-[18px]">
              Have a question? Get in touch with us in whichever way is easiest
              for you.
            </p>
          </div>
        </div>

        <div className="relative order-1 aspect-[16/11] w-full sm:aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-[520px] xl:min-h-[560px]">
          <div className="absolute inset-0">
            <Image
              src={studioImage}
              alt="The Healing Mat studio"
              fill
              priority
              className="object-cover object-[50%_48%] sm:object-[50%_42%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Desktop only: soft cream blend at the left edge when image is on the right */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 hidden w-14 bg-gradient-to-r from-[#FBF9F5] to-transparent lg:block xl:w-16"
            />
          </div>
        </div>
      </div>

      {/* Mobile: normal stack under copy. Desktop: sit on the image bottom edge. */}
      <div className="relative z-10 mx-auto mt-2 w-full max-w-[1100px] px-4 pb-2 sm:mt-3 sm:px-6 lg:-mt-10 lg:px-8 lg:pb-0">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {cards.map((card) => (
            <li
              key={card.key}
              className="flex h-full flex-col items-center rounded-[20px] border border-[#e8ebe4] bg-[#FBF9F5] px-4 py-6 text-center sm:rounded-[22px] sm:px-5 sm:py-7 lg:px-6 lg:py-8 sm:last:col-span-2 lg:last:col-span-1"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a] sm:h-14 sm:w-14">
                {card.icon}
              </span>
              <h2 className="mt-3 font-serif text-[1.25rem] font-bold text-[#1f6b3a] sm:mt-4 sm:text-[1.45rem]">
                {card.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6f64] sm:mt-2 sm:min-h-[48px] sm:text-[14px] lg:min-h-[48px]">
                {card.body}
              </p>
              <a
                href={card.href}
                {...(card.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="mt-2.5 inline-block break-all text-[14px] font-bold text-[#1f6b3a] transition hover:text-[#185830] sm:mt-3 sm:break-normal sm:text-[16px]"
              >
                {card.value}
              </a>
              <div className="mt-auto pt-4 sm:pt-5">
                <a
                  href={card.href}
                  {...(card.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="btn-outline inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]"
                >
                  {card.cta}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ContactFormBlock() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your message. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full px-3 py-8 sm:px-6 sm:py-10 lg:px-6 lg:py-12 xl:px-8">
      <div className="relative mx-auto grid w-full max-w-[1240px] overflow-hidden rounded-[28px] border border-[#ebe6dc] bg-[#FBF9F5] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative flex flex-col px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-12">
          <div className="relative z-10 mx-auto mt-4 max-w-[340px] text-center sm:mt-6 lg:mt-8">
            <h2 className="font-serif text-[1.65rem] leading-tight font-bold text-[#1f6b3a] sm:text-[1.95rem] lg:text-[2.1rem]">
              Have a Question?
              <br />
              We’re Here to Help.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              Tell us what you need help with and we’ll get back to you as soon
              as possible.
            </p>
          </div>

          <div className="mt-8 flex flex-1 items-end justify-center pb-1 lg:mt-10">
            <Image
              src={contactFormArt}
              alt=""
              aria-hidden="true"
              className="h-auto w-[260px] object-contain sm:w-[320px] lg:w-[360px] xl:w-[400px]"
              sizes="(max-width: 1024px) 320px, 400px"
            />
          </div>
        </div>

        <div className="border-t border-[#ebe6dc] px-6 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-10 lg:py-12 xl:px-12">
          {submitted ? (
            <div className="flex h-full min-h-[280px] flex-col items-start justify-center">
              <p className="font-serif text-[1.5rem] font-bold text-[#1f6b3a]">
                Thank you!
              </p>
              <p className="mt-2 max-w-[360px] text-[14px] leading-relaxed text-[#5f6f64]">
                We’ve received your message and will get back to you as soon as
                possible.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setPhone("");
                  setEmail("");
                  setMessage("");
                }}
                className="btn-outline mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-[#1f6b3a]"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>
                  Name <span className="text-[#c45c3a]">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Phone Number <span className="text-[#c45c3a]">*</span>
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                  placeholder="Your phone number"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className={labelClass}>Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                  placeholder="Your email address"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={labelClass}>
                  How can we help you?{" "}
                  <span className="text-[#c45c3a]">*</span>
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${fieldClass} min-h-[120px] resize-y`}
                  placeholder="Tell us how we can help you..."
                />
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-[#f0d0c4] bg-[#fff7f4] px-3.5 py-3 text-[13px] text-[#9a4030]"
                >
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-3.5 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <ButtonLoader />
                ) : (
                  <>
                    Send Message
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
              <p className="flex items-center gap-1.5 text-[12px] text-[#6d8474]">
                <HiOutlineLockClosed
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                We’ll get back to you as soon as possible.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function CorporateBand() {
  return (
    <section className="w-full px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-5 overflow-hidden rounded-[28px] border border-[#d9e5d8] bg-[#E8F0E4] px-6 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-7 lg:gap-8 lg:px-10 lg:py-8">
        <Image
          src={leafRight}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 h-24 w-auto opacity-30 sm:h-32"
        />
        <div className="relative z-10 flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-14 sm:w-14">
            <Image
              src={buildingIcon}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain sm:h-7 sm:w-7"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(29%) sepia(34%) saturate(900%) hue-rotate(95deg) brightness(92%) contrast(92%)",
              }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="pt-1.5 text-[15px] leading-snug font-bold text-[#1f6b3a] sm:pt-0 sm:text-[16px] lg:text-[17px]">
              Looking for Corporate Plans?
            </h2>
            <p className="mt-1.5 max-w-[520px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              Want to offer The Healing Mat to your employees?
              <br />
              Explore our corporate plans or speak with us about employee
              wellness programmes.
            </p>
          </div>
        </div>
        <Link
          href="/corporate/enquiry"
          className="btn-primary relative z-10 inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-3 text-[13px] font-bold text-white sm:w-auto sm:px-7 sm:text-[14px]"
        >
          Enquire Now
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

function VisitUsBlock() {
  return (
    <section className="w-full px-3 pb-8 sm:px-6 sm:pb-12 lg:px-6 lg:pb-14 xl:px-8">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[0.95fr_1.2fr] overflow-hidden rounded-[22px] border border-[#ebe6dc] bg-[#FBF9F5] sm:grid-cols-[0.9fr_1.25fr] sm:rounded-[28px] lg:grid-cols-[0.9fr_1.35fr]">
        <div className="flex flex-col justify-center px-3.5 py-5 sm:px-7 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="flex items-center gap-1 sm:gap-2">
            <Image
              src={mapIcon}
              alt=""
              aria-hidden="true"
              className="h-9 w-6 object-contain object-center sm:h-14 sm:w-9 lg:h-16 lg:w-10"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(29%) sepia(34%) saturate(900%) hue-rotate(95deg) brightness(92%) contrast(92%)",
              }}
            />
            <h2 className="font-serif text-[1.15rem] font-bold text-black sm:text-[1.55rem] lg:text-[1.75rem]">
              Visit Us
            </h2>
          </div>
          <p className="mt-3 text-[13px] font-extrabold text-[#1f6b3a] sm:mt-5 sm:text-[16px] lg:mt-6 lg:text-[17px]">
            The Healing Mat
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-[#5f6f64] sm:mt-2.5 sm:max-w-[320px] sm:text-[14px] sm:leading-relaxed lg:text-[15px]">
            51, 5th Floor, Aditya Gold Crest,
            <br />
            Vaibhav Khand, Indirapuram,
            <br />
            Ghaziabad, Uttar Pradesh – 201010
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-outline mt-4 inline-flex w-fit max-w-full cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border-[1.5px] border-[#1f6b3a] px-2.5 py-1.5 text-[10px] font-bold text-[#1f6b3a] sm:mt-6 sm:gap-1.5 sm:px-5 sm:py-2.5 sm:text-[13px] lg:mt-7 lg:px-6 lg:text-[14px]"
          >
            View on Google Maps
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="relative min-h-[180px] border-l border-[#ebe6dc] sm:min-h-[280px] lg:min-h-[380px]">
          <iframe
            title="The Healing Mat location on Google Maps"
            src={MAPS_EMBED}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
