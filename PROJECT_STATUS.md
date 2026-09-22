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

## Test data currently in the database

One property ("Sky Lofts", Cincinnati OH) with one suite (204), one tenant
(EDIS Group, LLC), one lease, and one rent schedule row — mirrors the
real example lease in `C:\2026-Claude\EDGER\4TR-Sample_Lease_2026.docx`
used to validate the data model. This was used for local smoke testing;
confirm with the user whether to keep it as real data or clear it before
going further.

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
