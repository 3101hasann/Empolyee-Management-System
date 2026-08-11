/**
 * Batch start/end times are stored as minutes since midnight
 * (`batches.startTimeMin` / `endTimeMin`): timezone-proof and sortable.
 */

export const MINUTES_IN_DAY = 24 * 60;

export function isValidTimeMinutes(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 0 && minutes < MINUTES_IN_DAY;
}

/** 540 -> "09:00" (for <input type="time"> values). */
export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "09:00" -> 540. Returns null for anything that is not a valid HH:mm. */
export function timeInputToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (Number(match[2]) > 59 || !isValidTimeMinutes(minutes)) return null;
  return minutes;
}

/** 540 -> "09:00 AM" (display format used throughout the Figma design). */
export function minutesTo12Hour(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}
