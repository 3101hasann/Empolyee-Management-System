/** "12 Aug 2025" — matches the date format used across the Figma tables. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  // DATE columns come back as UTC midnight; format in UTC to avoid drift.
  timeZone: "UTC",
});

export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}

/** Form value for <input type="date"> from a DATE column. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
