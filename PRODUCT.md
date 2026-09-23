# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a Trinidad and Tobago resident with a concrete task (passport renewal, police clearance, birth certificate) who wants to find the right form and move toward filling it out online.

Secondary, equal weight: an evaluator deciding whether online government forms could work. They need reassurance this is an honest demo with clear limits.

## Product Purpose

Show what completing T&T government paperwork online could feel like. The homepage routes a visitor to the right pilot form with clear direction. Success means the visitor finds their form, understands what the online version will ask, and tries a field without confusion about what is real.

## Positioning

Guided online completion instead of raw PDFs and portal links. The demo previews each form's sections, cites the official source it is modeled on, and lets visitors practice before any account or submission exists.

## Operating Context

Pilot scope: three forms plus one swap-in alternate (Certificate of Character, adult passport renewal, computerized birth certificate, NIS NI 4 alternate). Homepage search filters by name, agency, and keyword. Per-form intro pages preview sections and offer one local-only practice field. Sign-in (Google or email code, one account per address) gates future server saves. Full applicant fill and submit arrive later.

## Capabilities and Constraints

Confirmed: static catalog in `apps/web/lib/forms.ts`; local-only drafts via `useLocalDraft` (nothing reaches Convex before sign-in); working Convex Auth sign-in UI at `/signin`; homepage stays `force-dynamic` with a null-on-unreachable-backend fallback so browsing renders with no backend; cookie-auth rule (queries in Server Components, mutations from Server Actions or handlers; session refresh in `apps/web/proxy.ts`).

Must preserve: the "Demo, not a government service" badge, the real-email-vs-fake-answers wording, and every official source citation. No server fill or submit on the homepage or intro pages.

Undecided: which alternate (if any) swaps into the final three; the full application flow belongs to later tickets.

## Brand Commitments

Name: TT Forms Demo. Voice: plain, official, task-focused. Binding commitments: the quiet demo badge and the fake-data safety wording wherever forms appear. No invented claims about government affiliation or submission.

## Evidence on Hand

Real catalog data in `apps/web/lib/forms.ts` with official source URLs (TTPS portal, Immigration Division PDF, RGD PDF, NIB PDF). Working auth and seeded developer admin on the dev deployment. Absences future work must not fabricate: no submission endpoint, no testimonials, no usage metrics.

## Product Principles

1. Search first, explanation second. The fastest path to the right form wins.
2. Every step names its direction. The visitor always knows what happens next.
3. The demo never pretends to be the government. Limits are stated, not footnoted.
4. Practice is safe by default. Fake answers stay local until sign-in earns a save.
