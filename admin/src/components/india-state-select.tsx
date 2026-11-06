"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { INDIA_STATES } from "@/lib/india-profile";

type IndiaStateSelectProps = {
  value: string;
  onChange: (state: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
};

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function IndiaStateSelect({
  value,
  onChange,
  placeholder = "Select state",
  disabled = false,
  className = "",
}: IndiaStateSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const options = useMemo(() => {
    const list = [...INDIA_STATES] as string[];
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      return [trimmed, ...list];
    }
    return list;
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }

    function updatePosition() {
      const trigger = rootRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const preferredMax = Math.min(280, window.innerHeight * 0.45);
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
      const spaceAbove = rect.top - gap - 8;
      const placeAbove = spaceBelow < preferredMax && spaceAbove > spaceBelow;
      const available = placeAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(160, Math.min(preferredMax, available));

      setMenuPos(
        placeAbove
          ? {
              bottom: window.innerHeight - rect.top + gap,
              left: rect.left,
              width: Math.max(rect.width, 260),
              maxHeight,
            }
          : {
              top: rect.bottom + gap,
              left: rect.left,
              width: Math.max(rect.width, 260),
              maxHeight,
            },
      );
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  function choose(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) setOpen(true);
    }
  }

  const menuStyle: CSSProperties | undefined = menuPos
    ? {
        top: menuPos.top,
        bottom: menuPos.bottom,
        left: menuPos.left,
        width: menuPos.width,
        maxHeight: menuPos.maxHeight,
      }
    : undefined;

  const selected = value.trim();

  const menu =
    open && mounted && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="fixed z-[240] flex flex-col overflow-hidden rounded-[12px] border border-[#d9e2d8] bg-white shadow-[0_16px_40px_rgba(31,107,58,0.14)]"
          >
            <div className="shrink-0 border-b border-[#e8ebe4] p-2">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search state"
                className="w-full rounded-lg border border-[#e4ebe0] bg-[#fafcfb] px-2.5 py-2 text-[12px] text-[#1f6b3a] outline-none placeholder:text-[#a8b4ab] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12"
              />
            </div>
            <ul
              id={listId}
              role="listbox"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
              style={{ maxHeight: menuPos.maxHeight - 52 }}
            >
              {filtered.length === 0 ? (
                <li className="px-3.5 py-3 text-[12px] text-[#7a8a7e]">
                  No states match
                </li>
              ) : (
                filtered.map((name) => {
                  const active = name === selected;
                  return (
                    <li key={name} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => choose(name)}
                        className={`flex w-full cursor-pointer items-center px-3.5 py-2.5 text-left text-[13px] transition ${
                          active
                            ? "bg-[#eef6f0] font-semibold text-[#1f6b3a]"
                            : "bg-white font-medium text-[#243028] hover:bg-[#f6f8f5]"
                        }`}
                      >
                        <span className="min-w-0 truncate">{name}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
          if (open) setQuery("");
        }}
        onKeyDown={onTriggerKeyDown}
        className="relative flex h-11 w-full cursor-pointer items-center rounded-xl border border-[#e2e8df] bg-white py-2.5 pr-9 pl-3.5 text-left text-sm outline-none transition hover:border-[#b7cbb8] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#5f6f64] disabled:opacity-60"
      >
        {selected ? (
          <span className="min-w-0 truncate font-medium text-[#243028]">
            {selected}
          </span>
        ) : (
          <span className="min-w-0 truncate font-medium text-[#9aa89c]">
            {placeholder}
          </span>
        )}
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
      </button>
      {menu}
    </div>
  );
}
