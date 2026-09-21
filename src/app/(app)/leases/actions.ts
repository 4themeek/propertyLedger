"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, rentSchedulePeriods, LEASE_STATUSES } from "@/db/schema";

export async function createLease(formData: FormData) {
  const suiteId = Number(formData.get("suiteId"));
  const tenantId = Number(formData.get("tenantId"));
  const permittedUse = String(formData.get("permittedUse") ?? "").trim() || null;
  const commencementDate = String(formData.get("commencementDate") ?? "").trim() || null;
  const initialTermMonthsRaw = String(formData.get("initialTermMonths") ?? "").trim();
  const renewalOptionYearsRaw = String(formData.get("renewalOptionYears") ?? "").trim();
  const renewalNoticeDaysRaw = String(formData.get("renewalNoticeDays") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isInteger(suiteId) || !Number.isInteger(tenantId)) {
    throw new Error("Suite and tenant are required");
  }

  const [created] = await db
    .insert(leases)
    .values({
      suiteId,
      tenantId,
      permittedUse,
      commencementDate,
      initialTermMonths: initialTermMonthsRaw ? Number(initialTermMonthsRaw) : null,
      renewalOptionYears: renewalOptionYearsRaw ? Number(renewalOptionYearsRaw) : null,
      renewalNoticeDays: renewalNoticeDaysRaw ? Number(renewalNoticeDaysRaw) : null,
      notes,
    })
    .returning({ id: leases.id });

  revalidatePath(`/suites/${suiteId}`);
  redirect(`/leases/${created.id}`);
}

export async function updateLeaseStatus(leaseId: number, formData: FormData) {
  const status = String(formData.get("status") ?? "");
  if (!LEASE_STATUSES.includes(status as (typeof LEASE_STATUSES)[number])) {
    throw new Error("Invalid status");
  }
  await db.update(leases).set({ status }).where(eq(leases.id, leaseId));
  revalidatePath(`/leases/${leaseId}`);
}

export async function addRentSchedulePeriod(leaseId: number, formData: FormData) {
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const monthlyBaseRent = String(formData.get("monthlyBaseRent") ?? "").trim();
  const monthlyAdditionalRent = String(formData.get("monthlyAdditionalRent") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!periodStart || !periodEnd || !monthlyBaseRent) {
    throw new Error("Period start/end and base rent are required");
  }

  await db.insert(rentSchedulePeriods).values({
    leaseId,
    periodStart,
    periodEnd,
    monthlyBaseRent,
    monthlyAdditionalRent: monthlyAdditionalRent || null,
    notes,
  });

  revalidatePath(`/leases/${leaseId}`);
}

export async function deleteRentSchedulePeriod(periodId: number, leaseId: number) {
  await db.delete(rentSchedulePeriods).where(eq(rentSchedulePeriods.id, periodId));
  revalidatePath(`/leases/${leaseId}`);
}
