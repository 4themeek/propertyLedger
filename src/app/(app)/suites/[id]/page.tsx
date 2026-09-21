import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { suites, properties, leases, tenants, files } from "@/db/schema";
import { uploadFile, deleteFile } from "@/lib/file-actions";

export const dynamic = "force-dynamic";

export default async function SuiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const suiteId = Number(id);
  if (!Number.isInteger(suiteId)) notFound();

  const [suite] = await db.select().from(suites).where(eq(suites.id, suiteId)).limit(1);
  if (!suite) notFound();

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, suite.propertyId))
    .limit(1);

  const suiteLeases = await db
    .select({
      id: leases.id,
      status: leases.status,
      commencementDate: leases.commencementDate,
      tenantName: tenants.entityName,
    })
    .from(leases)
    .innerJoin(tenants, eq(tenants.id, leases.tenantId))
    .where(eq(leases.suiteId, suiteId))
    .orderBy(desc(leases.commencementDate));

  const floorplans = await db
    .select()
    .from(files)
    .where(and(eq(files.attachedToType, "suite"), eq(files.attachedToId, suiteId)));

  const revalidatePathValue = `/suites/${suiteId}`;
  const boundUpload = uploadFile.bind(null, "suite", suiteId, "floorplan", revalidatePathValue);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/properties/${suite.propertyId}`} className="text-sm text-slate-500 hover:underline">
          {property?.name}
        </Link>
        <h1 className="text-lg font-semibold">Suite {suite.suiteNumber}</h1>
        {suite.rentableSqft && <p className="text-sm text-slate-500">{suite.rentableSqft} SF</p>}
        {suite.notes && <p className="text-sm text-slate-600 mt-2">{suite.notes}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Floorplans</h2>
        {floorplans.length === 0 ? (
          <p className="text-sm text-slate-500 mb-3">No floorplans uploaded yet.</p>
        ) : (
          <ul className="space-y-1 mb-3">
            {floorplans.map((f) => (
              <li key={f.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded px-3 py-2">
                <a href={`/api/files/${f.id}`} target="_blank" className="hover:underline">
                  {f.originalFilename}
                </a>
                <form action={deleteFile.bind(null, f.id, revalidatePathValue)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={boundUpload} encType="multipart/form-data" className="flex items-center gap-2">
          <input type="file" name="file" required className="text-sm" />
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
          >
            Upload
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">Leases</h2>
          <Link
            href={`/leases/new?suiteId=${suiteId}`}
            className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
          >
            Add lease
          </Link>
        </div>
        {suiteLeases.length === 0 ? (
          <p className="text-sm text-slate-500">No leases yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
            {suiteLeases.map((l) => (
              <Link
                key={l.id}
                href={`/leases/${l.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <span>{l.tenantName}</span>
                <span className="text-xs uppercase tracking-wide text-slate-500">{l.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
