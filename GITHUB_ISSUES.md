# Recurb — GitHub Issues Tracker

This document lists all known bugs, missing features, UI issues, configuration gaps, and broken user flows ready to be filed as GitHub issues. Each item includes a suggested label set and a description suitable for pasting directly into a GitHub issue.

---

## Table of Contents

- [🔴 Critical Bugs](#-critical-bugs)
- [🟠 Security Issues](#-security-issues)
- [🟡 Broken User Flows](#-broken-user-flows)
- [🔵 Missing Features](#-missing-features)
- [🟣 UI / UX Issues](#-ui--ux-issues)
- [⚪ Configuration & Infrastructure](#-configuration--infrastructure)

---

## 🔴 Critical Bugs

---

### [BUG] Backup API crashes on import — `@/lib/auth/jwt` does not exist

**Labels:** `bug`, `critical`, `api`

**Description:**
`src/app/api/backup/route.ts` imports `verifyToken` from `@/lib/auth/jwt`, but that module does not exist. The auth utilities live at `@/lib/auth/index.ts`. This causes a module-not-found error at runtime, making the entire backup API non-functional.

**Steps to reproduce:**
1. Make any request to `GET /api/backup`, `POST /api/backup`, or `DELETE /api/backup`.
2. Observe a 500 Internal Server Error.

**Expected:** Backup endpoints respond correctly.

**Fix:** Change the import in `src/app/api/backup/route.ts` from `@/lib/auth/jwt` to `@/lib/auth`.

---

### [BUG] User registration fails — wrong column names in INSERT

**Labels:** `bug`, `critical`, `auth`, `database`

**Description:**
`src/app/api/auth/register/route.ts` inserts into the `organizations` table using column names `subscription_plan` and `currency`. Neither column exists in the `organizations` schema (which only has `plan`). Every new user registration attempt results in a database error.

**Steps to reproduce:**
1. Navigate to the registration page.
2. Fill in all fields and submit.
3. Observe a 500 error; no account is created.

**Expected:** Registration creates an organization and user correctly.

**Fix:** Rename `subscription_plan` → `plan` and remove the `currency` column reference from the INSERT statement in the register route.

---

### [BUG] Forgot password API crashes — `password_resets` table never created

**Labels:** `bug`, `critical`, `auth`, `database`

**Description:**
`POST /api/auth/forgot-password` tries to insert a reset token into a `password_resets` table, but this table is never defined in any migration file. The query throws a "no such table" error at runtime.

**Steps to reproduce:**
1. Go to `/auth/forgot-password`.
2. Enter a valid email and submit.
3. Observe a 500 error.

**Expected:** A reset token is created and a reset link is sent (or at minimum, the request succeeds).

**Fix:**
- Add a `password_resets` migration creating the table with columns: `id`, `user_id`, `token` (hashed), `expires_at`, `created_at`.
- Run the migration before the API is used.

---

### [BUG] Team management page is completely broken — `/api/team/members` does not exist

**Labels:** `bug`, `critical`, `api`, `team`

**Description:**
The `TeamManagement` component and its invite/edit dialogs all call `/api/team/members` (GET, POST, PATCH, DELETE). No such route exists in the codebase. Every action on the Team page fails with a 404. The page always shows an empty or error state.

**Steps to reproduce:**
1. Navigate to `/team`.
2. The member list fails to load.
3. Clicking "Invite Member" and submitting the form results in a 404.

**Expected:** Team members are listed and can be invited/edited/removed.

**Fix:** Create `src/app/api/team/members/route.ts` (and `src/app/api/team/members/[id]/route.ts`) implementing GET, POST, PATCH, DELETE with proper auth and org scoping.

---

### [BUG] Profile update always returns 405 — PATCH handler missing on `/api/auth/me`

**Labels:** `bug`, `critical`, `auth`, `api`

**Description:**
`src/lib/auth/client.ts` calls `PATCH /api/auth/me` to save profile changes, but `src/app/api/auth/me/route.ts` only exports a `GET` handler. Every profile save attempt returns HTTP 405 Method Not Allowed. Changes are never persisted.

**Steps to reproduce:**
1. Go to `/settings/profile`.
2. Edit any field and click Save.
3. Observe the save silently fails (or check network tab for 405).

**Expected:** Profile changes are persisted to the database.

**Fix:** Add a `PATCH` handler to `src/app/api/auth/me/route.ts` that updates the user record and returns the updated user object.

---

### [BUG] Subscriptions export page is missing (404)

**Labels:** `bug`, `critical`, `subscriptions`, `ui`

**Description:**
The Subscriptions page has an "Export CSV" menu item that navigates to `/subscriptions/export`. No page file exists at that path, resulting in a Next.js 404 error.

**Steps to reproduce:**
1. Navigate to `/subscriptions`.
2. Click the Export / Export CSV option.
3. Observe a 404 page.

**Expected:** A working export page (or direct file download).

**Fix:** Either create `src/app/subscriptions/export/page.tsx` with CSV export UI, or replace the navigation link with a direct download action that calls an API endpoint.

---

## 🟠 Security Issues

---

### [SECURITY] Admin endpoints have no authorization check

**Labels:** `bug`, `security`, `admin`, `api`

**Description:**
`GET /api/admin/users`, `PATCH /api/admin/users`, `DELETE /api/admin/users`, and `GET /api/admin/system` perform no role or permission check. Any authenticated user — including `viewer` role — can call these endpoints directly and read or mutate all user records across all organizations.

**Expected:** All `/api/admin/*` routes should verify the caller has the `roles:manage` (or equivalent admin) permission before processing the request.

**Fix:** Add an authorization guard at the top of each handler, similar to how the subscription routes check `subscriptions:read`. Return 403 if the permission is not present.

---

### [SECURITY] Admin users list is not scoped to the caller's organization

**Labels:** `bug`, `security`, `admin`, `database`

**Description:**
`GET /api/admin/users` returns all users from all organizations with no `WHERE organization_id = ?` filter. An admin of one org can see (and delete) users from every other organization.

**Fix:** Filter the users query by the calling user's `organization_id` extracted from their JWT.

---

### [SECURITY] In-memory rate limiter is ineffective in production

**Labels:** `bug`, `security`, `performance`

**Description:**
The rate limiter for auth routes uses a module-level `Map` to track request counts. In serverless/edge deployments (Vercel, etc.) each cold start resets the map, making the rate limit useless. In multi-instance deployments, each instance has its own counter so the limit is never properly enforced.

**Fix:** Use a persistent store for rate limiting. Options: Redis (already optional in the stack via `REDIS_ENABLED`), a database table, or a dedicated rate-limit middleware like `upstash/ratelimit`.

---

### [SECURITY] Middleware calls `/api/setup` on every request (recursive HTTP call)

**Labels:** `bug`, `security`, `performance`

**Description:**
`src/middleware.ts` fetches `http://localhost:${port}/api/setup` on every single incoming request to check whether setup is complete. This creates a recursive internal HTTP call on every page load, adding latency and creating a potential loop. In production, `localhost` may not resolve correctly.

**Fix:** Store the setup completion flag in a way the middleware can access without an HTTP call — for example, check an environment variable (`SETUP_COMPLETED=true` already exists in the config) or read directly from a database/cache.

---

### [SECURITY] `usePermission` hook ignores the `allowed` field in the API response

**Labels:** `bug`, `security`, `auth`

**Description:**
`src/hooks/usePermission.ts` (or equivalent) returns `true` if the HTTP response status is `ok` (2xx), regardless of the `allowed: false` value in the JSON body. This means permission checks always pass for any reachable endpoint, defeating the authorization layer.

**Fix:** Parse the response body and check `result.allowed === true` instead of only checking `response.ok`.

---

## 🟡 Broken User Flows

---

### [BUG] Password reset flow is incomplete — no reset page and no email sent

**Labels:** `bug`, `auth`, `user-flow`

**Description:**
The forgot-password API (when fixed) only logs a reset link to the server console. There is no `/auth/reset-password` page for users to actually enter a new password. The full reset flow is non-functional end-to-end.

**Missing pieces:**
1. No email is sent — the `// TODO: Send email with reset link` comment has never been implemented.
2. No `/auth/reset-password?token=...` page exists to consume the token.
3. No API endpoint to validate the token and apply the new password.

**Fix:**
- Create `src/app/api/auth/reset-password/route.ts` (POST) to validate the token and update the password.
- Create `src/app/auth/reset-password/page.tsx` with a form for the new password.
- Implement email sending via SMTP/SendGrid/Mailgun using the config already present in `env.ts`.

---

### [BUG] Profile fields `company`, `phone`, `timezone` are not persisted

**Labels:** `bug`, `user-flow`, `database`

**Description:**
The profile settings form at `/settings/profile` collects `company`, `phone`, and `timezone`, and the client-side Zod schema validates them. However, none of these columns exist in the `users` table migration. Even if the PATCH handler is fixed, these fields will be silently dropped.

**Fix:** Add `company VARCHAR(255)`, `phone VARCHAR(50)`, and `timezone VARCHAR(100)` columns to the `users` table migration and update the PATCH handler to persist them.

---

### [BUG] Audit logs are not persisted — lost on page refresh

**Labels:** `bug`, `user-flow`, `database`

**Description:**
The audit log UI on the Team page reads from an in-memory Zustand store (`useAuditStore`). No code ever writes to the `audit_logs` database table (which does exist in the schema). Logs are lost on every page refresh and are never visible to other users.

**Fix:** Write audit log entries to the `audit_logs` DB table from API route handlers on critical actions (subscription create/edit/delete, role changes, user management). Update the audit log UI to fetch from a new `GET /api/audit-logs` endpoint.

---

### [BUG] Shared notes are not shared — in-memory only

**Labels:** `bug`, `user-flow`, `database`

**Description:**
The "Shared Notes" component on the subscription detail page (`/subscriptions/[id]`) stores notes in a Zustand store only. Notes are not persisted to the database and are not visible to other users in the same organization, despite the feature being named "Shared Notes."

**Fix:** Add a `notes` column (or a dedicated `subscription_notes` table) to the DB schema. Implement `GET /api/subscriptions/[id]/notes` and `POST /api/subscriptions/[id]/notes` endpoints.

---

### [BUG] Webhook configuration is not persisted

**Labels:** `bug`, `user-flow`

**Description:**
The `WebhookConfig` component on the Team page stores webhook URLs and settings in local React state only. Clicking Save does not make any API call. Webhook configurations are lost on every page refresh.

**Fix:** Create `GET /api/webhooks` and `POST /api/webhooks` endpoints and a corresponding database table. Wire the component to call these endpoints on save/delete.

---

### [BUG] Notification settings are not persisted

**Labels:** `bug`, `user-flow`

**Description:**
The notification settings form at `/settings` stores preferences in local React state. The Save button only triggers a success toast — no API call is made, so settings are never saved and reset on every page load.

**Fix:** Create a `GET /api/auth/notifications` and `PATCH /api/auth/notifications` endpoint. Persist notification preferences as a JSON column or separate columns on the `users` table (or a `user_preferences` table).

---

### [BUG] Subscription duplicate merge is wired but non-functional

**Labels:** `bug`, `subscriptions`, `user-flow`

**Description:**
The `DuplicateDetector` component on the dashboard detects subscriptions with the same name/vendor and shows a "Review & Merge" button. The `onMerge` callback prop is never passed from the parent component, so clicking the button does nothing.

**Fix:** Implement the merge logic (likely a `POST /api/subscriptions/merge` endpoint that combines two subscriptions into one) and pass the handler as `onMerge` where `DuplicateDetector` is rendered.

---

## 🔵 Missing Features

---

### [FEATURE] Feature flag system is not enforced in the application

**Labels:** `enhancement`, `feature-flags`

**Description:**
The admin panel allows toggling feature flags (`csv_import`, `pdf_upload`, `team_features`, `webhooks`, `api_access`) and environment-level flags exist in `env.ts`. However, no component, page, or API route actually reads these flags to gate behavior. All features are always enabled for all users regardless of flag state.

**Acceptance criteria:**
- Navigation items respect their associated feature flag (the `feature` field already exists on nav items but is never read).
- API routes return 403/404 when the relevant feature flag is disabled.
- UI components are hidden when their flag is off.
- A `useFeatureFlag(key)` hook fetches and caches flag state from `GET /api/admin/features`.

---

### [FEATURE] Category Analysis tab in Analytics is a placeholder

**Labels:** `enhancement`, `analytics`

**Description:**
The "Categories" tab in `/analytics` displays the static text "Category analysis charts will be displayed here." It is not implemented.

**Acceptance criteria:**
- Show a breakdown of spending by category (pie chart or bar chart).
- Display each category's total spend, subscription count, and percentage of total.
- Data sourced from the existing `byCategory` field returned by `/api/analytics/stats`.

---

### [FEATURE] Analytics trend data uses current amounts retroactively (inaccurate history)

**Labels:** `bug`, `analytics`, `enhancement`

**Description:**
`GET /api/analytics/trends` calculates the last 12 months of spending by applying each subscription's *current* monthly amount to every past month, regardless of when the subscription started or what it cost then. This gives a flat, inaccurate history.

**Fix:** Factor in `start_date` (and `end_date` / `cancelled_at` if available) so only active subscriptions in a given month contribute to that month's total.

---

### [FEATURE] Vendor analytics groups by `name` instead of `vendor` field

**Labels:** `bug`, `analytics`

**Description:**
`GET /api/analytics/vendors` runs `GROUP BY name`, but the `name` column on the `subscriptions` table is the subscription nickname (e.g., "Netflix Personal"), not the vendor. The correct grouping field is `vendor` (or `vendor_name` depending on schema). This makes the vendors chart meaningless.

**Fix:** Change the query to `GROUP BY vendor` (or the correct vendor column name).

---

### [FEATURE] Dashboard KPI deltas are hardcoded strings

**Labels:** `bug`, `dashboard`, `enhancement`

**Description:**
The dashboard displays "+2.5% from last month" and "Save $120 with annual plans" as static strings in the source code. These are not calculated from real data.

**Acceptance criteria:**
- "% from last month" is calculated by comparing current MRR to the previous month's MRR from the trends API.
- The annual savings suggestion either reflects actual data or is removed.

---

### [FEATURE] Forecasting chart uses a hardcoded 5% growth rate

**Labels:** `enhancement`, `analytics`

**Description:**
The `ForecastingChart` component projects MRR 12 months forward at a hardcoded 5% monthly growth rate. This number is arbitrary and displayed without a clear disclaimer in the UI.

**Acceptance criteria:**
- Allow the user to adjust the growth rate assumption via a slider or input.
- Or replace the growth projection with a flat line (no growth assumed) and a toggle for optimistic/pessimistic scenarios.
- Add a clear disclaimer that these are projections, not guarantees.

---

### [FEATURE] No email sending implementation

**Labels:** `enhancement`, `email`

**Description:**
The project has configuration for SMTP, SendGrid, and Mailgun in `env.ts` but no actual email-sending code exists anywhere. The forgot-password route has `// TODO: Send email with reset link` and just logs the URL to the console. No transactional emails are sent.

**Acceptance criteria:**
- Create `src/lib/email/index.ts` with a `sendEmail(to, subject, html)` function that uses SMTP or a configured provider.
- Wire it into the forgot-password flow at minimum.
- Add templates for: password reset, welcome/registration confirmation, upcoming renewal reminders.

---

### [FEATURE] No API access / public API for integrations

**Labels:** `enhancement`, `api`

**Description:**
`FEATURE_API_ACCESS` exists as a feature flag but no public API with key-based authentication is implemented. There is no way for external tools to integrate with Recurb programmatically.

**Acceptance criteria:**
- API key generation and management UI (e.g., in `/settings`).
- A `api_keys` database table.
- Bearer token authentication on a dedicated `/api/v1/...` namespace.
- At minimum: read access to subscriptions and analytics.

---

### [FEATURE] No organization management UI

**Labels:** `enhancement`, `organizations`

**Description:**
Users belong to an organization set at registration, but there is no UI to view or update organization details (name, plan, settings), no way to leave an organization, and multi-tenancy (`FEATURE_MULTI_TENANT`) has no implementation behind the flag.

**Acceptance criteria:**
- An `/settings/organization` page showing org name, current plan, and org-level settings.
- Ability for `owner` role to rename the organization.
- Stub for plan/billing info (even if just a static display).

---

### [FEATURE] Subscription reminders are not functional

**Labels:** `enhancement`, `subscriptions`

**Description:**
The `ReminderSettings` component is rendered in the subscription form and collects reminder preferences (days before renewal, notification method). These values are never saved to the DB and no background job or notification mechanism exists to actually send reminders.

**Acceptance criteria:**
- Reminder fields (`reminder_days`, `reminder_method`) persisted to the `subscriptions` table.
- A cron job (using the existing `node-cron` dependency) that runs daily and sends notifications for subscriptions renewing within the configured window.

---

### [FEATURE] Invoice upload is always visible and non-functional

**Labels:** `enhancement`, `subscriptions`

**Description:**
The `InvoiceUpload` component is always rendered in the subscription form regardless of the `pdf_upload` feature flag. Uploaded files are not connected to any storage backend — `STORAGE_TYPE` is configurable but no upload API route exists.

**Acceptance criteria:**
- Hide `InvoiceUpload` when the `pdf_upload` feature flag is disabled.
- Create `POST /api/subscriptions/[id]/invoices` to handle file uploads using the configured `STORAGE_TYPE` (local disk as minimum).
- Fix the schema mismatch: frontend sends `invoiceUrls` (array) but the DB column is `invoice_url` (string). Decide on one and align both.

---

## 🟣 UI / UX Issues

---

### [UI] Admin Users page uses native `confirm()` dialog for delete confirmation

**Labels:** `ui`, `admin`

**Description:**
The delete user action on `/admin/users` uses the browser's native `window.confirm()` dialog. Every other destructive action in the app (e.g., deleting a subscription) uses the custom `AlertDialog` component from shadcn/ui, which is accessible and styled consistently.

**Fix:** Replace `confirm()` with the `AlertDialog` component used in the subscriptions page.

---

### [UI] Navigation feature flags are never checked — all nav items always visible

**Labels:** `ui`, `feature-flags`

**Description:**
Each item in the `MainLayout` sidebar navigation has a `feature` property (e.g., `feature: 'csv_import'`), but the rendering code never reads this field. All navigation items are always shown, even for features that are disabled in the admin panel.

**Fix:** In `MainLayout`, check each item's `feature` property against the active feature flags and conditionally render the nav item. This requires the `useFeatureFlag` hook described in the feature flag issue.

---

### [UI] No loading or error states on the Team page

**Labels:** `ui`, `team`

**Description:**
Because `/api/team/members` doesn't exist, the Team page silently shows an empty state or a broken UI without a clear error message. Even after the API is fixed, the page should display proper loading skeletons and a friendly error state when the API is unavailable.

---

### [UI] Analytics "Vendors" tab data is always incorrect

**Labels:** `ui`, `analytics`

**Description:**
Due to the `GROUP BY name` bug, the Vendors chart on the analytics page shows subscription names (e.g., "Netflix Personal") instead of vendor names (e.g., "Netflix"). The chart is visually misleading.

**Fix:** Addressed by the vendor analytics bug fix above. Consider also adding a "No vendor data" empty state when the vendor field is not populated on subscriptions.

---

### [UI] No empty state on the Calendar page when there are no renewals

**Labels:** `ui`, `calendar`

**Description:**
The `/calendar` page does not have an empty state for when no subscriptions are present. New users see a blank calendar with no guidance on what to do next.

**Fix:** Add an empty state illustration and a call-to-action button linking to `/subscriptions/new` when there are no subscriptions.

---

### [UI] Setup wizard does not validate database connectivity before proceeding

**Labels:** `ui`, `setup`, `user-flow`

**Description:**
In the setup wizard step 1, the user selects a database type and enters connection details, but there is no "Test Connection" button. The wizard proceeds to step 2 without verifying the DB is reachable. Errors only surface later, after the full setup form is submitted.

**Fix:** Add a "Test Connection" button on the DB configuration step that calls a lightweight `/api/setup/test-connection` endpoint and shows success/failure feedback inline.

---

### [UI] No confirmation or feedback after CSV import

**Labels:** `ui`, `subscriptions`

**Description:**
After a CSV bulk import (`POST /api/subscriptions/bulk`), the UI does not display how many records were imported, how many were skipped due to errors, or any per-row validation feedback. The user has no way to know if the import succeeded partially.

**Fix:** Return a structured response from the bulk endpoint (`{ imported: N, skipped: M, errors: [...] }`) and display a summary dialog or toast on the import page.

---

### [UI] `/auth/verify` route is in the middleware matcher but the page doesn't exist

**Labels:** `ui`, `auth`

**Description:**
The middleware exclusion list includes `auth/verify` (for email verification presumably), but no `/auth/verify` page exists. If email verification is not planned, the exclusion should be removed. If it is planned, the page needs to be built.

**Fix:** Either remove `auth/verify` from the middleware matcher, or implement the email verification page and flow.

---

## ⚪ Configuration & Infrastructure

---

### [CONFIG] `DB_TYPE` and `DATABASE_TYPE` are duplicate variables doing the same thing

**Labels:** `configuration`, `cleanup`

**Description:**
The codebase uses both `DB_TYPE` (in `src/lib/db/index.ts`, `src/app/api/admin/*`) and `DATABASE_TYPE` (in `src/lib/config/env.ts`, backup scripts) to refer to the same setting: the database engine type. Having two separate env vars for the same concept is confusing and error-prone.

**Fix:** Standardize on one variable name (suggest `DATABASE_TYPE` to match the env schema). Update all references in DB initialization and API routes to use the canonical name.

---

### [CONFIG] No `.env.example` file committed to the repository

**Labels:** `configuration`, `documentation`

**Description:**
The `.gitignore` has `!.env.example` (meaning it intentionally should be tracked), but no `.env.example` file exists in the repository. New contributors have no reference for what environment variables are required or what values to use.

**Fix:** Create `.env.example` with all variables from `src/lib/config/env.ts` (secrets as placeholder values, optional fields commented out). This file should be committed to the repo.

---

### [CONFIG] Database singleton may not survive serverless cold starts

**Labels:** `configuration`, `performance`, `database`

**Description:**
`src/lib/db/index.ts` stores the DB connection as a module-level singleton (`dbInstance`). In Next.js serverless deployments, module state does not persist across cold starts, meaning a new connection is created for every invocation. For PostgreSQL/MySQL this exhausts the connection pool; for SQLite this is generally fine but still wasteful.

**Fix:** Use Next.js-recommended global singleton pattern (store the instance on `globalThis` in development to survive HMR, use a proper connection pool for production Postgres/MySQL).

---

### [CONFIG] No database migration versioning or tracking

**Labels:** `configuration`, `database`, `enhancement`

**Description:**
The migration system in `src/lib/db/migrate.ts` runs all migrations on startup but has no mechanism to track which migrations have already been applied. Every app restart re-runs all migrations, which is only safe because current migrations use `CREATE TABLE IF NOT EXISTS`. Any future migration that alters data will run multiple times.

**Fix:** Create a `migrations` table with a `name` and `applied_at` column. Track applied migrations and skip ones already in the table (standard migration runner pattern).

---

### [CONFIG] `SETUP_COMPLETED` env var is ignored — setup state is only in the DB

**Labels:** `configuration`

**Description:**
`SETUP_COMPLETED` exists in `env.ts` and `.env` but the setup check in the middleware always calls the database (via `/api/setup`) to determine if setup is complete. The env var is never read for this purpose. This creates a circular dependency: the DB may not be set up yet, but the middleware is already trying to connect to it.

**Fix:** Use `SETUP_COMPLETED=true` as the authoritative signal in the middleware to skip the setup redirect, bypassing the DB call entirely for already-configured deployments.

---

### [CONFIG] No health check endpoint

**Labels:** `configuration`, `infrastructure`

**Description:**
There is no `GET /api/health` endpoint. Health checks are standard for containerized/cloud deployments (Docker `HEALTHCHECK`, Kubernetes liveness probes, load balancer checks). Without one, there is no reliable way to verify the application is running correctly.

**Acceptance criteria:**
- `GET /api/health` returns `{ status: 'ok', db: 'connected'|'error', version: '...' }` with HTTP 200 (or 503 if DB is down).
- Does not require authentication.

---

## 🟢 New Features & Enhancements

---

### [FEATURE] Docker / Docker Compose configuration

**Labels:** `enhancement`, `docker`, `devops`, `help wanted`, `good first issue`

**Description:**
The ARCHITECTURE.md references Docker deployment and the CHANGELOG lists Docker configuration as "Planned", but no `Dockerfile` or `docker-compose.yml` exists. Adding Docker support would enable:
- Consistent development environments
- Easy self-hosting on any platform
- Integration with CI/CD pipelines

**Acceptance criteria:**
- Multi-stage `Dockerfile` for production build (Node.js 18+, Next.js standalone output)
- `docker-compose.yml` with app + database (PostgreSQL/MySQL) services
- Development `docker-compose.dev.yml` with hot-reload
- `.dockerignore` file
- Working `docker compose up` that starts the full stack

---

### [FEATURE] Swagger / OpenAPI documentation

**Labels:** `enhancement`, `api`, `documentation`, `help wanted`, `good first issue`

**Description:**
The project has no API documentation. Adding Swagger/OpenAPI would make the API discoverable for contributors and users building integrations. With 20+ API endpoints across admin, auth, subscriptions, analytics, and backup, auto-generated docs would significantly lower the barrier to contribution.

**Acceptance criteria:**
- Integrate `swagger-jsdoc` + `swagger-ui-react` or `next-swagger-doc`
- Add JSDoc annotations to at least the core API routes
- Expose `GET /api/docs` (or `/api/swagger`) serving the Swagger UI
- Include auth, subscriptions, and admin endpoints

---

### [FEATURE] MCP (Model Context Protocol) tool integration

**Labels:** `enhancement`, `ai`, `mcp`, `integrations`, `help wanted`

**Description:**
Recurb could expose its subscription data through an MCP server, allowing AI assistants (Claude, Cursor, Zed, etc.) to query and manage subscriptions directly. This would be a unique differentiator for the project.

**Proposed capabilities:**
- `list_subscriptions` — return all subscriptions with filters
- `get_subscription` — get details for a specific subscription
- `get_spending_summary` — monthly/yearly spend breakdown
- `get_upcoming_renewals` — subscriptions renewing in the next N days
- `add_subscription` — create a new subscription

**Acceptance criteria:**
- MCP server exposing the above tools via `stdio` transport
- Reads from the same database as the main app
- README section documenting how to configure it in AI editors

---

### [CHORE] Migrate from npm to pnpm

**Labels:** `chore`, `build`, `performance`, `help wanted`, `good first issue`

**Description:**
The project uses npm (`package-lock.json` exists) but pnpm offers faster installs, strict dependency resolution, and disk-space efficiency via content-addressable storage. The `.gitignore` already has pnpm-related entries (`.pnpm-debug.log*`).

**Acceptance criteria:**
- Add `pnpm-lock.yaml` (and optionally remove `package-lock.json`)
- Update `CONTRIBUTING.md` to document pnpm usage
- Update CI scripts if any exist
- Verify `pnpm install && pnpm build` works correctly

---

### [FEATURE] Investment / portfolio tracker

**Labels:** `enhancement`, `feature`, `help wanted`

**Description:**
Recurb currently tracks only recurring subscriptions. Adding an investment/portfolio tracker would expand the app to cover stocks, crypto, ETFs, and other assets — giving users a single dashboard for their entire financial picture.

**Proposed scope:**
- New `investments` (or `assets`) database table with: symbol, name, type (stock/crypto/etf/bond), quantity, purchase_price, current_price, purchase_date
- API routes: `GET/POST/PUT/DELETE /api/investments`
- Dashboard widget showing total portfolio value and gain/loss
- Basic chart showing portfolio performance over time
- Real-time price lookup via a free API (e.g., Alpha Vantage, Yahoo Finance, CoinGecko)

**Acceptance criteria:**
- Users can add, edit, and delete investment holdings
- Dashboard shows aggregated portfolio summary
- Price data is cached to avoid rate limits

---

## 🟡 Additional Bugs Found

---

### [BUG] Admin DELETE user has no cascade — orphaned data left behind

**Labels:** `bug`, `admin`, `database`, `help wanted`

**Description:**
`DELETE /api/admin/users` removes a row from the `users` table but does not clean up related records: subscriptions owned by that user, audit log entries, password reset tokens, or shared notes. This leaves orphaned data in the database.

**Steps to reproduce:**
1. Create a user with subscriptions.
2. Delete the user via the admin panel.
3. Query the `subscriptions` table — the user's subscriptions still exist with a dangling `user_id`.

**Fix:** Either add `ON DELETE CASCADE` to foreign keys in the schema, or delete related records in a transaction before deleting the user.

---

### [BUG] Bulk subscription import hardcodes `organization_id = 1`

**Labels:** `bug`, `subscriptions`, `database`, `help wanted`

**Description:**
`POST /api/subscriptions/bulk` inserts every imported subscription with `organization_id = 1` regardless of the authenticated user's actual organization. In a multi-organization setup, all bulk-imported subscriptions end up in org #1.

**Fix:** Replace the hardcoded `1` with `user.organizationId`.

---

### [BUG] Login does not persist `last_login_at` timestamp

**Labels:** `bug`, `auth`, `database`, `help wanted`

**Description:**
The login route authenticates the user but never updates a `last_login_at` (or `last_login`) column on the `users` table. There is no way to know when a user last signed in — useful for security audits and identifying inactive accounts.

**Fix:** Add a `last_login_at` column to the `users` table migration and run `UPDATE users SET last_login_at = NOW() WHERE id = ?` on successful login.

---

### [BUG] No input length validation on subscription name/notes

**Labels:** `bug`, `validation`, `security`, `help wanted`

**Description:**
The Zod schemas and API routes do not enforce max length on `name`, `vendor`, `category`, or `notes` fields in subscriptions. This can lead to database errors (column overflow) or denial-of-service via extremely large payloads.

**Fix:** Add `.max()` constraints to the Zod schemas for all string fields matching the database column definitions (e.g., `name` → max 255 chars, `notes` → max 2000 chars).

---

## ⚪ Documentation & Repository Gaps

---

### [DOCS] README has placeholder screenshot section

**Labels:** `documentation`, `help wanted`, `good first issue`

**Description:**
The README's "Screenshots" section contains only a comment: `> Add screenshots here showcasing the dashboard, analytics, and key features`. This is a placeholder.

**Fix:** Capture screenshots of the dashboard, analytics page, subscription list, calendar view, and team management. Add them to the README (or a `screenshots/` directory).

---

### [DOCS] CONTRIBUTING.md contains placeholder links

**Labels:** `documentation`, `help wanted`, `good first issue`

**Description:**
`CONTRIBUTING.md` references:
- `cp .env.example .env.local` — `.env.example` does not exist (already tracked as a separate issue)
- Discord invite: `https://discord.gg/yourinvite` — placeholder link
- `/docs` directory — does not exist in the repository

**Fix:** Remove or update the Discord link with a real invite. Either create a `/docs` directory or remove the reference. Fix the `.env.example` reference.

---

### [CHORE] Leftover `gh.zip` file in repository root

**Labels:** `chore`, `cleanup`, `help wanted`, `good first issue`

**Description:**
A `gh.zip` file (GitHub CLI download artifact) is sitting in the repository root. It's 8+ MB of unnecessary binary data and likely shouldn't be tracked.

**Fix:** Delete `gh.zip` and add it to `.gitignore`.

---

### [CHORE] No GitHub Actions CI/CD workflow

**Labels:** `chore`, `ci-cd`, `devops`, `help wanted`

**Description:**
The repository has no `.github/workflows/` directory with CI/CD pipelines. Adding one would:
- Run `npm run lint` and `npm run build` on every PR
- Catch type errors and build failures before merging
- Potentially run database migrations as part of CI

**Acceptance criteria:**
- `.github/workflows/ci.yml` that runs on PRs to `main`
- Steps: checkout → setup Node.js → install deps → lint → build
- Optional: run migrations against an in-memory SQLite to validate schema

---

### [CHORE] No Pull Request template

**Labels:** `chore`, `documentation`, `help wanted`, `good first issue`

**Description:**
The `.github/` directory has issue templates but no `PULL_REQUEST_TEMPLATE.md`. A PR template helps contributors include testing instructions, screenshots, and linked issues.

**Fix:** Create `.github/PULL_REQUEST_TEMPLATE.md` with sections for: description, linked issues, testing steps, screenshots (if UI change), and a checklist.

---

### [CHORE] `data/` directory should not be tracked

**Labels:** `chore`, `cleanup`, `help wanted`, `good first issue`

**Description:**
The `.gitignore` includes `/data/` but SQLite database files (`.db`) may still be tracked if committed before the gitignore was added. Check if any database files exist in `data/` and ensure they are removed from tracking.

**Fix:** Run `git rm --cached data/*.db` if any database files are tracked, and verify `/data/` is properly ignored.

---

### [SECURITY] CSRF token is generated but never set as a cookie — protection always fails

**Labels:** `bug`, `security`, `critical`, `help wanted`

**Description:**
`src/lib/utils/csrf.ts` exports `generateCsrfToken()` and `validateCsrfToken()` — the validator checks `req.cookies.get("csrf-token")`. However, `generateCsrfToken()` is **never called** anywhere in the codebase to set the `csrf-token` cookie. This means `validateCsrfToken()` always returns `false`, and all CSRF-protected POST/PUT/PATCH/DELETE requests fail with 403.

**Impact:** Every mutation endpoint that uses `csrfProtection()` is broken — registration, login, forgot-password, subscription create/update/delete, admin updates.

**Fix:**
1. On login/page load, call `generateCsrfToken()` and set the result as a cookie `csrf-token` (path=/)
2. The client must read this cookie and send it as `X-CSRF-Token` header on mutation requests
3. Alternatively, use Next.js built-in CSRF via `server-only` tokens or the `next-csrf` package

---

### [BUG] Migration system calls `db.connect()` redundantly — double-connect errors

**Labels:** `bug`, `database`, `help wanted`

**Description:**
`getDatabase()` in `src/lib/db/index.ts` already calls `await dbInstance.connect()` on line 54. But `runMigrations()` in `src/lib/db/migrate.ts` calls `await db.connect()` again on line 11. Similarly, `isSetupComplete()` and `completeSetup()` in `src/lib/setup/wizard.ts` also call `db.connect()`. With PostgreSQL/MySQL adapters, this can throw "already connected" errors.

**Fix:** Remove the redundant `db.connect()` calls from `migrate.ts` and `wizard.ts`. `getDatabase()` already handles connection.

---

### [SECURITY] Admin `/api/admin/database` and `/api/admin/features` have no auth check

**Labels:** `bug`, `security`, `admin`, `api`, `help wanted`

**Description:**
- `GET /api/admin/database` returns database stats (table counts, DB type) to anyone — no authentication check.
- `GET /api/admin/features` returns all feature flags — no authentication check.
- `PATCH /api/admin/features` toggles feature flags — no authentication check.

These are in addition to the already-tracked `/api/admin/users` and `/api/admin/system` auth gaps (#8).

**Fix:** Add `requirePermission(PERMISSIONS.ROLES_MANAGE)` at the top of each handler, consistent with how `/api/admin/roles` already does it.

---

### [BUG] Feature flags PATCH uses wrong column name `updatedAt` instead of `updated_at`

**Labels:** `bug`, `database`, `help wanted`, `good first issue`

**Description:**
`PATCH /api/admin/features` (in `src/app/api/admin/features/route.ts`) executes:
```sql
UPDATE feature_flags SET enabled = ?, updatedAt = ? WHERE key = ?
```
The column is `updated_at` (snake_case) in the database schema, not `updatedAt` (camelCase). This UPDATE silently fails to set the timestamp — or worse, throws an error on strict SQL modes.

**Fix:** Change `updatedAt` to `updated_at` on line 32 of the route.

---

### [BUG] Setup wizard uses SQLite-specific `INSERT OR REPLACE` — breaks PostgreSQL/MySQL

**Labels:** `bug`, `database`, `setup`, `help wanted`

**Description:**
`completeSetup()` in `src/lib/setup/wizard.ts` uses:
```sql
INSERT OR REPLACE INTO system_config (key, value) VALUES ('setup_complete', 'true')
```
`INSERT OR REPLACE` is SQLite-specific syntax. On PostgreSQL, you need `INSERT ... ON CONFLICT (key) DO UPDATE`. On MySQL, you need `INSERT ... ON DUPLICATE KEY UPDATE`. This means setup will fail on non-SQLite databases.

**Fix:** Use a database-agnostic upsert pattern. Either:
- Detect the DB type and use the appropriate SQL syntax
- Or DELETE + INSERT in a transaction

---

### [BUG] Admin roles API returns inconsistent response format

**Labels:** `bug`, `api`, `admin`, `help wanted`, `good first issue`

**Description:**
`GET /api/admin/roles` returns a bare array `[{...}, {...}]` instead of `{ data: [...] }`. `POST /api/admin/roles` returns `{ id, name, ... }` instead of `{ data: { id, name, ... } }`. Every other API route wraps responses in `{ data: ... }` or `{ error: ... }`. This breaks client-side code that expects the `data` wrapper.

**Fix:** Wrap the GET response in `{ data: rolesWithPermissions }` and the POST response in `{ data: { id, name, description, permissions } }`.

---

### [BUG] Admin `/api/admin/system` GET has no auth check — information disclosure

**Labels:** `bug`, `security`, `admin`, `api`, `help wanted`

**Description:**
`GET /api/admin/system` returns OS platform, CPU architecture, Node.js version, uptime, total/free memory, hostname, and DB type — to any unauthenticated caller. This is a security-relevant information disclosure (hostname, internal IP via hostname resolution, DB type).

**Fix:** Add `requirePermission(PERMISSIONS.ROLES_MANAGE)` to the handler.

---

*Generated by analyzing the Recurb codebase. File as individual GitHub issues with the suggested labels.*
