# TODO
_Updated 2026-11-12_

## Apply to the app (Claude Code)
- [ ] Apply LEASE_UPDATE.md sections 1-5 to `src/lib/lease-engine.ts` and `src/components/LeaseDocument.tsx`
- [ ] Add `normalizeLeaseData` for old saved leases (electric* keys -> utilities*)
- [ ] Copy `docx-export.ts` (updated version) and `ExportDocxButton.tsx`; wrap the lease in `<div id="lease-document">`
- [ ] Numbered sections / paragraphs with `{{id}}` cross-references (see section 5)
- [ ] `npm run build` (needs `.env.local`); check the default-lease rent table totals: Base $461,753.10, Utilities $23,533.80
- [ ] Commit and push to GitHub `4themeek/property-ledger`

## Deployment (HANDOFF.md)
- [ ] Create Neon project, Cloudflare R2 bucket + token, set env vars
- [ ] Deploy to Vercel (primary) and Cloudflare Workers (backup)
- [ ] Set site password (store only its hash)

## Decisions needed from Danno
- [ ] Section II: confirm Granting Clause (user list skipped II)
- [ ] Utilities cap default: $2.00 (current) or $2.10 (original text)?
- [ ] Security deposit: keep dollar amount variable, or express as "one month's Rent"?
- [ ] Prose still says "electric" in a few places; change to "utilities"?
- [ ] Early-termination lapse sentence is added drafting; keep or remove (counsel)?

## Nice to have
- [ ] Attach `lease-engine.ts` / `LeaseDocument.tsx` to a chat so the app can be edited directly

- [ ] App: port Saved versions (LEASE_UPDATE.md section 10) - server-side lease_snapshots table, Restore with auto-snapshot, JSON import/export.
- [ ] App: port the proposed-revision modes (LEASE_UPDATE.md section 11): revisionMode/revisionSchedule fields, PROPOSED paragraphs, Schedule 1.7-A.
- [ ] Decide the conflicts listed in LEASE_UPDATE.md section 11 (12.3 insurance limits; Exhibit E "Guarantee Period" wording; renewal vs new-lease wording) and fill the [NEGOTIATE]/[CONFIRM] items before signing.
