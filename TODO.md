# Property Ledger — TODO

Tracks what's left to finish the HANDOFF.md deployment phases. See
`PROJECT_STATUS.md` for the fuller picture of what's already working.

## Lease document generation (new, not started)

`templates/lease-agreement-template.docx` exists and is verified working
(see PROJECT_STATUS.md), but nothing in the app uses it yet. To wire it in:

- [ ] Add `docxtemplater` + `pizzip` as app dependencies
- [ ] Add missing schema fields the template needs but leases/tenants/
      properties don't currently store: guarantor name, landlord/tenant
      signatory name + title, tenant address split into street/city/state/
      zip (currently one `mailingAddress` text field), property state
      (currently only `addressState` on properties — should already cover
      `propertyState`, double check field names line up)
- [ ] A "Generate lease document" action on the lease detail page that
      maps a lease + its suite + tenant + property + rent schedule rows
      into the template's field names and produces a downloadable .docx
      (upload the result to R2 as a `lease` category document, or stream
      it directly as a download — decide which)
- [ ] Decide whether template values need `$`/comma formatting handled by
      the generator code or typed in by the user (the template's dollar
      fields expect the number only, e.g. `537.50`, not `$537.50`)

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
