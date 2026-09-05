"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type MemberSelectOption = {
  value: string;
  label: string;
};

type MemberSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: MemberSelectOption[];
  placeholder?: string;
  className?: string;
};

export function MemberSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
}: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const isPlaceholder = !selected?.value;

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
      setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className={`relative w-full max-w-[300px] ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className="relative flex w-full cursor-pointer items-center rounded-[12px] border border-[#d7e0d6] bg-white py-2 pr-10 pl-3 text-left text-[14px] font-semibold outline-none transition hover:border-[#b7cbb8] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
      >
        <span
          className={`min-w-0 truncate ${
            isPlaceholder ? "font-medium text-[#9aa89c]" : "text-[#243028]"
          }`}
        >
          {displayLabel}
        </span>
        <SelectChevron open={open} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="auth-select-menu absolute top-[calc(100%+6px)] right-0 left-0 z-30 w-full overflow-hidden rounded-[12px] border border-[#d9e2d8] bg-white py-1.5 shadow-[0_16px_40px_rgba(31,107,58,0.14)]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value || "placeholder"} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(option.value)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] transition ${
                    active
                      ? "bg-[#eef6f0] font-semibold text-[#1f6b3a]"
                      : "font-medium text-[#243028] hover:bg-[#f6f8f5]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
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
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SelectChevron({ open }: { open?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6d8474] transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
