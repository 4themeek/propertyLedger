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
export function periodFromMonthOffsets(
  commencementDate: string,
  monthOffsetStart: number,
  monthOffsetEnd: number
): { periodStart: string; periodEnd: string } {
  const periodStart = addMonths(commencementDate, monthOffsetStart - 1);
  const periodEnd = addDays(addMonths(commencementDate, monthOffsetEnd), -1);
  return { periodStart, periodEnd };
}
