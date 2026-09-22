/** Numeric string/number -> "1,234.56" (no currency symbol, template text supplies it). */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
