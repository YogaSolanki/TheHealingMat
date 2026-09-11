"use client";

import Link from "next/link";
import { FormEvent, type ReactNode, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  HiOutlineLockClosed,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineQuestionMarkCircle,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { ButtonLoader } from "@/components/site-loader";
import { submitContact } from "@/lib/api";
import {
  SITE_EMAIL,
  SITE_MAPS_URL,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_WHATSAPP_URL,
} from "@/lib/site-contact";

const cream = "#FBF9F5";
const MAPS_QUERY =
  "51, 5th Floor, Aditya Gold Crest, Vaibhav Khand, Indirapuram, Ghaziabad, Uttar Pradesh 201010";
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;

const fieldClass =
  "w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 py-3 text-sm text-[#1f6b3a] outline-none transition placeholder:text-[#9aa89e] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "mb-1.5 block text-sm font-medium text-[#3d4a3c]";

export function ContactSection() {
  return (
    <div className="w-full bg-white">
      <section className="w-full px-4 pt-8 pb-6 sm:px-6 sm:pt-10 sm:pb-8 lg:px-8 lg:pt-12 lg:pb-10">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10 xl:gap-12">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#1f6b3a] uppercase sm:text-[12px]">
              Contact Us
            </p>
            <h1 className="mt-2.5 font-serif text-[2rem] leading-[1.12] font-bold tracking-tight text-black sm:mt-3 sm:text-[2.6rem] lg:text-[2.85rem]">
              We’re Here to Help.
            </h1>
            <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-[#5f6f64] sm:mt-3.5 sm:text-[15px] lg:text-[16px]">
              Have a question about The Healing Mat?
              <br />
              Get in touch with us in whichever way is easiest for you.
            </p>

            <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-3.5">
              <ContactChannelCard
                icon={<HiOutlinePhone className="h-5 w-5 sm:h-6 sm:w-6" />}
                title="Call Us"
                description="Speak with our team."
                value={SITE_PHONE_DISPLAY}
                href={`tel:${SITE_PHONE_TEL}`}
                meta="Mon – Sat, 9:00 AM – 6:00 PM (IST)"
                cta="Call Us"
              />
              <ContactChannelCard
                icon={<FaWhatsapp className="h-5 w-5 sm:h-6 sm:w-6" />}
                title="WhatsApp Us"
                description="Prefer to chat? Message us on WhatsApp."
                value={SITE_PHONE_DISPLAY}
                href={SITE_WHATSAPP_URL}
                meta="Mon – Sat, 9:00 AM – 6:00 PM (IST)"
                cta="Chat on WhatsApp"
                external
              />
              <ContactChannelCard
                icon={<HiOutlineMail className="h-5 w-5 sm:h-6 sm:w-6" />}
                title="Email Us"
                description="For questions or other enquiries."
                value={SITE_EMAIL}
                href={`mailto:${SITE_EMAIL}`}
                meta="We usually respond within 1 working day."
                cta="Send an Email"
              />
            </ul>
          </div>

          <ContactFormCard />
        </div>
      </section>

      <section className="w-full px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        <div className="mx-auto grid w-full max-w-[1240px] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:items-stretch">
          <article className="grid overflow-hidden rounded-[20px] border border-[#e8ebe4] bg-white sm:rounded-[22px] md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col items-center justify-center px-5 py-6 text-center sm:px-6 sm:py-7 lg:px-6 lg:py-7">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a] sm:h-12 sm:w-12">
                <HiOutlineLocationMarker className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-bold text-black sm:text-[17px]">
                Visit Us
              </h2>
              <p className="mt-2 text-[14px] font-bold text-[#1f6b3a]">
                The Healing Mat
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                51, 5th Floor, Aditya Gold Crest
                <br />
                Vaibhav Khand, Indirapuram
                <br />
                Ghaziabad, Uttar Pradesh – 201010
              </p>
              <a
                href={SITE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-outline mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]"
              >
                View on Google Maps
                <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="relative min-h-[220px] border-t border-[#e8ebe4] sm:min-h-[240px] md:min-h-full md:border-t-0 md:border-l">
              <iframe
                title="The Healing Mat location on Google Maps"
                src={MAPS_EMBED}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </article>

          <article
            className="flex flex-col items-center justify-center rounded-[20px] border border-[#ebe6dc] px-5 py-8 text-center sm:rounded-[22px] sm:px-6 sm:py-10"
            style={{ backgroundColor: cream }}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f3ebe0] text-[#c47a2c] sm:h-12 sm:w-12">
              <HiOutlineUserGroup className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <h2 className="mt-4 text-[16px] font-bold text-black sm:text-[17px]">
              Looking for Corporate Plans?
            </h2>
            <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              Want to offer The Healing Mat to your employees?
              <br />
              Get in touch with our corporate wellness team.
            </p>
            <Link
              href="/corporate"
              className="btn-outline mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[#c47a2c] px-5 py-2.5 text-[13px] font-bold text-[#c47a2c] sm:text-[14px]"
            >
              Explore Corporate Plans
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="w-full px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 rounded-[20px] border border-[#e8ebe4] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-[22px] sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a] sm:h-12 sm:w-12">
              <HiOutlineQuestionMarkCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <p className="text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              <span className="font-bold text-black">Have a common question?</span>
              <br className="sm:hidden" />{" "}
              You may find the answer in our FAQs.
            </p>
          </div>
          <Link
            href="/faq"
            className="btn-outline inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-[#1f6b3a] sm:w-auto sm:text-[14px]"
          >
            View FAQs
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ContactChannelCard({
  icon,
  title,
  description,
  value,
  href,
  meta,
  cta,
  external = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  value: string;
  href: string;
  meta: string;
  cta: string;
  external?: boolean;
}) {
  const linkProps = external
    ? ({ target: "_blank", rel: "noreferrer" } as const)
    : {};

  return (
    <li className="flex flex-col gap-4 rounded-[18px] border border-[#e8ebe4] bg-white px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:rounded-[20px] sm:px-5 sm:py-5">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a] sm:h-12 sm:w-12">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-black sm:text-[16px]">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-[#5f6f64] sm:text-[14px]">
            {description}
          </p>
          <a
            href={href}
            {...linkProps}
            className="mt-1.5 inline-block break-all text-[14px] font-bold text-[#1f6b3a] transition hover:text-[#185830] sm:break-normal sm:text-[15px]"
          >
            {value}
          </a>
          <p className="mt-1 text-[12px] text-[#7a8a7e] sm:text-[13px]">{meta}</p>
        </div>
      </div>
      <a
        href={href}
        {...linkProps}
        className="btn-outline inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#1f6b3a] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap text-[#1f6b3a] sm:w-auto sm:px-5 sm:text-[14px]"
      >
        {cta}
        <span aria-hidden="true">→</span>
      </a>
    </li>
  );
}

function ContactFormCard() {
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
    <div
      className="rounded-[22px] border border-[#ebe6dc] px-5 py-6 sm:rounded-[24px] sm:px-7 sm:py-8 lg:px-8 lg:py-9"
      style={{ backgroundColor: cream }}
    >
      {submitted ? (
        <div className="flex min-h-[320px] flex-col items-start justify-center">
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
        <>
          <h2 className="font-serif text-[1.45rem] leading-tight font-bold text-black sm:text-[1.65rem] lg:text-[1.75rem]">
            Send Us a Message
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
            Tell us what you need help with and we’ll get back to you.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4 sm:mt-6">
            <div>
              <label className={labelClass}>
                Name <span className="text-[#c45c3a]">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Enter your full name"
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
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelClass}>
                How can we help you? <span className="text-[#c45c3a]">*</span>
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${fieldClass} min-h-[120px] resize-y`}
                placeholder="Tell us your question or message here..."
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
              Your information is safe with us. We respect your privacy.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
