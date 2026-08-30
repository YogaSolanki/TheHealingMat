export function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Admin";
  const words = local
    .replace(/\d+/g, " ")
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "Admin";

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
