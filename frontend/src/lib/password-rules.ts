/** Matches backend `backend/src/auth/dto/password.rules.ts`. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d\W_]{8,72}$/;
const PASSWORD_ALLOWED_CHARS = /^[A-Za-z\d\W_]*$/;

export type PasswordCriterion = {
  id: string;
  label: string;
  met: boolean;
};

export function isValidPassword(password: string): boolean {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_PATTERN.test(password)
  );
}

/** Checklist items shown under password fields (common signup pattern). */
export function getPasswordCriteria(password: string): PasswordCriterion[] {
  const criteria: PasswordCriterion[] = [
    {
      id: "length",
      label: `Use ${PASSWORD_MIN_LENGTH} or more characters`,
      met:
        password.length >= PASSWORD_MIN_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "uppercase",
      label: "Use an uppercase letter (A–Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Use a lowercase letter (a–z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Use a number (0–9)",
      met: /\d/.test(password),
    },
  ];

  if (password.length > PASSWORD_MAX_LENGTH) {
    criteria[0] = {
      id: "length",
      label: `Use ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`,
      met: false,
    };
  }

  if (password.length > 0 && !PASSWORD_ALLOWED_CHARS.test(password)) {
    criteria.push({
      id: "allowed",
      label: "Use only letters, numbers, and symbols",
      met: false,
    });
  }

  return criteria;
}

function joinRequirements(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const CRITERION_ERROR_PHRASE: Record<string, string> = {
  length: `be at least ${PASSWORD_MIN_LENGTH} characters long`,
  uppercase: "include an uppercase letter",
  lowercase: "include a lowercase letter",
  number: "include a number",
  allowed: "use only letters, numbers, and symbols",
};

const CRITERION_HINT_SHORT: Record<string, string> = {
  length: `${PASSWORD_MIN_LENGTH}+ characters`,
  uppercase: "an uppercase letter",
  lowercase: "a lowercase letter",
  number: "a number",
  allowed: "only letters, numbers, and symbols",
};

/** One-line hint under the password field (compact). */
export function getPasswordHintText(password: string): string | null {
  if (!password || isValidPassword(password)) return null;

  const unmet = getPasswordCriteria(password)
    .filter((item) => !item.met)
    .map((item) => CRITERION_HINT_SHORT[item.id] ?? item.label.toLowerCase());
  if (unmet.length === 0) return null;

  return `Must include ${joinRequirements(unmet)}.`;
}

export function formatPasswordValidationError(
  password: string,
  options?: { subject?: string },
): string {
  const unmet = getPasswordCriteria(password)
    .filter((item) => !item.met)
    .map((item) => CRITERION_ERROR_PHRASE[item.id] ?? item.label.toLowerCase());
  if (unmet.length === 0) return "";

  const subject = options?.subject ?? "Password";
  return `${subject} must ${joinRequirements(unmet)}.`;
}
