"use client";

import { RefreshIcon } from "@/components/icons";

type ReloadButtonProps = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

export function ReloadButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Reload",
}: ReloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbf9f5] text-[#1f6b3a] transition hover:bg-[#e8f2ea] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshIcon className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}
