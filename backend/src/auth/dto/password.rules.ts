/** Shared password rules for signup / set-password flows. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt truncation boundary
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d\W_]{8,72}$/;
export const PASSWORD_MESSAGE =
  'Password must be 8–72 characters and include uppercase, lowercase, and a number.';
