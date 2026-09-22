import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  leases,
  suites,
  properties,
  tenants,
  landlordProfile,
  rentSchedulePeriods,
} from "@/db/schema";
import {
  formatLongDate,
  formatMonthYear,
  formatYear,
  addMonths,
  addDays,
  monthOffsetsFromPeriod,
} from "@/lib/dates";
import { formatMoney } from "@/lib/money";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "lease-agreement-template.docx");

export async function generateLeaseDocument(leaseId: number): Promise<Buffer> {
  const data = await buildLeaseDocumentData(leaseId);

  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);

  return doc.getZip().generate({ type: "nodebuffer" });
}

async function buildLeaseDocumentData(leaseId: number) {
  const [lease] = await db.select().from(leases).where(eq(leases.id, leaseId)).limit(1);
  if (!lease) throw new Error("Lease not found");

  const [suite] = await db.select().from(suites).where(eq(suites.id, lease.suiteId)).limit(1);
  if (!suite) throw new Error("Suite not found");

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, suite.propertyId))
    .limit(1);
  if (!property) throw new Error("Property not found");

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, lease.tenantId)).limit(1);
  if (!tenant) throw new Error("Tenant not found");

  const [landlord] = await db.select().from(landlordProfile).limit(1);
  if (!landlord) {
    throw new Error("Landlord profile is not set up yet — fill it in at /landlord-profile first");
  }

  const scheduleRows = await db
    .select()
    .from(rentSchedulePeriods)
    .where(eq(rentSchedulePeriods.leaseId, leaseId))
    .orderBy(asc(rentSchedulePeriods.periodStart));

  const commencementDate = lease.commencementDate;

  const rentRows = scheduleRows.map((row) => {
    const monthlyBase = Number(row.monthlyBaseRent);
    const monthlyAdditional = row.monthlyAdditionalRent ? Number(row.monthlyAdditionalRent) : 0;
    const rentableSqft = suite.rentableSqft ? Number(suite.rentableSqft) : null;

    let leaseYear = "";
    let leaseMonthRange = "";
    if (commencementDate) {
      const { monthOffsetStart, monthOffsetEnd } = monthOffsetsFromPeriod(
        commencementDate,
        row.periodStart,
        row.periodEnd
      );
      leaseYear = Math.ceil(monthOffsetStart / 12).toString();
      leaseMonthRange = monthOffsetStart === monthOffsetEnd
        ? `${monthOffsetStart}`
        : `${monthOffsetStart}-${monthOffsetEnd}`;
    }

    return {
      leaseYear,
      leaseMonthRange,
      annualBaseRentPerSqft: rentableSqft ? formatMoney((monthlyBase * 12) / rentableSqft) : "",
      monthlyBaseRent: formatMoney(monthlyBase),
      annualBaseRent: formatMoney(monthlyBase * 12),
      monthlyAdditionalRent: formatMoney(monthlyAdditional),
      annualAdditionalRent: formatMoney(monthlyAdditional * 12),
    };
  });

  const expirationDate =
    commencementDate && lease.initialTermMonths
      ? addDays(addMonths(commencementDate, lease.initialTermMonths), -1)
      : null;

  return {
    landlordName: landlord.name,
    landlordAddressLine1: landlord.addressLine1 ?? "",
    landlordCityStateZip: landlord.cityStateZip ?? "",
    landlordSignatoryName: landlord.signatoryName ?? "",
    landlordSignatoryTitle: landlord.signatoryTitle ?? "",

    tenantName: tenant.entityName,
    tenantAddressLine1: tenant.addressLine1 ?? "",
    tenantCityStateZip: tenant.cityStateZip ?? "",
    tenantSignatoryName: lease.tenantSignatoryName ?? "",
    tenantSignatoryTitle: lease.tenantSignatoryTitle ?? "",

    permittedUse: lease.permittedUse ?? "",
    commencementDate: commencementDate ? formatLongDate(commencementDate) : "",
    expirationDate: expirationDate ? formatLongDate(expirationDate) : "",
    initialTermMonths: lease.initialTermMonths?.toString() ?? "",
    renewalOptionCount: lease.renewalOptionCount?.toString() ?? "",
    renewalOptionYears: lease.renewalOptionYears?.toString() ?? "",
    renewalNoticeDays: lease.renewalNoticeDays?.toString() ?? "",
    earlyOccupancyWeeks: lease.earlyOccupancyWeeks?.toString() ?? "",
    rentFreeMonths: lease.rentFreeMonths?.toString() ?? "",
    firstRentDueDate: lease.firstRentDueDate ? formatLongDate(lease.firstRentDueDate) : "",

    rentableSqft: suite.rentableSqft ? formatMoney(suite.rentableSqft) : "",
    suiteNumber: suite.suiteNumber,

    propertyStreetAddress: property.addressStreet,
    propertyCity: property.addressCity,
    propertyState: property.addressState,

    securityDepositMonths: lease.securityDepositMonths?.toString() ?? "",
    securityDepositAmount: formatMoney(lease.securityDepositAmount),
    parkingPaymentAmount: formatMoney(lease.parkingPaymentAmount),
    parkingSpotCount: lease.parkingSpotCount?.toString() ?? "",
    parkingYears: lease.parkingYears?.toString() ?? "",
    movingExpenseAmount: formatMoney(lease.movingExpenseAmount),

    guarantorName: lease.guarantorName ?? "",
    guaranteePeriodEndDate: lease.guaranteePeriodEndDate
      ? formatLongDate(lease.guaranteePeriodEndDate)
      : "",

    leaseExecutionMonthYear: lease.leaseExecutionDate
      ? formatMonthYear(lease.leaseExecutionDate)
      : "",
    leaseExecutionYear: lease.leaseExecutionDate ? formatYear(lease.leaseExecutionDate) : "",

    rentRows,
  };
}
