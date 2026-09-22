# Authenticated flows, manual script

Headless Playwright cannot do these: OTP needs a real inbox and Google needs
interactive consent, and this repo has no test auth provider by design. Run
this script once per release against a deployment with a live Convex backend
and seeded pilots. It matches the pass already performed manually during
#40.

## Setup

- Start the app against the deployment under test.
- You need one email inbox you control and, for the Google pass, a Google
  account on that same address.

## OTP applicant pass

1. Open the catalog, search "passport", and open Adult passport renewal.
2. Fill the first section with invented answers. For every ID-number field,
   confirm the placeholder shows an invented example and the hint says to
   invent a number. Reload the page and confirm the answers persist from
   this browser.
3. Start Google sign-in in a new tab but stop before consent, or skip it.
   Instead sign in with OTP: enter your real email, take the code from your
   inbox, verify, and confirm you land back with your local answers intact.
4. Confirm the draft autosaves with a visible expiry date. Break the
   connection if you like and confirm the "Not saved" state with retry.
5. Step through every section, submit, and confirm success appears only
   after the server confirms.
6. Open My applications and confirm the row is read-only with its version.
   Open it, confirm the printable view, and print to PDF.
7. Start a new draft of the same form and confirm the old submission stays
   untouched.

## Google same-email pass

1. Sign out, then sign in with Google on the same address as the OTP pass.
2. Confirm you land on one account: My applications shows the same rows,
   and no second applicant appears in the admin list.

## Admin denials

1. As a plain applicant, open /admin/forms and /admin/applicants and
   confirm both show the developer-admin denial instead of rows.
2. As a demo-admin (invite one via the invites page), confirm the builder
   preview works with disposable answers while publish, retire, withdraw,
   and invite issue all fail server-side.
3. As a developer-admin, confirm the applicant list shows real sign-in
   emails with submission counts plus the fake-answers wording, and that
   each submission opens with its fake answers under the pinned version.
