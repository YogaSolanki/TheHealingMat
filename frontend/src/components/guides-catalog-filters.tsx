"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CatalogItem = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
};

function SearchGlyph({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`${className} text-[#1f6b3a]`}
      fill="none"
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
  );
}

type GuidesCatalogFiltersProps<T extends CatalogItem> = {
  items: T[];
  searchPlaceholder?: string;
  accent?: string;
  emptyLabel?: string;
  /** Shown on the left of the filter row (e.g. breadcrumb) */
  header?: ReactNode;
  children: (filtered: T[]) => ReactNode;
};

export function GuidesCatalogFilters<T extends CatalogItem>({
  items,
  searchPlaceholder = "Search…",
  accent = "#1f6b3a",
  emptyLabel = "No matches found. Try a different search or category.",
  header,
  children,
}: GuidesCatalogFiltersProps<T>) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState(items);
  const [contentVisible, setContentVisible] = useState(true);
  const [statusText, setStatusText] = useState("");
  const categoryRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prevResultsKey = useRef<string | null>(null);
  const filteredRef = useRef<T[]>(items);
  const queryRef = useRef("");
  const selectedCategoryRef = useRef("All");
  const listId = useId();
  const mobileSearchId = useId();

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category))).sort(
      (a, b) => a.localeCompare(b),
    );
    return ["All", ...unique];
  }, [items]);

  useEffect(() => {
    if (!search.trim()) {
      setDebouncedSearch(search);
      return;
    }
    const debounceTimer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 160);
    return () => window.clearTimeout(debounceTimer);
  }, [search]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [items, debouncedSearch, category]);

  filteredRef.current = filtered;
  queryRef.current = debouncedSearch;
  selectedCategoryRef.current = category;

  const filteredKey = useMemo(
    () => filtered.map((item) => item.slug).join("|"),
    [filtered],
  );

  useEffect(() => {
    const next = filteredRef.current;
    const query = queryRef.current.trim();
    const selectedCategory = selectedCategoryRef.current;

    function applyStatus(list: T[] = next) {
      if (list.length > 0 && (query || selectedCategory !== "All")) {
        setStatusText(
          `Showing ${list.length} of ${items.length}${
            selectedCategory !== "All" ? ` in ${selectedCategory}` : ""
          }${query ? ` for “${query}”` : ""}`,
        );
      } else {
        setStatusText("");
      }
    }

    function applyResults(list: T[] = next) {
      setVisibleItems(list);
      applyStatus(list);
    }

    // Same result set — keep content visible (avoids stuck opacity:0 after cancels)
    if (prevResultsKey.current === filteredKey) {
      applyStatus();
      setContentVisible(true);
      return;
    }

    const isFirst = prevResultsKey.current === null;
    if (isFirst) {
      prevResultsKey.current = filteredKey;
      applyResults();
      setContentVisible(true);
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      prevResultsKey.current = filteredKey;
      applyResults();
      setContentVisible(true);
      return;
    }

    let cancelled = false;
    let completed = false;
    setContentVisible(false);

    const swapTimer = window.setTimeout(() => {
      if (cancelled) return;
      completed = true;
      prevResultsKey.current = filteredKey;
      applyResults();
      setContentVisible(true);
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(swapTimer);
      // Only force-commit when a fade was interrupted mid-flight.
      // Otherwise a later filter change would skip its own transition.
      if (completed) return;
      const latest = filteredRef.current;
      prevResultsKey.current = latest.map((item) => item.slug).join("|");
      applyResults(latest);
      setContentVisible(true);
    };
  }, [filteredKey, debouncedSearch, category, items.length]);

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

  useEffect(() => {
    if (!mobileSearchOpen) return;
    mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  const categoryLabel = category === "All" ? "All categories" : category;
  const searchActive = mobileSearchOpen || Boolean(search.trim());

  return (
    <div>
      <div className="mb-5 flex flex-col items-stretch gap-3 sm:mb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {header ? (
          <div className="min-w-0 shrink-0 lg:max-w-[45%]">{header}</div>
        ) : null}

        <div className="flex w-full flex-col gap-3 pr-1 sm:pr-2 lg:w-auto lg:shrink-0 lg:pr-1 xl:pr-2">
          <div className="flex w-full items-center justify-end gap-3 sm:gap-4">
            <label className="relative hidden min-w-0 flex-1 sm:block lg:w-[370px] lg:flex-none">
              <span className="sr-only">Search</span>
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                <SearchGlyph />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full border border-[#d9e2d8] bg-white py-2 pr-3.5 pl-9 text-[13px] text-[#2c3a30] outline-none transition placeholder:text-[#9aa89e] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12"
              />
            </label>

            <div
              ref={categoryRef}
              className="relative min-w-0 flex-1 sm:w-[180px] sm:flex-none"
            >
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
                  className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 overflow-hidden rounded-[16px] border border-[#e6ebe3] bg-white py-1.5 shadow-[0_16px_40px_rgba(31,107,58,0.12)]"
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

            <button
              type="button"
              aria-label={mobileSearchOpen ? "Hide search" : "Show search"}
              aria-expanded={mobileSearchOpen}
              aria-controls={mobileSearchId}
              onClick={() => setMobileSearchOpen((open) => !open)}
              className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-white transition sm:hidden ${
                searchActive
                  ? "border-[#1f6b3a] ring-2 ring-[#1f6b3a]/12"
                  : "border-[#d9e2d8] hover:border-[#b7cbb8]"
              }`}
            >
              <SearchGlyph className="h-4 w-4" />
            </button>
          </div>

          <div
            id={mobileSearchId}
            className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out sm:hidden ${
              mobileSearchOpen
                ? "max-h-14 translate-y-0 opacity-100"
                : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
            }`}
          >
            <label className="relative block w-full">
              <span className="sr-only">Search</span>
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                <SearchGlyph />
              </span>
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                tabIndex={mobileSearchOpen ? 0 : -1}
                className="w-full rounded-full border border-[#d9e2d8] bg-white py-2 pr-3.5 pl-9 text-[13px] text-[#2c3a30] outline-none transition placeholder:text-[#9aa89e] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/12"
              />
            </label>
          </div>
        </div>
      </div>

      <div
        className={`catalog-results ${
          contentVisible ? "catalog-results-in" : "catalog-results-out"
        }`}
      >
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center rounded-[22px] border border-[#e6ebe3] bg-[#FBF9F5] px-5 py-12 text-center shadow-[0_8px_28px_rgba(31,107,58,0.04)] sm:px-8 sm:py-14">
            <h2
              className="font-serif text-[1.35rem] font-bold tracking-tight sm:text-[1.5rem]"
              style={{ color: accent }}
            >
              No results found
            </h2>
            <p className="mt-2 max-w-[380px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              {search.trim() ? (
                <>
                  We couldn&apos;t find anything matching{" "}
                  <span className="font-semibold text-[#2c3a30]">
                    “{search.trim()}”
                  </span>
                  {category !== "All" ? (
                    <>
                      {" "}
                      in <span className="font-semibold">{category}</span>
                    </>
                  ) : null}
                  . Try another keyword or browse all categories.
                </>
              ) : (
                emptyLabel
              )}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setMobileSearchOpen(false);
              }}
              className="btn-primary mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
              style={{ backgroundColor: accent }}
            >
              Clear filters
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <>
            {statusText ? (
              <p className="mb-4 text-[12px] font-semibold text-[#5f6f64] transition-opacity duration-300 sm:text-[13px]">
                {statusText}
              </p>
            ) : null}
            {children(visibleItems)}
          </>
        )}
      </div>
    </div>
  );
}
