// Builds the Lease Builder state for one lease from the database
// (see docs/lease-builder/PORT-PLAN.md section 4 for the mapping).
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, suites, properties, tenants, landlordProfile } from "@/db/schema";
import { normalizeLeaseData, TERMS_KEYS, type LeaseState, type LeaseStateKey } from "@/lib/lease-engine";

type LeaseRow = typeof leases.$inferSelect;
type LeaseUpdate = Partial<typeof leases.$inferInsert>;

/** LeaseState keys stored in a column of the leases row, and how to read/write them. */
export const LEASE_COLUMN_FIELDS: Partial<
  Record<LeaseStateKey, { read: (l: LeaseRow) => string | number; write: (v: unknown) => LeaseUpdate }>
> = {
  tenantSignerName: { read: (l) => l.tenantSignatoryName ?? "", write: (v) => ({ tenantSignatoryName: str(v) }) },
  tenantSignerTitle: { read: (l) => l.tenantSignatoryTitle ?? "", write: (v) => ({ tenantSignatoryTitle: str(v) }) },
  guarantorName: { read: (l) => l.guarantorName ?? "", write: (v) => ({ guarantorName: str(v) }) },
  permittedUse: { read: (l) => l.permittedUse ?? "", write: (v) => ({ permittedUse: str(v) }) },
  executionDate: { read: (l) => l.leaseExecutionDate ?? "", write: (v) => ({ leaseExecutionDate: str(v) }) },
  commencementDate: { read: (l) => l.commencementDate ?? "", write: (v) => ({ commencementDate: str(v) }) },
  initialTermMonths: { read: (l) => l.initialTermMonths ?? 0, write: (v) => ({ initialTermMonths: Number(v) || 0 }) },
  earlyOccupancyWeeks: { read: (l) => l.earlyOccupancyWeeks ?? 0, write: (v) => ({ earlyOccupancyWeeks: Number(v) || 0 }) },
  freeRentMonths: { read: (l) => l.rentFreeMonths ?? 0, write: (v) => ({ rentFreeMonths: Number(v) || 0 }) },
  renewalOptionCount: { read: (l) => l.renewalOptionCount ?? 0, write: (v) => ({ renewalOptionCount: Number(v) || 0 }) },
  renewalOptionYears: { read: (l) => l.renewalOptionYears ?? 0, write: (v) => ({ renewalOptionYears: Number(v) || 0 }) },
  renewalNoticeDays: { read: (l) => l.renewalNoticeDays ?? 0, write: (v) => ({ renewalNoticeDays: Number(v) || 0 }) },
  parkingSpaces: { read: (l) => l.parkingSpotCount ?? 2, write: (v) => ({ parkingSpotCount: Number(v) || 1 }) },
  parkingYears: { read: (l) => l.parkingYears ?? 0, write: (v) => ({ parkingYears: Number(v) || 0 }) },
  securityDeposit: {
    read: (l) => (l.securityDepositAmount ? Number(l.securityDepositAmount) : 0),
    write: (v) => ({ securityDepositAmount: String(Number(v) || 0) }),
  },
  guarantyEndDate: { read: (l) => l.guaranteePeriodEndDate ?? "", write: (v) => ({ guaranteePeriodEndDate: str(v) }) },
};

function str(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function joinAddress(line1: string | null | undefined, line2: string | null | undefined): string {
  return [line1, line2].map((x) => (x ?? "").trim()).filter(Boolean).join(", ");
}

export interface LoadedLease {
  lease: LeaseRow;
  suite: typeof suites.$inferSelect;
  property: typeof properties.$inferSelect;
  tenant: typeof tenants.$inferSelect;
  landlordMissing: boolean;
  state: LeaseState;
}

export async function loadLeaseState(leaseId: number): Promise<LoadedLease | null> {
  const [lease] = await db.select().from(leases).where(eq(leases.id, leaseId)).limit(1);
  if (!lease) return null;
  const [suite] = await db.select().from(suites).where(eq(suites.id, lease.suiteId)).limit(1);
  if (!suite) return null;
  const [property] = await db.select().from(properties).where(eq(properties.id, suite.propertyId)).limit(1);
  if (!property) return null;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, lease.tenantId)).limit(1);
  if (!tenant) return null;
  const [landlord] = await db.select().from(landlordProfile).limit(1);

  // 1. Stored lease_terms (only the keys that belong there).
  const stored = (lease.leaseTerms ?? {}) as Record<string, unknown>;
  const terms: Record<string, unknown> = {};
  for (const k of TERMS_KEYS) if (stored[k] !== undefined) terms[k] = stored[k];
  for (const k of ["electricMonthlyYear1", "electricEscalationPct", "electricCapAnnualPSFYear2"]) {
    if (stored[k] !== undefined) terms[k] = stored[k];
  }

  // 2. Values from the leases row.
  const fromLease: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(LEASE_COLUMN_FIELDS)) fromLease[key] = col!.read(lease);

  // 3. Values from linked records.
  const fromLinked: Partial<LeaseState> = {
    landlordName: landlord?.name ?? "",
    landlordAddress: joinAddress(landlord?.addressLine1, landlord?.cityStateZip),
    landlordSignerName: landlord?.signatoryName ?? "",
    landlordSignerTitle: landlord?.signatoryTitle ?? "",
    tenantName: tenant.entityName,
    tenantAddress: joinAddress(tenant.addressLine1, tenant.cityStateZip),
    buildingName: property.name,
    buildingAddress: property.addressStreet,
    city: property.addressCity,
    stateName: property.addressState,
    buildingZip: property.addressZip,
    suiteNumber: suite.suiteNumber,
    rsf: suite.rentableSqft ? Math.round(Number(suite.rentableSqft)) : 0,
    exhibitDItems: (lease.tenantImprovementDetails ?? "")
      .split(/\r?\n/)
      .map((x) => x.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean),
  };

  const state = normalizeLeaseData({
    ...terms,
    ...fromLease,
    ...fromLinked,
    revisionMode: lease.revisionMode,
    revisionSchedule: lease.revisionSchedule,
  });

  return { lease, suite, property, tenant, landlordMissing: !landlord, state };
}
