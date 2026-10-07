"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { useAdmin } from "@/components/admin-session";
import {
  ADMIN_TOKEN_KEY,
  deleteAllAdminUsers,
  getAdminUsers,
  updateAdminAccount,
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

    void getAdminUsers(token)
      .then((data) => setUserCount(data.users.length))
      .catch(() => setUserCount(null));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (emailBusy || passwordBusy || gateBusy || deletingAll) return;
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

  const busy = emailBusy || passwordBusy || gateBusy || deletingAll;

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
