import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { leaseTemplates, leaseTemplateRentRows } from "@/db/schema";
import {
  addTemplateRentRow,
  deleteTemplateRentRow,
  deleteTemplate,
  generateTemplateRentRows,
} from "../actions";

function formatMoney(value: string | null) {
  if (!value) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const dynamic = "force-dynamic";

export default async function LeaseTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = Number(id);
  if (!Number.isInteger(templateId)) notFound();

  const [template] = await db
    .select()
    .from(leaseTemplates)
    .where(eq(leaseTemplates.id, templateId))
    .limit(1);
  if (!template) notFound();

  const rows = await db
    .select()
    .from(leaseTemplateRentRows)
    .where(eq(leaseTemplateRentRows.templateId, templateId))
    .orderBy(asc(leaseTemplateRentRows.monthOffsetStart));

  const boundAddRow = addTemplateRentRow.bind(null, templateId);
  const boundGenerateRows = generateTemplateRentRows.bind(null, templateId);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{template.name}</h1>
          <div className="text-sm text-slate-600 mt-1 space-y-0.5">
            {template.permittedUse && <div>Permitted use: {template.permittedUse}</div>}
            {template.initialTermMonths && <div>Initial term: {template.initialTermMonths} months</div>}
            {template.renewalOptionYears && (
              <div>
                Renewal option: {template.renewalOptionYears} year(s),{" "}
                {template.renewalNoticeDays ?? "?"} days notice
              </div>
            )}
            {template.notes && <div className="mt-2">{template.notes}</div>}
          </div>
        </div>
        <form action={deleteTemplate.bind(null, templateId)}>
          <button type="submit" className="text-xs text-red-600 hover:underline">
            Delete template
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Rent schedule pattern</h2>
        <p className="text-xs text-slate-500 mb-2">
          Months are relative to a lease's commencement date (e.g. "months 1–3" becomes real
          calendar dates once applied to a lease).
        </p>
        {rows.length > 0 && (
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden bg-white mb-3">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">Months</th>
                <th className="px-3 py-2">Monthly base rent</th>
                <th className="px-3 py-2">Monthly additional rent</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    {row.monthOffsetStart}–{row.monthOffsetEnd}
                  </td>
                  <td className="px-3 py-2">{formatMoney(row.monthlyBaseRent)}</td>
                  <td className="px-3 py-2">{formatMoney(row.monthlyAdditionalRent)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteTemplateRentRow.bind(null, row.id, templateId)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form
          action={boundAddRow}
          className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-lg p-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">From month</label>
            <input
              type="number"
              name="monthOffsetStart"
              min={1}
              required
              className="rounded border border-slate-300 px-2 py-1.5 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Through month</label>
            <input
              type="number"
              name="monthOffsetEnd"
              min={1}
              required
              className="rounded border border-slate-300 px-2 py-1.5 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Monthly base rent</label>
            <input
              type="number"
              step="0.01"
              name="monthlyBaseRent"
              required
              className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Monthly additional rent</label>
            <input
              type="number"
              step="0.01"
              name="monthlyAdditionalRent"
              className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
          >
            Add row
          </button>
        </form>

        <details className="mt-3">
          <summary className="text-sm text-slate-600 cursor-pointer hover:underline">
            Generate a schedule instead of adding rows one at a time
          </summary>
          <form
            action={boundGenerateRows}
            className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-lg p-4 mt-2"
          >
            <div>
              <label className="block text-xs font-medium mb-1"># of periods</label>
              <input
                type="number"
                name="numberOfPeriods"
                min={1}
                required
                defaultValue={template.renewalOptionYears ? undefined : 1}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Months per period</label>
              <input
                type="number"
                name="monthsPerPeriod"
                min={1}
                required
                defaultValue={12}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Starting monthly base rent</label>
              <input
                type="number"
                step="0.01"
                name="startingMonthlyBaseRent"
                required
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Base rent escalation %/period</label>
              <input
                type="number"
                step="0.01"
                name="baseRentEscalationPct"
                defaultValue={0}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-28"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Starting monthly additional rent</label>
              <input
                type="number"
                step="0.01"
                name="startingMonthlyAdditionalRent"
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Additional rent escalation %/period</label>
              <input
                type="number"
                step="0.01"
                name="additionalRentEscalationPct"
                defaultValue={0}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-28"
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="replaceExisting" />
              Replace existing rows
            </label>
            <button
              type="submit"
              className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
            >
              Generate
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
