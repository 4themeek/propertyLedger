# Project Status: Property Ledger + Lease Builder
_Last updated: 2026-11-12_

## Property Ledger (Next.js 16 app)
- Password-gated site: leases (with integrated Lease Builder), floorplans (Cloudflare R2), income/expenses vs budget.
- Stack: Next.js 16, Drizzle, Neon Postgres, R2. Vercel primary, Cloudflare Workers backup.
- Delivered earlier as a zip with README.md and HANDOFF.md (deployment runbook for Claude Code).
- **Deployment: not yet executed** (Neon project, R2 token, Vercel/Cloudflare deploy are still manual steps in HANDOFF.md).
- **App does NOT yet contain any of the lease changes below.** The app's lease source files were lost when the build container was replaced, so changes are specified in LEASE_UPDATE.md for Claude Code to apply.

## Lease Builder (standalone artifact, source of truth for lease behavior)
- URL: https://claude.ai/artifact/TWdPcUE8ttz53G5SCTYsZB (currently titled "Lease Builder 11.12", version 7)
- Two screens: variable form -> print-ready generated lease. Exports Word (.docx).
- Changes made in the artifact (all documented in LEASE_UPDATE.md):
  1. Electric -> Utilities (annual amount drives math; monthly = annual / 12; columns Annual then Monthly)
  2. Optional second Tenant signer (name + title) and second Guarantor
  3. Early Termination Option clause (default 6 months early, notice window Feb 1 - Mar 1, 2032, effective Aug 31, 2032)
  4. Word (.docx) export
  12. v1.5: new ZIP code field (default 45202) printed after the address line on page 1
  13. v1.6: "Saved versions" drawer - save the current lease, restore/delete/download/import versions, auto-snapshot before restore and before reset (see LEASE_UPDATE.md section 10)
  14. v1.7: proposed revisions from `PROPOSED-CHANGES-9pmNov12.md` added as a "Lease version" switch (Original / Review copy / Clean draft) plus Schedule 1.7-A month-by-month rent schedule (see LEASE_UPDATE.md section 11)
  11. v1.4: address line under the building name no longer shows the suite; Annual Base Rent column shows the full-year pre-credit total on every row of a credited year (struck/lighter)
  10. v1.3: struck-through normal annual amount in the Annual Base Rent column of credit rows; version label "v1.3" added after "2026 lease template" in the header
  9. Rent credits from Landlord (Yes/No; per month x months, or total amount) with "Credit" shown in the Monthly Installment column of the Rent Schedule
  8. Edge Lot parking Yes/No option (paragraph 6.6) with spots (max 2), $85/spot/mo, term (years or match lease), landlord credit; opening line now has a 2" blank for the date
  7. Utilities cap on/off + start/stop years; moving-expense Yes/No (controls 8.2); optional Lobby LED Screen paragraph 10.2; Signatures always on a new page
  6. Layout edits (11.12): Rent Schedule totals row removed; "The Edge Office Building" under the title; Exhibits A-E each start a page; 0.75" margins; "X of N" page footer; header text "2026 lease template"
  5. Numbered Sections I-XXIII and paragraphs 1.1, 1.2 ... (63 numbered paragraphs); clause text expanded from the annotated original (3NOV12-LeaseBuild1.md); new Section XIII Nonliabilities

## Versioning
- The Lease Builder header shows `2026 lease template - vX.Y`. **Current: v1.7.** Increment by 0.1 on every update (v1.4, v1.5 ...) and log it here.

## Not done / not pushed
- App source not updated for items 1-5 above.
- Nothing from this work is pushed to GitHub (`4themeek/property-ledger`): this session has no GitHub access to that repo.

## Files (deliver / commit alongside the repo)
- LEASE_UPDATE.md (sections 1-5 + verify checklist)
- docx-export.ts -> src/lib/docx-export.ts
- ExportDocxButton.tsx -> src/components/ExportDocxButton.tsx
- TODO.md, PROJECT-STATUS.md, RESUME-HERE.md
