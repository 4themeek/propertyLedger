import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { properties, suites } from "@/db/schema";
import { createSuite, deleteSuite } from "../actions";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propertyId = Number(id);
  if (!Number.isInteger(propertyId)) notFound();

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);
  if (!property) notFound();

  const propertySuites = await db
    .select()
    .from(suites)
    .where(eq(suites.propertyId, propertyId))
    .orderBy(suites.suiteNumber);

  const boundCreateSuite = createSuite.bind(null, propertyId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">{property.name}</h1>
        <p className="text-sm text-slate-500">
          {property.addressStreet}, {property.addressCity}, {property.addressState}{" "}
          {property.addressZip}
        </p>
        {property.notes && <p className="text-sm text-slate-600 mt-2">{property.notes}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Suites</h2>
        {propertySuites.length === 0 ? (
          <p className="text-sm text-slate-500 mb-4">No suites yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white mb-4">
            {propertySuites.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <Link href={`/suites/${s.id}`} className="hover:underline">
                  <span className="font-medium">Suite {s.suiteNumber}</span>
                  {s.rentableSqft && (
                    <span className="text-sm text-slate-500"> · {s.rentableSqft} SF</span>
                  )}
                </Link>
                <form action={deleteSuite.bind(null, s.id, propertyId)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form
          action={boundCreateSuite}
          className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-lg p-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Suite number</label>
            <input
              name="suiteNumber"
              required
              className="rounded border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Rentable SF</label>
            <input
              name="rentableSqft"
              type="number"
              step="0.01"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm w-28"
            />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-xs font-medium mb-1">Notes</label>
            <input name="notes" className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
          >
            Add suite
          </button>
        </form>
      </div>
    </div>
  );
}
