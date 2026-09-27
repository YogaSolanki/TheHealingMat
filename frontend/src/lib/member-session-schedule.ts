/** Fallback when timings have not loaded yet (matches admin seed defaults). */
export const FALLBACK_SESSION_LABELS = [
  "6:30 AM",
  "7:30 AM",
  "8:30 AM",
  "11:30 AM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
] as const;

export type SessionAccessKind = "trial" | "member";

const SESSION_DURATION_MINUTES = 60;
const SPECIAL_SESSION_DURATION_MINUTES = 30;

type SessionSlot = {
  label: string;
  minutes: number;
  durationMinutes: number;
};

function toMinutes(hours: number, minutes: number) {
  return hours * 60 + minutes;
}

export function parseSlotLabel(label: string) {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return toMinutes(hours, minutes);
}

function isSpecialMinutes(minutes: number) {
  // Mid-morning special block (e.g. 11:30 AM), separate from regular morning slots.
  const hour = Math.floor(minutes / 60);
  return hour >= 11 && hour < 12;
}

function durationForMinutes(minutes: number) {
  return isSpecialMinutes(minutes)
    ? SPECIAL_SESSION_DURATION_MINUTES
    : SESSION_DURATION_MINUTES;
}

/** Split admin timings into morning / special / evening for dashboard layout. */
export function splitSessionLabels(labels: readonly string[]) {
  const morning: string[] = [];
  const special: string[] = [];
  const evening: string[] = [];

  for (const label of labels) {
    const minutes = parseSlotLabel(label);
    if (minutes == null) continue;
    if (minutes >= 12 * 60) evening.push(label);
    else if (isSpecialMinutes(minutes)) special.push(label);
    else morning.push(label);
  }

  return { morning, special, evening };
}

function toSlots(labels: readonly string[]): SessionSlot[] {
  return labels
    .map((label) => {
      const minutes = parseSlotLabel(label);
      if (minutes == null) return null;
      return {
        label,
        minutes,
        durationMinutes: durationForMinutes(minutes),
      };
    })
    .filter((slot): slot is SessionSlot => slot != null)
    .sort((a, b) => a.minutes - b.minutes);
}

export function isSunday(date = new Date()) {
  return date.getDay() === 0;
}

export function isWeekdaySessionDay(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 6;
}

function slotsForDate(
  date: Date,
  kind: SessionAccessKind,
  labels: readonly string[],
) {
  void kind;
  void date;
  // Admin Session timings are the single source of truth for every joinable slot
  // (weekday, Sunday, and trial).
  return toSlots(labels);
}

function currentMinutes(date: Date) {
  return toMinutes(date.getHours(), date.getMinutes());
}

export function findRunningSession(
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
) {
  const minutesNow = currentMinutes(now);
  return (
    slotsForDate(now, kind, labels).find(
      (slot) =>
        minutesNow >= slot.minutes &&
        minutesNow < slot.minutes + slot.durationMinutes,
    ) ?? null
  );
}

export function isSessionSlotRunning(
  slotLabel: string,
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
) {
  const running = findRunningSession(now, kind, labels);
  return running?.label === slotLabel;
}

export function findNextSession(
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
) {
  const minutesNow = currentMinutes(now);
  const todaySlots = slotsForDate(now, kind, labels).filter(
    (slot) => slot.minutes > minutesNow,
  );
  if (todaySlots.length > 0) {
    return { label: todaySlots[0].label, when: "today" as const };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const nextDaySlots = slotsForDate(tomorrow, kind, labels);
  return {
    label: nextDaySlots[0]?.label ?? labels[0] ?? "the next session",
    when: "tomorrow" as const,
  };
}

export function sessionUnavailableMessage(
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
) {
  const next = findNextSession(now, kind, labels);
  if (next.when === "tomorrow") {
    return `No session is currently running. The next session starts at ${next.label} tomorrow.`;
  }
  return `No session is currently running. The next session starts at ${next.label}.`;
}

export function formatSlotList(labels: readonly string[]) {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
