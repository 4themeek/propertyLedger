"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  leases,
  rentSchedulePeriods,
  leaseTemplateRentRows,
  LEASE_STATUSES,
} from "@/db/schema";
import { periodFromMonthOffsets, addMonths, addDays } from "@/lib/dates";

export async function createLease(formData: FormData) {
  const suiteId = Number(formData.get("suiteId"));
  const tenantId = Number(formData.get("tenantId"));
  const permittedUse = String(formData.get("permittedUse") ?? "").trim() || null;
  const commencementDate = String(formData.get("commencementDate") ?? "").trim() || null;
  const initialTermMonthsRaw = String(formData.get("initialTermMonths") ?? "").trim();
  const renewalOptionYearsRaw = String(formData.get("renewalOptionYears") ?? "").trim();
  const renewalNoticeDaysRaw = String(formData.get("renewalNoticeDays") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const cloneFromRaw = String(formData.get("cloneFrom") ?? "").trim();
  const templateIdRaw = String(formData.get("templateId") ?? "").trim();

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

  const cloneFrom = Number(cloneFromRaw);
  if (Number.isInteger(cloneFrom) && cloneFromRaw) {
    const sourceRows = await db
      .select()
      .from(rentSchedulePeriods)
      .where(eq(rentSchedulePeriods.leaseId, cloneFrom));
    if (sourceRows.length > 0) {
      await db.insert(rentSchedulePeriods).values(
        sourceRows.map((row) => ({
          leaseId: created.id,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
          monthlyBaseRent: row.monthlyBaseRent,
          monthlyAdditionalRent: row.monthlyAdditionalRent,
          notes: row.notes,
        }))
      );
    }
  }

  const templateId = Number(templateIdRaw);
  if (Number.isInteger(templateId) && templateIdRaw && commencementDate) {
    const templateRows = await db
      .select()
      .from(leaseTemplateRentRows)
      .where(eq(leaseTemplateRentRows.templateId, templateId));
    if (templateRows.length > 0) {
      await db.insert(rentSchedulePeriods).values(
        templateRows.map((row) => {
          const { periodStart, periodEnd } = periodFromMonthOffsets(
            commencementDate,
            row.monthOffsetStart,
            row.monthOffsetEnd
          );
          return {
            leaseId: created.id,
            periodStart,
            periodEnd,
            monthlyBaseRent: row.monthlyBaseRent,
            monthlyAdditionalRent: row.monthlyAdditionalRent,
            notes: row.notes,
          };
        })
      );
    }
  }

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

function numOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw ? Number(raw) : null;
}

function strOrNull(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

export async function updateLeaseDocumentDetails(leaseId: number, formData: FormData) {
  await db
    .update(leases)
    .set({
      renewalOptionCount: numOrNull(formData, "renewalOptionCount"),
      earlyOccupancyWeeks: numOrNull(formData, "earlyOccupancyWeeks"),
      rentFreeMonths: numOrNull(formData, "rentFreeMonths"),
      firstRentDueDate: strOrNull(formData, "firstRentDueDate"),
      leaseExecutionDate: strOrNull(formData, "leaseExecutionDate"),
      guaranteePeriodEndDate: strOrNull(formData, "guaranteePeriodEndDate"),
      securityDepositMonths: numOrNull(formData, "securityDepositMonths"),
      securityDepositAmount: strOrNull(formData, "securityDepositAmount"),
      parkingPaymentAmount: strOrNull(formData, "parkingPaymentAmount"),
      parkingSpotCount: numOrNull(formData, "parkingSpotCount"),
      parkingYears: numOrNull(formData, "parkingYears"),
      movingExpenseAmount: strOrNull(formData, "movingExpenseAmount"),
      tenantSignatoryName: strOrNull(formData, "tenantSignatoryName"),
      tenantSignatoryTitle: strOrNull(formData, "tenantSignatoryTitle"),
      guarantorName: strOrNull(formData, "guarantorName"),
    })
    .where(eq(leases.id, leaseId));

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

function escalate(startingAmount: number, escalationPct: number, periodIndex: number): string {
  const amount = startingAmount * Math.pow(1 + escalationPct / 100, periodIndex);
  return amount.toFixed(2);
}

export async function generateRentSchedule(leaseId: number, formData: FormData) {
  const firstPeriodStart = String(formData.get("firstPeriodStart") ?? "").trim();
  const numberOfPeriods = Number(formData.get("numberOfPeriods"));
  const monthsPerPeriod = Number(formData.get("monthsPerPeriod"));
  const startingMonthlyBaseRent = Number(formData.get("startingMonthlyBaseRent"));
  const baseRentEscalationPct = Number(formData.get("baseRentEscalationPct") || 0);
  const startingMonthlyAdditionalRentRaw = String(
    formData.get("startingMonthlyAdditionalRent") ?? ""
  ).trim();
  const additionalRentEscalationPct = Number(formData.get("additionalRentEscalationPct") || 0);
  const replaceExisting = formData.get("replaceExisting") === "on";

  if (
    !firstPeriodStart ||
    !Number.isInteger(numberOfPeriods) ||
    numberOfPeriods < 1 ||
    !Number.isInteger(monthsPerPeriod) ||
    monthsPerPeriod < 1 ||
    !Number.isFinite(startingMonthlyBaseRent)
  ) {
    throw new Error("Start date, number of periods, months per period, and starting rent are required");
  }

  const startingMonthlyAdditionalRent = startingMonthlyAdditionalRentRaw
    ? Number(startingMonthlyAdditionalRentRaw)
    : null;

  const rows = Array.from({ length: numberOfPeriods }, (_, i) => {
    const periodStart = addMonths(firstPeriodStart, i * monthsPerPeriod);
    const periodEnd = addDays(addMonths(periodStart, monthsPerPeriod), -1);
    return {
      leaseId,
      periodStart,
      periodEnd,
      monthlyBaseRent: escalate(startingMonthlyBaseRent, baseRentEscalationPct, i),
      monthlyAdditionalRent:
        startingMonthlyAdditionalRent !== null
          ? escalate(startingMonthlyAdditionalRent, additionalRentEscalationPct, i)
          : null,
      notes: null,
    };
  });

  if (replaceExisting) {
    await db.delete(rentSchedulePeriods).where(eq(rentSchedulePeriods.leaseId, leaseId));
  }
  await db.insert(rentSchedulePeriods).values(rows);

  revalidatePath(`/leases/${leaseId}`);
}
