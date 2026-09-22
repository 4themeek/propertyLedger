// Pure calendar-date math on 'YYYY-MM-DD' strings, using UTC internally so
// timezone offsets never shift a date by a day.

function parse(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addMonths(dateStr: string, months: number): string {
  const date = parse(dateStr);
  date.setUTCMonth(date.getUTCMonth() + months);
  return format(date);
}

export function addDays(dateStr: string, days: number): string {
  const date = parse(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return format(date);
}

/**
 * Converts a template's 1-based, inclusive month-offset range (e.g. "months
 * 1-3 of the lease") into real calendar dates relative to a commencement date.
 */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 'YYYY-MM-DD' -> "January 1, 2027" */
export function formatLongDate(dateStr: string): string {
  const date = parse(dateStr);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** 'YYYY-MM-DD' -> "December 2026" */
export function formatMonthYear(dateStr: string): string {
  const date = parse(dateStr);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** 'YYYY-MM-DD' -> "2026" */
export function formatYear(dateStr: string): string {
  return parse(dateStr).getUTCFullYear().toString();
}

/** Number of whole calendar months from `fromDate` to `toDate` (year/month only, ignores day-of-month). */
export function monthsBetween(fromDate: string, toDate: string): number {
  const a = parse(fromDate);
  const b = parse(toDate);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

/**
 * Inverse of periodFromMonthOffsets: given a lease's commencement date and a
 * rent-schedule period's real dates, recover the 1-based "lease month"
 * range (e.g. "4-12") for display in a generated document.
 */
export function monthOffsetsFromPeriod(
  commencementDate: string,
  periodStart: string,
  periodEnd: string
): { monthOffsetStart: number; monthOffsetEnd: number } {
  const monthOffsetStart = monthsBetween(commencementDate, periodStart) + 1;
  const monthOffsetEnd = monthsBetween(commencementDate, addDays(periodEnd, 1));
  return { monthOffsetStart, monthOffsetEnd };
}

export function periodFromMonthOffsets(
  commencementDate: string,
  monthOffsetStart: number,
  monthOffsetEnd: number
): { periodStart: string; periodEnd: string } {
  const periodStart = addMonths(commencementDate, monthOffsetStart - 1);
  const periodEnd = addDays(addMonths(commencementDate, monthOffsetEnd), -1);
  return { periodStart, periodEnd };
}
