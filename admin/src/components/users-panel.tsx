"use client";

import Link from "next/link";
import {
  FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  checkAdminUserExists,
  createAdminUser,
  deactivateAdminUser,
  exportAdminUsers,
  getAdminUsers,
  reactivateAdminUser,
  type AdminUserRow,
  type ExportAdminUsersInput,
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

function regionLabel(region: string) {
  return region.replaceAll("_", " ");
}

function statusTone(status: string) {
  switch (status) {
    case "active":
      return "bg-[#e8f2ea] text-[#1f6b3a]";
    case "scheduled":
      return "bg-[#f4f7f4] text-[#5f6f64]";
    default:
      return "bg-[#f1ece6] text-[#6b5b4a]";
  }
}

function isUserInactive(user: AdminUserRow) {
  return user.accountStatus === "inactive";
}

type AddUserForm = {
  fullName: string;
  region: "india" | "outside_india";
  mobile: string;
  email: string;
  password: string;
  startFreeTrial: boolean;
};

function emptyAddUserForm(): AddUserForm {
  return {
    fullName: "",
    region: "india",
    mobile: "",
    email: "",
    password: "",
    startFreeTrial: false,
  };
}

type ExportUsersForm = {
  region: NonNullable<ExportAdminUsersInput["region"]>;
  accessType: NonNullable<ExportAdminUsersInput["accessType"]>;
  accountStatus: NonNullable<ExportAdminUsersInput["accountStatus"]>;
  dateField: NonNullable<ExportAdminUsersInput["dateField"]>;
  dateFrom: string;
  dateTo: string;
};

function emptyExportUsersForm(): ExportUsersForm {
  return {
    region: "all",
    accessType: "all",
    accountStatus: "all",
    dateField: "all",
    dateFrom: "",
    dateTo: "",
  };
}

function indiaMobileDigits(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function isValidIndiaMobile(value: string) {
  const digits = indiaMobileDigits(value);
  return /^[6-9]\d{9}$/.test(digits);
}

function normalizeIndiaMobile(value: string) {
  const digits = indiaMobileDigits(value);
  return `+91${digits}`;
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "block text-sm font-semibold text-[#243028]";

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium transition hover:text-[#1f6b3a] ${
        active ? "text-[#1f6b3a]" : "text-[#5f6f64]"
      }`}
    >
      {label}
      <span className="inline-flex flex-col text-[9px] leading-none" aria-hidden>
        <span className={active && direction === "asc" ? "opacity-100" : "opacity-30"}>
          ▲
        </span>
        <span className={active && direction === "desc" ? "opacity-100" : "opacity-30"}>
          ▼
        </span>
      </span>
    </button>
  );
}

type FilterOption<T extends string> = { value: T; label: string };

function FilterSelectMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  onClose,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className="absolute top-[calc(100%+6px)] left-0 z-[60] min-w-full overflow-hidden rounded-xl border border-[#e2e8df] bg-white py-1 shadow-[0_16px_36px_rgba(21,32,25,0.14)]"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => {
              onChange(option.value);
              onClose();
            }}
            className={`flex w-full items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-left text-sm transition ${
              active
                ? "bg-[#eef6f0] font-semibold text-[#1f6b3a]"
                : "text-[#243028] hover:bg-[#f6f8f5]"
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
                active ? "text-[#1f6b3a]" : "text-transparent"
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function useClickOutsideClose(
  open: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  setOpen: (open: boolean) => void,
) {
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
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, rootRef, setOpen]);
}

function ToolbarFilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useClickOutsideClose(open, rootRef, setOpen);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e2e8df] bg-[#fbf9f5] px-3.5 text-xs font-semibold text-[#243028] transition hover:border-[#c9d4c6] hover:bg-white focus:border-[#1f6b3a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f6b3a]/20"
      >
        <span className="whitespace-nowrap">{selected?.label ?? "Select"}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 text-[#5f6f64] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <FilterSelectMenu
          label={label}
          value={value}
          options={options}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ExportFilterSelect<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useClickOutsideClose(open, rootRef, setOpen);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <p className={labelClass}>{label}</p>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${inputClass} inline-flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-[#5f6f64] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <FilterSelectMenu
          label={label}
          value={value}
          options={options}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function UsersPanel() {
  const router = useRouter();
  const cacheKey = DASHBOARD_CACHE_KEYS.users;
  const [users, setUsers] = useState<AdminUserRow[]>(
    () => getCached<AdminUserRow[]>(cacheKey) ?? [],
  );
  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | "india" | "outside_india">(
    "all",
  );
  const [trialFilter, setTrialFilter] = useState<
    "all" | "active" | "scheduled" | "completed" | "none"
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortKey, setSortKey] = useState<
    "name" | "region" | "trial" | "joined"
  >("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeactivateUser, setPendingDeactivateUser] =
    useState<AdminUserRow | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>(emptyAddUserForm);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportForm, setExportForm] = useState<ExportUsersForm>(
    emptyExportUsersForm,
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [mobileExistsError, setMobileExistsError] = useState<string | null>(
    null,
  );
  const [mobileFormatError, setMobileFormatError] = useState<string | null>(
    null,
  );
  const [checkingExists, setCheckingExists] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<AdminUserRow[]>(cacheKey);
        if (cached) {
          setUsers(cached);
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
        const data = await getAdminUsers(token);
        setCached(cacheKey, data.users);
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!menuOpenId) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpenId(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpenId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = users.filter((user) => {
      if (regionFilter !== "all" && user.region !== regionFilter) return false;

      if (statusFilter === "active" && isUserInactive(user)) return false;
      if (statusFilter === "inactive" && !isUserInactive(user)) return false;

      if (trialFilter !== "all") {
        const trialStatus = user.trial?.status?.toLowerCase() ?? null;
        if (trialFilter === "none") {
          if (trialStatus) return false;
        } else if (trialStatus !== trialFilter) {
          return false;
        }
      }

      if (!q) return true;
      const haystack = [
        user.fullName,
        user.email,
        user.mobile,
        user.referralCode,
        user.region,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const trialRank = (user: AdminUserRow) => {
      const status = user.trial?.status?.toLowerCase();
      if (status === "active") return 3;
      if (status === "scheduled") return 2;
      if (status === "completed") return 1;
      return 0;
    };

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.fullName.localeCompare(b.fullName, undefined, {
          sensitivity: "base",
        });
      } else if (sortKey === "region") {
        cmp = a.region.localeCompare(b.region);
      } else if (sortKey === "trial") {
        cmp = trialRank(a) - trialRank(b);
        if (cmp === 0) {
          cmp = (a.trial?.status ?? "").localeCompare(b.trial?.status ?? "");
        }
      } else {
        cmp =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [users, query, regionFilter, trialFilter, statusFilter, sortKey, sortDir]);

  const filtersActive =
    regionFilter !== "all" ||
    trialFilter !== "all" ||
    statusFilter !== "all" ||
    query.trim().length > 0;

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "joined" ? "desc" : "asc");
  }

  function openExportUsers() {
    setExportForm(emptyExportUsersForm());
    setExportError(null);
    setExportOpen(true);
  }

  async function onExportUsers(event: FormEvent) {
    event.preventDefault();
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setExportError("Please sign in again.");
      return;
    }
    if (
      exportForm.dateFrom &&
      exportForm.dateTo &&
      exportForm.dateFrom > exportForm.dateTo
    ) {
      setExportError("Start date must be on or before end date.");
      return;
    }

    setExporting(true);
    setExportError(null);
    try {
      await exportAdminUsers(token, {
        region: exportForm.region,
        accessType: exportForm.accessType,
        accountStatus: exportForm.accountStatus,
        dateField: exportForm.dateField,
        ...(exportForm.dateFrom ? { dateFrom: exportForm.dateFrom } : {}),
        ...(exportForm.dateTo ? { dateTo: exportForm.dateTo } : {}),
      });
      setExportOpen(false);
      setNotice("Users export downloaded.");
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Unable to export users.",
      );
    } finally {
      setExporting(false);
    }
  }

  function openAddUser() {
    setAddForm(emptyAddUserForm());
    setAddError(null);
    setMobileExistsError(null);
    setMobileFormatError(null);
    setCreatedPassword(null);
    setCreatedUserId(null);
    setAddOpen(true);
  }

  function closeAddUser() {
    if (adding || checkingExists) return;
    setAddOpen(false);
    setAddError(null);
    setMobileExistsError(null);
    setMobileFormatError(null);
    setCreatedPassword(null);
    setCreatedUserId(null);
  }

  function validateMobileFormat(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setMobileFormatError("Mobile number is required.");
      return false;
    }
    if (!isValidIndiaMobile(trimmed)) {
      setMobileFormatError(
        "Enter a valid 10-digit Indian mobile number (starts with 6–9).",
      );
      return false;
    }
    setMobileFormatError(null);
    return true;
  }

  async function verifyMobileAvailable(mobileValue?: string) {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return false;

    const mobile = (mobileValue ?? addForm.mobile).trim()
      ? normalizeIndiaMobile(mobileValue ?? addForm.mobile)
      : "";

    if (!mobile) return true;

    setCheckingExists(true);
    try {
      const result = await checkAdminUserExists(token, { mobile });
      if (result.mobileTaken) {
        setMobileExistsError("User already exists with this mobile number.");
        setAddError("User already exists with this mobile number.");
        return false;
      }
      setMobileExistsError(null);
      setAddError(null);
      return true;
    } catch {
      return true;
    } finally {
      setCheckingExists(false);
    }
  }

  async function onCreateUser(event: FormEvent) {
    event.preventDefault();
    if (adding || checkingExists) return;

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setAddError("Please sign in again.");
      return;
    }

    const fullName = addForm.fullName.trim();
    if (fullName.length < 2) {
      setAddError("Enter the member’s full name.");
      return;
    }
    if (addForm.region === "india") {
      if (!validateMobileFormat(addForm.mobile)) {
        setAddError(
          "Enter a valid 10-digit Indian mobile number (starts with 6–9).",
        );
        return;
      }
    }
    if (addForm.region === "outside_india" && !addForm.email.trim()) {
      setAddError("Email is required for outside-India accounts.");
      return;
    }

    const available =
      addForm.region === "india"
        ? await verifyMobileAvailable(addForm.mobile)
        : true;
    if (!available) return;

    setAdding(true);
    setAddError(null);
    try {
      const result = await createAdminUser(token, {
        fullName,
        region: addForm.region,
        mobile:
          addForm.region === "india"
            ? normalizeIndiaMobile(addForm.mobile)
            : undefined,
        email: addForm.email.trim() || undefined,
        password: addForm.password.trim() || undefined,
        startFreeTrial: addForm.startFreeTrial,
      });

      invalidateCached(cacheKey);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
      await load({ force: true });

      setCreatedUserId(result.profile.id);
      setCreatedPassword(result.temporaryPassword);
      if (!result.temporaryPassword) {
        setAddOpen(false);
        router.push(`/dashboard/users/${result.profile.id}`);
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unable to create user.");
    } finally {
      setAdding(false);
    }
  }

  async function onDeactivate(user: AdminUserRow) {
    setMenuOpenId(null);
    setPendingDeactivateUser(user);
  }

  async function confirmDeactivateUser() {
    const user = pendingDeactivateUser;
    if (!user || deletingId) return;

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      setPendingDeactivateUser(null);
      return;
    }

    setDeletingId(user.id);
    setError(null);
    try {
      await deactivateAdminUser(token, user.id);
      const next = users.map((row) =>
        row.id === user.id ? { ...row, accountStatus: "inactive" as const } : row,
      );
      setUsers(next);
      setCached(cacheKey, next);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
      setPendingDeactivateUser(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate user",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function onReactivate(user: AdminUserRow) {
    setMenuOpenId(null);
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setDeletingId(user.id);
    setError(null);
    try {
      await reactivateAdminUser(token, user.id);
      const next = users.map((row) =>
        row.id === user.id ? { ...row, accountStatus: "active" as const } : row,
      );
      setUsers(next);
      setCached(cacheKey, next);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reactivate user",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <PanelLoader label="Loading users…" />;
  }

  if (error && users.length === 0) {
    return (
      <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
          <div className="flex shrink-0 justify-end border-b border-[#e6ebe3] px-5 py-4">
            <ReloadButton
              onClick={() => void load({ force: true })}
              label="Reload users"
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
      <AdminConfirmDialog
        open={Boolean(pendingDeactivateUser)}
        title="Deactivate user?"
        description={
          pendingDeactivateUser
            ? `Deactivate “${pendingDeactivateUser.fullName}”? They will not be able to sign in. Membership, payment, invoice, and referral records are kept. You can reactivate the account later.`
            : ""
        }
        confirmLabel="Deactivate user"
        variant="default"
        busy={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) setPendingDeactivateUser(null);
        }}
        onConfirm={() => void confirmDeactivateUser()}
      />
      <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
        <div className="flex shrink-0 flex-col gap-2.5 border-b border-[#e6ebe3] px-5 py-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="shrink-0 text-sm font-medium text-[#243028]">
              {filtersActive
                ? `${filtered.length} of ${users.length} accounts`
                : `${users.length} permanent THM accounts`}
            </p>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, mobile…"
                className="h-10 min-w-0 flex-1 rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:w-64 sm:flex-none"
              />
              <button
                type="button"
                onClick={openExportUsers}
                disabled={Boolean(deletingId) || exporting}
                className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[#d7e0d6] bg-white px-3.5 text-xs font-semibold text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export
              </button>
              <button
                type="button"
                onClick={openAddUser}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1f6b3a] px-3.5 text-xs font-semibold text-white transition hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add user
              </button>
              <ReloadButton
                onClick={() => void load({ force: true })}
                loading={loading}
                label="Reload users"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarFilterSelect
              label="Filter by region"
              value={regionFilter}
              onChange={setRegionFilter}
              options={[
                { value: "all", label: "All regions" },
                { value: "india", label: "India" },
                { value: "outside_india", label: "Outside India" },
              ]}
            />
            <ToolbarFilterSelect
              label="Filter by trial"
              value={trialFilter}
              onChange={setTrialFilter}
              options={[
                { value: "all", label: "All trials" },
                { value: "active", label: "Trial active" },
                { value: "scheduled", label: "Trial scheduled" },
                { value: "completed", label: "Trial completed" },
                { value: "none", label: "No trial" },
              ]}
            />
            <ToolbarFilterSelect
              label="Filter by account status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active accounts" },
                { value: "inactive", label: "Inactive accounts" },
              ]}
            />
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRegionFilter("all");
                  setTrialFilter("all");
                  setStatusFilter("all");
                }}
                className="h-9 rounded-full px-3 text-xs font-semibold text-[#1f6b3a] transition hover:bg-[#eef6f0]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="shrink-0 border-b border-[#e6ebe3] bg-[#fff8f7] px-5 py-3 text-sm text-[#8a2f2f]">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="shrink-0 border-b border-[#cfe8d6] bg-[#f3faf5] px-5 py-3 text-sm text-[#1f6b3a]">
            {notice}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-x-auto pb-28">
          <table className="w-full min-w-[860px] table-fixed text-left text-sm">
            <thead className="text-[#5f6f64]">
              <tr>
                <th className="w-[24%] px-5 py-3 font-medium">
                  <SortableHeader
                    label="Name"
                    active={sortKey === "name"}
                    direction={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                </th>
                <th className="w-[14%] px-5 py-3 font-medium">
                  <SortableHeader
                    label="Region"
                    active={sortKey === "region"}
                    direction={sortDir}
                    onClick={() => toggleSort("region")}
                  />
                </th>
                <th className="w-[24%] px-5 py-3 font-medium">Contact</th>
                <th className="w-[12%] px-5 py-3 font-medium">
                  <SortableHeader
                    label="Trial"
                    active={sortKey === "trial"}
                    direction={sortDir}
                    onClick={() => toggleSort("trial")}
                  />
                </th>
                <th className="w-[14%] px-5 py-3 font-medium">
                  <SortableHeader
                    label="Joined"
                    active={sortKey === "joined"}
                    direction={sortDir}
                    onClick={() => toggleSort("joined")}
                  />
                </th>
                <th className="w-[12%] px-5 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-[#8a978c]"
                  >
                    {users.length === 0
                      ? "No users yet."
                      : "No users match these filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const contact = user.mobile ?? user.email ?? "—";
                  const menuOpen = menuOpenId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="cursor-pointer border-t border-[#f4f7f4] transition hover:bg-[#f7faf6]"
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f2ea] text-xs font-semibold text-[#1f6b3a]">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#243028]">
                              {user.fullName}
                            </p>
                            <p className="truncate text-xs text-[#8a978c]">
                              {user.referralCode}
                            </p>
                            {isUserInactive(user) ? (
                              <span className="mt-1 inline-flex rounded-full bg-[#f1ece6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b5b4a]">
                                Inactive
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 capitalize text-[#5f6f64]">
                        {regionLabel(user.region)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="truncate text-[#5f6f64]" title={contact}>
                          {contact}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {user.trial ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusTone(
                              user.trial.status,
                            )}`}
                          >
                            {user.trial.status}
                          </span>
                        ) : (
                          <span className="text-[#8a978c]">
                            {user.hasUsedFreeTrial ? "Used" : "None"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[#5f6f64]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="relative px-5 py-3 text-right">
                        <div
                          className="relative inline-flex justify-end"
                          ref={menuOpen ? menuRef : undefined}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Actions for ${user.fullName}`}
                            aria-expanded={menuOpen}
                            disabled={deletingId === user.id}
                            onClick={() =>
                              setMenuOpenId((current) =>
                                current === user.id ? null : user.id,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6f64] transition hover:bg-[#f4f7f4] hover:text-[#243028] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === user.id ? (
                              <span className="text-[10px] font-semibold text-[#8a2f2f]">
                                …
                              </span>
                            ) : (
                              <span
                                className="flex flex-col items-center gap-[3px]"
                                aria-hidden
                              >
                                <span className="h-[3px] w-[3px] rounded-full bg-current" />
                                <span className="h-[3px] w-[3px] rounded-full bg-current" />
                                <span className="h-[3px] w-[3px] rounded-full bg-current" />
                              </span>
                            )}
                          </button>

                          {menuOpen ? (
                            <div className="absolute right-0 top-full z-30 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-[#e6ebe3] bg-white py-1 shadow-[0_12px_28px_rgba(21,32,25,0.12)]">
                              <Link
                                href={`/dashboard/users/${user.id}`}
                                className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#243028] hover:bg-[#f4f7f4]"
                                onClick={() => setMenuOpenId(null)}
                              >
                                Open
                              </Link>
                              {isUserInactive(user) ? (
                                <button
                                  type="button"
                                  onClick={() => void onReactivate(user)}
                                  disabled={deletingId === user.id}
                                  className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#1f6b3a] hover:bg-[#f4f7f4] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void onDeactivate(user)}
                                  disabled={deletingId === user.id}
                                  className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#5f4a3a] hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#152019]/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-users-title"
            className="flex w-full max-w-xl flex-col overflow-visible rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_20px_48px_rgba(21,32,25,0.18)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2ee] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="export-users-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  Export users
                </h2>
                <p className="mt-1 text-sm text-[#5f6f64]">
                  Choose which date to match, set a From/To range, then export.
                  “All dates” matches joined, trial start, or membership start.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !exporting && setExportOpen(false)}
                disabled={exporting}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f6f64] transition hover:bg-[#f0f4ef] hover:text-[#243028] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(event) => void onExportUsers(event)}
              className="px-5 py-5 sm:px-6"
            >
              {exportError ? (
                <p className="mb-4 rounded-xl bg-[#fff8f7] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
                  {exportError}
                </p>
              ) : null}

              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                <ExportFilterSelect
                  label="Region"
                  value={exportForm.region}
                  disabled={exporting}
                  onChange={(region) =>
                    setExportForm({ ...exportForm, region })
                  }
                  options={[
                    { value: "all", label: "All regions" },
                    { value: "india", label: "India" },
                    { value: "outside_india", label: "Outside India" },
                  ]}
                />

                <ExportFilterSelect
                  label="Access type"
                  value={exportForm.accessType}
                  disabled={exporting}
                  onChange={(accessType) =>
                    setExportForm({ ...exportForm, accessType })
                  }
                  options={[
                    { value: "all", label: "All" },
                    { value: "trial", label: "Trial users" },
                    { value: "membership", label: "Membership users" },
                    { value: "none", label: "No trial / membership" },
                  ]}
                />

                <ExportFilterSelect
                  label="Account status"
                  value={exportForm.accountStatus}
                  disabled={exporting}
                  onChange={(accountStatus) =>
                    setExportForm({ ...exportForm, accountStatus })
                  }
                  options={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />

                <ExportFilterSelect
                  label="Date field"
                  value={exportForm.dateField}
                  disabled={exporting}
                  onChange={(dateField) =>
                    setExportForm({ ...exportForm, dateField })
                  }
                  options={[
                    { value: "all", label: "All dates" },
                    { value: "createdAt", label: "Joined date" },
                    { value: "trialStartsAt", label: "Trial start date" },
                    {
                      value: "membershipStartsAt",
                      label: "Membership start date",
                    },
                  ]}
                />

                <label className={`${labelClass} min-w-0`}>
                  From date
                  <input
                    type="date"
                    value={exportForm.dateFrom}
                    onChange={(e) =>
                      setExportForm({
                        ...exportForm,
                        dateFrom: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={exporting}
                  />
                </label>

                <label className={`${labelClass} min-w-0`}>
                  To date
                  <input
                    type="date"
                    value={exportForm.dateTo}
                    onChange={(e) =>
                      setExportForm({ ...exportForm, dateTo: e.target.value })
                    }
                    className={inputClass}
                    disabled={exporting}
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#eef2ee] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  disabled={exporting}
                  className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exporting}
                  className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:cursor-wait disabled:opacity-60"
                >
                  {exporting ? "Exporting…" : "Export CSV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_20px_48px_rgba(21,32,25,0.18)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="add-user-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  {createdPassword ? "User created" : "Add user"}
                </h2>
                <p className="mt-1 text-sm text-[#5f6f64]">
                  {createdPassword
                    ? "Copy the temporary password now — it won’t be shown again."
                    : "Create with name and contact. Profile details can be edited later on the user page."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddUser}
                disabled={adding || checkingExists}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f6f64] transition hover:bg-[#f0f4ef] hover:text-[#243028] disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {createdPassword && createdUserId ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-[#f7faf6] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#8a978c]">
                    Temporary password
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-[#243028]">
                    {createdPassword}
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddUser}
                    className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(createdPassword);
                    }}
                    className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5]"
                  >
                    Copy password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = createdUserId;
                      closeAddUser();
                      if (id) router.push(`/dashboard/users/${id}`);
                    }}
                    className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830]"
                  >
                    Open user
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(event) => void onCreateUser(event)}
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >
                <label className={`${labelClass} sm:col-span-2`}>
                  Full name
                  <input
                    required
                    value={addForm.fullName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, fullName: e.target.value })
                    }
                    className={inputClass}
                    disabled={adding}
                  />
                </label>

                <label className={labelClass}>
                  Region
                  <select
                    value={addForm.region}
                    onChange={(e) => {
                      const region = e.target
                        .value as AddUserForm["region"];
                      setAddForm({
                        ...addForm,
                        region,
                        mobile: region === "outside_india" ? "" : addForm.mobile,
                      });
                      if (region === "outside_india") {
                        setMobileExistsError(null);
                        setMobileFormatError(null);
                      }
                      setAddError(null);
                    }}
                    className={inputClass}
                    disabled={adding}
                  >
                    <option value="india">India</option>
                    <option value="outside_india">Outside India</option>
                  </select>
                </label>

                {addForm.region === "india" ? (
                  <label className={labelClass}>
                    Mobile *
                    <input
                      value={addForm.mobile}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setAddForm({ ...addForm, mobile: digits });
                        setMobileExistsError(null);
                        setMobileFormatError(null);
                        setAddError(null);
                      }}
                      onBlur={() => {
                        if (!validateMobileFormat(addForm.mobile)) return;
                        void verifyMobileAvailable(addForm.mobile);
                      }}
                      className={inputClass}
                      disabled={adding || checkingExists}
                      placeholder="10-digit mobile"
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
                    {mobileFormatError || mobileExistsError ? (
                      <span className="mt-1 block text-xs font-medium text-[#8a2f2f]">
                        {mobileFormatError || mobileExistsError}
                      </span>
                    ) : null}
                  </label>
                ) : null}

                <label className={labelClass}>
                  Email{addForm.region === "outside_india" ? " *" : ""}
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => {
                      setAddForm({ ...addForm, email: e.target.value });
                      setAddError(null);
                    }}
                    className={inputClass}
                    disabled={adding || checkingExists}
                    required={addForm.region === "outside_india"}
                  />
                </label>

                <label className={labelClass}>
                  Password (optional)
                  <input
                    type="text"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                    className={inputClass}
                    disabled={adding}
                    placeholder="Auto-generated if blank"
                    autoComplete="new-password"
                  />
                </label>

                <label className="flex items-center gap-3 pt-6 text-sm font-semibold text-[#243028] sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={addForm.startFreeTrial}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        startFreeTrial: e.target.checked,
                      })
                    }
                    disabled={adding}
                    className="h-4 w-4 rounded border-[#d7e0d6] text-[#1f6b3a] focus:ring-[#1f6b3a]"
                  />
                  Start free trial (like website trial signup)
                </label>

                {addError ? (
                  <p className="rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f] sm:col-span-2">
                    {addError}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddUser}
                    disabled={adding}
                    className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      adding ||
                      checkingExists ||
                      Boolean(mobileFormatError) ||
                      Boolean(mobileExistsError)
                    }
                    className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:opacity-60"
                  >
                    {adding
                      ? "Creating…"
                      : checkingExists
                        ? "Checking…"
                        : "Create user"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
