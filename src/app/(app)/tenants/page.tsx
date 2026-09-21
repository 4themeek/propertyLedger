import Link from "next/link";
import { db } from "@/db";
import { tenants } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const rows = await db.select().from(tenants).orderBy(tenants.entityName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tenants</h1>
        <Link
          href="/tenants/new"
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
        >
          Add tenant
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No tenants yet. <Link href="/tenants/new" className="underline">Add your first one</Link>.
        </p>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
          {rows.map((t) => (
            <Link
              key={t.id}
              href={`/tenants/${t.id}`}
              className="block px-4 py-3 hover:bg-slate-50"
            >
              <div className="font-medium">{t.entityName}</div>
              {t.contactName && <div className="text-sm text-slate-500">{t.contactName}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
