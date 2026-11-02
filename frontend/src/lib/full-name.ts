const FULL_NAME_SURNAME_MESSAGE = "Please enter your full name.";
const FULL_NAME_CHARS_MESSAGE =
  "Full name can only include letters and spaces.";

/** Letters (any language) and spaces only. */
const FULL_NAME_ALLOWED = /^[\p{L}\s]+$/u;

/**
 * Keeps only letters and spaces, then capitalizes each name part.
 * Preserves trailing spaces so typing stays natural.
 */
export function formatFullNameInput(value: string): string {
  return value
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => {
      return `${space}${letter.toUpperCase()}`;
    });
}

/**
 * Requires at least two name parts (first + surname / repeated first name).
 * Numbers and special characters are not allowed.
 */
export function validateFullName(value: string): string | null {
  if (value.length > 0 && !FULL_NAME_ALLOWED.test(value)) {
    return FULL_NAME_CHARS_MESSAGE;
  }

  const parts = value
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "Please enter your full name.";
  }

  if (parts.length < 2) {
    return FULL_NAME_SURNAME_MESSAGE;
  }

  if (parts.some((part) => part.length < 1)) {
    return "Please enter your full name.";
  }

  return null;
}

export function isValidFullName(value: string): boolean {
  return validateFullName(value) === null;
}
