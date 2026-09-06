"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(viewMonth: Date) {
  const first = startOfMonth(viewMonth);
  const startOffset = first.getDay();
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  const previousMonthDays = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    0,
  ).getDate();

  for (let index = startOffset - 1; index >= 0; index -= 1) {
    cells.push({
      date: new Date(
        viewMonth.getFullYear(),
        viewMonth.getMonth() - 1,
        previousMonthDays - index,
      ),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day),
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1]?.date;
    cells.push({
      date: new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1,
      ),
      inMonth: false,
    });
  }

  return cells;
}

type MemberDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function MemberDatePicker({
  value,
  onChange,
  placeholder = "Select date of birth",
  className = "",
}: MemberDatePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const minDate = useMemo(
    () => new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()),
    [today],
  );
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? today),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (selected) {
      setViewMonth(startOfMonth(selected));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const cells = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const years = useMemo(() => {
    const options: number[] = [];
    for (let year = today.getFullYear(); year >= minDate.getFullYear(); year -= 1) {
      options.push(year);
    }
    return options;
  }, [minDate, today]);

  function isDisabled(date: Date) {
    const day = startOfDay(date);
    return day > today || day < minDate;
  }

  function selectDate(date: Date) {
    if (isDisabled(date)) return;
    onChange(toIso(date));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewMonth((current) =>
      startOfMonth(new Date(current.getFullYear(), current.getMonth() + delta, 1)),
    );
  }

  const displayLabel = selected
    ? selected.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  return (
    <div ref={rootRef} className={`relative w-full max-w-[300px] ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="relative flex w-full cursor-pointer items-center rounded-[12px] border border-[#d7e0d6] bg-white py-2 pr-10 pl-3 text-left text-[14px] font-semibold outline-none transition hover:border-[#b7cbb8] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
      >
        <span
          className={`min-w-0 truncate ${
            selected ? "text-[#243028]" : "font-medium text-[#9aa89c]"
          }`}
        >
          {displayLabel}
        </span>
        <CalendarGlyph className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[#6d8474]" />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose date of birth"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 overflow-hidden rounded-[16px] border border-[#d9e2d8] bg-white p-3 shadow-[0_16px_40px_rgba(31,107,58,0.14)] sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e3ebe3] text-[#1f6b3a] transition hover:bg-[#f6f8f5]"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <select
                aria-label="Month"
                value={viewMonth.getMonth()}
                onChange={(event) =>
                  setViewMonth(
                    startOfMonth(
                      new Date(viewMonth.getFullYear(), Number(event.target.value), 1),
                    ),
                  )
                }
                className="min-w-0 flex-1 cursor-pointer rounded-[10px] border border-[#d7e0d6] bg-white px-2 py-1.5 text-[13px] font-semibold text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                aria-label="Year"
                value={viewMonth.getFullYear()}
                onChange={(event) =>
                  setViewMonth(
                    startOfMonth(
                      new Date(Number(event.target.value), viewMonth.getMonth(), 1),
                    ),
                  )
                }
                className="w-[88px] shrink-0 cursor-pointer rounded-[10px] border border-[#d7e0d6] bg-white px-2 py-1.5 text-[13px] font-semibold text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e3ebe3] text-[#1f6b3a] transition hover:bg-[#f6f8f5]"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="py-1 text-center text-[11px] font-bold tracking-wide text-[#8a9a8d] uppercase"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map(({ date, inMonth }) => {
              const disabled = isDisabled(date);
              const isSelected = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={toIso(date)}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  className={`inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[10px] text-[13px] font-semibold transition ${
                    isSelected
                      ? "bg-[#1f6b3a] text-white shadow-[0_4px_12px_rgba(31,107,58,0.25)]"
                      : disabled
                        ? "cursor-not-allowed text-[#c5cec7]"
                        : inMonth
                          ? "text-[#243028] hover:bg-[#eef6f0]"
                          : "text-[#a8b4aa] hover:bg-[#f6f8f5]"
                  } ${isToday && !isSelected ? "ring-1 ring-[#1f6b3a]/35 ring-inset" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-3 w-full cursor-pointer rounded-[10px] px-2 py-2 text-[12px] font-semibold text-[#6b7c6e] transition hover:bg-[#f6f8f5] hover:text-[#1f6b3a]"
            >
              Clear date
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M12.5 5 7.5 10l5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="m7.5 5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
