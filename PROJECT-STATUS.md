# Project Status: Lease Builder
_Last updated: 2026-11-13_

The app's overall status (stack, deployment, database, bugs fixed) is in **PROJECT_STATUS.md**.
This file tracks the Lease Builder only.

## Done
- **v1.7 standalone page** in the repo at `public/lease-builder/index.html` (PR #1 on `4themeek/propertyLedger`).
- **v1.7 in the app** (branch `lease-builder-port`):
  - Schema: `leases.lease_terms` (jsonb), `leases.revision_mode` (default `original`), `leases.revision_schedule` (default `yes`). Applied to Neon with `db:push` on 2026-11-13.
  - Engine: `src/lib/lease-engine-core.js`, generated from the page by `scripts/extract-lease-engine.mjs`; typed wrapper, field groups and `normalizeLeaseData` in `src/lib/lease-engine.ts`; per-lease state from DB rows in `src/lib/lease-state.ts`.
  - Pages: `/leases/[id]/terms` (Lease terms form) and `/leases/[id]/review` (Review & Print, revision modes, Schedule 1.7-A, Print, Export Word).
  - Word export: `src/lib/docx-export.ts` + `src/components/ExportDocxButton.tsx`.
  - Verified: `scripts/check-lease-parity.mjs` all pass (page vs app byte-identical for 6 variants x 3 modes; default rent table and totals $461,753.10 / $23,533.80; 1.7 / 1.8 / 1.9 anchors; 63 paragraphs; 23 sections; Early Termination effective August 31, 2032; Clean draft drops replaced text; Schedule 1.7-A balances). The 3 leases in the database render in all modes. `npm run build` passes.
- LEASE_UPDATE.md sections 1-9 and 11 are covered by the generated engine (sections 1-5 changes, layout, optional clauses, parking, rent credits, proposed revisions).

## App-specific differences from the standalone page
- Landlord, tenant, property and suite details come from their records (read-only on Lease terms).
- Building name on page 1 = the property's name; landlord signer title = landlord profile title; Exhibit D = the lease's tenant-improvement details (one item per line). Each falls back to the page's text when blank.
- The lease document's rent schedule is computed from $/RSF; the ledger's rent schedule rows are separate and unchanged.

## Not done
- LEASE_UPDATE.md section 10 (Saved versions): needs a `lease_snapshots` table. Deferred.
- Retiring the older Word-template download / text preview: not decided.
- Review & Print was checked with the app's compiled CSS and Word exporter outside the password gate, not yet by signing in to the deployed app.

## Versioning
- `2026 lease template - vX.Y`. **Current: v1.7.** Increment by 0.1 on every update and log it here.

## Version log
- v1.3-v1.7: see LEASE_UPDATE.md sections 9-11.
- v1.7 ported into the app: 2026-11-13.
