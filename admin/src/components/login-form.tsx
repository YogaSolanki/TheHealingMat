"use client";

import { FormEvent, useState } from "react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const fieldClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[#d9ddd6] bg-white px-3.5 text-base text-[#1f2a24] outline-none transition placeholder:text-[#9aa59a] focus:border-[#243028] focus:ring-2 focus:ring-[#243028]/15 sm:h-12 sm:text-sm";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  function validate() {
    const next: { email?: string; password?: string } = {};

    if (!email.trim()) {
      next.email = "Enter your email.";
    } else if (!isValidEmail(email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Enter your password.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validate();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-[13px] font-medium text-[#3d4a3c]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          placeholder="you@example.com"
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) {
              setErrors((current) => ({ ...current, email: undefined }));
            }
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClass}
        />
        {errors.email ? (
          <p id="email-error" className="mt-1.5 text-sm text-[#9b3d3d]">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[13px] font-medium text-[#3d4a3c]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            placeholder="Enter your password"
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((current) => ({ ...current, password: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1.5 right-0 flex h-11 w-11 items-center justify-center text-[#6d7a6c] hover:text-[#243028] sm:h-12"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-sm text-[#9b3d3d]">
            {errors.password}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className="mt-2 h-11 w-full rounded-lg bg-[#243028] text-[15px] font-medium tracking-wide text-white transition hover:bg-[#1a241c] sm:h-12"
      >
        Sign in
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 3.8" />
      <path d="M6.7 6.7C3.9 8.6 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.3-.9" />
    </svg>
  );
}
