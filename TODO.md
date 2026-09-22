# Property Ledger — TODO

Tracks what's left to finish the HANDOFF.md deployment phases. See
`PROJECT_STATUS.md` for the fuller picture of what's already working.

## Lease document generation — DONE

Wired up end-to-end: `/api/leases/[id]/document` (GET, auth-gated like
everything else) generates the lease agreement `.docx` from a lease's real
data and streams it back as a download. "Generate lease document" button
on the lease detail page; works at any point during editing since every
template field defaults to an empty string rather than being undefined —
this doubles as a live preview (generate anytime, blanks show up blank).

What was added:
- `landlordProfile` table + `/landlord-profile` settings page (singleton —
  one landlord entity for the whole app, used on every generated document)
- `tenants.mailingAddress` replaced with `addressLine1` + `cityStateZip`
  (split to match the template's two-line address format)
- New document-only fields on `leases` (renewal option count, early
  occupancy weeks, rent-free months, first rent due date, lease execution
  date, guarantee period end date, security deposit/parking/moving-expense
  amounts, tenant signatory name/title, guarantor name) — editable via a
  "Document details" section on the lease detail page, all optional
- `src/lib/lease-document.ts` — maps a lease + suite + tenant + property +
  landlord profile + rent schedule rows into the template's field names;
  rent-table rows (lease year, month range, annual figures) are computed
  from `rentSchedulePeriods` + the suite's `rentableSqft`, not stored
  separately
- `docxtemplater` + `pizzip` as app dependencies; template file read via
  `fs.readFileSync` from `templates/`, with `outputFileTracingIncludes` in
  `next.config.js` so Vercel's build bundles it into the serverless function

Verified locally against the real database (lease #2, real rent schedule
rows) via a direct Node script — zero leftover `{...}` tokens, correct
computed values, matches the earlier docxtemplater test.

**Known gap**: `fs.readFileSync` for the template works on Vercel's
Node.js runtime, but Cloudflare Workers has no filesystem — this feature
specifically will need a different approach (e.g. fetch the template from
its own deployed URL, or embed it as a bundled asset) before it'll work on
the Cloudflare Workers deployment. Not yet an issue since Workers deploy
hasn't happened yet (blocked on R2 below), but flag it when that phase
starts.

## Blocked on the user (dashboard actions)

- [ ] **Cloudflare R2** (on hold, user asked to come back to this later)
  - [ ] Enable R2 in the Cloudflare dashboard
  - [ ] Create bucket `property-ledger-files`
  - [ ] Create an API token scoped to that bucket (read/write)
  - [ ] Give Claude: Account ID, Access Key ID, Secret Access Key
- [ ] Confirm test data in the database (Sky Lofts / EDIS Group) — keep as
      real first entry, or clear it before continuing?
- [ ] Confirm `www.skybuilder.pro` is the intended production domain for
      this app (that's what the existing Vercel project is aliased to)

## Once R2 credentials are in hand

- [ ] Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
      `R2_BUCKET_NAME` to `.env.local`
- [ ] Test floorplan upload on a suite page and document upload on a
      lease page, locally, against the real bucket
- [ ] `npm run build` one more time to confirm nothing regressed

## Deployment (HANDOFF.md Phases 7–10)

- [x] Vercel: `DATABASE_URL` auto-provided by the Neon integration;
      `APP_PASSWORD_HASH` and `SESSION_SECRET` added via `vercel env add`
- [x] `vercel --prod` — live at https://www.skybuilder.pro, `/login`
      verified working with the real site password
- [ ] Add the 4 R2 vars to Vercel once Cloudflare setup is done
- [ ] Cloudflare Workers: `npx wrangler secret put <NAME>` for all 7 vars
- [ ] `npm run cf:build && npm run cf:deploy`
- [ ] Confirm the `*.workers.dev` URL's `/login` also returns 200
- [ ] Cross-deployment check: create a test property on the Vercel URL,
      confirm it shows up on the Cloudflare Workers URL too (proves both
      deployments share the same Neon database), then delete it
- [ ] Final report to user: both URLs, confirmation they share one DB
