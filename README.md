# SentriNG Admin

The admin console (portal 4 of 4): a handful of trusted operators onboard field observers. They import CSO
rosters, print one-time enrollment codes as QR cards for training sessions, re-issue codes for replacement phones,
revoke lost phones, and assign observers to polling units. They manage desk analyst accounts (add, disable, log out
everywhere, reset a password or authenticator), keep reference data current (elections and where they're held;
polling-unit, party and election CSVs checked with a dry run before they're applied), follow onboarding progress by
CSO and state, and read the audit log of every desk decision and admin change. Build plan: `sentriNG-api/docs/04-admin-console.md`
(Option B). Brand: `sentriNG-api/docs/05-brand-system.md`. Visual language: [`docs/DESIGN.md`](docs/DESIGN.md).

TanStack Start (SPA mode) on the **TanStack Redact** runtime · TanStack Router (file routes) + TanStack Query ·
axios · zod · Tailwind v4 + shadcn/ui · Hugeicons · `qrcode`. Dark only, desktop only (≥ 1280 px). The same stack and
layering as `sentriNG-desk`.

## Run

```sh
pnpm install
pnpm dev            # http://localhost:5185. /v1 is proxied to the API on :8080 (API_PROXY_TARGET overrides it)
pnpm test           # Vitest
pnpm typecheck
pnpm build          # dist/client: the SPA shell + assets + _headers (CSP hashes for this build)
pnpm serve          # preview dist/client with the production headers (port 4173, PORT overrides)
pnpm e2e            # Playwright: the whole onboarding flow against a real API + the test database (below)
```

The API (`sentriNG-api`, branch with `/v1/admin/*`) must be running: `make migrate && make run` there. Then create
an admin and add the printed TOTP secret to an authenticator:

```sh
go run ./cmd/createanalyst -email ops@desk.test -name "Ops" -password '…' -admin   # in sentriNG-api
```

To try enrollment end to end, import a roster, then enroll one printed code with
`node ../sentriNG-desk/scripts/dev-submit.mjs <code>` (point it at the same API).

### E2E

`pnpm e2e` starts the API (`go run .` in `../sentriNG-api`, port 8091) and this console (port 5186) on the **test
database**, loads the sample polling units, creates an E2E admin, then runs import → print → enroll → assign →
re-issue → revoke → audit log → onboarding; add analyst → desk login → reset password → disable / enable; and add /
re-scope an election → parties CSV dry run → apply → re-run changes nothing. Run `make migrate-test` in the API first, and don't run `make test` there
at the same time (it truncates the same database).

```sh
E2E_DATABASE_URL=postgres://localhost:5432/sentring_test?sslmode=disable   # the default
E2E_CHROMIUM_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"   # any Chromium; unset = Playwright's own
E2E_PRINT_OUT=/tmp/sheet    # optional: keep the card sheet as cards.pdf and cards.png to check the print layout
```

## Layout

```
src/routes/                 /login, /observers, /observers/$ref, /import, /assignments, /analysts, /analysts/$id,
                            /onboarding, /audit, /reference;
                            _admin.tsx = signed-in layout
src/core/services/          HTTP only (axios, AbortSignal)          ┐
src/core/queries/           TanStack Query hooks; mutations invalidate │ docs/api-integration.md
src/core/schemas/           zod form schemas                          ┐
src/core/helpers/           axios instance, useValidator             ┘ docs/form-validation.md
src/components/enrollment/  QR (drawn as SVG paths), enrollment cards, the leave-page guard
src/components/analysts/    analyst table, credential slip (password + authenticator QR, shown once)
src/components/oversight/   onboarding counts table, audit log table
src/components/reference/   elections table and editor, reference CSV import with its dry-run diff
src/lib/csv.ts              roster / assignments CSV reading and row checks (before anything is sent)
src/lib/observers.ts        what an observer's dates add up to (code issued / enrolled / revoked / expired)
e2e/                        Playwright: global setup (seed + E2E admin through the API's CLIs) and the flow
scripts/headers.mjs         CSP and security headers, for Pages (_headers) and the preview server
```

## Deploy

Static hosting on its **own origin**, never bundled into the desk (admin plan §7, §8).

1. Build with `VITE_API_URL=https://api.example.org pnpm build` and deploy `dist/client/`. Serve `index.html`
   (status 200) for unknown paths. `dist/client/_headers` carries the CSP with this build's script hashes.
2. Add the admin origin to the API's `ALLOWED_ORIGINS` (exact, https). Set the API's `PUBLIC_API_URL` so the QR codes
   tell the field app which API to enroll with.
3. Put **Cloudflare Access** (or a VPN / IP allowlist) in front, in addition to the login (§8).

## Security notes

- Admin tokens are separate from desk tokens: 1 hour, admin-scoped, refused on desk routes. A non-admin login fails
  with the same message as a wrong password.
- The token lives in memory, mirrored to `sessionStorage` (this tab only), never `localStorage`. Any 401 goes to
  login. 10 minutes without input locks the console.
- **Codes are shown once.** They live only in the page that asked for them (the import and re-issue mutations keep no
  cache). Leaving that page asks first, except for log out, idle lock and session end, which always clear the screen.
  Reprinting means re-issuing, which voids the earlier code.
- Revoking voids any unused code too: enrolling with a code lifts a revocation, so a stolen code would undo it.
- Analyst passwords are generated by the API, never typed by an admin, and shown once with the authenticator QR. A
  password or authenticator reset ends the analyst's sessions.
- Admin accounts are read-only in the console (the acting admin's own too): they are added, changed and withdrawn only
  with the API's CLI, so a stolen admin session can't take over or create another admin.
- Every change is in the API's `audit_log` with the acting admin.
- No third-party scripts or fonts (Inter and Noto Sans Mono are bundled). QR codes are SVG drawn in the page: no
  network call, no CSP exception.

## Known gaps

- The national polling-unit file (~20 MB) is too big for one import (1 MiB, about one state): import state by state,
  or load it with the API's `cmd/seed`. Imports add and update only; nothing is deleted here (or by `cmd/seed`).
- An election's race and date can't be edited, and elections can't be deleted: results belong to them.
- Analysts can't change their own password: there's no desk flow for it. The generated one stays until an admin resets
  it.
- Onboarding counts by state and for observers without a CSO aren't links: the observer list can't filter by those.
- No search for polling units: assigning one takes its exact INEC code.
- Before an import, the console says that existing refs get new codes but not which ones; the result counts them.
- Four-eyes approval for bulk imports and mass revocation (§8) isn't built.
- E2E covers the main flows; not the 401/idle lock paths, and not a real phone scanning a printed card or an
  authenticator scanning the QR (it uses the typed key).
