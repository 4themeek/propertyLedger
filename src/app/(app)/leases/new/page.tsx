import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { suites, properties, tenants, leases, leaseTemplates } from "@/db/schema";
import { createLease } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ suiteId?: string; cloneFrom?: string; templateId?: string }>;
}) {
  const { suiteId: suiteIdRaw, cloneFrom: cloneFromRaw, templateId: templateIdRaw } =
    await searchParams;

  const allSuites = await db
    .select({
      id: suites.id,
      suiteNumber: suites.suiteNumber,
      propertyName: properties.name,
    })
    .from(suites)
    .innerJoin(properties, eq(properties.id, suites.propertyId))
    .orderBy(asc(properties.name), asc(suites.suiteNumber));

  const allTenants = await db.select().from(tenants).orderBy(tenants.entityName);
  const allTemplates = await db.select().from(leaseTemplates).orderBy(leaseTemplates.name);

  let defaultSuiteId = suiteIdRaw ? Number(suiteIdRaw) : undefined;
  let defaultTenantId: number | undefined;
  let defaults = {
    permittedUse: "",
    commencementDate: "",
    initialTermMonths: "",
    renewalOptionYears: "",
    renewalNoticeDays: "",
    notes: "",
  };
  let cloneFromId: number | undefined;
  let cloneFromLabel: string | undefined;
  let templateId: number | undefined;
  let templateLabel: string | undefined;

  const cloneFrom = Number(cloneFromRaw);
  if (Number.isInteger(cloneFrom) && cloneFromRaw) {
    const [source] = await db.select().from(leases).where(eq(leases.id, cloneFrom)).limit(1);
    if (!source) notFound();
    cloneFromId = source.id;
    defaultSuiteId = source.suiteId;
    defaultTenantId = source.tenantId;
    defaults = {
      permittedUse: source.permittedUse ?? "",
      commencementDate: "",
      initialTermMonths: source.initialTermMonths?.toString() ?? "",
      renewalOptionYears: source.renewalOptionYears?.toString() ?? "",
      renewalNoticeDays: source.renewalNoticeDays?.toString() ?? "",
      notes: source.notes ?? "",
    };
    cloneFromLabel = `lease #${source.id}`;
  }

  const templateIdParsed = Number(templateIdRaw);
  if (Number.isInteger(templateIdParsed) && templateIdRaw) {
    const [template] = await db
      .select()
      .from(leaseTemplates)
      .where(eq(leaseTemplates.id, templateIdParsed))
      .limit(1);
    if (!template) notFound();
    templateId = template.id;
    templateLabel = template.name;
    defaults = {
      permittedUse: template.permittedUse ?? "",
      commencementDate: "",
      initialTermMonths: template.initialTermMonths?.toString() ?? "",
      renewalOptionYears: template.renewalOptionYears?.toString() ?? "",
      renewalNoticeDays: template.renewalNoticeDays?.toString() ?? "",
      notes: template.notes ?? "",
    };
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Add lease</h1>

      {cloneFromLabel && (
        <p className="text-sm bg-slate-100 rounded px-3 py-2">
          Starting from {cloneFromLabel} — terms and rent schedule will be copied in.
        </p>
      )}
      {templateLabel && (
        <p className="text-sm bg-slate-100 rounded px-3 py-2">
          Starting from template "{templateLabel}" — terms prefilled, rent schedule will be
          generated from the template once you pick a commencement date.
        </p>
      )}

      {!cloneFromLabel && !templateLabel && allTemplates.length > 0 && (
        <form method="GET" className="flex items-end gap-2 text-sm bg-white border border-slate-200 rounded-lg p-3">
          {defaultSuiteId && <input type="hidden" name="suiteId" value={defaultSuiteId} />}
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Start from a template</label>
            <select name="templateId" className="w-full rounded border border-slate-300 px-2 py-1.5">
              <option value="">Blank lease</option>
              {allTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded bg-slate-100 border border-slate-300 px-3 py-1.5 hover:bg-slate-200">
            Load
          </button>
        </form>
      )}

      {allTenants.length === 0 ? (
        <p className="text-sm text-slate-500">
          No tenants yet.{" "}
          <Link href="/tenants/new" className="underline">
            Add a tenant first
          </Link>
          .
        </p>
      ) : allSuites.length === 0 ? (
        <p className="text-sm text-slate-500">
          No suites yet. Add a property and suite first.
        </p>
      ) : (
        <form action={createLease} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
          {cloneFromId && <input type="hidden" name="cloneFrom" value={cloneFromId} />}
          {templateId && <input type="hidden" name="templateId" value={templateId} />}
          <div>
            <label className="block text-sm font-medium mb-1">Suite</label>
            <select
              name="suiteId"
              required
              defaultValue={defaultSuiteId ?? ""}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Select a suite</option>
              {allSuites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.propertyName} · Suite {s.suiteNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tenant</label>
            <select
              name="tenantId"
              required
              defaultValue={defaultTenantId ?? ""}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Select a tenant</option>
              {allTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.entityName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Permitted use</label>
            <input
              name="permittedUse"
              defaultValue={defaults.permittedUse}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Commencement date</label>
              <input
                type="date"
                name="commencementDate"
                defaultValue={defaults.commencementDate}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
              {templateLabel && (
                <p className="text-xs text-slate-500 mt-1">Required to generate the rent schedule.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial term (months)</label>
              <input
                type="number"
                name="initialTermMonths"
                defaultValue={defaults.initialTermMonths}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Renewal option (years)</label>
              <input
                type="number"
                name="renewalOptionYears"
                defaultValue={defaults.renewalOptionYears}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Renewal notice (days)</label>
              <input
                type="number"
                name="renewalNoticeDays"
                defaultValue={defaults.renewalNoticeDays}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={defaults.notes}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
          >
            Save lease
          </button>
        </form>
      )}
    </div>
  );
}
