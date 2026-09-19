"use client";

import { useEffect, useRef, useState } from "react";

type InlineDobEditorProps = {
  value: string;
  onChange: (isoDate: string) => void;
  onValidityChange?: (valid: boolean) => void;
  className?: string;
};

function isoToDisplay(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Build DD/MM/YYYY while typing; reject impossible day/month/year digits. */
function maskDobInput(raw: string) {
  const today = new Date();
  const maxYear = today.getFullYear();
  const minYear = maxYear - 100;
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let day = "";
  let month = "";
  let year = "";

  function yearPrefixPossible(prefix: string) {
    if (!prefix) return true;
    const start = Number(prefix.padEnd(4, "0"));
    const end = Number(prefix.padEnd(4, "9"));
    return end >= minYear && start <= maxYear;
  }

  for (let i = 0; i < digits.length; i += 1) {
    const ch = digits[i];
    const n = Number(ch);

    if (day.length < 2) {
      if (day.length === 0) {
        if (n > 3) continue;
        day = ch;
      } else {
        const first = Number(day[0]);
        if (first === 0 && n === 0) continue;
        if (first === 3 && n > 1) continue;
        day += ch;
      }
      continue;
    }

    if (month.length < 2) {
      if (month.length === 0) {
        if (n > 1) continue;
        month = ch;
      } else {
        const first = Number(month[0]);
        if (first === 0 && n === 0) continue;
        if (first === 1 && n > 2) continue;
        month += ch;
      }
      continue;
    }

    const nextYear = year + ch;
    if (!yearPrefixPossible(nextYear)) continue;
    year = nextYear;
  }

  if (year.length === 4) {
    const y = Number(year);
    if (y > maxYear) year = String(maxYear);
    if (y < minYear) year = String(minYear);
  }

  if (day.length === 2 && month.length === 2) {
    const m = Number(month);
    const y = year.length === 4 ? Number(year) : 2000;
    let max = daysInMonth(y, m);
    if (m === 2 && year.length < 4) max = 29;
    if (Number(day) > max) day = String(max).padStart(2, "0");
    if (Number(day) < 1) day = "01";
  }

  if (!day) return "";
  if (day.length < 2) return day;
  if (!month) return `${day}/`;
  if (month.length < 2) return `${day}/${month}`;
  if (!year) return `${day}/${month}/`;
  return `${day}/${month}/${year}`;
}

function validateDisplay(display: string): {
  iso: string;
  message: string | null;
} {
  const trimmed = display.trim();
  if (!trimmed) return { iso: "", message: null };

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    return {
      iso: "",
      message: "Enter the full date as DD/MM/YYYY.",
    };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const minYear = currentYear - 100;

  if (month < 1 || month > 12) {
    return { iso: "", message: "Month must be between 01 and 12." };
  }

  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      return { iso: "", message: `${year} is not a leap year.` };
    }
    return {
      iso: "",
      message: `Day must be between 01 and ${String(maxDay).padStart(2, "0")} for this month.`,
    };
  }

  if (year < minYear || year > currentYear) {
    return {
      iso: "",
      message: `Year must be between ${minYear} and ${currentYear}.`,
    };
  }

  const date = new Date(year, month - 1, day);
  if (date > today) {
    return { iso: "", message: "Date of birth cannot be in the future." };
  }

  return {
    iso: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    message: null,
  };
}

const fieldClass =
  "w-full max-w-full rounded-[12px] border bg-white px-3 py-2 text-[14px] font-semibold text-[#243028] outline-none transition placeholder:font-medium placeholder:text-[#9aa89c] focus:ring-2 sm:max-w-[300px]";

export function InlineDobEditor({
  value,
  onChange,
  onValidityChange,
  className = "",
}: InlineDobEditorProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));
  const [touched, setTouched] = useState(false);
  const result = validateDisplay(display);
  const isValid = !display.trim() || Boolean(result.iso);
  const errorText = touched ? result.message : null;
  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;

  useEffect(() => {
    if (!value.trim()) return;
    setDisplay(isoToDisplay(value));
  }, [value]);

  useEffect(() => {
    onValidityChangeRef.current?.(isValid);
  }, [isValid]);

  function handleChange(nextRaw: string) {
    const nextDisplay = maskDobInput(nextRaw);
    setDisplay(nextDisplay);
    const next = validateDisplay(nextDisplay);
    onChange(next.iso);
    onValidityChangeRef.current?.(!nextDisplay.trim() || Boolean(next.iso));
  }

  return (
    <div className="w-full max-w-full sm:max-w-[300px]">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="DD/MM/YYYY"
        value={display}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => setTouched(true)}
        className={`${fieldClass} ${
          errorText
            ? "border-[#e2a8a0] focus:border-[#c45c4a] focus:ring-[#c45c4a]/15"
            : "border-[#d7e0d6] focus:border-[#1f6b3a] focus:ring-[#1f6b3a]/15"
        } ${className}`.trim()}
        maxLength={10}
        aria-label="Date of birth"
        aria-invalid={Boolean(errorText)}
      />
      {errorText ? (
        <p className="mt-1.5 text-[12px] font-medium text-[#c45c4a]">
          {errorText}
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] text-[#6d8474]">
          Type as DD/MM/YYYY. Year must be within the last 100 years.
        </p>
      )}
    </div>
  );
}
