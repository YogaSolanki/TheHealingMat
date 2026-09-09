import Link from "next/link";

type TermsAcceptanceFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
};

export function TermsAcceptanceField({
  checked,
  onChange,
  disabled = false,
  id = "terms-acceptance",
}: TermsAcceptanceFieldProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2 rounded-[12px] border border-[#e2e8df] bg-[#f7faf7] px-3 py-2 text-left"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#b7cbb8] text-[#1f6b3a] focus:ring-[#1f6b3a]/20"
      />
      <span className="text-[12px] leading-snug text-[#3d4a3c]">
        I agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1f6b3a] underline"
          onClick={(event) => event.stopPropagation()}
        >
          Terms &amp; Conditions
        </Link>
        .
      </span>
    </label>
  );
}
