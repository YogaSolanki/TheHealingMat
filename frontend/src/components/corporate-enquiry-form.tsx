"use client";

import { useState, type FormEvent } from "react";

const employeeOptions = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1,000",
  "1,000+",
];

const fieldClass =
  "w-full rounded-xl border border-[#e4ebe0] bg-white px-3.5 py-2.5 text-[13px] text-[#1f6b3a] outline-none transition placeholder:text-[#a8b4ab] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12 sm:py-3 sm:text-[14px]";

const labelClass =
  "mb-1.5 block text-[12px] font-semibold text-[#1f6b3a] sm:text-[13px]";

export function CorporateEnquiryForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employees, setEmployees] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(
      `Corporate Enquiry — ${company || "Organisation"}`,
    );
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Company / Organisation: ${company}`,
        `Work Email: ${email}`,
        `Phone: +91 ${phone}`,
        `Approximate Number of Employees: ${employees}`,
        "",
        "How can we help you?",
        message,
      ].join("\n"),
    );
    window.location.href = `mailto:corporate@thehealingmat.yoga?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-2 text-center">
        <p className="font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.5rem]">
          Thank you for your enquiry.
        </p>
        <p className="mt-2 max-w-[360px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
          Your email client should open with the details filled in. We’ll get
          back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="btn-primary mt-5 rounded-full bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5 sm:space-y-4">
      <div>
        <label htmlFor="enquiry-name" className={labelClass}>
          Name <span className="text-[#c45c3a]">*</span>
        </label>
        <input
          id="enquiry-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder="Your full name"
          autoComplete="name"
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
          placeholder="Company or organisation name"
          autoComplete="organization"
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
          placeholder="Your work email address"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="enquiry-phone" className={labelClass}>
          Phone Number <span className="text-[#c45c3a]">*</span>
        </label>
        <div className="flex gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#e4ebe0] bg-white px-2.5 py-2.5 text-[13px] font-semibold text-[#1f6b3a] sm:px-3 sm:py-3">
            <span aria-hidden="true" className="text-[15px] leading-none">
              🇮🇳
            </span>
            <span>+91</span>
            <ChevronDown className="h-3 w-3 text-[#6b7c6e]" />
          </span>
          <input
            id="enquiry-phone"
            required
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
            className={fieldClass}
            placeholder="Enter your phone number"
            autoComplete="tel-national"
          />
        </div>
      </div>

      <div>
        <label htmlFor="enquiry-employees" className={labelClass}>
          Approximate Number of Employees{" "}
          <span className="text-[#c45c3a]">*</span>
        </label>
        <select
          id="enquiry-employees"
          required
          value={employees}
          onChange={(e) => setEmployees(e.target.value)}
          className={`${fieldClass} appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%236b7c6e%22 d=%22M1 1l5 5 5-5%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10`}
        >
          <option value="" disabled>
            Select number of employees
          </option>
          {employeeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
          className={`${fieldClass} min-h-[88px] resize-none`}
          placeholder="Tell us a little about your requirements..."
        />
      </div>

      <button
        type="submit"
        className="btn-primary mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.22)] hover:bg-[#185830]"
      >
        Submit Enquiry
        <span aria-hidden="true">→</span>
      </button>

      <p className="flex items-center justify-center gap-1.5 pt-0.5 text-center text-[11px] text-[#7a8a7e] sm:text-[12px]">
        <LockIcon className="h-3.5 w-3.5 shrink-0" />
        Your information is safe with us. We respect your privacy.
      </p>
    </form>
  );
}

function ChevronDown({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 8" className={className} fill="none" aria-hidden="true">
      <path
        d="M1 1.5 6 6.5 11 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
