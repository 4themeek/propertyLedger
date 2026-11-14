# Port plan: Lease Builder v1.7 into Property Ledger

Status: **approved 2026-11-13 and built** on branch `lease-builder-port`. One change from the draft: instead of
retyping the page's renderer in TypeScript, `scripts/extract-lease-engine.mjs` copies it from the page into
`src/lib/lease-engine-core.js` (typed through `lease-engine-core.d.ts` / `lease-engine.ts`), so parity is exact and
v1.8 can be pulled in by re-running the script. Section 7 (Saved versions) remains deferred.

## 1. What is actually in the repo (and why LEASE_UPDATE.md does not apply as written)

`LEASE_UPDATE.md` assumes a React builder (`src/lib/lease-engine.ts`, `src/components/LeaseDocument.tsx`,
`LeaseForm.tsx`, a "Review & Print" tab, a `leases.data` jsonb column). None of these exist. The app today:

| Piece | Where | How it works |
|---|---|---|
| Lease text | `templates/lease-agreement-template.docx` | An older Word lease (Word list numbering, no Roman sections, no Early Termination, no proposed revisions). |
| Filling it | `src/lib/lease-document.ts` | docxtemplater fills ~45 `{placeholders}` from DB rows. |
| Preview | `/leases/[id]/preview` | Plain-text paragraphs pulled out of the filled .docx. |
| Download | `/api/leases/[id]/document` | The filled .docx. |
| Deal inputs | `leases` columns + `rent_schedule_periods` rows | ~25 typed columns; rent is entered/generated as dated rows, not computed from $/RSF. |

The standalone page (`public/lease-builder/index.html`) is a different, newer lease: 23 Roman-numbered sections,
63 numbered paragraphs, fuller clause text, a computed rent schedule, ~65 inputs, three revision modes.
Its logic is plain JavaScript with pure functions: `computeModel(state)`, `renderDocument()` (state -> HTML string),
`renderRentTable`, `renderMonthlySchedule`, the `PL` / `PB` proposal strings and `PROPL()`, plus a DOM -> .docx
exporter (`buildLeaseDocx`) that matches `docs/lease-builder/docx-export.ts.txt`.

## 2. Recommended approach: port the page's engine, keep the Word template for now

**Port the page's renderer to TypeScript almost line-for-line and render it in the app.** Do not try to rebuild
v1.7 inside the Word template.

Why:
- The spec says the page is the reference for wording, numbering and math, and Original mode must match the page.
  A mechanical port can be checked byte-for-byte against the page; a hand-rebuilt Word template cannot.
- Rebuilding the template would mean rewriting nearly every clause in Word XML, plus conditional blocks for three
  revision modes, ~30 proposal paragraphs and computed cross-references. That's fragile and hard to review.
- The page's .docx exporter (`docx-export.ts`) already produces the Word file from the rendered HTML, with no server
  work and no new packages.

The existing Word-template download and preview stay as they are (separate code path), so nothing that works today
breaks. Retiring them is a later decision.

## 3. Schema change (needs your approval before `npm run db:push`)

The repo uses `drizzle-kit push` (no migrations folder). Proposed change to `src/db/schema.ts`, `leases` table:

```ts
import { jsonb } from "drizzle-orm/pg-core";   // added to the existing import
// ...inside pgTable("leases", { ... })
  // Lease Builder v1.7 inputs that have no column of their own (see section 4).
  leaseTerms: jsonb("lease_terms").$type<Partial<LeaseTerms>>(),
  revisionMode: text("revision_mode").notNull().default("original"),     // original | review | clean
  revisionSchedule: text("revision_schedule").notNull().default("yes"),  // yes | no (Schedule 1.7-A)
```

SQL that `db:push` will run (additive only, no data touched):

```sql
ALTER TABLE "leases" ADD COLUMN "lease_terms" jsonb;
ALTER TABLE "leases" ADD COLUMN "revision_mode" text DEFAULT 'original' NOT NULL;
ALTER TABLE "leases" ADD COLUMN "revision_schedule" text DEFAULT 'yes' NOT NULL;
```

Notes:
- `revision_mode` defaults to **original** for existing leases (the page defaults new leases to `review`; the
  handoff says anything without a mode is treated as original). New leases can be created with `review` if you prefer.
- `text` + a TS union (like `status` / `LEASE_STATUSES` today) rather than a Postgres enum, to match the repo's pattern.
- Section 10 (Saved versions) would need a second table, `lease_snapshots`. Proposed to **defer** (section 7).

## 4. Where each builder input comes from

Builder state is assembled per lease by a new `buildLeaseState(leaseId)`: existing DB fields first, then
`lease_terms`, then the page's `DEFAULTS` for anything still missing.

**From existing rows (no duplication):**

| Builder field | App source |
|---|---|
| landlordName, landlordAddress, landlordSignerName | `landlord_profile` name, address_line1 + city_state_zip, signatory_name |
| tenantName, tenantAddress | `tenants` entity_name, address |
| tenantSignerName, tenantSignerTitle, guarantorName | `leases` tenant_signatory_name / _title, guarantor_name |
| buildingAddress, city, stateName, buildingZip | `properties` address_street / _city / _state / _zip |
| suiteNumber, rsf | `suites` suite_number, rentable_sqft |
| permittedUse, commencementDate, initialTermMonths | `leases` |
| renewalOptionCount / Years / NoticeDays, earlyOccupancyWeeks | `leases` |
| freeRentMonths, executionDate, guarantyEndDate, securityDeposit | `leases` rent_free_months, lease_execution_date, guarantee_period_end_date, security_deposit_amount |
| parkingSpaces, parkingYears | `leases` parking_spot_count, parking_years |

**New, stored in `lease_terms`:** county, baseRentPSFYear1, annualEscalationPct, utilities (annual Y1, escalation,
cap on/off, cap $/RSF, cap years), insurance limits, brokers, late interest / grace days, cure days,
tenantSigner2Name/Title, guarantor2Name, earlyTermMonths + notice window, movingExpenseProvided + movingAllowancePSF,
LED screen option + terms, parkingIncluded / parkingTermMode / parkingMonthlyRatePerSpace / parkingCredit,
rent credits (provided / mode / per-month / months / total).

**Mismatches to decide (my default in bold):**
1. *Moving:* app has `moving_expense_amount` ($); builder uses `movingAllowancePSF` ($/RSF). **Use the builder field; leave the column for the old template.**
2. *Parking:* app's `parking_payment_amount` is the old one-time allowance; builder's `parkingCredit` replaces it. **Use `parkingCredit`.**
3. *First rent due date:* app stores it; builder computes it (commencement + free months). **Use the computed date.**
4. *Exhibit D:* the page hard-codes five bullet items; app has `tenant_improvement_details`. **Use the app field (one bullet per line) when filled, else the page's list.**
5. *Landlord signer title:* page hard-codes "Managing Member"; app has `landlord_profile.signatory_title`. **Use the app value when set.**
6. *Rent schedule:* the builder computes rent from $/RSF; the ledger's `rent_schedule_periods` are separate. **The lease document uses the computed schedule; the ledger rows are untouched.** A "copy computed schedule into ledger rows" button can come later.
7. *Building name:* page hard-codes "The Edge Office Building". **Use `properties.name`.**

Items 4, 5 and 7 change output vs the page only when those app fields differ from the page's defaults; parity checks
run with page-equivalent values.

## 5. Build steps (small commits on `lease-builder-port`)

1. **Schema** (after your approval): the three columns above; `npm run db:push`.
2. **Engine** `src/lib/lease-engine.ts`: TypeScript port of the page's helpers (`money`, `wordsInt`, `moneyWords`,
   dates, `toRoman`, `capYears`), `computeModel`, `renderRentTable`, `renderMonthlySchedule`, `renderDocument`,
   `PL` / `PB` / `PROPL`, plus `LeaseTerms` type, `LEASE_DEFAULTS`, `LEASE_FIELD_GROUPS` and `normalizeLeaseData`
   (old `electric*` keys -> utilities, defaults filled, missing `revisionMode` -> original).
   Pure function `renderLeaseHtml(state): string`. Kept as close to the page's code as TS allows, so diffs are easy.
3. **Parity check** `scripts/check-lease-parity.mjs`: runs the page's own script in Node (`vm`, stubbed DOM) and the
   TS engine on 4 lease variants x 3 modes and diffs the HTML. Must be identical. Variants: default; rent credit
   total $12,000; signer #2 + guarantor #2 + early-term 0 + cap off; parking off + moving off + LED on.
4. **State builder** `src/lib/lease-state.ts`: `buildLeaseState(leaseId)` per section 4.
5. **Review & Print page** `/leases/[id]/review`: mode selector (Original / Review copy / Clean draft) and
   Schedule 1.7-A toggle, saved to the lease; the rendered lease inside `<div id="lease-document">` with the page's
   lease CSS (screen + print: Letter, 0.75in margins, "1 of N" footer); Print button; Export to Word. Linked from the
   lease detail page next to the current Preview / Download links.
6. **Word export**: copy `docx-export.ts.txt` -> `src/lib/docx-export.ts` and `ExportDocxButton.tsx.txt` ->
   `src/components/ExportDocxButton.tsx` (`"use client"`); file name ends "- Original" / "- Proposed (review copy)" /
   "- Proposed (clean)".
7. **Lease terms form** `src/components/LeaseForm.tsx`: generic form driven by `LEASE_FIELD_GROUPS` (number, text,
   date, select, textarea, checkbox; show-when with two conditions), on `/leases/[id]/terms`, saving
   `lease_terms` through a server action. Fields that come from other tables (section 4) are shown read-only with a
   link to where they're edited.
8. **Verify** (section 6), then update `RESUME-HERE.md`, `PROJECT-STATUS.md` (and reconcile it with the older
   `PROJECT_STATUS.md`), open the PR.

Untouched: auth, R2, `wrangler.jsonc`, `open-next.config.ts`, `drizzle.config.ts`, `package.json`, `.env*`, the
Word template and its routes.

## 6. Verification

- `npm run build` passes.
- Parity script: 12 HTML comparisons identical.
- Default lease rent table matches `LEASE_UPDATE.md` section 1 row for row.
- Default lease anchors: rent schedule 1.7, Demised Premises 1.8, Early Termination 1.9 ("effective August 31, 2032"),
  Granting Clause 2.1, Miscellaneous 23.1-23.9, 63 numbered paragraphs, no `__` in cross-references.
- Original mode: no "PROPOSED" text. Clean mode: "with no termination fee" and "shall cease upon expiration of the
  Guarantee Period" both absent. Schedule 1.7-A: scheduled - credit = net on every row.
- A lease created before this change opens on Review & Print without errors (all new fields at defaults).
- Screenshot of Review & Print for the default lease, plus an exported .docx, before the PR.

## 7. Deferred (proposed as a follow-up PR)

- **Section 10, Saved versions:** `lease_snapshots(id uuid pk, lease_id fk, name, created_at, template_version,
  is_auto, state jsonb)`, two-click Restore/Delete, 30-per-lease cap, JSON import/export. Second schema change.
- Retiring the old Word template + text preview once you're happy with the new page.
- Copying the computed rent schedule into the ledger's `rent_schedule_periods`.

## 8. Decisions needed from you

1. Approach in section 2 (port the page's renderer; keep the Word template alongside it).
2. The schema change in section 3, including `revision_mode` default `original` for existing leases.
3. The seven defaults in section 4.
4. Deferring Saved versions (section 7).
