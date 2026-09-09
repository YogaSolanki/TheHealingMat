"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { submitCorporateEnquiry } from "@/lib/api";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!employees) {
      setError("Please select the approximate number of employees.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitCorporateEnquiry({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employees,
        message: message.trim(),
      });
      setSubmitted(true);
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setEmployees("");
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
      <div className="flex min-h-[360px] flex-col items-center justify-center px-2 text-center">
        <p className="font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.5rem]">
          Thank you for your enquiry.
        </p>
        <p className="mt-2 max-w-[360px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
          We’ve received your details and will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setError(null);
          }}
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
          placeholder="Company or organisation name"
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
          placeholder="Your work email address"
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="enquiry-phone" className={labelClass}>
          Phone Number <span className="text-[#c45c3a]">*</span>
        </label>
        <input
          id="enquiry-phone"
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
          placeholder="Your phone number"
          autoComplete="tel"
          disabled={loading}
        />
      </div>

      <div>
        <span id="enquiry-employees-label" className={labelClass}>
          Approximate Number of Employees{" "}
          <span className="text-[#c45c3a]">*</span>
        </span>
        <EmployeesSelect
          value={employees}
          onChange={setEmployees}
          disabled={loading}
        />
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
          disabled={loading}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-[#f0d5cc] bg-[#fff7f4] px-3.5 py-2.5 text-[13px] text-[#a14a32]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.22)] hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending…" : "Submit Enquiry"}
        {!loading ? <span aria-hidden="true">→</span> : null}
      </button>

      <p className="flex items-center justify-center gap-1.5 pt-0.5 text-center text-[11px] text-[#7a8a7e] sm:text-[12px]">
        <LockIcon className="h-3.5 w-3.5 shrink-0" />
        Your information is safe with us. We respect your privacy.
      </p>
    </form>
  );
}

function EmployeesSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isPlaceholder = !value;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id="enquiry-employees"
        aria-labelledby="enquiry-employees-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className={`relative flex w-full cursor-pointer items-center rounded-xl border border-[#e4ebe0] bg-white px-3.5 py-2.5 pr-10 text-left text-[13px] outline-none transition focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12 disabled:cursor-not-allowed disabled:opacity-70 sm:py-3 sm:text-[14px] ${
          open ? "border-[#1f6b3a] ring-2 ring-[#1f6b3a]/12" : ""
        }`}
      >
        <span
          className={`min-w-0 truncate ${
            isPlaceholder ? "text-[#a8b4ab]" : "font-medium text-[#1f6b3a]"
          }`}
        >
          {value || "Select number of employees"}
        </span>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[#6b7c6e] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 w-full overflow-hidden rounded-xl border border-[#e4ebe0] bg-white py-1.5 shadow-[0_16px_40px_rgba(31,107,58,0.12)]"
        >
          {employeeOptions.map((option) => {
            const active = option === value;
            return (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(option)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition sm:text-[14px] ${
                    active
                      ? "bg-[#eef6f0] font-semibold text-[#1f6b3a]"
                      : "font-medium text-[#243028] hover:bg-[#f6f8f5]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#1f6b3a] ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M3.5 8.2L6.4 11.1L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
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
