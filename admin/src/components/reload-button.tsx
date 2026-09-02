"use client";

import { RefreshIcon } from "@/components/icons";

type ReloadButtonProps = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
};

export function ReloadButton({
  onClick,
  loading = false,
  label = "Reload",
}: ReloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f5f2] text-[#3f6b4f] transition hover:bg-[#e5efe8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshIcon className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}
