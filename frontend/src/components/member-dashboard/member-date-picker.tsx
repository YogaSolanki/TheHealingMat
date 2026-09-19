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
  /** Inclusive lower bound as YYYY-MM-DD. Defaults to 100 years ago. */
  minDate?: string;
  /** Inclusive upper bound as YYYY-MM-DD. Defaults to today. */
  maxDate?: string;
  allowClear?: boolean;
  dialogLabel?: string;
  /** Force panel side, or auto-flip based on available space. */
  placement?: "auto" | "above" | "below";
  /** Compact panel for tight layouts like checkout. */
  size?: "md" | "sm";
};

export function MemberDatePicker({
  value,
  onChange,
  placeholder = "Select date of birth",
  className = "",
  minDate: minDateProp,
  maxDate: maxDateProp,
  allowClear = true,
  dialogLabel = "Choose date",
  placement = "auto",
  size = "md",
}: MemberDatePickerProps) {
  const compact = size === "sm";
  const today = useMemo(() => startOfDay(new Date()), []);
  const minDate = useMemo(() => {
    const parsed = minDateProp ? parseIso(minDateProp) : null;
    if (parsed) return startOfDay(parsed);
    return new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  }, [minDateProp, today]);
  const maxDate = useMemo(() => {
    const parsed = maxDateProp ? parseIso(maxDateProp) : null;
    if (parsed) return startOfDay(parsed);
    return today;
  }, [maxDateProp, today]);
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [panelSide, setPanelSide] = useState<"above" | "below">(
    placement === "above" ? "above" : "below",
  );
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? (maxDate < today ? maxDate : today)),
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

    function resolvePlacement() {
      if (placement === "above" || placement === "below") {
        setPanelSide(placement);
        return;
      }
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const panelHeight = compact ? 260 : 340;
      setPanelSide(
        spaceBelow < panelHeight && spaceAbove > spaceBelow ? "above" : "below",
      );
    }

    resolvePlacement();

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onViewportChange() {
      resolvePlacement();
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, placement, compact]);

  const cells = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const years = useMemo(() => {
    const options: number[] = [];
    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();
    if (endYear >= startYear) {
      for (let year = endYear; year >= startYear; year -= 1) {
        options.push(year);
      }
    } else {
      for (let year = startYear; year >= endYear; year -= 1) {
        options.push(year);
      }
    }
    return options;
  }, [minDate, maxDate]);

  function isDisabled(date: Date) {
    const day = startOfDay(date);
    return day > maxDate || day < minDate;
  }

  function selectDate(date: Date) {
    if (isDisabled(date)) return;
    onChange(toIso(date));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewMonth((current) => {
      const next = startOfMonth(
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
      );
      if (next < startOfMonth(minDate) || next > startOfMonth(maxDate)) {
        return current;
      }
      return next;
    });
  }

  const displayLabel = selected
    ? selected.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  const canGoNext =
    startOfMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
    ) <= startOfMonth(maxDate);
  const canGoPrev =
    startOfMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
    ) >= startOfMonth(minDate);
  const showCompactBack = compact && canGoPrev;

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${compact ? "max-w-[260px]" : "max-w-[300px]"} ${className}`}
    >
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
          aria-label={dialogLabel}
          className={`absolute z-40 overflow-hidden rounded-[14px] border border-[#d9e2d8] bg-white shadow-[0_16px_40px_rgba(31,107,58,0.14)] ${
            compact
              ? "right-0 left-auto w-[236px] p-2.5"
              : "right-0 left-0 max-h-[min(340px,70vh)] overflow-y-auto overscroll-contain p-3 sm:p-4"
          } ${
            panelSide === "above"
              ? "bottom-[calc(100%+6px)]"
              : "top-[calc(100%+6px)]"
          }`}
        >
          {compact ? (
            <div className="relative mb-2 flex h-7 items-center justify-center">
              {showCompactBack ? (
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => shiftMonth(-1)}
                  className="absolute left-0 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border border-[#e3ebe3] text-[#1f6b3a] transition hover:bg-[#f6f8f5]"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <p className="px-8 text-center text-[12px] font-semibold text-[#243028]">
                {MONTHS[viewMonth.getMonth()].slice(0, 3)} {viewMonth.getFullYear()}
              </p>
              <button
                type="button"
                aria-label="Next month"
                disabled={!canGoNext}
                onClick={() => shiftMonth(1)}
                className="absolute right-0 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border border-[#e3ebe3] text-[#1f6b3a] transition hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
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
                        new Date(
                          viewMonth.getFullYear(),
                          Number(event.target.value),
                          1,
                        ),
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
                        new Date(
                          Number(event.target.value),
                          viewMonth.getMonth(),
                          1,
                        ),
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
          )}

          <div className={`grid grid-cols-7 ${compact ? "mb-0.5 gap-0.5" : "mb-1 gap-1"}`}>
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className={`text-center font-bold tracking-wide text-[#8a9a8d] uppercase ${
                  compact ? "py-0.5 text-[9px]" : "py-1 text-[11px]"
                }`}
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 ${compact ? "gap-0.5" : "gap-1"}`}>
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
                  className={`inline-flex w-full cursor-pointer items-center justify-center font-semibold transition ${
                    compact
                      ? "h-7 rounded-[7px] text-[11px]"
                      : "h-8 rounded-[10px] text-[13px] sm:h-9"
                  } ${
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

          {allowClear && value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`w-full cursor-pointer font-semibold text-[#6b7c6e] transition hover:bg-[#f6f8f5] hover:text-[#1f6b3a] ${
                compact
                  ? "mt-2 rounded-[8px] px-1.5 py-1.5 text-[11px]"
                  : "mt-3 rounded-[10px] px-2 py-2 text-[12px]"
              }`}
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
