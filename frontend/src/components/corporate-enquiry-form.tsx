"use client";

import { useState, type FormEvent } from "react";
import { isValidPhoneNumber } from "libphonenumber-js";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { submitCorporateEnquiry } from "@/lib/api";

const fieldClass =
  "w-full rounded-xl border border-[#e4ebe0] bg-white px-3.5 py-2.5 text-[13px] text-[#1f6b3a] outline-none transition placeholder:text-[#a8b4ab] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12";

const labelClass =
  "mb-1 block text-[12px] font-semibold text-[#1f6b3a] sm:text-[13px]";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPhoneValid(phone: string): boolean {
  if (!phone || phone.replace(/\D/g, "").length < 8) return false;
  try {
    return isValidPhoneNumber(phone);
  } catch {
    return false;
  }
}

function isFormValid(input: {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
}): boolean {
  return (
    input.name.trim().length >= 2 &&
    input.company.trim().length >= 2 &&
    EMAIL_PATTERN.test(input.email.trim()) &&
    isPhoneValid(input.phone) &&
    input.message.trim().length >= 5
  );
}

export function CorporateEnquiryForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formValid = isFormValid({ name, company, email, phone, message });
  const canSubmit = formValid && !loading;
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneInvalid = phoneDigits.length > 3 && !isPhoneValid(phone);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!formValid) {
      setError(
        !isPhoneValid(phone)
          ? "Please enter a valid phone number."
          : "Please fill in all fields with valid details before submitting.",
      );
      return;
    }

    setLoading(true);
    try {
      await submitCorporateEnquiry({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.replace(/[^\d+]/g, ""),
        message: message.trim(),
      });
      setSubmitted(true);
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your enquiry. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center px-2 py-8 text-center">
        <p className="font-serif text-[1.25rem] font-bold text-[#1f6b3a] sm:text-[1.35rem]">
          Thank you for your enquiry.
        </p>
        <p className="mt-2 max-w-[360px] text-[13px] leading-relaxed text-[#5f6f64]">
          We’ve received your details and will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setError(null);
          }}
          className="btn-primary mt-4 rounded-full bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="enquiry-name" className={labelClass}>
          Your Name <span className="text-[#c45c3a]">*</span>
        </label>
        <input
          id="enquiry-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder="Enter your full name"
          autoComplete="name"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="enquiry-company" className={labelClass}>
          Company / Organisation <span className="text-[#c45c3a]">*</span>
        </label>
        <input
          id="enquiry-company"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={fieldClass}
          placeholder="Enter your company or organisation name"
          autoComplete="organization"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="enquiry-email" className={labelClass}>
          Work Email <span className="text-[#c45c3a]">*</span>
        </label>
        <input
          id="enquiry-email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          placeholder="Enter your work email address"
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="enquiry-phone" className={labelClass}>
          Phone Number <span className="text-[#c45c3a]">*</span>
        </label>
        <PhoneInput
          defaultCountry="in"
          preferredCountries={["in", "us", "gb", "ae", "au", "sg"]}
          value={phone}
          onChange={(next) => {
            setPhone(next);
            if (error) setError(null);
          }}
          disabled={loading}
          placeholder="Enter your phone number"
          className={`corporate-phone-input ${phoneInvalid ? "corporate-phone-input--invalid" : ""}`}
          inputProps={{
            id: "enquiry-phone",
            required: true,
            name: "phone",
            autoComplete: "tel",
            "aria-invalid": phoneInvalid,
          }}
        />
        {phoneInvalid ? (
          <p className="mt-1.5 text-[12px] leading-snug text-[#a14a32]">
            Please enter a valid phone number.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="enquiry-message" className={labelClass}>
          How can we help you? <span className="text-[#c45c3a]">*</span>
        </label>
        <textarea
          id="enquiry-message"
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} min-h-[84px] resize-none`}
          placeholder="Tell us about your requirements, such as session plans, number of employees, specific goals, etc."
          disabled={loading}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-[#f0d5cc] bg-[#fff7f4] px-3.5 py-2 text-[13px] text-[#a14a32]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        className="btn-primary mt-0.5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.2)] hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#1f6b3a]"
      >
        {loading ? "Sending…" : "Submit Enquiry"}
        {!loading ? <span aria-hidden="true">→</span> : null}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#7a8a7e]">
        <LockIcon className="h-3.5 w-3.5 shrink-0" />
        Your information is safe with us. We respect your privacy.
      </p>
    </form>
  );
}

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
