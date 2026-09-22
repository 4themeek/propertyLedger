"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaseTemplates, leaseTemplateRentRows } from "@/db/schema";

export async function createTemplate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const permittedUse = String(formData.get("permittedUse") ?? "").trim() || null;
  const initialTermMonthsRaw = String(formData.get("initialTermMonths") ?? "").trim();
  const renewalOptionYearsRaw = String(formData.get("renewalOptionYears") ?? "").trim();
  const renewalNoticeDaysRaw = String(formData.get("renewalNoticeDays") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    throw new Error("Template name is required");
  }

  const [created] = await db
    .insert(leaseTemplates)
    .values({
      name,
      permittedUse,
      initialTermMonths: initialTermMonthsRaw ? Number(initialTermMonthsRaw) : null,
      renewalOptionYears: renewalOptionYearsRaw ? Number(renewalOptionYearsRaw) : null,
      renewalNoticeDays: renewalNoticeDaysRaw ? Number(renewalNoticeDaysRaw) : null,
      notes,
    })
    .returning({ id: leaseTemplates.id });

  revalidatePath("/lease-templates");
  redirect(`/lease-templates/${created.id}`);
}

export async function deleteTemplate(templateId: number) {
  await db.delete(leaseTemplates).where(eq(leaseTemplates.id, templateId));
  revalidatePath("/lease-templates");
  redirect("/lease-templates");
}

export async function addTemplateRentRow(templateId: number, formData: FormData) {
  const monthOffsetStart = Number(formData.get("monthOffsetStart"));
  const monthOffsetEnd = Number(formData.get("monthOffsetEnd"));
  const monthlyBaseRent = String(formData.get("monthlyBaseRent") ?? "").trim();
  const monthlyAdditionalRent = String(formData.get("monthlyAdditionalRent") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isInteger(monthOffsetStart) || !Number.isInteger(monthOffsetEnd) || !monthlyBaseRent) {
    throw new Error("Month range and base rent are required");
  }
  if (monthOffsetStart < 1 || monthOffsetEnd < monthOffsetStart) {
    throw new Error("Invalid month range");
  }

  await db.insert(leaseTemplateRentRows).values({
    templateId,
    monthOffsetStart,
    monthOffsetEnd,
    monthlyBaseRent,
    monthlyAdditionalRent: monthlyAdditionalRent || null,
    notes,
  });

  revalidatePath(`/lease-templates/${templateId}`);
}

export async function deleteTemplateRentRow(rowId: number, templateId: number) {
  await db.delete(leaseTemplateRentRows).where(eq(leaseTemplateRentRows.id, rowId));
  revalidatePath(`/lease-templates/${templateId}`);
}

function escalate(startingAmount: number, escalationPct: number, periodIndex: number): string {
  const amount = startingAmount * Math.pow(1 + escalationPct / 100, periodIndex);
  return amount.toFixed(2);
}

export async function generateTemplateRentRows(templateId: number, formData: FormData) {
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
    !Number.isInteger(numberOfPeriods) ||
    numberOfPeriods < 1 ||
    !Number.isInteger(monthsPerPeriod) ||
    monthsPerPeriod < 1 ||
    !Number.isFinite(startingMonthlyBaseRent)
  ) {
    throw new Error("Number of periods, months per period, and starting rent are required");
  }

  const startingMonthlyAdditionalRent = startingMonthlyAdditionalRentRaw
    ? Number(startingMonthlyAdditionalRentRaw)
    : null;

  const rows = Array.from({ length: numberOfPeriods }, (_, i) => ({
    templateId,
    monthOffsetStart: i * monthsPerPeriod + 1,
    monthOffsetEnd: (i + 1) * monthsPerPeriod,
    monthlyBaseRent: escalate(startingMonthlyBaseRent, baseRentEscalationPct, i),
    monthlyAdditionalRent:
      startingMonthlyAdditionalRent !== null
        ? escalate(startingMonthlyAdditionalRent, additionalRentEscalationPct, i)
        : null,
    notes: null,
  }));

  if (replaceExisting) {
    await db.delete(leaseTemplateRentRows).where(eq(leaseTemplateRentRows.templateId, templateId));
  }
  await db.insert(leaseTemplateRentRows).values(rows);

  revalidatePath(`/lease-templates/${templateId}`);
}
