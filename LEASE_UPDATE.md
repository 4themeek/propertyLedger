# Lease template update — apply to Property Ledger (for Claude Code)

Paste to Claude Code from the project root:

> Read LEASE_UPDATE.md and apply it to this repo. Mirror the existing patterns in
> `src/lib/lease-engine.ts` and `src/components/LeaseDocument.tsx` exactly (field
> definition shape, helper names, JSX style). Don't touch auth, DB schema, R2 or
> deployment config. When done run `npm run build` (needs `.env.local`) and show me
> the Review & Print output for the default example lease.

These changes already exist in the standalone Lease Builder artifact; this brings the
app's lease module to the same behavior. Only two files need real edits:
`src/lib/lease-engine.ts` and `src/components/LeaseDocument.tsx`. `LeaseForm.tsx`
renders generically from `LEASE_FIELD_GROUPS`, so it should need no change.
No DB migration: leases store their values in the `leases.data` jsonb column.

---

## 1. Electric becomes Utilities, annual amount drives the math

**Rename fields (in `LeaseData`, `LEASE_FIELD_GROUPS`, `LEASE_DEFAULTS`):**

| old key | new key | new meaning / label |
|---|---|---|
| `electricMonthlyYear1` | `utilitiesAnnualYear1` | "Year 1 utilities (annual amount)", default **3000.00** |
| `electricEscalationPct` | `utilitiesEscalationPct` | "Utilities escalation" (default 2.5) |
| `electricCapAnnualPSFYear2` | `utilitiesCapAnnualPSFYear2` | "Utilities cap (from Year 2 on)" (default 2.00, $/RSF/yr) |

Rename the group "Electric (Additional Rent)" to **"Utilities (Additional Rent)"**,
hint: *Modified-gross structure: Tenant pays utilities separately. Enter the Year 1
annual amount — the monthly charge is that amount divided by 12. Later years escalate
but never exceed the cap.* Year 1 utilities is a normal number input (it is the
variable the user edits).

**In `computeLease`** replace the electric block per lease year with:

```ts
const escalatedUtilAnnual = round2(s.utilitiesAnnualYear1 * Math.pow(1 + s.utilitiesEscalationPct / 100, yearNum - 1));
const capUtilAnnual = round2(s.utilitiesCapAnnualPSFYear2 * s.rsf);
const annualUtilRate = yearNum >= 2 && capUtilAnnual > 0 ? Math.min(escalatedUtilAnnual, capUtilAnnual) : escalatedUtilAnnual;
const monthlyUtil = round2(annualUtilRate / 12);
// per row (months = months covered by that row; free-rent row, paid row, or full/partial year):
const annualUtilities = round2(annualUtilRate * months / 12);   // period amount
const monthlyUtilities = monthlyUtil;
```

- Row fields become `annualUtilities` and `monthlyUtilities` (were `annualElectric` /
  `monthlyElectric`); totals field `totalElectric` → `totalUtilities` (sum of
  `annualUtilities`).
- Utilities are NOT abated during free rent: the free-rent row still charges them.
- Fix any other reference to the old names (e.g. the electric-cap note under the table
  uses `utilitiesCapAnnualPSFYear2` now).

**Rent table in `LeaseDocument.tsx`:** columns are now, in order:
`Lease Yr | Months | Rate /RSF | Monthly Base | Annual Base | Annual Utilities | Monthly Utilities`
(Annual first, then Monthly, for utilities only; base columns unchanged). Totals row:
`Initial Term Totals` spanning 4 cols, then total Annual Base, then total Annual
Utilities, then an empty cell.

**Expected result for the default example lease** (RSF 3040, 87 months, 3 free, $20.00 +2.5%/yr):

```
1        1-3    FREE    FREE       $0.00 (abated)   $750.00    $250.00
1        4-12   $20.00  $5,066.67  $45,600.03       $2,250.00  $250.00
2        13-24  $20.50  $5,193.33  $62,319.96       $3,075.00  $256.25
3        25-36  $21.01  $5,322.53  $63,870.36       $3,151.87  $262.66
4        37-48  $21.54  $5,456.80  $65,481.60       $3,230.67  $269.22
5        49-60  $22.08  $5,593.60  $67,123.20       $3,311.44  $275.95
6        61-72  $22.63  $5,732.93  $68,795.16       $3,394.22  $282.85
7        73-84  $23.19  $5,874.80  $70,497.60       $3,479.08  $289.92
8 (Partial) 85-87 $23.77 $6,021.73 $18,065.19       $891.52    $297.17
Totals                               $461,753.10    $23,533.80
```

If the numbers differ, the port is wrong.

**Existing saved leases** hold the old keys in `data`. Add a small normalizer used
wherever a lease's `data` is read into `LeaseData` (the lease detail page, the print
page, and the edit form's initial values):

```ts
export function normalizeLeaseData(raw: Record<string, unknown>): LeaseData {
  const d = { ...LEASE_DEFAULTS, ...raw } as LeaseData;
  if (raw.utilitiesAnnualYear1 === undefined && typeof raw.electricMonthlyYear1 === "number") {
    d.utilitiesAnnualYear1 = round2(raw.electricMonthlyYear1 * 12);
  }
  if (raw.utilitiesEscalationPct === undefined && typeof raw.electricEscalationPct === "number") {
    d.utilitiesEscalationPct = raw.electricEscalationPct;
  }
  if (raw.utilitiesCapAnnualPSFYear2 === undefined && typeof raw.electricCapAnnualPSFYear2 === "number") {
    d.utilitiesCapAnnualPSFYear2 = raw.electricCapAnnualPSFYear2;
  }
  return d;
}
```

---

## 2. New optional fields: second Tenant signer (name + title), second Guarantor

Add to the **Parties** group (type text, default `""`):

- `tenantSigner2Name` — label "Tenant signer #2 (optional)", note "Leave blank for a single Tenant signature block."
- `tenantSigner2Title` — label "Tenant signer #2 title"
- `guarantor2Name` — label "Guarantor #2 (optional)", note "Leave blank for a single Guarantor."

In `LeaseDocument.tsx` (let `t2 = tenantSigner2Name.trim()`, `t2Title = tenantSigner2Title.trim()`,
`t2Full = t2 + (t2Title ? ", " + t2Title : "")`, `g2 = guarantor2Name.trim()`,
`guarantorNames = guarantorName + (g2 ? " and " + g2 : "")`):

- **Tenant signature block:** if `t2`, add a second signature line directly under the
  first: `By: {t2Full}`.
- **Tenant notary line:** `... by {tenantSignerName}, {tenantSignerTitle}` + (t2 ? `, and {t2Full}` : ``) + `, on behalf of {tenantName}.`
- **Miscellaneous** (last sentence): single guarantor → unchanged
  (`{guarantorName}, as principal member of Tenant, shall execute the Performance Guaranty attached as Exhibit E.`);
  with `g2` → `{guarantorNames}, as guarantors of Tenant, shall each execute the Performance Guaranty attached as Exhibit E.`
- **Exhibit E opening:** single → `the undersigned Guarantor, {guarantorName}, guarantees Tenant's obligations ...`;
  with `g2` → `the undersigned Guarantors, {guarantorNames}, jointly and severally guarantee Tenant's obligations ...`
- **Exhibit E signature:** if `g2`, add a second `Guarantor` signature block for `{g2}`.

---

## 3. New clause: Early Termination Option

**New fields** in the **Term & Key Dates** group:

- `earlyTermMonths` (int) — label "Early termination option", suffix "months early", default **6**, note "Set to 0 to omit the clause."
- `earlyTermNoticeStart` (date) — "Early-termination notice window opens", default **2032-02-01**
- `earlyTermNoticeEnd` (date) — "Early-termination notice window closes", default **2032-03-01**

**In `computeLease`:**

```ts
// last day of the month that is N months before the natural expiration
const earlyTermEffective = expiration && s.earlyTermMonths > 0
  ? addDays(addMonths(addDays(expiration, 1), -s.earlyTermMonths), -1)
  : null;
```

With the default lease (expires 2033-02-28) this is **August 31, 2032**.

**In `LeaseDocument.tsx`**, render directly after the "Lease Renewal" paragraph and before
"Monthly Installment of Base Rent", only when `earlyTermMonths > 0` and both dates are set:

> **Early Termination Option:** Upon written notice from Tenant delivered to Landlord on or
> after {earlyTermNoticeStart} and on or before {earlyTermNoticeEnd}, this Lease may
> terminate {wordsInt(earlyTermMonths) lowercased} ({earlyTermMonths}) months prior to the
> scheduled expiration of the Initial Term, effective {earlyTermEffective}, with no
> termination fee, penalty or other charge payable by Tenant, provided that all Rent,
> utilities and other Additional Rent due under this Lease through the effective
> termination date have been paid in full. If Tenant does not deliver such notice within
> that period, this option lapses and the Lease continues through the scheduled expiration
> date.

Dates use the existing `fmtDate`. Note: the last sentence (lapse) is added drafting, not
something the user dictated — keep it, but it is the first thing to remove if counsel objects.

---

---

## 4. Export the lease as a Word file (.docx)

Two new files ship with this document — copy them in as-is:

- `docx-export.ts` → `src/lib/docx-export.ts` (dependency-free; builds a real .docx in the
  browser: headings, justified paragraphs, the rent schedule as a native Word table,
  signature lines, page breaks, "Page N" footer. Already type-checked under `--strict`.)
- `ExportDocxButton.tsx` → `src/components/ExportDocxButton.tsx`

Wire-up:

1. Wrap the rendered `<LeaseDocument />` in an element with a stable id, e.g.
   `<div id="lease-document">…</div>` (do it where the page renders it, so the preview tab,
   the lease detail page and the print page all work).
2. Render `<ExportDocxButton targetId="lease-document" filename={`Lease - ${tenantName} - Suite ${suiteNumber}`} className={…same as PrintButton…} />`
   next to the existing Print button on the **Review & Print** tab and on the print page.
3. **The exporter reads the rendered DOM, so `LeaseDocument.tsx` must carry these markers**
   (add them next to whatever Tailwind classes already exist; do not change the look):
   - title: an `<h2>`; every section heading: an `<h3>` (add class `pagebreak` on the ones that
     start a new page: Miscellaneous, Signatures, Exhibit A, Exhibit E)
   - subtitle under the title: `<p className="docsub">`; small print / notes: `<p className="small">`
   - inline lead-ins like "Landlord:" stay as `<h4>` (or `<strong>`) inside the `<p>`
   - rent schedule: a real `<table>` with `<caption>`, a header row of `<th>`, and the totals
     row `<tr className="totalsrow">`
   - signature blocks: `<div className="sig">` containing the name `<p>`, an empty
     `<div className="sigline" />`, and the caption `<p>`
4. No server work, no new npm packages, nothing to deploy differently (works on Vercel and Cloudflare).

Verify: click Export on the default example lease, open the .docx in Word/LibreOffice —
expect ~9 letter pages, the rent table with the Annual/Monthly Utilities columns, the
"Early Termination Option" paragraph, and signature lines. Word's native format is .docx
(the old .doc binary format is not produced).

## 5. Numbered Sections (I-XXIII) and decimal paragraphs (1.1, 1.2 ...)

The generated lease now has Roman-numeral Section headings and every paragraph is numbered
`<section>.<n>`. Port this to `LeaseDocument.tsx` (and the .docx export keeps working: it keys on `h3` / `p` / `strong`).

**Section order and titles** (heading text is `Section <Roman> — <Title>`; `h3.sec`):

I Basic Lease Provisions · II Granting Clause · III Occupancy and Acceptance of Premises · IV Rent ·
V Common Area · VI Use and Care of Premises · VII Maintenance and Repair of Premises · VIII Alterations ·
IX Right of Access · X Signs, Storefronts · XI Utilities · XII Indemnity and Public Liability Insurance ·
XIII Nonliabilities for Certain Damages (new) · XIV Damages by Casualty · XV Eminent Domain ·
XVI Assignment and Subletting · XVII Taxes and Insurance · XVIII Default by Tenant and Remedies ·
XIX Holdover · XX Landlord's Rights Upon Termination · XXI Hazardous Waste Clause ·
XXII LEED Requirements for Tenant Premises · XXIII Miscellaneous (starts a new page).
Signatures and Exhibits A-E are unnumbered headings, as before.

**Mechanics** (copy from the artifact's `renderDocument`): a running `secNo` / `paraNo`; `SEC(title, pagebreak?)` bumps
`secNo`, resets `paraNo`, emits the heading; `P(id, label, text)` bumps `paraNo`, emits
`<p><strong className="pn">{sec}.{n}</strong> <strong>{label}</strong> {text}</p>`; `ITEM(mark, text, level)` emits an
unnumbered `(a)` / `(i)` / bullet sub-item as `<p className="item">` (level 2 adds `item2`).
Cross-references are resolved by id, never hard-coded: register `ids[id] = "N.n"` in `P`, write `{{id}}` in text, and
replace all `{{id}}` tokens after the whole body is built. Ids used: landlord, tenant, permitted, term, renewal, leaseyear,
rent, demised, earlyterm, firstpay, monthly, default.

Default-lease anchors to verify: rent schedule is **1.7** (table caption "Section 1.7 - Rent Schedule"), Demised Premises
**1.8**, Early Termination Option **1.9**, Granting Clause **2.1** (refers to 1.8 and 1.4), Payment of Rent **4.1** (refers to 1.1 and the
rent schedule), Miscellaneous runs **23.1-23.9**; 63 numbered paragraphs in total.

**Extra markup the exporter now understands:** `p.center`, `p.item`, `p.item2` (hanging indents). Use the updated
`docx-export.ts` delivered with this file (replace the earlier copy).

**Clause text now fuller** (taken from the annotated original): Lease Year definition (1.6), full electric true-up note under the
rent table, Security Deposit (4.4), Common Area (5.x), Maintenance (7.x), indemnities by both parties (12.1-12.3), Nonliabilities (13.1),
Casualty (14.x), Eminent Domain, Assignment, Default with the four events and three remedies (18.x), Holdover, Termination,
three-part Hazardous Waste (21.x), LEED (a)-(c) with the water-use list, and the nine Miscellaneous paragraphs. Variables are
wired in exactly as before (term, dates, deposit, insurance limits, late interest and grace days, cure days, parking and moving
allowances, brokers, guarantors, state). Source the wording from the artifact (`renderDocument`) rather than retyping.

**Two judgment calls to confirm:** (1) Section II is the Granting Clause (your list skipped II). (2) The utilities cap stays the
`utilitiesCapAnnualPSFYear2` variable (default $2.00); your original text said $2.10 - change the default if $2.10 is intended.

Verify: Review & Print shows 23 numbered sections and 63 numbered paragraphs; no `__` in any cross-reference; the exported .docx
shows the same numbering (about 19 letter pages for the default lease).

## 6. Layout edits (2026-11-12)

Apply to `LeaseDocument.tsx`, the print stylesheet and the updated `docx-export.ts`:

1. **Rent Schedule (1.7):** remove the "Initial Term Totals" row. The table ends after the last lease-year row. (The `totalBase` /
   `totalUtilities` values may stay in `computeLease`; just don't render them. The expected-result totals in section 1 no longer appear on the page.)
2. **Title block:** directly under `COMMERCIAL LEASE` add `<p className="bldgtitle">The Edge Office Building</p>` at 60% of the title size
   (title 22px -> 13.2px; bold, centered). The suite/address subtitle stays below it. In the Word export it is 9.5pt bold (title 16pt).
   Make the building name a field if it should vary per property (the artifact hard-codes it).
3. **Exhibits A-E each start a new page:** class `pagebreak` on the `h3` of Exhibits A, B, C, D and E (B, C and D were missing it).
4. **Margins 0.75" on all four sides:** `@page { size: Letter; margin: 0.75in; }` for print, 72px padding on the on-screen sheet, and in the
   .docx `w:pgMar` top/right/bottom/left = 1080 (header/footer 540).
5. **Page counter "1 of N" in the footer of every page:** print uses
   `@page { @bottom-center { content: counter(page) " of " counter(pages); } }`; the .docx footer uses PAGE and NUMPAGES fields
   (shipped in the updated `docx-export.ts`; Word may need F9 / print preview to refresh the total).
6. Page title text "4TR office lease template" -> "2026 lease template" (header subtitle). Also title the page "Lease Builder <MM.DD>" if wanted.

Verified on the default lease: 24 printed pages / 20 Word pages; every Exhibit starts at the top of a page; footers read "1 of 24" / "3 of 20".

## 7. Optional clauses and the utilities-cap switch (2026-11-12)

New fields (add to `LeaseData`, `LEASE_FIELD_GROUPS`, `LEASE_DEFAULTS`; `LeaseForm` needs boolean, select and textarea field types if it lacks them):

| key | type | default | notes |
|---|---|---|---|
| `utilitiesCapEnabled` | boolean (checkbox, placed directly before the cap field) | true | unchecked = no cap; cap amount and years are disabled/greyed |
| `utilitiesCapStartYear` | int | 2 | first Lease Year the cap applies |
| `utilitiesCapEndYear` | int | 2 | last Lease Year; 0 = through end of term |
| `movingExpenseProvided` | select yes/no | yes | in "Deposits & Landlord Concessions"; "no" hides the amount field |
| `movingAllowancePSF` | existing | 2.00 | relabel "Moving expense amount"; shown only when provided = yes |
| `ledScreenOption` | select yes/no | no | new "Signage Options (Section X)" group |
| `ledScreenTerms` | textarea | starter language (see artifact) | shown only when option = yes; printed verbatim as paragraph 10.2 |

**Engine (`computeLease`):** cap applies to a lease year only if `utilitiesCapEnabled && capUtilAnnual > 0 && yearNum >= start && yearNum <= (end > 0 ? max(start, end) : Infinity)`.
Default lease table is unchanged (the cap never binds at default values).

**Document:**
- Utilities note under the rent table: if the cap is on, keep the proviso with the years spelled from the settings
  (start = end -> "during the second year (i.e., months 13-24)"; otherwise "during Lease Years 3 through 5 (i.e., months 25-60)"; months = (start-1)*12+1 to min(end*12, term months)).
  If off, drop the proviso: `...(the "Annual Electric Usage Calculation"). If the Annual Electric Usage Calculation shows ...`
- **8.2** (moving expense paragraph) renders only when `movingExpenseProvided !== "no"`.
- **10.2 "Special Lobby LED Screen Advertising:"** renders only when `ledScreenOption === "yes"`, body = `ledScreenTerms` (whitespace collapsed; "[Terms to be specified.]" if blank).
- Because paragraph numbers are generated, later numbers and cross-references adjust on their own.
- **Signatures start on a new page:** `h3` with class `pagebreak` (already true; on screen the artifact now shows a dashed "page break" marker above every page-break heading via a `screen`-only `::before`).

Judgment call: the cap years default to 2-2 so the text matches your original lease wording ("the second year, months 13-24"). Previously the engine capped year 2 onward; set the end year to 0 to restore that.

## 8. Edge Lot parking option (paragraph 6.6) and the blank date line (2026-11-12)

**Parking.** Replaces the old one-time "parking allowance" paragraph. In the form, add a group **"On-Site Edge Lot Parking (Paragraph 6.6)"** directly after the Utilities group
(and remove `parkingSpaces`, `parkingYears`, `parkingMonthlyRatePerSpace` from "Deposits & Landlord Concessions"; the same keys are reused):

| key | type | default | notes |
|---|---|---|---|
| `parkingIncluded` | select yes/no | yes | "Edge Lot parking included?"; "no" hides every field below |
| `parkingSpaces` | select 1 / 2 | 2 | maximum 2 (clamp to 1-2 in the engine too) |
| `parkingMonthlyRatePerSpace` | number $ | 85.00 | monthly cost per spot, editable |
| `parkingTermMode` | select years / lease | years | "A set number of years" or "Match the lease term" |
| `parkingYears` | int | 3 | shown only when mode = years |
| `parkingCredit` | number $ | 6120.00 | one-time payment from Landlord to Tenant, offset against the parking charges. Show a live note: "Total Edge Lot parking cost over the term: $X" = spots x rate x months (months = years x 12, or the initial term months when matching the lease) |

Remove `parkingAllowanceTotal`; `computeLease` now exposes `parkingSpots`, `parkingMonths`, `parkingTotalCost`.
The show/hide helper must support two conditions (`parkingIncluded=yes` AND `parkingTermMode=years`).

**Paragraph 6.6 (Section VI) text**
- No: "Parking: No on-site parking at the Edge parking lot is included in this Lease. All parking for Tenant, its employees and invitees shall be arranged and paid for by Tenant."
- Yes: "Parking: Landlord shall make available to Tenant {two (2)} parking space(s) in the Building's on-site Edge parking lot (the "Edge Lot") for {a term of three (3) years commencing on the Commencement Date | the Initial Term of this Lease}. Tenant shall pay Landlord {$85.00} per space per month ({$170.00} per month in total), payable monthly together with the Rent. [if credit > 0: Landlord shall pay Tenant a one-time parking credit in the sum of {moneyWords(credit)} (the "Parking Credit") as an offset against the Edge Lot parking charges payable under this paragraph.] All other parking for Tenant and its employees shall be paid for by Tenant. Tenant shall be responsible for any additional parking."

**Opening line.** `THIS LEASE is entered into on ______, by and between ...`: the date/month/year text is gone. Render the blank as
`<span className="blank2">` containing 26 underscores: `display:inline-block; width:2in; overflow:hidden; white-space:nowrap; vertical-align:bottom; border-bottom:1px solid; color:transparent`
(on screen it is exactly 2 inches; in the .docx the 26 underscores come out at about 2 inches in Times New Roman 11pt, so no exporter change is needed).
`executionDate` is still used by the notary and Exhibit E year fields.

## 9. Rent credits from Landlord (paragraph 1.7 Rent Schedule) (2026-11-12)

New fields in the **Base Rent** group (show/hide as noted; helper must support `&` for two conditions):

| key | type | default | shown when |
|---|---|---|---|
| `rentCreditProvided` | select yes/no | no | always ("Rent credits from Landlord?") |
| `rentCreditMode` | select monthly / total | monthly | provided = yes |
| `rentCreditPerMonth` | number $ | 1000.00 | provided = yes and mode = monthly (never more than that month's installment) |
| `rentCreditMonths` | int | 3 | provided = yes and mode = monthly |
| `rentCreditTotal` | number $ | 10000.00 | provided = yes and mode = total |

**Engine - rebuild the rent schedule month by month** (replaces the per-year free-rent/paid split; output for the default lease must stay identical to section 1's expected table):
1. For each lease year compute `rate`, `monthlyBase`, utilities exactly as before (utilities are never reduced by credits).
2. For each month: free-rent months (year 1, first `freeRentMonths`) are `free`. Every later month is a "rent month" (counted from the first installment due).
   - monthly mode: if rentMonthIdx < `rentCreditMonths`, `applied = min(rentCreditPerMonth, monthlyBase)`.
   - total mode: `applied = min(poolLeft, monthlyBase)`; `poolLeft -= applied` (credit is used up month by month, spanning lease years if needed).
   - `net = monthlyBase - applied`; kind = `normal` (applied = 0), `credit` (net = 0) or `partial` (0 < net < monthlyBase).
3. Group consecutive months with the same kind and net into one table row (single-month rows show just the month number, e.g. "6"). Row values:
   - `free`: rate "FREE", monthly "FREE", annual "$0.00 (abated)"
   - `credit`: rate shown normally, **monthly installment column = "CREDIT"**, annual "$0.00 (credited)"
   - `partial`: monthly = "CREDIT ($X net due)", annual = net x months
   - `normal`: as before
   - utilities columns for every row: annualUtilities = annualUtilRate x months / 12, monthlyUtilities = annualUtilRate / 12 (unchanged by credits)

**Document:** when `rentCreditProvided = yes`, add an unnumbered note directly under the Rent Schedule (before the "*Additional Rent" note):
"**Rent Credit:** Landlord shall provide Tenant a rent credit {in the total amount of $X (the "Rent Credit"), which shall be applied against each monthly installment of Base Rent, beginning with the first installment due, until the Rent Credit is exhausted. | of up to $X per month for N months (the "Rent Credit"), applied against each monthly installment of Base Rent, beginning with the first installment due.} Months in which the Rent Credit fully offsets the monthly installment are shown as "Credit" in the Rent Schedule above, and a month only partly offset shows "Credit" with the net amount due. The Rent Credit applies to Base Rent only; Monthly Utilities and other Additional Rent are not reduced."

**Struck-through normal rent (added later the same day):** in every `credit` and `partial` row, under the "CREDIT" text in the Monthly Installment cell, show the
normal installment that would have been due without the credit (e.g. `$5,066.67`) in a lighter, smaller font with a strike-through:
`<br/><span className="strike">$5,066.67</span>` (CSS: `text-decoration: line-through; color: <faint ink>; font-weight: 400; font-size: .9em`).
Row data gets a `strike` field (= `money(monthlyBase)`) for those two kinds only. The updated `docx-export.ts` renders it in Word
(main text, a line break, then a struck-through grey run), so recopy that file.

**Annual column - yearly pre-credit total (replaces the v1.3 per-row figure; v1.4):** in any Lease Year in which a Rent Credit applies, **every row of that year**
shows, under its Annual Base Rent amount, the total Base Rent for the whole Lease Year before the credit
(`monthlyBase x (months in the year - free-rent months)`, e.g. `$45,600.03` for year 1 of the default lease).
It is struck through and lighter on `credit` / `partial` rows and lighter without strike-through on the other rows of that year (`.faint`, same style as `.strike` minus the line).
Row data gets `annualPre` and `annualPreStruck`; years with no credit show nothing extra. The Rent Credit note adds a sentence explaining the lighter figure.
The updated `docx-export.ts` handles both `.strike` and `.faint` cell spans.

**Address line (v1.4):** the subtitle under "The Edge Office Building" is now just `{buildingAddress}, {city}, {state}` (the suite number was removed).

**ZIP on the address line (v1.5):** new text field `buildingZip` (label "ZIP code", default `45202`, in the Premises group after State). The subtitle under the building name is
`{buildingAddress}, {city}, {state} {buildingZip}` (ZIP omitted if blank).

**Version label (now v1.7):** the builder header reads `2026 lease template - v1.7` (the app's lease module should show the same label beside its lease-template name).
Bump by 0.1 with every update (next is v1.8). Record each bump in PROJECT-STATUS.md.

Check: default lease + total credit $12,000 gives rows `1 | 1-3 | FREE ...`, `1 | 4-5 | CREDIT | $0.00 (credited)`, `1 | 6 | CREDIT ($3,200.01 net due) | $3,200.01`, `1 | 7-12 | $5,066.67 ...`.
Credit starts after the free-rent months. Any credit left over when the term ends simply goes unused.

## 10. Saved versions (snapshot / revert) (v1.6, 2026-11-12)

Lets the user save the lease as built and go back to it if later edits go wrong. No effect on the lease text, rent table, print or Word export.

**Behavior**
- Header button "Saved versions" opens a right-side drawer. A name box (prefilled "Lease vX.Y - <date time>") plus "Save this version".
- Each saved version lists name, time, template version, and a one-line summary (tenant, suite, RSF, $/RSF). Actions: Restore, Download (.json), Delete. Restore and Delete need a second click (button turns "Click again to ...", disarms after 4 s). No `confirm()`/`alert()`.
- Restoring first saves the current lease as "Auto: before restoring <name>" (dashed card), so a restore can be undone. "Reset to example" also saves "Auto: before reset to example" before clearing.
- "Download all" exports every version to one `.json`; "Import from file" reads a single-version or all-versions file (invalid files are rejected with a message). Imported versions are added, never overwrite.
- Cap 30 versions; oldest Auto entries are dropped first.

**Data**
- localStorage key `leaseBuilder.snapshots.v1` = array of `{id, name, savedAt (ISO), version ("v1.6"), auto (bool), state}`. `state` is the same flat object as `leaseBuilder.v1`.
- Single-file format: `{kind:"lease-builder-snapshot", name, savedAt, version, state}`. All-file format: `{kind:"lease-builder-snapshots", snapshots:[...]}`.
- Restore does `state = Object.assign({}, DEFAULTS, snap.state)`, so versions saved before a field existed load with that field at its default.

**For the app (Property Ledger)**: store snapshots server-side instead of localStorage. Suggested table `lease_snapshots(id uuid pk, lease_id fk, name text, created_at timestamptz, template_version text, is_auto bool, state jsonb)`; Restore = copy `state` back into the lease row after inserting an auto snapshot of the current row. Keep the same two-click confirm, the 30-per-lease cap, and the JSON export/import format above.

## 11. Proposed revisions: Original / Review copy / Clean draft (v1.7, 2026-11-12)

Source: `PROPOSED-CHANGES-9pmNov12.md` (landlord-proposed language; a copy of the file is in this folder). Every PROPOSED paragraph in it is implemented verbatim, with the deal values filled in from the form. Nothing was reworded.

**New field `revisionMode`** (default `review`): `original` | `review` | `clean`.
- `original`: the lease exactly as before (output is byte-identical to v1.6; this is the revert).
- `review`: the original clauses stay, and a bold, labeled "PROPOSED ..." paragraph follows each one (left rule on screen). Banner at the top: "LEASE REVISION REVIEW COPY - LANDLORD PROPOSED LANGUAGE" plus the not-agreed warning, copied from the source file.
- `clean`: proposed text merged in. Additions, clarifications and limitations become plain paragraphs after the clause; REPLACEMENT items remove the old text (1.9, the electric reconciliation sentences in 1.7, 19.1, 23.1, the Exhibit E guaranty-period paragraph). Banner says the draft is not signable as-is.
- **New field `revisionSchedule`** (default `yes`): attach Schedule 1.7-A in review/clean.

**Where each proposal sits** (section numbers come from the numbering engine, not hard-coded; labels use `{{id}}` tokens): 1.4 early access; 1.5 renewal; 1.7 schedule correction (after the 1.7 intro, before the table); 1.7 electric reconciliation (replaces the reconciliation sentences only: the intro and the closing "Landlord shall be responsible for payment of all other expenses..." sentence stay); 1.8; 1.9 (replacement); 3.2; 4.4; 7.1; 7.2; 8.1; 9.1; 10.1; 12.3; 16.1; 18.1; 18.2; 19.1 (replacement); 20.1; 21.2; 21.3; 22.1; 23.1 (replacement); 23.3; 23.5; 23.9; Exhibit E guaranty period (replacement); completion requirement (end of Exhibit E).

**4.4 Security Deposit**: in review and clean modes the opening sentences ("Tenant shall pay to Landlord upon the Commencement Date a deposit...") are replaced by the source file's "Landlord acknowledges that it currently holds ... under the Original Lease" language (bold in review mode), then the rest of 4.4 continues unchanged, followed by the proposed addition. In original mode 4.4 is untouched.

**Values filled from the form** (the source file hard-codes them): early-access date (`earlyOccupancy`), first rent due date, security deposit, Rent Credit total (`rentCreditTotal`, or the applied total for per-month mode), term months, RSF, utilities cap per RSF and the cap's Lease Years (cap clause drops out if the cap is off), early-termination notice window, effective date and expiration date (1.9 only if the early-termination option is on), guaranty end date. Ids added to P(): accept, deposit, lmaint, tmaint, lwork, laccess, tsigns, tindem, lindem, publiab, assign, remedies, holdover, surrender, haz2, haz3, leed, notice, delays, snda, guarantee (default, term, renewal, rent, demised, earlyterm already existed).

**1.7 correction sentence about inconsistencies**: it is only printed when the rent table has a row covering part of a Lease Year (credit or free-rent split rows), and its example ("a Year 2 row that lists $260.52 as Annual Utilities") is read from the real table. Cause: in a split row the "Annual Utilities" column shows only that row's share of the year.

**Schedule 1.7-A** (`renderMonthlySchedule`, new `c.months` array from `computeModel`): one line per month with Lease Month, installment due date, Scheduled Base Rent, Credit/Abatement Applied, Net Base Rent Due, Electricity; Lease Year totals and an Initial Term total (`totalsrow` class, supported by the docx exporter). Every row satisfies scheduled - credit = net, and each year total is the sum of its months. Free-rent months show the scheduled amount as "(abated)". Monthly electricity is annual/12 rounded to cents, so a year's twelve months can differ from the annual figure by a few cents (Year 1 example: $3,050.04 vs $3,050.00).

**Safety copy and revert**: the first time v1.7 opens in a browser that has a saved lease, it stores "Auto: lease before the proposed revisions (v1.6)" in Saved versions (with `revisionMode: "original"`). Snapshots saved before v1.7 have no `revisionMode`, and Restore treats that as `original`. The Word file name now ends with "- Original", "- Proposed (review copy)" or "- Proposed (clean)".

**For the app**: add `revisionMode` and `revisionSchedule` to the lease row (enum + enum), port the PL/PB proposal strings and `PROPL()` helper into the template renderer, add the `{{id}}` ids listed above, `c.months` plus `renderMonthlySchedule`, and the `.prop`, `.banner`, `table.ledger` styles. Keep Original mode output identical to the pre-change renderer (the builder was checked by comparing HTML for four lease variants).

**Open items flagged by the proposed text** (still bracketed in the output): 1.5 renewal rent floor and concessions; 1.7 approved replacement schedule; 1.7 electric (Year 1 reconciliation, cap scope, denominator and meter coverage); 1.9 early-termination fee and deadline; 8.1 delay remedies; 12.3 insurance limits; 16.1 profit sharing; 19.1 holdover tier; Exhibit E cap/burn-off; completion blanks.

**Conflicts the merge creates (not resolved, for the user to decide)**
1. 12.3: the original limits ($500K / $2M / $200K, from the insurance fields) and the proposed $1M / $2M both appear in the clean draft.
2. Exhibit E: after the guaranty-period paragraph is replaced, the following paragraphs still say "during the Guarantee Period", a term the replacement does not define.
3. 1.4 / 4.4 / 1.5 assume a renewal of an existing lease ("Original Lease", deposit already held) while the rest of the lease reads as a new lease.

## Verify

1. `npm run build` passes (TypeScript: no leftover `electric*` references — `grep -ri electric src` should only hit prose in the lease clauses).
2. Create a lease with defaults; the rent table matches the expected result above.
3. Review & Print shows the Early Termination Option paragraph with "effective August 31, 2032".
4. Set Tenant signer #2 and Guarantor #2: extra signature lines and the "guarantors / jointly and severally" wording appear; clear them: wording reverts.
5. Open a lease saved *before* this change: it loads without errors and its utilities show monthly×12 as the annual figure.
6. Set `earlyTermMonths` to 0: the clause disappears.
8. Revisions: with Original selected the lease has no PROPOSED text; Review copy shows PROPOSED paragraphs under each clause; Clean draft shows no replaced text (grep for "with no termination fee" and "shall cease upon expiration of the Guarantee Period": both absent). Schedule 1.7-A totals: scheduled - credit = net.
7. Saved versions: save, change a field, Restore (field returns; an "Auto" version appears), Restore the Auto one (change returns), Download then Import a file, Delete.

Prose clauses that still say "electric" (the cap note under the rent table, the Utilities
section, "excluding electric" in the Base Rent paragraph) were left as written on purpose;
change them to "utilities" only if the user asks.
