/**
 * Batch working days are stored as a single bitmask column
 * (`batches.daysOfWeek`). One bit per weekday, Monday first.
 */

export const WEEKDAYS = [
  { key: "MON", label: "Monday", short: "Mon", bit: 1 << 0 },
  { key: "TUE", label: "Tuesday", short: "Tue", bit: 1 << 1 },
  { key: "WED", label: "Wednesday", short: "Wed", bit: 1 << 2 },
  { key: "THU", label: "Thursday", short: "Thu", bit: 1 << 3 },
  { key: "FRI", label: "Friday", short: "Fri", bit: 1 << 4 },
  { key: "SAT", label: "Saturday", short: "Sat", bit: 1 << 5 },
  { key: "SUN", label: "Sunday", short: "Sun", bit: 1 << 6 },
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

export const ALL_WEEKDAYS_MASK = WEEKDAYS.reduce((mask, day) => mask | day.bit, 0);

export function encodeWeekdays(keys: readonly WeekdayKey[]): number {
  return WEEKDAYS.filter((day) => keys.includes(day.key)).reduce(
    (mask, day) => mask | day.bit,
    0,
  );
}

export function decodeWeekdays(mask: number): WeekdayKey[] {
  return WEEKDAYS.filter((day) => (mask & day.bit) !== 0).map((day) => day.key);
}

export function countWeekdays(mask: number): number {
  return decodeWeekdays(mask).length;
}

/** "Mon, Tue, Wed" — used by tooltips and detail views. */
export function formatWeekdays(mask: number): string {
  return WEEKDAYS.filter((day) => (mask & day.bit) !== 0)
    .map((day) => day.short)
    .join(", ");
}

/** A valid mask selects at least one day and no unknown bits. */
export function isValidWeekdayMask(mask: number): boolean {
  return Number.isInteger(mask) && mask > 0 && (mask & ~ALL_WEEKDAYS_MASK) === 0;
}
