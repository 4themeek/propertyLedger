// Types for the generated src/lib/lease-engine-core.js (see scripts/extract-lease-engine.mjs).
import type { LeaseState } from "./lease-engine";

export const TEMPLATE_VERSION: string;
export const DEFAULTS: LeaseState;

export interface LeaseRentRow {
  yearNum: string;
  months: string;
  rate: string;
  monthlyBase: string;
  annualBase: string;
  annualUtilities: string;
  monthlyUtilities: string;
  strike?: string;
  annualPre?: string;
  annualPreStruck?: boolean;
  note: string;
}

export interface LeaseMonth {
  n: number;
  year: number;
  date: Date | null;
  base: number;
  free: boolean;
  credit: number;
  net: number;
  util: number;
}

export interface LeaseModel {
  commencement: Date | null;
  execution: Date | null;
  expiration: Date | null;
  firstRentDue: Date | null;
  earlyOccupancy: Date | null;
  renewalDeadline: Date | null;
  guarantyEnd: Date | null;
  earlyTermEffective: Date | null;
  rentRows: LeaseRentRow[];
  months: LeaseMonth[];
  totalBase: number;
  totalUtilities: number;
  creditApplied: number;
  movingAllowanceTotal: number;
  parkingSpots: number;
  parkingMonths: number;
  parkingTotalCost: number;
}

export function renderLeaseHtml(state: LeaseState): string;
export function computeLeaseModel(state: LeaseState): LeaseModel;
