# Property Ledger — Project Status

Last updated: 2026-09-21

## What this is

A private, password-gated web app for tracking a landlord's property
portfolio: properties → suites → tenants → leases → rent schedules, plus
floorplan and lease-document storage. Single owning entity, single shared
site password (no per-user accounts).

Repo: https://github.com/4themeek/propertyLedger
Local: `C:\2026-Claude\property-ledger`

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Drizzle ORM + Neon Postgres (`drizzle-orm/neon-http`, HTTP-based so it
  works identically on Vercel and Cloudflare Workers)
- Auth: single shared password, PBKDF2 hash + HMAC-signed session cookie,
  both via Web Crypto (`src/lib/auth.ts`) — no external auth library
- File storage: Cloudflare R2 via `aws4fetch` (`src/lib/r2.ts`)
- Deploy target: **both** Vercel (primary) and Cloudflare Workers (backup,
  via `@opennextjs/cloudflare`), sharing the same Neon database

## Features added beyond the original HANDOFF.md scope

Lease creation was all-manual (blank form, rent-schedule rows added one at
a time) — a real problem for leases with many rate-escalation periods like
the sample lease. Added, all verified working end-to-end:

1. **Reusable lease templates** (`/lease-templates`) — save named terms +
   a rent-schedule pattern expressed as relative month offsets (e.g.
   "months 1–3", "months 4–12") since a template has no real commencement
   date yet. Applying a template to a new lease (`/leases/new?templateId=`)
   converts those offsets into real calendar dates via
   `src/lib/dates.ts::periodFromMonthOffsets`, using the lease's actual
   commencement date (leap years handled correctly — verified against a
   2028-02-29 case).
2. **Clone an existing lease** — "Duplicate this lease" on any lease page
   (`/leases/new?cloneFrom=`) copies its terms and rent-schedule rows
   as-is into a new lease; dates aren't shifted automatically, so edit
   them afterward if the new lease starts on a different date.
3. **Bulk rent-schedule generation** — a "Generate a schedule" form on the
   lease detail page creates N periods at once from a starting rent and a
   per-period % escalation (base rent and additional rent escalate
   independently), with an option to replace the existing schedule instead
   of appending.

`/leases/new` now always shows suite + tenant dropdowns (previously
required a `suiteId` in the URL), so it works standalone, from a suite
page, from a clone, or from a template.

## Lease document template

`templates/lease-agreement-template.docx` — the real sample commercial
lease (`C:\2026-Claude\EDGER\4TR-Sample_Lease_2026.docx`, Sky Lofts LLC ↔
EDIS Group LLC), converted into a docxtemplater merge-field template.

The source file turned out to already have unresolved Word tracked
changes — someone had started converting it to a template by redlining
out the landlord/tenant names and addresses, but never accepted the
changes. Those were accepted first (via direct XML string-splicing, not
a full-tree reserialization — that approach was tried first and found to
subtly corrupt namespace declarations and whitespace-preservation
attributes elsewhere in the document; redone safely after catching it).
Every other variable field (dates, term/renewal numbers, suite/sqft,
deposit/parking/moving-expense amounts, signatory names) was then
replaced by hand with `{fieldName}` placeholders, using large
unique-context string anchors to avoid accidentally matching the wrong
occurrence of a common word like "Landlord".

The rent schedule table was converted from a fixed 8-row table into a
single templated row wrapped in a `{#rentRows}...{/rentRows}` loop, so a
lease with any number of rate-escalation periods can be generated — not
just ones matching the sample's exact 8-period structure.

**Verified**, not just visually inspected (no LibreOffice on this
machine to render a preview) — actually rendered through docxtemplater
with sample data including a 3-row rent schedule:
- `office/validate.py` (from the docx skill): structurally valid OOXML
- The rendered output's rent table had exactly 3 rows with correct
  per-row values (proves the loop works, not just that it doesn't crash)
- Zero leftover unfilled `{...}` tokens anywhere in the rendered document

**Now wired into the app.** `/api/leases/[id]/document` generates a real
lease document from a lease's actual data via `docxtemplater` — a
"Generate lease document" button on the lease detail page. A `/landlord-profile`
settings page holds the one landlord entity used on every document; a
"Document details" section on each lease holds the fields the core ledger
doesn't otherwise need (signatory names, guarantor, deposit/parking/moving
amounts, etc.), all optional. Verified against real production data
(lease #2's real rent schedule and tenant): 320,920-byte output, byte-for-byte
identical between a local direct-script run and the live Vercel deployment,
zero leftover `{...}` tokens. See TODO.md for the one known gap (this
specific feature needs a different template-loading approach before it'll
work on the Cloudflare Workers deployment, since Workers has no filesystem).

**Field → data source mapping** (for whoever wires this in):

| Template field(s) | Current data source | Notes |
|---|---|---|
| `landlordName`, `landlordAddressLine1`, `landlordCityStateZip` | none | Single-entity app — could be `.env` config or a new settings table, not per-lease data |
| `tenantName` | `tenants.entityName` | |
| `tenantAddressLine1`, `tenantCityStateZip` | none | `tenants.mailingAddress` is one free-text field today, not split into street/city/state/zip |
| `commencementDate`, `initialTermMonths`, `renewalOptionYears`, `renewalNoticeDays` | `leases.*` | Direct match |
| `renewalOptionCount`, `earlyOccupancyWeeks`, `rentFreeMonths`, `firstRentDueDate`, `expirationDate`, `guaranteePeriodEndDate`, `leaseExecutionMonthYear`, `leaseExecutionYear` | none | Not in schema; some are computable (`expirationDate` from commencement+term), others need new fields |
| `rentableSqft` | `suites.rentableSqft` | |
| `suiteNumber` | `suites.suiteNumber` | |
| `securityDepositMonths`, `securityDepositAmount`, `parkingPaymentAmount`, `parkingSpotCount`, `parkingYears`, `movingExpenseAmount` | none | Deal-specific numbers not currently tracked anywhere |
| `propertyStreetAddress`, `propertyCity`, `propertyState` | `properties.addressStreet/addressCity/addressState` | Direct match |
| `landlordSignatoryName/Title`, `tenantSignatoryName/Title`, `guarantorName` | none | Not in schema |
| `rentRows[].*` | `rentSchedulePeriods` rows for the lease | `leaseYear`/`leaseMonthRange`/`annualBaseRentPerSqft`/`annualBaseRent`/`annualAdditionalRent` are all computable from `periodStart`/`periodEnd`/`monthlyBaseRent`/`monthlyAdditionalRent` + the suite's `rentableSqft` |

Simplifications made versus the original document's exact legal language
(flagged here since they're judgment calls, not neutral transcription):
- Dropped the spelled-out-words duplicate of numeric terms (e.g. "eighty
  seven (87)" → just "{initialTermMonths}") — the source already had an
  internal inconsistency here (words said 87, numeral said 90)
- Standardized the rent-free period to show as a real `$0.00` row in the
  table rather than the source's special-cased "FREE"/"N/A" text
- Assumed "an Ohio limited liability company" and Ohio/Hamilton County
  as the governing jurisdiction throughout — not templated, since the
  app has no per-lease jurisdiction field; fine for Sky Lofts' own
  building, would need manual editing for an out-of-state deal
- Left broker names (Colliers / Elaine Gillespie / Sloane Nichols)
  as literal text — not templated, lower priority

## Current state

- [x] App built from scratch (see `HANDOFF.md` for why — the repo existed
      with only a deployment handoff doc, no code, when this started)
- [x] Pushed to GitHub (`main` branch)
- [x] Neon Postgres database created and schema pushed (`npm run db:push`)
- [x] Site password set, hashed, and verified working end-to-end
- [x] Full CRUD flow smoke-tested locally against the real database:
      property → suite → tenant → lease → rent schedule row, all working
- [ ] Cloudflare R2 bucket + API token — **not set up yet, on hold**
- [ ] File upload (floorplans/lease documents) — untested, blocked on R2
- [x] **Vercel deployment is live**: https://www.skybuilder.pro (project
      `amdg26/property-ledger`). The Neon database was created through
      Vercel's own Storage/Marketplace integration, which auto-injected
      `DATABASE_URL` (and several Postgres variable variants) into the
      Vercel project already — no need to set that one manually.
      `APP_PASSWORD_HASH` and `SESSION_SECRET` were added via
      `vercel env add ... --sensitive`. Login and the full property →
      suite → tenant → lease flow verified working on the live site,
      showing the same data as local (confirms it's the same database).
      R2 vars are not set yet, so file upload will fail there until Phase 4.
      Note: the production alias is `www.skybuilder.pro`, not a
      `property-ledger`-branded domain — confirm with the user whether
      that's intentional.
- [ ] Cloudflare Workers deployment — not started
- [ ] Cross-deployment check (same data visible on both Vercel and
      Workers URLs) — not started

## Data currently in the database

Started as one property ("Sky Lofts", Cincinnati OH) with one suite (204),
one tenant (EDIS Group, LLC), one lease, and one rent schedule row —
mirroring the real example lease in
`C:\2026-Claude\EDGER\4TR-Sample_Lease_2026.docx`, used to validate the
data model during local smoke testing. The user has since added more
(Suite 200, a "Pixel Fiction" tenant/lease) while testing the live site —
since local and production share one Neon database, both sets of data
are visible from either. A "Standard office suite" lease template was
also added (real, meant to be kept) while verifying the template feature;
two disposable test leases created purely to verify the clone/template/
bulk-generate features were deleted afterward via a one-off script.
Confirm with the user whether the original Sky Lofts/EDIS Group entry
should be kept as real data or cleared.

## Bugs found and fixed during setup

1. **`$` in `.env.local` values gets silently truncated.** Next.js expands
   `$NAME`-style references in `.env` files (like `dotenv-expand`). The
   original password hash format (`pbkdf2$100000$<salt>$<hash>`) was
   truncated to just `pbkdf2` at runtime, breaking login with no obvious
   error. Fixed by switching to a delimiter-free hex format in
   `src/lib/auth.ts` (`hashPassword`/`verifyPassword`). Any future secret
   values pasted into `.env.local` should avoid `$` for the same reason.
2. **Eager `DATABASE_URL` check broke Vercel's build.** `src/db/index.ts`
   used to throw at *import* time if `DATABASE_URL` was unset. Vercel's
   build imports every route module just to inspect its config — including
   `/api/files/[id]`, which never runs a query during build — so the build
   failed before secrets were even needed. Fixed by making the Neon client
   lazily initialize on first real use (`db` is now a `Proxy`).

## Next steps (see TODO.md)

Cloudflare R2 setup is next, then Vercel env vars + deploy, then Cloudflare
Workers deploy, then the cross-deployment check.
