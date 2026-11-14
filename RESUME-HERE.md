# RESUME HERE
_Updated 2026-11-12_

**State:** The Lease Builder artifact is current (v1.7, "Lease Builder 11.12"). A standalone copy of v1.7 is in this repo at `public/lease-builder/index.html` (served at `/lease-builder/index.html` after deploy). The app's own Lease Builder (`LeaseForm.tsx`, `LeaseDocument.tsx`, `lease-engine.ts`) is NOT yet updated.

**Next action (pick one):**
1. In Claude Code, at the repo root, paste:
   > Read LEASE_UPDATE.md and apply it to this repo. Mirror the existing patterns in `src/lib/lease-engine.ts` and `src/components/LeaseDocument.tsx` exactly. Don't touch auth, DB schema, R2 or deployment config. Run `npm run build` and show me the Review & Print output for the default lease.
   LEASE_UPDATE.md is at the repo root; the reference exporter files are `docs/lease-builder/docx-export.ts.txt` and `ExportDocxButton.tsx.txt` (rename to `src/lib/docx-export.ts` and `src/components/ExportDocxButton.tsx` when wiring them in).
2. Or attach `src/lib/lease-engine.ts` and `src/components/LeaseDocument.tsx` (and `LeaseForm.tsx`) to a Claude chat and ask for the edits directly.

**Then:** continue deployment from HANDOFF.md.

**Versioning rule:** each Lease Builder update bumps the header label after "2026 lease template" by 0.1 (current v1.7; next v1.8).

**Open questions:** see TODO.md "Decisions needed".

**Where the truth lives:** the artifact https://claude.ai/artifact/TWdPcUE8ttz53G5SCTYsZB defines the lease wording, numbering and math; LEASE_UPDATE.md describes how to port it.
