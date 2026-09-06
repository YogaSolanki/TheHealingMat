export const weekdayMorningSlots = ["6:30 AM", "7:30 AM", "8:30 AM"] as const;
export const weekdayEveningSlots = ["5:00 PM", "6:00 PM", "7:00 PM"] as const;
export const sundayQaSlots = ["8:00 AM", "7:00 PM"] as const;
export const trialSessionSlots = ["7:00 AM", "7:00 PM"] as const;
export const specialSessionLabel = "11:30 AM";

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

function parseSlotLabel(label: string) {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return toMinutes(hours, minutes);
}

function weekdaySlots(now: Date): SessionSlot[] {
  return [
    ...weekdayMorningSlots.map((label) => ({
      label,
      minutes: parseSlotLabel(label) ?? 0,
      durationMinutes: SESSION_DURATION_MINUTES,
    })),
    {
      label: specialSessionLabel,
      minutes: parseSlotLabel(specialSessionLabel) ?? 0,
      durationMinutes: SPECIAL_SESSION_DURATION_MINUTES,
    },
    ...weekdayEveningSlots.map((label) => ({
      label,
      minutes: parseSlotLabel(label) ?? 0,
      durationMinutes: SESSION_DURATION_MINUTES,
    })),
  ];
}

function sundaySlots(): SessionSlot[] {
  return sundayQaSlots.map((label) => ({
    label,
    minutes: parseSlotLabel(label) ?? 0,
    durationMinutes: SESSION_DURATION_MINUTES,
  }));
}

export function isSunday(date = new Date()) {
  return date.getDay() === 0;
}

export function isWeekdaySessionDay(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 6;
}

function trialSlots(): SessionSlot[] {
  return trialSessionSlots.map((label) => ({
    label,
    minutes: parseSlotLabel(label) ?? 0,
    durationMinutes: SESSION_DURATION_MINUTES,
  }));
}

function slotsForDate(date: Date, kind: SessionAccessKind = "member") {
  if (kind === "trial") return trialSlots();
  return isSunday(date) ? sundaySlots() : weekdaySlots(date);
}

function currentMinutes(date: Date) {
  return toMinutes(date.getHours(), date.getMinutes());
}

export function findRunningSession(
  now = new Date(),
  kind: SessionAccessKind = "member",
) {
  const minutesNow = currentMinutes(now);
  return (
    slotsForDate(now, kind).find(
      (slot) =>
        minutesNow >= slot.minutes &&
        minutesNow < slot.minutes + slot.durationMinutes,
    ) ?? null
  );
}

export function findNextSession(
  now = new Date(),
  kind: SessionAccessKind = "member",
) {
  const minutesNow = currentMinutes(now);
  const todaySlots = slotsForDate(now, kind).filter((slot) => slot.minutes > minutesNow);
  if (todaySlots.length > 0) {
    return { label: todaySlots[0].label, when: "today" as const };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const nextDaySlots = slotsForDate(tomorrow, kind);
  return { label: nextDaySlots[0].label, when: "tomorrow" as const };
}

export function sessionUnavailableMessage(
  now = new Date(),
  kind: SessionAccessKind = "member",
) {
  const next = findNextSession(now, kind);
  if (next.when === "tomorrow") {
    return `No session is currently running. The next session starts at ${next.label} tomorrow.`;
  }
  return `No session is currently running. The next session starts at ${next.label}.`;
}
