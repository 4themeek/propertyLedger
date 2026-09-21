import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { suites, properties, tenants } from "@/db/schema";
import { createLease } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ suiteId?: string }>;
}) {
  const { suiteId: suiteIdRaw } = await searchParams;
  const suiteId = Number(suiteIdRaw);
  if (!Number.isInteger(suiteId)) notFound();

  const [suite] = await db.select().from(suites).where(eq(suites.id, suiteId)).limit(1);
  if (!suite) notFound();
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, suite.propertyId))
    .limit(1);

  const allTenants = await db.select().from(tenants).orderBy(tenants.entityName);

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Add lease</h1>
        <p className="text-sm text-slate-500">
          {property?.name} · Suite {suite.suiteNumber}
        </p>
      </div>

      {allTenants.length === 0 ? (
        <p className="text-sm text-slate-500">
          No tenants yet.{" "}
          <Link href="/tenants/new" className="underline">
            Add a tenant first
          </Link>
          .
        </p>
      ) : (
        <form action={createLease} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
          <input type="hidden" name="suiteId" value={suiteId} />
          <div>
            <label className="block text-sm font-medium mb-1">Tenant</label>
            <select
              name="tenantId"
              required
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
            <input name="permittedUse" className="w-full rounded border border-slate-300 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Commencement date</label>
              <input
                type="date"
                name="commencementDate"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial term (months)</label>
              <input
                type="number"
                name="initialTermMonths"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Renewal option (years)</label>
              <input
                type="number"
                name="renewalOptionYears"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Renewal notice (days)</label>
              <input
                type="number"
                name="renewalNoticeDays"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full rounded border border-slate-300 px-3 py-2" />
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
