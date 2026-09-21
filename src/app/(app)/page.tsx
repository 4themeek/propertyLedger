import Link from "next/link";
import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { properties, suites, leases } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const rows = await db
    .select({
      id: properties.id,
      name: properties.name,
      city: properties.addressCity,
      state: properties.addressState,
      suiteCount: sql<number>`count(distinct ${suites.id})`.mapWith(Number),
      activeLeaseCount: sql<number>`count(distinct case when ${leases.status} = 'active' then ${leases.id} end)`.mapWith(
        Number
      ),
    })
    .from(properties)
    .leftJoin(suites, eq(suites.propertyId, properties.id))
    .leftJoin(leases, eq(leases.suiteId, suites.id))
    .groupBy(properties.id)
    .orderBy(properties.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Properties</h1>
        <Link
          href="/properties/new"
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
        >
          Add property
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No properties yet. <Link href="/properties/new" className="underline">Add your first one</Link>.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-500">
                {p.city}, {p.state}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {p.suiteCount} suite{p.suiteCount === 1 ? "" : "s"} · {p.activeLeaseCount} active
                lease{p.activeLeaseCount === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
