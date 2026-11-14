# Applying this update (GitHub Desktop)

1. Close GitHub Desktop's changes view, then unzip `property-ledger-update-v1.7.zip` into the ROOT of your local `property-ledger` repo folder (the folder that contains `package.json`). Choose "Replace" if asked. The zip only adds these files:
   - `public/lease-builder/index.html`  (Lease Builder v1.7, standalone)
   - `LEASE_UPDATE.md`, `TODO.md`, `PROJECT-STATUS.md`, `RESUME-HERE.md`
   - `docs/lease-builder/*` (proposed-changes source file, reference exporter files saved as `.txt` so they are not compiled)
2. Open GitHub Desktop. The Changes list should show only those files. If it shows anything else, stop and do not commit.
3. Summary: `Add Lease Builder v1.7 (proposed revisions, saved versions) and handoff docs`. Click Commit to main, then Push origin.
4. Vercel redeploys on the push. After it finishes, open `https://<your-vercel-url>/lease-builder/index.html`. If the site asks for the password first, the page is behind the gate; if it opens straight away, the page is public but holds no private data (entries stay in the viewer's own browser).
5. For the Cloudflare backup, run `npm run cf:build && npm run cf:deploy`.

What this does NOT change: the app's built-in Lease Builder, the database, auth, R2 and deployment settings. Entries in the standalone page are saved in the browser only, not in Neon. To bring the changes into the built-in builder, follow `RESUME-HERE.md`.
