"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isCatalogListPath,
  useCatalogQuery,
} from "@/hooks/use-catalog-query";
import { healthArticles } from "@/lib/health-articles";
import { healthVideos } from "@/lib/health-videos";
import { resourceGuides } from "@/lib/resource-guides";

function useCatalogMeta(pathname: string) {
  return useMemo(() => {
    if (pathname === "/articles") {
      return {
        items: healthArticles,
        placeholder: "Search articles…",
        accent: "#8B6B3E",
      };
    }
    if (pathname === "/videos") {
      return {
        items: healthVideos,
        placeholder: "Search videos…",
        accent: "#1f6b3a",
      };
    }
    return {
      items: resourceGuides,
      placeholder: "Search resources…",
      accent: "#1f6b3a",
    };
  }, [pathname]);
}

export function HeaderCatalogFilters() {
  const pathname = usePathname();
  const { search, category, setSearch, setCategory } = useCatalogQuery();
  const { items, placeholder, accent } = useCatalogMeta(pathname);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category))).sort(
      (a, b) => a.localeCompare(b),
    );
    return ["All", ...unique];
  }, [items]);

  useEffect(() => {
    setCategoryOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!categoryOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCategoryOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoryOpen]);

  if (!isCatalogListPath(pathname)) return null;

  const categoryLabel = category === "All" ? "All categories" : category;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <label className="relative w-[240px] xl:w-[286px]">
        <span className="sr-only">Search</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2"
          fill="none"
          style={{ color: accent }}
        >
          <circle
            cx="8.5"
            cy="8.5"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12.5 12.5 17 17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-[#d9e2d8] bg-white py-2 pr-3.5 pl-9 text-[13px] text-[#2c3a30] outline-none transition placeholder:text-[#9aa89e] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12"
        />
      </label>

      <div ref={categoryRef} className="relative w-[158px] xl:w-[170px]">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={categoryOpen}
          aria-controls={listId}
          onClick={() => setCategoryOpen((open) => !open)}
          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border bg-white py-2 pr-3 pl-3.5 text-left text-[13px] font-semibold outline-none transition ${
            categoryOpen
              ? "border-[#1f6b3a] ring-2 ring-[#1f6b3a]/12"
              : "border-[#d9e2d8] hover:border-[#b7cbb8]"
          }`}
        >
          <span className="truncate text-[#2c3a30]">{categoryLabel}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={`h-3.5 w-3.5 shrink-0 text-[#5f6f64] transition-transform duration-200 ${
              categoryOpen ? "rotate-180" : ""
            }`}
            fill="none"
          >
            <path
              d="M4 6.25 8 10.25 12 6.25"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {categoryOpen ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Category"
            className="absolute top-[calc(100%+8px)] right-0 left-0 z-40 overflow-hidden rounded-[16px] border border-[#e6ebe3] bg-white py-1.5 shadow-[0_16px_40px_rgba(31,107,58,0.12)]"
          >
            {categories.map((option) => {
              const active = option === category;
              const label = option === "All" ? "All categories" : option;
              return (
                <li key={option} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setCategory(option);
                      setCategoryOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition ${
                      active
                        ? "bg-[#e8f2ea] font-bold text-[#1f6b3a]"
                        : "font-semibold text-[#2c3a30] hover:bg-[#f4f7f4]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                      >
                        <path
                          d="M3.5 8.2L6.4 11.1L12.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
