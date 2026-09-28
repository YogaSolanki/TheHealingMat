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

/** How long a regular class stays joinable after its start time. */
const SESSION_DURATION_MINUTES = 60;
/** Mid-morning special block (e.g. 11:30 AM). */
const SPECIAL_SESSION_DURATION_MINUTES = 30;
/**
 * Members may enter a few minutes early (waiting room) and stay joinable
 * for the full class window — including mid-session.
 */
const JOIN_EARLY_MINUTES = 15;

/** All live session windows are evaluated in India business time. */
const SESSION_TIMEZONE = "Asia/Kolkata";

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

/** Split admin timings into morning / special / evening for dashboard layout. */
export function splitSessionLabels(
  labels: readonly string[],
  options?: { specialLabels?: ReadonlySet<string> | readonly string[] },
) {
  const morning: string[] = [];
  const special: string[] = [];
  const evening: string[] = [];
  const specialSet = options?.specialLabels
    ? options.specialLabels instanceof Set
      ? options.specialLabels
      : new Set(
          [...options.specialLabels].map((label) =>
            label.trim().toLowerCase(),
          ),
        )
    : null;

  for (const label of labels) {
    const minutes = parseSlotLabel(label);
    if (minutes == null) continue;
    const isMarkedSpecial =
      specialSet?.has(label.trim().toLowerCase()) === true;
    if (isMarkedSpecial) {
      special.push(label);
      continue;
    }
    if (minutes >= 12 * 60) evening.push(label);
    else morning.push(label);
  }

  return { morning, special, evening };
}

function toSlots(
  labels: readonly string[],
  specialLabels?: ReadonlySet<string>,
): SessionSlot[] {
  return labels
    .map((label) => {
      const minutes = parseSlotLabel(label);
      if (minutes == null) return null;
      const isSpecial =
        specialLabels?.has(label.trim().toLowerCase()) === true ||
        isSpecialMinutes(minutes);
      return {
        label,
        minutes,
        durationMinutes: isSpecial
          ? SPECIAL_SESSION_DURATION_MINUTES
          : SESSION_DURATION_MINUTES,
      };
    })
    .filter((slot): slot is SessionSlot => slot != null)
    .sort((a, b) => a.minutes - b.minutes);
}

export function isSunday(date = new Date()) {
  return istWeekday(date) === 0;
}

export function isWeekdaySessionDay(date = new Date()) {
  const day = istWeekday(date);
  return day >= 1 && day <= 6;
}

function slotsForDate(
  date: Date,
  kind: SessionAccessKind,
  labels: readonly string[],
  specialLabels?: ReadonlySet<string>,
) {
  void kind;
  void date;
  // Admin Session timings are the single source of truth for every joinable slot
  // (weekday, Sunday, and trial).
  return toSlots(labels, specialLabels);
}

/** Minutes since midnight in Asia/Kolkata. */
function currentMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SESSION_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hours = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return toMinutes(hours, minutes);
}

function istWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: SESSION_TIMEZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? date.getDay();
}

function joinWindow(slot: SessionSlot) {
  return {
    openAt: slot.minutes - JOIN_EARLY_MINUTES,
    closeAt: slot.minutes + slot.durationMinutes,
  };
}

export function findRunningSession(
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
  specialLabels?: ReadonlySet<string>,
) {
  const minutesNow = currentMinutes(now);
  return (
    slotsForDate(now, kind, labels, specialLabels).find((slot) => {
      const { openAt, closeAt } = joinWindow(slot);
      return minutesNow >= openAt && minutesNow < closeAt;
    }) ?? null
  );
}

export function isSessionSlotRunning(
  slotLabel: string,
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
  specialLabels?: ReadonlySet<string>,
) {
  const running = findRunningSession(now, kind, labels, specialLabels);
  return running?.label === slotLabel;
}

export function findNextSession(
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
  specialLabels?: ReadonlySet<string>,
) {
  const minutesNow = currentMinutes(now);
  const todaySlots = slotsForDate(now, kind, labels, specialLabels).filter(
    (slot) => {
      // Next start is after the current join window has closed (or before open).
      const { openAt } = joinWindow(slot);
      return openAt > minutesNow;
    },
  );
  if (todaySlots.length > 0) {
    return { label: todaySlots[0].label, when: "today" as const };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const nextDaySlots = slotsForDate(tomorrow, kind, labels, specialLabels);
  return {
    label: nextDaySlots[0]?.label ?? labels[0] ?? "the next session",
    when: "tomorrow" as const,
  };
}

export function sessionUnavailableMessage(
  now = new Date(),
  kind: SessionAccessKind = "member",
  labels: readonly string[] = FALLBACK_SESSION_LABELS,
  specialLabels?: ReadonlySet<string>,
) {
  const next = findNextSession(now, kind, labels, specialLabels);
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
