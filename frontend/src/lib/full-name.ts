const FULL_NAME_SURNAME_MESSAGE = "Please enter your full name.";

/**
 * Capitalizes the first letter of each name part as the user types.
 * Preserves spaces and trailing spaces so typing stays natural.
 */
export function formatFullNameInput(value: string): string {
  return value.replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => {
    return `${space}${letter.toUpperCase()}`;
  });
}

/**
 * Requires at least two name parts (first + surname / repeated first name).
 */
export function validateFullName(value: string): string | null {
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
