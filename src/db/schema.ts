import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  addressStreet: text("address_street").notNull(),
  addressCity: text("address_city").notNull(),
  addressState: text("address_state").notNull(),
  addressZip: text("address_zip").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const suites = pgTable("suites", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  suiteNumber: text("suite_number").notNull(),
  rentableSqft: numeric("rentable_sqft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  entityName: text("entity_name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  mailingAddress: text("mailing_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const LEASE_STATUSES = ["active", "expired", "terminated"] as const;
export type LeaseStatus = (typeof LEASE_STATUSES)[number];

export const leases = pgTable("leases", {
  id: serial("id").primaryKey(),
  suiteId: integer("suite_id")
    .notNull()
    .references(() => suites.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "restrict" }),
  permittedUse: text("permitted_use"),
  commencementDate: date("commencement_date"),
  initialTermMonths: integer("initial_term_months"),
  renewalOptionYears: integer("renewal_option_years"),
  renewalNoticeDays: integer("renewal_notice_days"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rentSchedulePeriods = pgTable("rent_schedule_periods", {
  id: serial("id").primaryKey(),
  leaseId: integer("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  monthlyBaseRent: numeric("monthly_base_rent").notNull(),
  monthlyAdditionalRent: numeric("monthly_additional_rent"),
  notes: text("notes"),
});

export const leaseTemplates = pgTable("lease_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  permittedUse: text("permitted_use"),
  initialTermMonths: integer("initial_term_months"),
  renewalOptionYears: integer("renewal_option_years"),
  renewalNoticeDays: integer("renewal_notice_days"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Rent rows on a template are relative to a lease's (not-yet-known)
// commencement date — "month 1 through month 3", not real calendar dates.
export const leaseTemplateRentRows = pgTable("lease_template_rent_rows", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .notNull()
    .references(() => leaseTemplates.id, { onDelete: "cascade" }),
  monthOffsetStart: integer("month_offset_start").notNull(),
  monthOffsetEnd: integer("month_offset_end").notNull(),
  monthlyBaseRent: numeric("monthly_base_rent").notNull(),
  monthlyAdditionalRent: numeric("monthly_additional_rent"),
  notes: text("notes"),
});

export const FILE_CATEGORIES = [
  "floorplan",
  "lease",
  "exhibit",
  "amendment",
  "insurance",
  "other",
] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const ATTACHED_TO_TYPES = ["suite", "lease"] as const;
export type AttachedToType = (typeof ATTACHED_TO_TYPES)[number];

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  r2Key: text("r2_key").notNull(),
  originalFilename: text("original_filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  category: text("category").notNull(),
  attachedToType: text("attached_to_type").notNull(),
  attachedToId: integer("attached_to_id").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});
