# Implementation plan: manual-to-online government forms prototype

Status: draft for review. Assembles wayfinder decisions 22 through 27 on map
#21 into one buildable spec. Nothing here re-decides; where a later ticket
revised an earlier one, the revision wins and the superseded line is named.

Source decisions:

- #22 Official pilot form selection (evidence in `docs/research/pilot-forms.md`)
- #23 Applicant accounts, sessions, and saved progress, as revised by #26
- #24 Form data model, builder capabilities, and versioning
- #25 Admin roles and user management
- #26 Demo-data safeguards, which revises #23 to sign-in-before-write
- #27 Technical feasibility check (evidence in
  `docs/research/technical-feasibility.md`)

## What we are building

A public demo that shows what completing Trinidad and Tobago government forms
online could look like today. Applicants find a few real forms, fill them in,
and submit. The app saves applications to its own database. There is no
government affiliation, no agency cooperation, and no claim of receipt.
Admins build and publish forms, view submissions, and manage users. The AI
assistant and any real government delivery are later phases, not this one.

Stack: Next.js 16.3.3, React 19.2.4, Convex 1.46.0, shadcn/ui, Turborepo,
bun. Auth and storage are evaluated against that stack in #27, not re-decided
here.

## Pilot forms

Build three official forms, with a fourth held as alternate:

- Certificate of Character (TTPS), source https://services.ttps.gov.tt/coc.
  Personal details, ID type and number, photo upload, appointment date and
  station choice.
- Adult passport renewal, 16 and over (Immigration Division), source
  https://foreign.gov.tt/documents/1752/ADULT_RENEWAL_APPLICATION_FORM_FOR_TRINIDAD_AND_TOBAGO_PASSPORT.pdf.
  Long multi-section form with conditionals, two references, declaration.
- Computerized birth certificate (Registrar General, RGD 14A), source
  https://foreign.gov.tt/documents/361/Application_for_Computerized_Birth_Certificate.pdf.
  Third-party application logic, ID-type select, purpose.
- Alternate: NIS NI 4, register as an employed person, source
  https://www.nibtt.net/NI_4.pdf. Swap in if one of the three proves awkward
  to model.

Together these exercise every builder capability: uploads, selects,
conditional questions, repeatable groups, declarations. All three carry
official ID-number fields, which is why the demo-data safeguards below are
mandatory, not optional.

## Applicant accounts and saved progress

Sign-in-to-save. Browsing stays anonymous and filling stays local in browser
state, but the first Convex write requires sign-in. There are no Guest Convex
saves. This is the #26 revision of #23, and it replaces the silent guest
session plus guest-to-account merge path entirely. The anonymous 7-day draft
expiry from #23 no longer applies.

- Two sign-in methods, no passwords: Google OAuth and email OTP. The same
  verified email lands on one user automatically, so Google and OTP share an
  account with no custom linking code.
- Before sign-in, answers live in component state plus a `localStorage`
  backup. Persist to `localStorage` before the Google redirect and restore
  after the callback. OTP needs no redirect handling.
- After sign-in, answers autosave to Convex as a draft. One active draft per
  account and form, with a 30-day expiry after the last edit and the expiry
  date visible to the applicant.
- Where an account already holds a draft of the same form and version, the
  sign-in save prompts with previews and merges: fill empty fields
  automatically, keep matching answers, ask which answer to use where they
  differ, discard neither until the merged draft saves.
- On autosave failure, keep answers on screen, show "Not saved", and retry.
  Submission is never shown as successful until Convex confirms it.
- Submitted applications become read-only and appear under "My
  applications". Starting a new draft of the same form is allowed.
- Real email addresses are collected for authentication only. Every form
  answer must be fake. #26 states this split wherever it matters.

## Form data model, builder, and versioning

Structured builder. No code, no arbitrary layouts, no scripting, no custom
regex editor. Admins rebuild the three pilot forms from scratch with
predefined pieces. Keep the official questions and requirements, rewrite
instructions and reorganize sections for online use, and mark any demo
substitution explicitly.

- Field types: short and long text, number, date, email, phone, single and
  multiple choice, yes/no, uploads, declaration checkboxes. Built-in rules
  only: required answers, length and range limits, date bounds, repeat
  counts. Validate in the browser and again on submission.
- Structure: ordered sections shown one at a time, with section help text
  and per-field hints. Conditions read earlier choice answers with all or any
  matching. One level of repeated groups with minimum and maximum counts.
  The passport form needs exactly two references. The guardian section uses
  an explicit age-band choice ("Are you under 18?"); date of birth stays a
  separate field with no automated age-consistency check in this demo.
- Hidden answers stay in the saved draft until its normal expiry and return
  if the section becomes visible again, but they skip required checks and
  are excluded from the submitted application while hidden. The server
  decides which answers apply. The browser is not trusted.
- One editable working copy per form. Editing never touches the live form.
  Applicant-style preview uses disposable answers. Publish is explicit, after
  checks for invalid rules, missing labels or options, and incomplete source
  information. Publishing snapshots an immutable version.
- Drafts and submissions pin the published version they started with and
  stay submittable under its rules until the normal draft expiry. New drafts
  use the latest version. Submissions keep their original definition.
- Same-version drafts at sign-in merge per the accounts rules above.
  Different versions never migrate silently: show both previews, let the
  applicant pick which draft to continue, retire the other only on explicit
  confirmation.
- Retirement stops new drafts; existing drafts stay submittable until
  expiry. Emergency withdrawal additionally blocks submission of existing
  drafts, keeps answers readable until expiry, and explains why. Neither
  deletes submitted applications.

## Admin roles and user management

Two roles: applicant and admin. Within admin there are two accounts with
different powers, both held by the developer. Visitors never sign in as
admin. A public read-only admin walkthrough is an explicit fast-follow, not
part of this plan.

- Developer-admin holds full powers: build, preview, publish new versions,
  retire, emergency-withdraw, view submissions, view the applicant list,
  invite further admins.
- Demo-admin drafts and previews with disposable answers only. It cannot
  publish, retire, emergency-withdraw, or invite. Every one of these denials
  is enforced server-side in each mutation. Hiding the buttons in the UI is
  cosmetic and never the enforcement.
- First developer-admin is seeded via a deploy env email through a one-off
  internal mutation or deploy script. All further admins come by
  existing-admin invite only. No public self-promotion, no approval queue, no
  shared secret.
- Invites are email-bound, single-use, 7-day expiry. The invitee signs in
  with the matching email through the same Google or OTP flow and gains the
  granted admin level automatically.
- Admin sign-in uses the same methods as applicants. The role is a flag on
  the user. No admin-only method, no extra factor in this demo.
- Applicant administration is view-only: the admin sees the applicant list
  with real sign-in emails plus submission counts, and each submission with
  its fake answers. No in-app delete, disable, edit, or impersonation. No
  admin editing of submitted applications. Manual cleanup stays out-of-band
  in the Convex dashboard.

Note on wording: the feasibility input in #25 says anonymous-guest flows
carry over unchanged from #23. #26 supersedes that for the anonymous part.
Google and OTP flows are unchanged and validated in #27.

## Demo-data safeguards

The whole site reads as a demo. No government affiliation, no claim of
receipt. Quiet but persistent: one small site-wide quiet-badge plus one
short line on each form start page and at submit. No DEMO plastered in every
input, no enforced DEMO- prefix.

- The real-email versus fake-answers split is stated at the badge, the form
  intro, sign-in, and submit confirm: the sign-in email is real and used
  only for authentication, every form answer must be fake. The admin
  applicant list carries the same wording where real emails sit next to fake
  answers.
- Identity-number fields use guided-fake-input: placeholder examples plus
  helper text reminding visitors to invent a number. No demo-format
  validation, no masking, no blocking of real-looking numbers.
- Uploads are images and PDF only, about 5MB max, with a fake-only reminder
  at the upload step. Files expire with their draft and are never part of
  seeded examples.
- Seed 1-2 submissions per pilot form so admin views are not empty. No
  per-record FAKE stamp; the site demo context carries the meaning.
- Abuse prevention: no anonymous writes removes the largest vector. The plan
  still requires rate limits on authenticated draft, submit, and upload
  writes, with CAPTCHA at OTP and submit held in reserve if abuse appears.

## Technical approach

Validated in #27 against the repo stack. No decision needs re-scoping, no
code blockers. One beta caveat is carried openly: Convex Auth is in beta and
its Next.js server support is experimental, so keep auth logic thin, keep
auth-sensitive reads and writes in client components plus Convex functions,
and pin `@convex-dev/auth` at 0.0.95. Watch its changelog; that is the only
schedule risk.

- Auth wiring: `@convex-dev/auth` with Google OAuth as a first-class
  provider and email OTP as a custom Resend provider. Cookie-auth rule
  applies: only queries in Server Components and GET handlers, mutations
  from Server Actions or POST and PUT handlers. Treat middleware-gated
  routes as nice-to-have.
- Schema in standard Convex tables: working-copy `forms`, immutable
  `formVersions`, pinned `drafts` and `submissions`, `files` metadata, a
  `users` role flag holding applicant, developer-admin, or demo-admin, and
  email-bound single-use 7-day `invites`. Submissions store a denormalized
  snapshot with answers, pinned version, file refs, and rendered labels for
  the printable view. Published-version immutability, role denials,
  ownership, and hidden-answer applicability are mutation-level rules using
  the standard `getAuthUserId` plus load-and-check pattern.
- One real limitation to respect: Convex has no true database unique
  constraint. One active draft per owner and form is a composite index plus
  check-and-reuse inside every write-path mutation. Correct under normal
  use, soft under concurrent duplicate inserts. Accept for a demo and note
  it in code.
- Draft expiry is an `expiresAt` timestamp set at creation and refreshed on
  edit, enforced by query-side filtering plus a daily cron or
  `scheduler.runAfter` cleanup running an internal mutation that deletes
  expired drafts and their files. Scheduled functions do not receive auth,
  so the cleanup takes ids as args and re-checks inside.
- Uploads use the standard three-step flow: a mutation issues the upload URL
  (this is the who-may-upload gate), the client POSTs the bytes, a mutation
  saves the storage id. Type and size are enforced in the saving mutation by
  reading the `_storage` row and deleting plus rejecting on violation.
  Client `accept` and size pre-checks are cosmetic. There is no built-in
  expiry or cascade delete, so the draft-expiry cleanup deletes each file
  explicitly. 5MB sits well inside Convex ceilings.
- File serving: `getUrl` links are bearer tokens with no expiry, so gate who
  receives them in the query, or serve per-request through an HTTP action
  that checks ownership or role first. Deletion revokes access.
- Print and export: render the denormalized submission snapshot in a
  printable route with print CSS. Keep snapshots under the 1MB document
  ceiling. PDF beyond print-to-PDF is out of scope.
- Abuse: the `@convex-dev/rate-limiter` component on authenticated
  draft, submit, and upload writes. CAPTCHA through hCaptcha or Turnstile
  stays conditional.

## External setups before implementation

Convex deployment plus `NEXT_PUBLIC_CONVEX_URL`, a Google Cloud OAuth
client with the Convex site URL as redirect target, a Resend API key as
`AUTH_RESEND_KEY`, and the pinned `@convex-dev/auth` version. The first
three are dashboard work outside the repo.

## Suggested build order

Rough effort from #27: auth wiring plus dashboard setup is small, schema
plus server functions is the largest block at about half the backend, and
uploads with expiry, rate limits, the print view, and local-until-sign-in
persistence are modest documented patterns.

1. External setups and auth wiring with sign-in UI.
2. Schema plus server functions: versioned forms, pinned drafts and
   submissions, invites, role enforcement, server-side applicability.
3. Builder with working copy, disposable preview, publish checks, retire and
   withdraw.
4. Applicant flow: browse, fill locally, sign-in-to-save, merge prompts,
   submit, My applications.
5. Safeguards: quiet-badge, per-form lines, guided-fake-input, seeded
   examples, upload limits with draft-linked expiry, rate limits.
6. Admin views, applicant list wording, printable submission route.

## Terms for the future glossary

No CONTEXT.md exists yet, so carry these forward for domain-modeling when
it is created: applicant, draft, submission, quiet-badge, sign-in-to-save,
guided-fake-input, plus the developer-admin versus demo-admin split from
#25. Flag if any usage in this plan drifts from how the tickets used them.

## Explicitly out of scope

AI assistance in the form-filling workflow, real government submission or
agency integration, approval or review or corrections workflows, real
personal data in answers, in-app user deletion or impersonation, and PDF
export beyond print-to-PDF.
