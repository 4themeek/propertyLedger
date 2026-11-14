# RESUME HERE
_Updated 2026-11-13_

**State:** Lease Builder v1.7 is in the app.
- Standalone copy: `public/lease-builder/index.html` (served at `/lease-builder/index.html`). Added in PR #1.
- App port (branch `lease-builder-port`): each lease has **Lease terms** (`/leases/[id]/terms`) and
  **Review & Print** (`/leases/[id]/review`) with Original / Review copy / Clean draft, Schedule 1.7-A,
  Print, and Export Word (.docx).
- The lease engine is generated from the standalone page, so the two always match:
  `node scripts/extract-lease-engine.mjs` writes `src/lib/lease-engine-core.js`;
  `node scripts/check-lease-parity.mjs` proves it (6 variants x 3 modes byte-identical + LEASE_UPDATE.md anchors).
- The older Word-template download and text preview (`/api/leases/[id]/document`, `/leases/[id]/preview`) are unchanged.
- How the port was done and why: `docs/lease-builder/PORT-PLAN.md`.

**Next action:**
1. Merge PR #1 (standalone page + docs), then the `lease-builder-port` PR.
2. Open a lease's Lease terms, check every section (unset fields start at the 2026 template's example values,
   e.g. brokers and insurance limits), then Review & Print.
3. Cloudflare backup: `npm run cf:build && npm run cf:deploy` after merging.

**Updating to v1.8 later:** replace `public/lease-builder/index.html`, run the two scripts above, then
`npm run build`. If the extract script reports a patch that no longer matches, adjust it in
`scripts/extract-lease-engine.mjs`. New input fields also need an entry in `LEASE_FIELD_GROUPS`
(`src/lib/lease-engine.ts`) and the `LeaseState` type.

**Versioning rule:** each Lease Builder update bumps the label after "2026 lease template" by 0.1 (current v1.7; next v1.8).

**Open questions:** see TODO.md "Decisions needed".

**Where the truth lives:** `public/lease-builder/index.html` (and the artifact https://claude.ai/artifact/TWdPcUE8ttz53G5SCTYsZB) defines the lease wording, numbering and math.
