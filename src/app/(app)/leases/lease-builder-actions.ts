"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, REVISION_MODES, type RevisionMode } from "@/db/schema";
import { LEASE_FIELDS, parseFieldValue } from "@/lib/lease-engine";
import { LEASE_COLUMN_FIELDS } from "@/lib/lease-state";

/** Review & Print: switch Original / Review copy / Clean draft and Schedule 1.7-A. */
export async function updateRevisionSettings(leaseId: number, formData: FormData) {
  const modeRaw = String(formData.get("revisionMode") ?? "");
  const revisionMode: RevisionMode = (REVISION_MODES as readonly string[]).includes(modeRaw)
    ? (modeRaw as RevisionMode)
    : "original";
  const revisionSchedule = formData.get("revisionSchedule") === "no" ? "no" : "yes";
  await db.update(leases).set({ revisionMode, revisionSchedule }).where(eq(leases.id, leaseId));
  revalidatePath(`/leases/${leaseId}/review`);
}

/** Lease terms form: writes "terms" fields to lease_terms and "lease" fields to their columns. */
export async function saveLeaseTerms(leaseId: number, formData: FormData) {
  const [lease] = await db
    .select({ leaseTerms: leases.leaseTerms })
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);
  if (!lease) throw new Error("Lease not found");

  const terms: Record<string, unknown> = { ...(lease.leaseTerms ?? {}) };
  let columns: Partial<typeof leases.$inferInsert> = {};

  for (const field of LEASE_FIELDS) {
    if (field.source === "linked") continue;
    const raw = formData.get(field.key);
    // Hidden (show-if) and disabled (enable-if) inputs are not submitted: keep the stored value.
    if (raw === null && field.type !== "bool") continue;
    if (field.type === "bool" && formData.get(`${field.key}__present`) === null) continue;
    const value = parseFieldValue(field, raw === null ? null : String(raw));
    if (field.source === "terms") {
      terms[field.key] = value;
    } else {
      const col = LEASE_COLUMN_FIELDS[field.key];
      if (col) columns = { ...columns, ...col.write(value) };
    }
  }

  await db
    .update(leases)
    .set({ ...columns, leaseTerms: terms })
    .where(eq(leases.id, leaseId));

  revalidatePath(`/leases/${leaseId}`);
  revalidatePath(`/leases/${leaseId}/terms`);
  revalidatePath(`/leases/${leaseId}/review`);
  if (formData.get("next") === "review") redirect(`/leases/${leaseId}/review`);
}
