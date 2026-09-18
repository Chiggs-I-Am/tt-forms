# Technical feasibility check (decision ticket: Technical feasibility check)

Stack in repo: Next.js 16.3.3, React 19.2.4, convex ^1.46.0, Turborepo + bun. Schema is empty (`packages/database/convex/schema.ts`). No auth library installed yet. Reviewed 18 Sep 2026 against official Convex and Convex Auth docs.

Verdict: every decision on the map can be built on this stack. One beta caveat (Convex Auth, Next.js server support experimental), one custom-code item (anonymous conversion no longer needed after #26), and three external-service setups (Google OAuth client, Resend key, Convex deployment). No blockers that change the plan.

## 1. Auth: Convex Auth with Google OAuth + email OTP

- Library: `@convex-dev/auth`, current `0.0.95`. Peer deps accept convex ^1.17 and React 18/19, so convex 1.46.0 and React 19.2.4 fit.
  Sources: https://www.npmjs.com/package/@convex-dev/auth, https://labs.convex.dev/auth
- Next.js App Router is supported (`ConvexAuthNextjsProvider`, `convexAuthNextjsMiddleware`, server helpers for Server Components/Actions/Route Handlers).
  Sources: https://labs.convex.dev/auth/authz/nextjs, https://labs.convex.dev/auth/api_reference/nextjs
- Caveat, carried openly: Convex Auth is in beta ("early preview"), and its Next.js server-component/middleware/SSR support is "under active development" / experimental. Cookie-based auth also means no side effects on GET: only queries in Server Components and GET handlers, mutations from Server Actions or POST/PUT handlers. For this demo (client-heavy form filling with server enforcement in Convex functions) that is a workable constraint, not a blocker. Plan should keep auth-sensitive reads/writes in client components plus Convex functions, and treat middleware-gated routes as nice-to-have.
  Sources: https://labs.convex.dev/auth, https://labs.convex.dev/auth/faq, https://docs.convex.dev/auth/convex-auth
- Google OAuth is first-class: Google Cloud project + Web Application client, authorized JS origin and redirect URI (`{convex-site-url}/api/auth/callback/google`), `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` via `npx convex env set`, `Google` from `@auth/core/providers/google` in `convex/auth.ts`.
  Source: https://labs.convex.dev/auth/config/oauth/google
- Email OTP is supported as a custom Email-based provider: two-step flow (email, then email + code), failed attempts rate-limited by the library. The documented Resend example needs a `resend` npm dep, `@oslojs/crypto`, `AUTH_RESEND_KEY`, and a `ResendOTP.ts` provider file (8-digit code, 15-minute expiry in the example).
  Source: https://labs.convex.dev/auth/config/otps
- Account linking (Google + OTP on the same email): both are trusted methods by default, so the same verified email lands on one user document automatically. No custom linking code needed for the Google/OTP pair. Custom behavior via `createOrUpdateUser` is available but takes over all user creation, so the plan should avoid it unless a reason appears.
  Source: https://labs.convex.dev/auth/advanced#account-linking

## 2. Sign-in-before-write (revises #23 per #26): feasible, simpler than guest conversion

- #26 removed Guest Convex writes: browsing anonymous, filling local in browser state, first Convex write requires Google or OTP sign-in.
- This removes the one advanced item from #23: anonymous-to-account conversion via a custom `createOrUpdateUser` implementation ("you must provide a custom account linking implementation", "we don't recommend it to newcomers").
  Source: https://labs.convex.dev/auth/config/anonymous
- What the plan must cover instead, all standard frontend work:
  - Keep unsent answers in browser state (plus `localStorage` backup) until sign-in.
  - OAuth redirect survival: persist the in-progress answers to `localStorage` before `signIn("google")`, restore after the callback. OTP has no redirect, so component state plus the same backup is enough.
  - On first save after sign-in, create the draft under the now-authenticated user; one active draft per account and form enforced server-side (see section 4).
- Anonymous provider: not needed for writes anymore. Do not install it; that also drops its abuse surface (unauthenticated writes + CAPTCHA-on-anonymous-sign-in) from the plan. Authenticated-write abuse is still handled by rate limits (section 6).
- Note on #25 wording: its feasibility input says "Google/OTP plus anonymous-guest flows unchanged from #23". #26 supersedes that for the anonymous part. Google/OTP flows are unchanged and validated here.

## 3. Convex schema for forms, submissions, drafts, files, users

Nothing in the decisions needs anything beyond standard Convex schema + functions:

- Tables: `forms` (working copy), `formVersions` (immutable published snapshots), `drafts` (pinned `formVersionId`, answers object, `status`), `submissions` (denormalized snapshot: answers + version + file refs + rendered labels for the printable view), `files` (metadata rows pointing at `_storage` ids, linked to draft), `users` (role flag: `applicant | developerAdmin | demoAdmin`), `invites` (email-bound, single-use, 7-day expiry).
- Versioning/pinning: plain references plus `v.union` / `v.literal` status fields and indexes on `(formId, version)` or `(userId, formId, status)`. Immutability of published versions is a mutation-level rule (no update path exposed), which is the normal Convex pattern.
- Server-side validation is runtime-enforced: schema validators plus per-function `args`/`returns` with `v.*` (TypeScript types alone do not run), plus hand-written checks in mutations (auth, ownership, role, status transitions). Schema push validates existing documents and fails deploy on mismatch.
  Sources: https://docs.convex.dev/functions/validation, https://docs.convex.dev/database/schemas
- One real limitation: Convex has no true database unique constraint. `.unique()` on an index is a read helper, not DDL. "One active draft per owner and form" = composite index on `(userId, formId)` (or with status) plus a check-and-throw-or-reuse in every write-path mutation. Correct under normal use; concurrent duplicate inserts are only softened by OCC retries, not prevented by the engine. Accept for a demo; note it in the plan.
  Source: https://docs.convex.dev/database/reading-data/indexes/
- Draft expiry: `expiresAt` timestamp on each draft, set at creation/last edit (30 days account drafts per #26). Enforcement two layers: query-side filter plus a daily cron (or `scheduler.runAfter` per draft) running an internal mutation that deletes expired drafts and their files. Auth is not propagated into scheduled functions, so the cleanup takes ids as args and re-checks inside.
  Sources: https://docs.convex.dev/scheduling/scheduled-functions, https://docs.convex.dev/scheduling/cron-jobs
- Server-side applicability checks (#24 hidden answers, #24/#25 role denials): standard `getAuthUserId` + load-user-doc + throw pattern. Role flag on the user doc, or `jwt.customClaims` for a `role` claim readable via `ctx.auth.getUserIdentity()`. Demo-admin denials (no publish/retire/withdraw/invite) enforced in each mutation; UI hiding is cosmetic.
  Sources: https://labs.convex.dev/auth/authz, https://labs.convex.dev/auth/advanced#custom-jwt-claims
- Seeded bootstrap admin (#25): a one-off internal mutation or deploy script that sets the role flag on the developer's user row by email from an env var; invites table covers the rest. Standard work.
- Session-validity footnote: `ctx.auth.getUserIdentity()` reflects JWT validity, so a deleted session reads valid until expiry. For this demo's threat level that is fine; only re-auth-sensitive or instant-revocation flows would need explicit session-doc checks.

## 4. Document upload and storage

- Standard three-step flow: mutation calls `storage.generateUploadUrl()` (this is the who-may-upload gate) -> client POSTs file bytes (URL expires in 1 hour) -> mutation saves the storage id into the data model.
  Source: https://docs.convex.dev/file-storage/upload-files
- No built-in MIME allowlist or max-size flag on upload URLs. Enforcement is app code, required in the saving mutation: read `ctx.db.system.get("_storage", storageId)` (`size`, `contentType`), `ctx.storage.delete()` + throw if it violates images/PDF-only and ~5MB. Client `accept` + `file.size` pre-check is cosmetic only.
  Source: https://docs.convex.dev/file-storage/file-metadata
- Size ceilings that matter: upload-URL POSTs have no file-size cap (2-minute timeout instead); serving through HTTP actions caps at 20MB. A 5MB cap sits comfortably inside both.
- No built-in file expiry and no cascade delete: deleting a draft does not delete its `_storage` rows. Draft-linked expiry must call `storage.delete(storageId)` per file in the same cleanup cron/mutation that deletes the expired draft. Files are never part of seeded examples per #26, so seeds carry no storage.
  Source: https://docs.convex.dev/file-storage/delete-files
- Serving files back to applicants/admins: `storage.getUrl(storageId)` URLs are bearer tokens (anyone with the URL reads; no expiry; delete to revoke) so gate who receives them in the query; or serve per-request through an HTTP action that checks ownership/role then returns the bytes. Either fits the view-submission need.
  Source: https://docs.convex.dev/file-storage/serve-files

## 5. Export / print of a completed form

Nothing Convex-specific blocks it. The plan stores a full denormalized submission snapshot (answers + pinned version + file refs + labels) as a normal document, queries it in a printable route, and renders with `window.print` + print CSS. Only generic value limits apply (1MB total document size, arrays up to 8192 values, objects up to 1024 entries); keep snapshots under that or reference files for bulk. PDF export beyond print-to-PDF is out of scope unless the plan adds it.

## 6. Abuse prevention: rate limits + optional CAPTCHA

- Official component exists: `@convex-dev/rate-limiter` (`convex.config.ts` + `RateLimiter` with fixed-window or token-bucket rules; `limit(ctx, name, { key: userId, throws: true })` in draft/submit/upload-URL mutations; `useRateLimit` client hook). Cost is one component plus per-check calls and config/testing surface; high-contention paths may need sharding. Right-sized for capping authenticated draft/submit writes. It is application-layer, not DDoS protection; fine for this demo.
  Sources: https://docs.convex.dev/agents/rate-limiting, https://github.com/get-convex/rate-limiter
- CAPTCHA (hCaptcha / Cloudflare Turnstile) stays conditional per #26: only if abuse appears, at OTP/submit. The anonymous-sign-in CAPTCHA concern from the Convex Auth docs falls away with #26 (no anonymous provider).

## 7. Rough effort (plan input, not a commitment)

- Convex Auth wiring (providers, Next.js provider + middleware, sign-in UI): small, measured in days; Google Cloud + Resend setup is dashboard work outside the repo.
- Schema + server functions (versioned forms, pinned drafts/submissions, invites, role enforcement, server-side applicability): the largest block, roughly half the backend work.
- Upload flow + validation + draft-linked expiry cron: modest, well-trodden path.
- Rate limiter + printable submission view + local-until-sign-in persistence: modest.
- Overall: no item above is research-grade; all are documented patterns. The only schedule risk is the Convex Auth beta/next-experimental surface (auth behavior changes across upgrades), mitigated by pinning `@convex-dev/auth` and keeping auth logic thin.

## Blockers and external setups

1. Convex deployment + `NEXT_PUBLIC_CONVEX_URL` for `apps/web/.env.local` (already required by `convex-provider.tsx`, currently unset in repo).
2. Google Cloud OAuth client (needs the Convex site URL for the redirect URI; production custom domain via `CUSTOM_AUTH_SITE_URL` if used).
3. Resend API key for OTP emails (`AUTH_RESEND_KEY`).
4. Pin `@convex-dev/auth` version; watch its changelog because of beta status.
5. No code blockers. No decision needs re-scoping.
