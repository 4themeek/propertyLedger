# Deployment Handoff — run this with Claude Code

This app (Property Ledger) is fully built and lives in this folder. What's
left is execution: real accounts, real CLIs, real secrets, and an actual
deploy — the kind of thing best done by Claude Code running on your own
machine, where it can log into your accounts and run commands directly.

**How to use this file:** open this project folder in Claude Code (`cd
property-ledger && claude`), then paste this as your first message:

> Read HANDOFF.md and execute it phase by phase. Stop and ask me for
> anything that needs a browser login, a dashboard click, or a password —
> don't guess or skip ahead. Don't modify any application code.

Everything below is written as instructions *to Claude Code*, not to you —
you'll be pulled in at the marked stopping points.

---

## Phase 0 — Preflight

1. Confirm `node -v` is 20+. Run `npm install`.
2. Check for required CLIs: `gh --version`, `vercel --version`, `npx
   wrangler --version`. Install whichever are missing (`npm i -g vercel`;
   `gh` via the system package manager; wrangler is already a
   devDependency and runs via `npx`).
3. Confirm with the user that they have accounts on GitHub (username
   `4themeek`), Neon (neon.tech), Cloudflare, and Vercel before proceeding.

## Phase 1 — Push the code to GitHub

1. `gh auth status` — if not logged in, run `gh auth login`, relay the
   device code/URL to the user, and wait for them to confirm it's done.
2. `gh repo create 4themeek/property-ledger --private --source=. --remote=origin`
3. `git add -A && git commit -m "Property Ledger"`
4. `git push -u origin main`

## Phase 2 — Neon Postgres

**STOP — needs the user.** Neon project creation is a dashboard action, not
something to script blind. Ask the user to:
1. Go to neon.tech → New Project (any region, name it `property-ledger`).
2. Dashboard → Connect → copy the pooled connection string.
3. Paste that connection string into the chat.

Once given, write it into a new `.env.local` (already gitignored — never
commit it) as `DATABASE_URL=...`.

## Phase 3 — Site password & session secret

1. Ask the user what password should protect the site (one shared
   password for the whole app, not per-user logins).
2. Run `npm run hash:password -- "<the password they gave you>"` and put
   the printed hash into `.env.local` as `APP_PASSWORD_HASH`. Never print,
   log, or commit the plaintext password anywhere — only the hash.
3. Run `openssl rand -hex 32` and put the result into `.env.local` as
   `SESSION_SECRET`.

## Phase 4 — Cloudflare R2 (floorplan storage)

1. `npx wrangler login` if not already authenticated (relay the browser
   URL to the user).
2. `npx wrangler r2 bucket create property-ledger-files`
3. **STOP — needs the user.** R2 API tokens are a dashboard action:
   Cloudflare dashboard → R2 → Manage API tokens → create one with
   read/write access to `property-ledger-files`. Ask the user for the
   resulting Account ID, Access Key ID, and Secret Access Key.
4. Add to `.env.local`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME=property-ledger-files`.

## Phase 5 — Push the database schema

1. `npm run db:push` — confirm it reports success with no errors.

## Phase 6 — Local smoke test

1. `npm run build` — must succeed (it reads `.env.local` at build time).
2. `npm run dev`, confirm `localhost:3000/login` returns the password
   screen (curl it, or ask the user to check in a browser), then stop the
   dev server.

## Phase 7 — Deploy to Vercel (primary)

1. `vercel login` if not already authenticated (relay the flow).
2. `vercel link` — create a new project named `property-ledger`.
3. For each of `DATABASE_URL`, `APP_PASSWORD_HASH`, `SESSION_SECRET`,
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET_NAME`: run `vercel env add <NAME> production` and paste the
   value from `.env.local` when prompted.
4. `vercel --prod` — report the production URL back to the user.
5. Verify: the deployed URL's `/login` route returns 200.

## Phase 8 — Deploy to Cloudflare Workers (backup)

1. For each of the same 7 variables: `npx wrangler secret put <NAME>` and
   paste the value from `.env.local` when prompted.
2. `npm run cf:build` then `npm run cf:deploy`.
3. Report the `*.workers.dev` URL Wrangler prints.
4. Verify: that URL's `/login` route also returns 200.

## Phase 9 — Confirm both deployments share one database

1. Log into the Vercel URL (POST `/api/login` with the password, keep the
   session cookie) and create one test property.
2. Log into the Cloudflare URL the same way and confirm that same test
   property shows up — this proves both deploys hit the same Neon
   database rather than drifting apart.
3. Delete the test property once confirmed.

## Phase 10 — Cleanup & report

1. `git status` should show `.env.local` and `.dev.vars` as untracked/
   ignored, never committed.
2. Report back: the Vercel URL, the Cloudflare URL, and confirmation both
   are live against the same database. Remind the user that the site
   password only exists as a hash — if they forget it, Phase 3 can be
   re-run with a new password and re-deployed.

---

Don't do anything outside these phases — no code changes, no secret
rotation, no deleting resources — without asking first.
