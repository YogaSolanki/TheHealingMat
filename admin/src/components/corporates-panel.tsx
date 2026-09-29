"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminCompany,
  getAdminCompanies,
  type AdminCompanyRow,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  invalidateCached,
  setCached,
} from "@/lib/dashboard-cache";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "block text-sm font-semibold text-[#243028]";

type AddForm = {
  companyName: string;
  domain: string;
  gstNumber: string;
  state: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
};

function emptyForm(): AddForm {
  return {
    companyName: "",
    domain: "",
    gstNumber: "",
    state: "",
    billingEmail: "",
    billingPhone: "",
    billingAddress: "",
  };
}

/** Normalize and validate a single company email domain (e.g. xyz.org). */
function normalizeCompanyDomain(raw: string): string | null {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^@/, "").replace(/^https?:\/\//, "");
  d = (d.split("/")[0] ?? d).split("?")[0] ?? d;
  if (d.startsWith("www.")) d = d.slice(4);
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(d)) {
    return null;
  }
  // Require a real TLD (at least 2 letters).
  const tld = d.split(".").pop() ?? "";
  if (!/^[a-z]{2,}$/i.test(tld)) return null;
  return d;
}

export function CorporatesPanel() {
  const router = useRouter();
  const cacheKey = DASHBOARD_CACHE_KEYS.corporate;
  const [companies, setCompanies] = useState<AdminCompanyRow[]>(
    () => getCached<AdminCompanyRow[]>(cacheKey) ?? [],
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddForm>(emptyForm);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<AdminCompanyRow[]>(cacheKey);
        if (cached) {
          setCompanies(cached);
          setLoading(false);
          setError(null);
          return;
        }
      }
      const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminCompanies(token);
        setCached(cacheKey, data.companies);
        setCompanies(data.companies);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load companies",
        );
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) => {
      const haystack = [
        company.companyName,
        company.gstNumber,
        company.state,
        ...(company.domains ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [companies, query]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (adding) return;
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setAddError("Please sign in again.");
      return;
    }
    const domain = normalizeCompanyDomain(form.domain);
    if (!form.companyName.trim()) {
      setAddError("Company name is required.");
      return;
    }
    if (!domain) {
      setAddError("Enter a valid company domain (e.g. xyz.org).");
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const result = await createAdminCompany(token, {
        companyName: form.companyName.trim(),
        domains: [domain],
        gstNumber: form.gstNumber.trim() || undefined,
        state: form.state.trim() || undefined,
        billingEmail: form.billingEmail.trim() || undefined,
        billingPhone: form.billingPhone.trim() || undefined,
        billingAddress: form.billingAddress.trim() || undefined,
      });
      invalidateCached(cacheKey);
      setAddOpen(false);
      setForm(emptyForm());
      router.push(`/dashboard/corporate/${result.company.id}`);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Unable to create company.",
      );
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <PanelLoader label="Loading companies…" />;
  }

  if (error && companies.length === 0) {
    return (
      <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
          <div className="flex shrink-0 justify-end border-b border-[#e6ebe3] px-5 py-4">
            <ReloadButton
              onClick={() => void load({ force: true })}
              label="Reload companies"
            />
          </div>
          <div className="flex min-h-0 flex-1 items-start px-5 py-4">
            <p className="w-full rounded-xl bg-[#fff8f7] px-4 py-3 text-sm text-[#8a2f2f]">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
          <div className="flex shrink-0 flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#243028]">
                {companies.length} corporate account
                {companies.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company, domain, GST…"
                className="h-10 min-w-0 flex-1 rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:w-64 sm:flex-none"
              />
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm());
                  setAddError(null);
                  setAddOpen(true);
                }}
                className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1f6b3a] px-3.5 text-xs font-semibold text-white transition hover:bg-[#185830]"
              >
                Add corporate
              </button>
              <ReloadButton
                onClick={() => void load({ force: true })}
                loading={loading}
                label="Reload companies"
              />
            </div>
          </div>

          {error ? (
            <p className="shrink-0 border-b border-[#e6ebe3] bg-[#fff8f7] px-5 py-3 text-sm text-[#8a2f2f]">
              {error}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-x-auto pb-28">
            <table className="w-full min-w-[860px] table-fixed text-left text-sm">
              <thead className="text-[#5f6f64]">
                <tr>
                  <th className="w-[28%] px-5 py-3 font-medium">Company</th>
                  <th className="w-[28%] px-5 py-3 font-medium">Domain</th>
                  <th className="w-[16%] px-5 py-3 font-medium">GST</th>
                  <th className="w-[12%] px-5 py-3 font-medium">Plans</th>
                  <th className="w-[16%] px-5 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-[#8a978c]"
                    >
                      {companies.length === 0
                        ? "No corporate accounts yet."
                        : "No companies match this search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((company) => (
                    <tr
                      key={company.id}
                      className="cursor-pointer border-t border-[#f4f7f4] transition hover:bg-[#f7faf6]"
                      onClick={() =>
                        router.push(`/dashboard/corporate/${company.id}`)
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f2ea] text-xs font-semibold text-[#1f6b3a]">
                            {company.companyName.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#243028]">
                              {company.companyName}
                            </p>
                            <p className="truncate text-xs text-[#8a978c]">
                              {company.state || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p
                          className="truncate text-[#5f6f64]"
                          title={(company.domains ?? [])[0] ?? undefined}
                        >
                          {(company.domains ?? [])[0] || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-[#5f6f64]">
                        {company.gstNumber || "—"}
                      </td>
                      <td className="px-5 py-3 text-[#5f6f64]">
                        {company.planCount}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[#5f6f64]">
                        {formatDate(company.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-corporate-title"
            className="w-full max-w-3xl rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_20px_48px_rgba(21,32,25,0.18)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="add-corporate-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  Add corporate
                </h2>
                <p className="mt-1 text-sm text-[#5f6f64]">
                  Company details for billing and domain-locked employee
                  coupons.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !adding && setAddOpen(false)}
                aria-label="Close"
                className="rounded-full px-2 text-xl leading-none text-[#8a978c] hover:bg-[#f4f7f4]"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => void onCreate(e)} className="mt-5 space-y-4">
              {addError ? (
                <p className="rounded-xl bg-[#fff8f7] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
                  {addError}
                </p>
              ) : null}
              <label className={labelClass}>
                Company name
                <input
                  required
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className={inputClass}
                  disabled={adding}
                />
              </label>
              <label className={labelClass}>
                Company domain
                <input
                  required
                  value={form.domain}
                  onChange={(e) =>
                    setForm({ ...form, domain: e.target.value })
                  }
                  className={inputClass}
                  disabled={adding}
                  placeholder="xyz.org"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="mt-1 block text-xs font-normal text-[#8a978c]">
                  Employees must verify email on this domain to use the plan
                  coupon.
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  GST number
                  <input
                    value={form.gstNumber}
                    onChange={(e) =>
                      setForm({ ...form, gstNumber: e.target.value })
                    }
                    className={inputClass}
                    disabled={adding}
                  />
                </label>
                <label className={labelClass}>
                  State
                  <input
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                    className={inputClass}
                    disabled={adding}
                    placeholder="For invoice"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Billing email
                  <input
                    type="email"
                    value={form.billingEmail}
                    onChange={(e) =>
                      setForm({ ...form, billingEmail: e.target.value })
                    }
                    className={inputClass}
                    disabled={adding}
                  />
                </label>
                <label className={labelClass}>
                  Billing phone
                  <input
                    value={form.billingPhone}
                    onChange={(e) =>
                      setForm({ ...form, billingPhone: e.target.value })
                    }
                    className={inputClass}
                    disabled={adding}
                  />
                </label>
              </div>
              <label className={`${labelClass} sm:col-span-2`}>
                Billing address
                <textarea
                  value={form.billingAddress}
                  onChange={(e) =>
                    setForm({ ...form, billingAddress: e.target.value })
                  }
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
                  disabled={adding}
                />
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => !adding && setAddOpen(false)}
                  disabled={adding}
                  className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:opacity-60"
                >
                  {adding ? "Creating…" : "Create corporate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
