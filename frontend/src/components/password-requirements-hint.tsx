import { getPasswordHintText } from "@/lib/password-rules";

export function PasswordRequirementsHint({ password }: { password: string }) {
  const text = getPasswordHintText(password);
  if (!text) return null;

  return (
    <p className="mt-1 text-[11px] leading-snug text-[#8a2f2f]" role="status">
      {text}
    </p>
  );
}

export function PasswordMismatchHint({
  value,
  other,
}: {
  value: string;
  other: string;
}) {
  if (!value || value === other) return null;

  return (
    <p className="mt-1 text-[11px] leading-snug text-[#8a2f2f]" role="alert">
      Passwords do not match.
    </p>
  );
}
