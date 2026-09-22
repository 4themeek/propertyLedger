# Property Ledger — TODO

Tracks what's left to finish the HANDOFF.md deployment phases. See
`PROJECT_STATUS.md` for the fuller picture of what's already working.

## Blocked on the user (dashboard actions)

- [ ] **Cloudflare R2** (on hold, user asked to come back to this later)
  - [ ] Enable R2 in the Cloudflare dashboard
  - [ ] Create bucket `property-ledger-files`
  - [ ] Create an API token scoped to that bucket (read/write)
  - [ ] Give Claude: Account ID, Access Key ID, Secret Access Key
- [ ] Confirm test data in the database (Sky Lofts / EDIS Group) — keep as
      real first entry, or clear it before continuing?
- [ ] Confirm whether the Vercel project that auto-attempted a build is
      the one to keep using for Phase 7, or if a fresh one should be made

## Once R2 credentials are in hand

- [ ] Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
      `R2_BUCKET_NAME` to `.env.local`
- [ ] Test floorplan upload on a suite page and document upload on a
      lease page, locally, against the real bucket
- [ ] `npm run build` one more time to confirm nothing regressed

## Deployment (HANDOFF.md Phases 7–10)

- [ ] Vercel: add all 7 env vars via `vercel env add <NAME> production`
- [ ] `vercel --prod`, confirm `/login` returns 200
- [ ] Cloudflare Workers: `npx wrangler secret put <NAME>` for all 7 vars
- [ ] `npm run cf:build && npm run cf:deploy`
- [ ] Confirm the `*.workers.dev` URL's `/login` also returns 200
- [ ] Cross-deployment check: create a test property on the Vercel URL,
      confirm it shows up on the Cloudflare Workers URL too (proves both
      deployments share the same Neon database), then delete it
- [ ] Final report to user: both URLs, confirmation they share one DB
