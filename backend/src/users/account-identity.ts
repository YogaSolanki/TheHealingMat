import { randomInt } from 'crypto';

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function slugNamePart(value: string, maxLength: number) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, maxLength);
  return slug || 'member';
}

export function firstNameSlug(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  return slugNamePart(first, 24);
}

export function fullNameSlug(fullName: string) {
  return slugNamePart(fullName, 48);
}

function randomAlphanumeric(length: number) {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += ALPHANUMERIC[randomInt(0, ALPHANUMERIC.length)];
  }
  return value;
}

function randomTwoDigits() {
  return String(randomInt(0, 100)).padStart(2, '0');
}

/** V1: firstname_5randomalphanumeric — e.g. pradeep_a7k4m */
export function buildReferralCode(fullName: string) {
  return `${firstNameSlug(fullName)}_${randomAlphanumeric(5)}`;
}

/** V1 slug only: firstnamelastname + 2-digit — e.g. pradeepsolanki27 */
export function buildAccessLinkSlug(fullName: string) {
  return `${fullNameSlug(fullName)}${randomTwoDigits()}`;
}

export function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const driverCode =
    'driverError' in error
      ? (error as { driverError?: { code?: string } }).driverError?.code
      : undefined;
  const code = 'code' in error ? String((error as { code?: string }).code) : '';
  return driverCode === '23505' || code === '23505';
}
