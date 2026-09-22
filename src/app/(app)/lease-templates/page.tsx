import Link from "next/link";
import { db } from "@/db";
import { leaseTemplates } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function LeaseTemplatesPage() {
  const rows = await db.select().from(leaseTemplates).orderBy(leaseTemplates.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Lease templates</h1>
          <p className="text-sm text-slate-500">
            Reusable lease terms and rent-schedule patterns you can apply when creating a new lease.
          </p>
        </div>
        <Link
          href="/lease-templates/new"
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
        >
          Add template
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No templates yet.{" "}
          <Link href="/lease-templates/new" className="underline">
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
          {rows.map((t) => (
            <Link
              key={t.id}
              href={`/lease-templates/${t.id}`}
              className="block px-4 py-3 hover:bg-slate-50"
            >
              <div className="font-medium">{t.name}</div>
              {t.permittedUse && <div className="text-sm text-slate-500">{t.permittedUse}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
