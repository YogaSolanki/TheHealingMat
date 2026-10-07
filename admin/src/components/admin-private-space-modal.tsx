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
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  invalidateCached,
} from "@/lib/dashboard-cache";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

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

    setNewEmail("");
    setEmailCurrentPassword("");
    setEmailMessage(null);
    setEmailError(null);
    setNewPassword("");
    setPasswordCurrentPassword("");
    setPasswordMessage(null);
    setPasswordError(null);
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
      if (event.key === "Escape" && !emailBusy && !passwordBusy && !deletingAll) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, emailBusy, passwordBusy, deletingAll, onClose]);

  async function onSubmitEmail(event: FormEvent) {
    event.preventDefault();
    if (emailBusy || passwordBusy || deletingAll) return;

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
    if (emailBusy || passwordBusy || deletingAll) return;

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

  if (!mounted || !open) return null;

  const busy = emailBusy || passwordBusy || deletingAll;

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
            <div>
              <h2
                id={titleId}
                className="text-base font-bold text-[#243028] sm:text-[17px]"
              >
                Private space
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e]">
                Admin login and destructive actions. Closing this window requires
                the private space password again.
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

          <div className="scrollbar-hide min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <p className="rounded-xl bg-[#f4f8f2] px-3.5 py-2.5 text-sm text-[#3d4a3c]">
              Signed in as{" "}
              <span className="font-semibold text-[#243028]">{admin.email}</span>
            </p>

            <form onSubmit={(e) => void onSubmitEmail(e)} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#243028]">
                Update login email
              </h3>
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

            <form
              onSubmit={(e) => void onSubmitPassword(e)}
              className="space-y-3 border-t border-[#e6ebe3] pt-6"
            >
              <h3 className="text-sm font-semibold text-[#243028]">
                Update admin password
              </h3>
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

            <section className="space-y-3 border-t border-[#e6ebe3] pt-6">
              <h3 className="text-sm font-semibold text-[#243028]">
                Delete all users
              </h3>
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
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
