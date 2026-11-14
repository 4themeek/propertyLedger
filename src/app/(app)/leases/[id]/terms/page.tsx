import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeaseState } from "@/lib/lease-state";
import { saveLeaseTerms } from "../../lease-builder-actions";
import { LeaseForm } from "@/components/LeaseForm";

export const dynamic = "force-dynamic";

export default async function LeaseTermsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaseId = Number(id);
  if (!Number.isInteger(leaseId)) notFound();

  const loaded = await loadLeaseState(leaseId);
  if (!loaded) notFound();
  const { state, tenant, suite, property } = loaded;

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/leases/${leaseId}`} className="text-sm text-slate-500 hover:underline">
          ← Back to lease
        </Link>
        <h1 className="text-lg font-semibold">Lease terms</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Everything the generated lease is built from. Grey fields come from the landlord profile, tenant,
          property and suite records; edit them there. Fields not filled in yet start at the 2026 lease
          template&apos;s example values, so check each section before you print.
        </p>
      </div>
      <LeaseForm
        initial={state}
        action={saveLeaseTerms.bind(null, leaseId)}
        linkedHrefs={{
          landlord: "/landlord-profile",
          tenant: `/tenants/${tenant.id}`,
          property: `/properties/${property.id}`,
          suite: `/suites/${suite.id}`,
        }}
      />
    </div>
  );
}
