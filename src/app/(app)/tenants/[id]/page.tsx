import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, leases, suites, properties } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = Number(id);
  if (!Number.isInteger(tenantId)) notFound();

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) notFound();

  const tenantLeases = await db
    .select({
      id: leases.id,
      status: leases.status,
      commencementDate: leases.commencementDate,
      suiteNumber: suites.suiteNumber,
      propertyName: properties.name,
    })
    .from(leases)
    .innerJoin(suites, eq(suites.id, leases.suiteId))
    .innerJoin(properties, eq(properties.id, suites.propertyId))
    .where(eq(leases.tenantId, tenantId))
    .orderBy(leases.commencementDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{tenant.entityName}</h1>
        <div className="text-sm text-slate-500 space-y-0.5 mt-1">
          {tenant.contactName && <div>{tenant.contactName}</div>}
          {tenant.contactEmail && <div>{tenant.contactEmail}</div>}
          {tenant.contactPhone && <div>{tenant.contactPhone}</div>}
          {tenant.mailingAddress && <div>{tenant.mailingAddress}</div>}
        </div>
        {tenant.notes && <p className="text-sm text-slate-600 mt-2">{tenant.notes}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Leases</h2>
        {tenantLeases.length === 0 ? (
          <p className="text-sm text-slate-500">No leases yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
            {tenantLeases.map((l) => (
              <Link
                key={l.id}
                href={`/leases/${l.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <span>
                  {l.propertyName} · Suite {l.suiteNumber}
                </span>
                <span className="text-xs uppercase tracking-wide text-slate-500">{l.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
