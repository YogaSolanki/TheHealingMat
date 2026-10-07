"use client";

import { FormEvent, useState } from "react";
import { AdminPrivateSpaceModal } from "@/components/admin-private-space-modal";
import { verifyAdminPrivateSpace } from "@/lib/api";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

type AdminSettingsPrivateSpaceProps = {
  token: string;
};

export function AdminSettingsPrivateSpace({
  token,
}: AdminSettingsPrivateSpaceProps) {
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function onSubmitGate(event: FormEvent) {
    event.preventDefault();
    if (gateBusy || modalOpen) return;

    if (!gatePassword) {
      setGateError("Enter the private space password.");
      return;
    }

    setGateBusy(true);
    setGateError(null);
    try {
      await verifyAdminPrivateSpace(token, gatePassword);
      setGatePassword("");
      setModalOpen(true);
    } catch (err) {
      setGateError(
        err instanceof Error ? err.message : "Could not open private space.",
      );
    } finally {
      setGateBusy(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setGatePassword("");
    setGateError(null);
  }

  return (
    <>
      <AdminPrivateSpaceModal
        open={modalOpen}
        token={token}
        onClose={closeModal}
      />

      <section className="space-y-4 rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">Private space</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7c6e]">
            Password-protected area for updating admin login credentials and
            deleting all member accounts. The session ends when you close the
            popup.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmitGate(e)} className="space-y-3">
          <label className="block text-sm font-semibold text-[#243028]">
            Private space password
            <input
              type="password"
              autoComplete="off"
              value={gatePassword}
              onChange={(event) => {
                setGatePassword(event.target.value);
                setGateError(null);
              }}
              className={inputClass}
              disabled={gateBusy || modalOpen}
            />
          </label>
          {gateError ? (
            <p className="text-sm text-[#8a2f2f]">{gateError}</p>
          ) : null}
          <button
            type="submit"
            disabled={gateBusy || modalOpen}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#1f6b3a] bg-[#f4f8f2] px-5 text-sm font-bold text-[#1f6b3a] disabled:opacity-60"
          >
            {gateBusy ? "Checking…" : "Open private space"}
          </button>
        </form>
      </section>
    </>
  );
}
