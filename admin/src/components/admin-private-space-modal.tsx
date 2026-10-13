"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { useAdmin } from "@/components/admin-session";
import {
  ADMIN_TOKEN_KEY,
  deleteAllAdminUsers,
  getAdminInvoiceSeries,
  getAdminUsers,
  type InvoiceSeriesOverview,
  updateAdminAccount,
  updateAdminInvoiceFinancialYear,
  updateAdminInvoiceNextSerial,
  updateAdminPrivateSpacePassword,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  invalidateCached,
} from "@/lib/dashboard-cache";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

type PrivateSpaceSection =
  | "menu"
  | "email"
  | "admin-password"
  | "gate-password"
  | "invoice-series"
  | "delete-users";

type MenuItem = {
  id: Exclude<PrivateSpaceSection, "menu">;
  title: string;
  description: string;
  danger?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: "email",
    title: "Update login email",
    description: "Change the email used for admin sign-in.",
  },
  {
    id: "admin-password",
    title: "Update admin password",
    description: "Change the password used for admin sign-in.",
  },
  {
    id: "gate-password",
    title: "Update private space password",
    description: "Change the password needed to open this popup.",
  },
  {
    id: "invoice-series",
    title: "Invoice numbering",
    description:
      "Financial year (e.g. 26-27) and next DM / EX / CO serials. Resets on 1 April.",
  },
  {
    id: "delete-users",
    title: "Delete all users",
    description: "Permanently remove every member account.",
    danger: true,
  },
];

type AdminPrivateSpaceModalProps = {
  open: boolean;
  token: string;
  onClose: () => void;
};

export function AdminPrivateSpaceModal({
  open,
  token,
  onClose,
}: AdminPrivateSpaceModalProps) {
  const titleId = useId();
  const { admin, setAdmin } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<PrivateSpaceSection>("menu");

  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [gateCurrentPassword, setGateCurrentPassword] = useState("");
  const [gateNewPassword, setGateNewPassword] = useState("");
  const [gateBusy, setGateBusy] = useState(false);
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  const [userCount, setUserCount] = useState<number | null>(null);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [invoiceSeries, setInvoiceSeries] =
    useState<InvoiceSeriesOverview | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceMessage, setInvoiceMessage] = useState<string | null>(null);
  const [fyOverrideInput, setFyOverrideInput] = useState("");
  const [serialDrafts, setSerialDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setSection("menu");
    setNewEmail("");
    setEmailCurrentPassword("");
    setEmailMessage(null);
    setEmailError(null);
    setNewPassword("");
    setPasswordCurrentPassword("");
    setPasswordMessage(null);
    setPasswordError(null);
    setGateCurrentPassword("");
    setGateNewPassword("");
    setGateMessage(null);
    setGateError(null);
    setDeleteNotice(null);
    setDeleteError(null);
    setPendingDeleteAll(false);
    setInvoiceSeries(null);
    setInvoiceError(null);
    setInvoiceMessage(null);
    setFyOverrideInput("");
    setSerialDrafts({});

    void getAdminUsers(token)
      .then((data) => setUserCount(data.users.length))
      .catch(() => setUserCount(null));
  }, [open, token]);

  useEffect(() => {
    if (!open || section !== "invoice-series") return;
    let cancelled = false;
    setInvoiceLoading(true);
    setInvoiceError(null);
    void getAdminInvoiceSeries(token)
      .then((data) => {
        if (cancelled) return;
        applyInvoiceSeries(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setInvoiceError(
          err instanceof Error
            ? err.message
            : "Could not load invoice series.",
        );
      })
      .finally(() => {
        if (!cancelled) setInvoiceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, section, token]);

  function applyInvoiceSeries(data: InvoiceSeriesOverview) {
    setInvoiceSeries(data);
    setFyOverrideInput(data.financialYearOverride ?? "");
    const drafts: Record<string, string> = {};
    for (const row of data.sequences) {
      drafts[row.category] = String(row.nextSerial);
    }
    setSerialDrafts(drafts);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (emailBusy || passwordBusy || gateBusy || invoiceBusy || deletingAll)
        return;
      if (event.key !== "Escape") return;
      if (section !== "menu") {
        setSection("menu");
        return;
      }
      onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    open,
    section,
    emailBusy,
    passwordBusy,
    gateBusy,
    invoiceBusy,
    deletingAll,
    onClose,
  ]);

  async function onSubmitEmail(event: FormEvent) {
    event.preventDefault();
    if (emailBusy || passwordBusy || gateBusy || deletingAll) return;

    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailError("Enter a new email address.");
      return;
    }
    if (trimmed.toLowerCase() === admin.email.toLowerCase()) {
      setEmailError("That is already your login email.");
      return;
    }
    if (!emailCurrentPassword) {
      setEmailError("Enter your current admin password.");
      return;
    }

    setEmailBusy(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const result = await updateAdminAccount(token, {
        currentPassword: emailCurrentPassword,
        newEmail: trimmed,
      });
      localStorage.setItem(ADMIN_TOKEN_KEY, result.accessToken);
      setAdmin(result.admin);
      setNewEmail("");
      setEmailCurrentPassword("");
      setEmailMessage("Login email updated.");
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to update email.",
      );
    } finally {
      setEmailBusy(false);
    }
  }

  async function onSubmitPassword(event: FormEvent) {
    event.preventDefault();
    if (emailBusy || passwordBusy || gateBusy || deletingAll) return;

    if (!passwordCurrentPassword) {
      setPasswordError("Enter your current admin password.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Enter a new password.");
      return;
    }

    setPasswordBusy(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      const result = await updateAdminAccount(token, {
        currentPassword: passwordCurrentPassword,
        newPassword,
      });
      localStorage.setItem(ADMIN_TOKEN_KEY, result.accessToken);
      setAdmin(result.admin);
      setNewPassword("");
      setPasswordCurrentPassword("");
      setPasswordMessage("Admin password updated.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    } finally {
      setPasswordBusy(false);
    }
  }

  async function onSubmitGatePassword(event: FormEvent) {
    event.preventDefault();
    if (emailBusy || passwordBusy || gateBusy || deletingAll) return;

    if (!gateCurrentPassword) {
      setGateError("Enter the current private space password.");
      return;
    }
    if (gateNewPassword.trim().length < 6) {
      setGateError("New password must be at least 6 characters.");
      return;
    }
    if (gateNewPassword === gateCurrentPassword) {
      setGateError("New password must be different from the current one.");
      return;
    }

    setGateBusy(true);
    setGateError(null);
    setGateMessage(null);
    try {
      const result = await updateAdminPrivateSpacePassword(token, {
        currentPassword: gateCurrentPassword,
        newPassword: gateNewPassword.trim(),
      });
      setGateCurrentPassword("");
      setGateNewPassword("");
      setGateMessage(result.message || "Private space password updated.");
    } catch (err) {
      setGateError(
        err instanceof Error
          ? err.message
          : "Failed to update private space password.",
      );
    } finally {
      setGateBusy(false);
    }
  }

  async function confirmDeleteAllUsers() {
    if (deletingAll) return;

    setDeletingAll(true);
    setDeleteError(null);
    setDeleteNotice(null);
    try {
      const result = await deleteAllAdminUsers(token);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
      setPendingDeleteAll(false);
      setUserCount(0);
      setDeleteNotice(
        result.deletedCount === 0
          ? "No users to delete."
          : `Deleted ${result.deletedCount} user${result.deletedCount === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete all users.",
      );
    } finally {
      setDeletingAll(false);
    }
  }

  async function onSaveFinancialYear(event: FormEvent) {
    event.preventDefault();
    if (invoiceBusy) return;
    setInvoiceBusy(true);
    setInvoiceError(null);
    setInvoiceMessage(null);
    try {
      const trimmed = fyOverrideInput.trim();
      const data = await updateAdminInvoiceFinancialYear(
        token,
        trimmed === "" ? null : trimmed,
      );
      applyInvoiceSeries(data);
      setInvoiceMessage(
        trimmed
          ? `New invoices will use FY ${data.activeFinancialYear} until you clear the override.`
          : `Using automatic FY ${data.activeFinancialYear} (resets on 1 April).`,
      );
    } catch (err) {
      setInvoiceError(
        err instanceof Error
          ? err.message
          : "Could not update financial year.",
      );
    } finally {
      setInvoiceBusy(false);
    }
  }

  async function onSaveNextSerial(category: string) {
    if (invoiceBusy) return;
    const raw = serialDrafts[category]?.trim() ?? "";
    const nextSerial = Number(raw);
    if (!Number.isFinite(nextSerial) || nextSerial < 1) {
      setInvoiceError("Next serial must be a whole number ≥ 1.");
      return;
    }
    setInvoiceBusy(true);
    setInvoiceError(null);
    setInvoiceMessage(null);
    try {
      const data = await updateAdminInvoiceNextSerial(token, {
        category: category as "domestic" | "export" | "corporate",
        nextSerial: Math.floor(nextSerial),
      });
      applyInvoiceSeries(data);
      const row = data.sequences.find((item) => item.category === category);
      setInvoiceMessage(
        row
          ? `Next ${row.code} invoice will be ${row.nextInvoiceNumber}.`
          : "Next serial updated.",
      );
    } catch (err) {
      setInvoiceError(
        err instanceof Error ? err.message : "Could not update next serial.",
      );
    } finally {
      setInvoiceBusy(false);
    }
  }

  const busy =
    emailBusy || passwordBusy || gateBusy || invoiceBusy || deletingAll;

  function goBackToMenu() {
    if (busy) return;
    setSection("menu");
  }

  if (!mounted || !open) return null;
  const activeItem = MENU_ITEMS.find((item) => item.id === section) ?? null;
  const headerTitle = activeItem?.title ?? "Private space";
  const headerDescription =
    activeItem?.description ??
    "Choose an action. Closing this window requires the private space password again.";

  return createPortal(
    <>
      <AdminConfirmDialog
        open={pendingDeleteAll}
        title="Delete all users?"
        description={
          userCount == null
            ? "Permanently delete all member accounts? This also removes memberships, payments, trials, and OTP records. This cannot be undone."
            : `Permanently delete all ${userCount} member account${userCount === 1 ? "" : "s"}? This also removes memberships, payments, trials, and OTP records. This cannot be undone.`
        }
        confirmLabel={deletingAll ? "Deleting…" : "Delete all users"}
        variant="danger"
        busy={deletingAll}
        onCancel={() => {
          if (!deletingAll) setPendingDeleteAll(false);
        }}
        onConfirm={() => void confirmDeleteAllUsers()}
      />

      <div
        className="fixed inset-0 z-[220] flex items-end justify-center px-4 py-6 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          aria-label="Close private space"
          className="absolute inset-0 bg-[#1a2e22]/45 backdrop-blur-[1px]"
          onClick={() => {
            if (!busy) onClose();
          }}
        />

        <div className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[20px] border border-[#e6ebe3] bg-white shadow-[0_24px_60px_rgba(31,107,58,0.2)]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {section !== "menu" ? (
                <button
                  type="button"
                  onClick={goBackToMenu}
                  disabled={busy}
                  className="mb-2 text-left text-[13px] font-semibold text-[#1f6b3a] hover:underline disabled:opacity-50"
                >
                  ← Back to list
                </button>
              ) : null}
              <h2
                id={titleId}
                className="text-base font-bold text-[#243028] sm:text-[17px]"
              >
                {headerTitle}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e]">
                {headerDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!busy) onClose();
              }}
              disabled={busy}
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-[#5f6f64] hover:bg-[#f4f7f4] disabled:opacity-50"
            >
              Close
            </button>
          </div>

          <div className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <p className="rounded-xl bg-[#f4f8f2] px-3.5 py-2.5 text-sm text-[#3d4a3c]">
              Signed in as{" "}
              <span className="font-semibold text-[#243028]">{admin.email}</span>
            </p>

            {section === "menu" ? (
              <ul className="overflow-hidden rounded-2xl border border-[#e6ebe3]">
                {MENU_ITEMS.map((item, index) => (
                  <li
                    key={item.id}
                    className={
                      index > 0 ? "border-t border-[#e6ebe3]" : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteNotice(null);
                        setEmailError(null);
                        setEmailMessage(null);
                        setPasswordError(null);
                        setPasswordMessage(null);
                        setGateError(null);
                        setGateMessage(null);
                        setInvoiceError(null);
                        setInvoiceMessage(null);
                        setSection(item.id);
                      }}
                      disabled={busy}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#f7faf6] disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-semibold ${
                            item.danger ? "text-[#8a2f2f]" : "text-[#243028]"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-[#6b7c6e]">
                          {item.description}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-lg ${
                          item.danger ? "text-[#c07a7a]" : "text-[#8a978c]"
                        }`}
                        aria-hidden
                      >
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {section === "email" ? (
              <form
                onSubmit={(e) => void onSubmitEmail(e)}
                className="space-y-3"
              >
                <label className="block text-sm font-semibold text-[#243028]">
                  New email
                  <input
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailError(null);
                      setEmailMessage(null);
                    }}
                    className={inputClass}
                    disabled={busy}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#243028]">
                  Current admin password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={emailCurrentPassword}
                    onChange={(e) => {
                      setEmailCurrentPassword(e.target.value);
                      setEmailError(null);
                      setEmailMessage(null);
                    }}
                    className={inputClass}
                    disabled={busy}
                  />
                </label>
                {emailError ? (
                  <p className="text-sm text-[#8a2f2f]">{emailError}</p>
                ) : null}
                {emailMessage ? (
                  <p className="text-sm font-medium text-[#1f6b3a]">
                    {emailMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white disabled:opacity-60"
                >
                  {emailBusy ? "Updating…" : "Update email"}
                </button>
              </form>
            ) : null}

            {section === "admin-password" ? (
              <form
                onSubmit={(e) => void onSubmitPassword(e)}
                className="space-y-3"
              >
                <label className="block text-sm font-semibold text-[#243028]">
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                      setPasswordMessage(null);
                    }}
                    className={inputClass}
                    disabled={busy}
                  />
                </label>
                <p className="text-[12px] leading-relaxed text-[#6b7c6e]">
                  8–72 characters with uppercase, lowercase, and a number.
                </p>
                <label className="block text-sm font-semibold text-[#243028]">
                  Current admin password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={passwordCurrentPassword}
                    onChange={(e) => {
                      setPasswordCurrentPassword(e.target.value);
                      setPasswordError(null);
                      setPasswordMessage(null);
                    }}
                    className={inputClass}
                    disabled={busy}
                  />
                </label>
                {passwordError ? (
                  <p className="text-sm text-[#8a2f2f]">{passwordError}</p>
                ) : null}
                {passwordMessage ? (
                  <p className="text-sm font-medium text-[#1f6b3a]">
                    {passwordMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white disabled:opacity-60"
                >
                  {passwordBusy ? "Updating…" : "Update password"}
                </button>
              </form>
            ) : null}

            {section === "gate-password" ? (
              <form
                onSubmit={(e) => void onSubmitGatePassword(e)}
                className="space-y-3"
              >
                <label className="block text-sm font-semibold text-[#243028]">
                  Current private space password
                  <input
                    type="password"
                    autoComplete="off"
                    value={gateCurrentPassword}
                    onChange={(e) => {
                      setGateCurrentPassword(e.target.value);
                      setGateError(null);
                      setGateMessage(null);
                    }}
                    className={inputClass}
                    disabled={busy}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#243028]">
                  New private space password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={gateNewPassword}
                    onChange={(e) => {
                      setGateNewPassword(e.target.value);
                      setGateError(null);
                      setGateMessage(null);
                    }}
                    className={inputClass}
                    disabled={busy}
                  />
                </label>
                <p className="text-[12px] leading-relaxed text-[#6b7c6e]">
                  At least 6 characters. Use this new password the next time you
                  open Private space.
                </p>
                {gateError ? (
                  <p className="text-sm text-[#8a2f2f]">{gateError}</p>
                ) : null}
                {gateMessage ? (
                  <p className="text-sm font-medium text-[#1f6b3a]">
                    {gateMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white disabled:opacity-60"
                >
                  {gateBusy ? "Updating…" : "Update private space password"}
                </button>
              </form>
            ) : null}

            {section === "invoice-series" ? (
              <section className="space-y-4">
                {invoiceLoading && !invoiceSeries ? (
                  <p className="text-sm text-[#6b7c6e]">Loading invoice series…</p>
                ) : null}

                {invoiceSeries ? (
                  <>
                    <div className="rounded-xl border border-[#e6ebe3] bg-[#f7faf6] px-3.5 py-3 text-[13px] leading-relaxed text-[#3d4a3c]">
                      <p>
                        <span className="font-semibold text-[#243028]">
                          Active FY:
                        </span>{" "}
                        {invoiceSeries.activeFinancialYear}
                        {invoiceSeries.financialYearOverride
                          ? " (manual override)"
                          : " (automatic)"}
                      </p>
                      <p className="mt-1">
                        Calendar FY right now:{" "}
                        <span className="font-semibold text-[#243028]">
                          {invoiceSeries.computedFinancialYear}
                        </span>
                      </p>
                      <p className="mt-2 text-[12px] text-[#5f6f64]">
                        {invoiceSeries.autoReset} For example, the first domestic
                        (retail) invoice in a new year is{" "}
                        <span className="font-semibold text-[#243028]">
                          YY-YY-DM-000001
                        </span>{" "}
                        (e.g. 27-28-DM-000001).
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => void onSaveFinancialYear(e)}
                      className="space-y-3 rounded-2xl border border-[#e6ebe3] p-4"
                    >
                      <label className="block text-sm font-semibold text-[#243028]">
                        Financial year override
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder={invoiceSeries.computedFinancialYear}
                          value={fyOverrideInput}
                          onChange={(e) => {
                            setFyOverrideInput(e.target.value);
                            setInvoiceError(null);
                            setInvoiceMessage(null);
                          }}
                          className={inputClass}
                          disabled={busy}
                          maxLength={5}
                        />
                      </label>
                      <p className="text-[12px] leading-relaxed text-[#6b7c6e]">
                        Leave blank for automatic Apr–Mar FY (recommended). Set
                        only if you need to force a label like{" "}
                        {invoiceSeries.computedFinancialYear}.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={busy}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white disabled:opacity-60"
                        >
                          {invoiceBusy ? "Saving…" : "Save financial year"}
                        </button>
                        {invoiceSeries.financialYearOverride ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setFyOverrideInput("");
                              void (async () => {
                                setInvoiceBusy(true);
                                setInvoiceError(null);
                                setInvoiceMessage(null);
                                try {
                                  const data =
                                    await updateAdminInvoiceFinancialYear(
                                      token,
                                      null,
                                    );
                                  applyInvoiceSeries(data);
                                  setInvoiceMessage(
                                    `Cleared override. Using automatic FY ${data.activeFinancialYear}.`,
                                  );
                                } catch (err) {
                                  setInvoiceError(
                                    err instanceof Error
                                      ? err.message
                                      : "Could not clear override.",
                                  );
                                } finally {
                                  setInvoiceBusy(false);
                                }
                              })();
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d7e0d6] px-4 text-sm font-semibold text-[#5f6f64] disabled:opacity-60"
                          >
                            Use automatic FY
                          </button>
                        ) : null}
                      </div>
                    </form>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[#243028]">
                        Next serial per series
                      </p>
                      {invoiceSeries.sequences.map((row) => (
                        <div
                          key={row.category}
                          className="rounded-2xl border border-[#e6ebe3] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-[#243028]">
                              {row.label}
                            </p>
                            <p className="font-mono text-[12px] text-[#1f6b3a]">
                              Next: {row.nextInvoiceNumber}
                            </p>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-end gap-2">
                            <label className="min-w-[7rem] flex-1 text-xs font-semibold text-[#5f6f64]">
                              Next serial
                              <input
                                type="number"
                                min={1}
                                max={999999}
                                value={serialDrafts[row.category] ?? ""}
                                onChange={(e) => {
                                  setSerialDrafts((current) => ({
                                    ...current,
                                    [row.category]: e.target.value,
                                  }));
                                  setInvoiceError(null);
                                  setInvoiceMessage(null);
                                }}
                                className={inputClass}
                                disabled={busy}
                              />
                            </label>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onSaveNextSerial(row.category)}
                              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#1f6b3a] px-3.5 text-sm font-semibold text-[#1f6b3a] disabled:opacity-60"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {invoiceError ? (
                  <p className="text-sm text-[#8a2f2f]">{invoiceError}</p>
                ) : null}
                {invoiceMessage ? (
                  <p className="text-sm font-medium text-[#1f6b3a]">
                    {invoiceMessage}
                  </p>
                ) : null}
              </section>
            ) : null}

            {section === "delete-users" ? (
              <section className="space-y-3">
                <p className="text-[13px] leading-relaxed text-[#6b7c6e]">
                  Removes every member account and related membership, payment,
                  trial, and OTP data. This cannot be undone.
                </p>
                {deleteError ? (
                  <p className="text-sm text-[#8a2f2f]">{deleteError}</p>
                ) : null}
                {deleteNotice ? (
                  <p className="text-sm font-medium text-[#1f6b3a]">
                    {deleteNotice}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteNotice(null);
                    setPendingDeleteAll(true);
                  }}
                  disabled={busy || userCount === 0}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#e8b4b4] bg-[#fff8f7] px-4 text-sm font-bold text-[#8a2f2f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete all users
                </button>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
