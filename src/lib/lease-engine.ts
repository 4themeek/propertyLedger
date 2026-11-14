// Lease Builder v1.7 in the app.
//
// The lease text, numbering and rent math come from the standalone page
// (public/lease-builder/index.html) through the generated lease-engine-core.js.
// This file adds the types, the form definition (LEASE_FIELD_GROUPS) and
// normalizeLeaseData, which turns stored values into a complete LeaseState.
import {
  DEFAULTS,
  TEMPLATE_VERSION,
  renderLeaseHtml,
  computeLeaseModel,
} from "./lease-engine-core";
import type { RevisionMode } from "@/db/schema";

export { TEMPLATE_VERSION, renderLeaseHtml, computeLeaseModel };

export type YesNo = "yes" | "no";

/** The flat input object the page's renderer reads (same keys as the page's FIELD_IDS). */
export interface LeaseState {
  landlordName: string;
  landlordAddress: string;
  landlordSignerName: string;
  tenantName: string;
  tenantAddress: string;
  tenantSignerName: string;
  tenantSignerTitle: string;
  guarantorName: string;
  buildingAddress: string;
  city: string;
  stateName: string;
  county: string;
  suiteNumber: string;
  rsf: number;
  permittedUse: string;
  executionDate: string;
  commencementDate: string;
  initialTermMonths: number;
  earlyOccupancyWeeks: number;
  freeRentMonths: number;
  renewalOptionCount: number;
  renewalOptionYears: number;
  renewalNoticeDays: number;
  baseRentPSFYear1: number;
  annualEscalationPct: number;
  utilitiesAnnualYear1: number;
  utilitiesEscalationPct: number;
  utilitiesCapAnnualPSFYear2: number;
  securityDeposit: number;
  movingAllowancePSF: number;
  parkingSpaces: number;
  parkingYears: number;
  parkingMonthlyRatePerSpace: number;
  insurancePerPerson: number;
  insurancePerOccurrence: number;
  insurancePropertyDamage: number;
  guarantyEndDate: string;
  landlordBrokerFirm: string;
  landlordBrokerAgent: string;
  tenantBrokerFirm: string;
  tenantBrokerAgent: string;
  latePaymentInterestPct: number;
  lateGraceDays: number;
  nonMonetaryCureDays: number;
  tenantSigner2Name: string;
  tenantSigner2Title: string;
  guarantor2Name: string;
  earlyTermMonths: number;
  earlyTermNoticeStart: string;
  earlyTermNoticeEnd: string;
  utilitiesCapEnabled: boolean;
  utilitiesCapStartYear: number;
  utilitiesCapEndYear: number;
  movingExpenseProvided: YesNo;
  ledScreenOption: YesNo;
  ledScreenTerms: string;
  buildingZip: string;
  parkingIncluded: YesNo;
  parkingTermMode: "years" | "lease";
  parkingCredit: number;
  rentCreditProvided: YesNo;
  rentCreditMode: "monthly" | "total";
  rentCreditPerMonth: number;
  rentCreditMonths: number;
  rentCreditTotal: number;
  revisionMode: RevisionMode;
  revisionSchedule: YesNo;

  // App-only hooks (absent on the page; blank = the page's hard-coded text).
  landlordSignerTitle?: string;
  buildingName?: string;
  exhibitDItems?: string[];
}

export type LeaseStateKey = Exclude<keyof LeaseState, "landlordSignerTitle" | "buildingName" | "exhibitDItems">;

export const LEASE_DEFAULTS: LeaseState = DEFAULTS;

// ---------------------------------------------------------------------------
// Where each value lives.
//   "terms"   -> leases.lease_terms (jsonb)
//   "lease"   -> a column on the leases row (edited on the Lease terms form too)
//   "linked"  -> another table (landlord profile, tenant, property, suite); shown read-only
// ---------------------------------------------------------------------------

export type FieldType = "text" | "int" | "num" | "date" | "bool" | "select" | "textarea";
export type FieldSource = "terms" | "lease" | "linked";

export interface LeaseField {
  key: LeaseStateKey;
  label: string;
  type: FieldType;
  source: FieldSource;
  /** For select fields that hold a number (parkingSpaces). */
  numeric?: boolean;
  options?: { value: string; label: string }[];
  prefix?: string;
  suffix?: string;
  note?: string;
  wide?: boolean;
  /** Page syntax: "a=b" or "a=b&c=d"; the field is hidden unless all match. */
  showIf?: string;
  /** Field is disabled unless this boolean is true. */
  enableIf?: LeaseStateKey;
  /** Where to edit a "linked" value. */
  linkedTo?: "landlord" | "tenant" | "property" | "suite";
}

export interface LeaseFieldGroup {
  title: string;
  hint?: string;
  fields: LeaseField[];
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
const NO_YES = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

export const LEASE_FIELD_GROUPS: LeaseFieldGroup[] = [
  {
    title: "Parties",
    hint: "Who is signing. Landlord and Tenant entity details come from the landlord profile and the tenant record.",
    fields: [
      { key: "landlordName", label: "Landlord entity name", type: "text", source: "linked", linkedTo: "landlord" },
      { key: "landlordAddress", label: "Landlord notice address", type: "text", source: "linked", linkedTo: "landlord", wide: true },
      { key: "landlordSignerName", label: "Landlord signer", type: "text", source: "linked", linkedTo: "landlord" },
      { key: "tenantName", label: "Tenant entity name", type: "text", source: "linked", linkedTo: "tenant" },
      { key: "tenantAddress", label: "Tenant notice address", type: "text", source: "linked", linkedTo: "tenant", wide: true },
      { key: "tenantSignerName", label: "Tenant signer", type: "text", source: "lease" },
      { key: "tenantSignerTitle", label: "Tenant signer title", type: "text", source: "lease" },
      { key: "guarantorName", label: "Guarantor (principal member)", type: "text", source: "lease" },
      { key: "tenantSigner2Name", label: "Tenant signer #2 (optional)", type: "text", source: "terms", note: "Leave blank for a single Tenant signature block." },
      { key: "tenantSigner2Title", label: "Tenant signer #2 title", type: "text", source: "terms" },
      { key: "guarantor2Name", label: "Guarantor #2 (optional)", type: "text", source: "terms", note: "Leave blank for a single Guarantor." },
    ],
  },
  {
    title: "Premises & Governing Law",
    hint: "Address, suite and square footage come from the property and suite records.",
    fields: [
      { key: "buildingAddress", label: "Building street address", type: "text", source: "linked", linkedTo: "property", wide: true },
      { key: "city", label: "City", type: "text", source: "linked", linkedTo: "property" },
      { key: "stateName", label: "State", type: "text", source: "linked", linkedTo: "property" },
      { key: "buildingZip", label: "ZIP code", type: "text", source: "linked", linkedTo: "property" },
      { key: "county", label: "County (for notary)", type: "text", source: "terms" },
      { key: "suiteNumber", label: "Suite", type: "text", source: "linked", linkedTo: "suite" },
      { key: "rsf", label: "Rentable square feet (RSF)", type: "int", source: "linked", linkedTo: "suite" },
      { key: "permittedUse", label: "Permitted use", type: "text", source: "lease", wide: true },
    ],
  },
  {
    title: "Term & Key Dates",
    hint: "Expiration, first rent due date and early-occupancy date are calculated for you on Review & Print.",
    fields: [
      { key: "executionDate", label: "Lease execution date", type: "date", source: "lease" },
      { key: "commencementDate", label: "Commencement Date", type: "date", source: "lease" },
      { key: "initialTermMonths", label: "Initial term", type: "int", source: "lease", suffix: "months" },
      { key: "earlyOccupancyWeeks", label: "Early occupancy", type: "int", source: "lease", suffix: "weeks" },
      { key: "freeRentMonths", label: "Free-rent period", type: "int", source: "lease", suffix: "months" },
      { key: "renewalOptionCount", label: "Renewal options", type: "int", source: "lease" },
      { key: "renewalOptionYears", label: "Each renewal option", type: "int", source: "lease", suffix: "years" },
      { key: "renewalNoticeDays", label: "Renewal notice required", type: "int", source: "lease", suffix: "days" },
      { key: "earlyTermMonths", label: "Early termination option", type: "int", source: "terms", suffix: "months early", note: "Set to 0 to omit the clause." },
      { key: "earlyTermNoticeStart", label: "Early-termination notice window opens", type: "date", source: "terms" },
      { key: "earlyTermNoticeEnd", label: "Early-termination notice window closes", type: "date", source: "terms" },
    ],
  },
  {
    title: "Base Rent",
    hint: "Sets Year 1's rate and the compounding annual escalation. The full year-by-year schedule is generated automatically.",
    fields: [
      { key: "baseRentPSFYear1", label: "Year 1 base rent", type: "num", source: "terms", prefix: "$", suffix: "/RSF/yr" },
      { key: "annualEscalationPct", label: "Annual escalation", type: "num", source: "terms", suffix: "%" },
      { key: "rentCreditProvided", label: "Rent credits from Landlord?", type: "select", source: "terms", options: NO_YES, note: "“Yes” shows “Credit” in the Monthly Installment column of the Rent Schedule." },
      { key: "rentCreditMode", label: "How is the credit stated?", type: "select", source: "terms", showIf: "rentCreditProvided=yes", options: [{ value: "monthly", label: "Per month × months" }, { value: "total", label: "Total amount, used up" }] },
      { key: "rentCreditPerMonth", label: "Credit per month", type: "num", source: "terms", prefix: "$", showIf: "rentCreditProvided=yes&rentCreditMode=monthly", note: "Never more than that month’s installment." },
      { key: "rentCreditMonths", label: "Number of months", type: "int", source: "terms", suffix: "months", showIf: "rentCreditProvided=yes&rentCreditMode=monthly" },
      { key: "rentCreditTotal", label: "Total credit amount", type: "num", source: "terms", prefix: "$", showIf: "rentCreditProvided=yes&rentCreditMode=total", note: "Applied to each monthly installment until used up." },
    ],
  },
  {
    title: "Utilities (Additional Rent)",
    hint: "Modified-gross structure: Tenant pays utilities separately. Enter the Year 1 annual amount — the monthly charge is that amount divided by 12. Later years escalate. Tick the box to apply a per-RSF cap, and choose the Lease Years it covers.",
    fields: [
      { key: "utilitiesAnnualYear1", label: "Year 1 utilities (annual amount)", type: "num", source: "terms", prefix: "$" },
      { key: "utilitiesEscalationPct", label: "Utilities escalation", type: "num", source: "terms", suffix: "%" },
      { key: "utilitiesCapEnabled", label: "Apply a utilities cap", type: "bool", source: "terms", note: "Unchecked = no cap; the cap sentence is removed from the lease." },
      { key: "utilitiesCapAnnualPSFYear2", label: "Utilities cap", type: "num", source: "terms", prefix: "$", suffix: "/RSF/yr", enableIf: "utilitiesCapEnabled" },
      { key: "utilitiesCapStartYear", label: "Cap starts in Lease Year", type: "int", source: "terms", enableIf: "utilitiesCapEnabled" },
      { key: "utilitiesCapEndYear", label: "Cap stops after Lease Year", type: "int", source: "terms", enableIf: "utilitiesCapEnabled", note: "0 = through the end of the term." },
    ],
  },
  {
    title: "On-Site Edge Lot Parking (Paragraph 6.6)",
    hint: "Is parking in the Building’s on-site lot part of this lease? “No” states in 6.6 that no on-site parking is included.",
    fields: [
      { key: "parkingIncluded", label: "Edge Lot parking included?", type: "select", source: "terms", options: YES_NO },
      { key: "parkingSpaces", label: "Parking spots requested", type: "select", numeric: true, source: "lease", showIf: "parkingIncluded=yes", options: [{ value: "1", label: "1 spot" }, { value: "2", label: "2 spots (maximum)" }] },
      { key: "parkingMonthlyRatePerSpace", label: "Monthly cost per spot", type: "num", source: "terms", prefix: "$", showIf: "parkingIncluded=yes" },
      { key: "parkingTermMode", label: "Term of parking", type: "select", source: "terms", showIf: "parkingIncluded=yes", options: [{ value: "years", label: "A set number of years" }, { value: "lease", label: "Match the lease term" }] },
      { key: "parkingYears", label: "Parking term", type: "int", source: "lease", suffix: "years", showIf: "parkingIncluded=yes&parkingTermMode=years" },
      { key: "parkingCredit", label: "Landlord parking credit (payment to Tenant)", type: "num", source: "terms", prefix: "$", showIf: "parkingIncluded=yes", note: "One-time payment applied against the parking charges." },
    ],
  },
  {
    title: "Deposits & Landlord Concessions",
    fields: [
      { key: "securityDeposit", label: "Security deposit", type: "num", source: "lease", prefix: "$" },
      { key: "movingExpenseProvided", label: "Landlord provides moving expense to Tenant?", type: "select", source: "terms", options: YES_NO, note: "Controls paragraph 8.2. “No” removes it." },
      { key: "movingAllowancePSF", label: "Moving expense amount", type: "num", source: "terms", prefix: "$", suffix: "/RSF", showIf: "movingExpenseProvided=yes", note: "One-time payment; the lease states the total (amount × RSF)." },
    ],
  },
  {
    title: "Insurance Minimums",
    hint: "The 2026 sample used dated limits ($500K / $2M / $200K). Consider raising these.",
    fields: [
      { key: "insurancePerPerson", label: "Per person (bodily injury)", type: "int", source: "terms", prefix: "$" },
      { key: "insurancePerOccurrence", label: "Per occurrence", type: "int", source: "terms", prefix: "$" },
      { key: "insurancePropertyDamage", label: "Property damage", type: "int", source: "terms", prefix: "$" },
    ],
  },
  {
    title: "Signage Options (Section X)",
    hint: "Optional add-on signage. Choosing “Yes” adds paragraph 10.2 to the lease using the explanation below.",
    fields: [
      { key: "ledScreenOption", label: "Special Lobby LED Screen Advertising option?", type: "select", source: "terms", options: NO_YES },
      { key: "ledScreenTerms", label: "Explanation of terms (appears as paragraph 10.2)", type: "textarea", source: "terms", wide: true, showIf: "ledScreenOption=yes", note: "Printed as written. The default is starter language for counsel to review." },
    ],
  },
  {
    title: "Guaranty, Brokers & Default Terms",
    fields: [
      { key: "guarantyEndDate", label: "Guaranty ends on", type: "date", source: "lease", note: "Often shorter than the full term — negotiated separately." },
      { key: "landlordBrokerFirm", label: "Landlord's broker — firm", type: "text", source: "terms" },
      { key: "landlordBrokerAgent", label: "Landlord's broker — agent", type: "text", source: "terms" },
      { key: "tenantBrokerFirm", label: "Tenant's broker — firm", type: "text", source: "terms" },
      { key: "tenantBrokerAgent", label: "Tenant's broker — agent", type: "text", source: "terms" },
      { key: "latePaymentInterestPct", label: "Late payment interest", type: "num", source: "terms", suffix: "%/mo" },
      { key: "lateGraceDays", label: "Late-payment grace period", type: "int", source: "terms", suffix: "days" },
      { key: "nonMonetaryCureDays", label: "Non-monetary cure period", type: "int", source: "terms", suffix: "days" },
    ],
  },
];

export const LEASE_FIELDS: LeaseField[] = LEASE_FIELD_GROUPS.flatMap((g) => g.fields);
export const TERMS_KEYS: LeaseStateKey[] = LEASE_FIELDS.filter((f) => f.source === "terms").map((f) => f.key);

/** Parse one form value the way the page's readFormIntoState does. */
export function parseFieldValue(field: LeaseField, raw: string | null): LeaseState[LeaseStateKey] {
  const v = raw ?? "";
  if (field.type === "bool") return raw === "on" || raw === "true";
  if (field.type === "int" || (field.type === "select" && field.numeric)) return v === "" ? 0 : parseInt(v, 10) || 0;
  if (field.type === "num") return v === "" ? 0 : parseFloat(v) || 0;
  return v as LeaseState[LeaseStateKey];
}

export function showIfMatches(showIf: string | undefined, state: LeaseState): boolean {
  if (!showIf) return true;
  return showIf.split("&").every((cond) => {
    const [k, v] = cond.split("=");
    return String(state[k as LeaseStateKey]) === v;
  });
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Complete LeaseState from stored lease_terms (plus any already-resolved values).
 * Missing keys take the page's defaults; older "electric*" keys are converted to
 * the utilities fields (LEASE_UPDATE.md section 1); an unknown revisionMode is
 * treated as "original".
 */
export function normalizeLeaseData(raw: Record<string, unknown>): LeaseState {
  const d = { ...LEASE_DEFAULTS, ...raw } as LeaseState;
  if (raw.utilitiesAnnualYear1 === undefined && typeof raw.electricMonthlyYear1 === "number") {
    d.utilitiesAnnualYear1 = round2(raw.electricMonthlyYear1 * 12);
  }
  if (raw.utilitiesEscalationPct === undefined && typeof raw.electricEscalationPct === "number") {
    d.utilitiesEscalationPct = raw.electricEscalationPct;
  }
  if (raw.utilitiesCapAnnualPSFYear2 === undefined && typeof raw.electricCapAnnualPSFYear2 === "number") {
    d.utilitiesCapAnnualPSFYear2 = raw.electricCapAnnualPSFYear2;
  }
  if (d.revisionMode !== "review" && d.revisionMode !== "clean") d.revisionMode = "original";
  if (d.revisionSchedule !== "no") d.revisionSchedule = "yes";
  return d;
}

/** Word file name, as on the page: "Lease - Tenant - Suite 204 - Original". */
export function leaseFileName(state: LeaseState): string {
  const safe = (x: string) => String(x || "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  const suffix =
    state.revisionMode === "original" ? " - Original" : state.revisionMode === "clean" ? " - Proposed (clean)" : " - Proposed (review copy)";
  return "Lease - " + (safe(state.tenantName) || "Tenant") + (state.suiteNumber ? " - Suite " + safe(state.suiteNumber) : "") + suffix;
}
