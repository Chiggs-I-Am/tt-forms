import { HOUR, RateLimiter } from "@convex-dev/rate-limiter"
import { components } from "./_generated/api.js"

// Abuse guard for #40: per-user fixed-window limits on every authenticated
// write path (draft save/replace, submit, upload-URL issue, save-file,
// invite create/claim). Numbers are demo-sized on purpose: the browser
// autosaves at most every ~2s while answers change, so draftSave at 1000/hr
// covers half an hour of nonstop editing and never trips a real applicant;
// sustained scripted writes trip it. The rarer actions (replace, submit,
// invites) sit at 30/hr and uploads at 120/hr, both far above any honest
// session with room for retries. Limits throw ConvexError denials via
// `throws: true`; callers see "rate limited, retry later", never a row.
//
// `components.rateLimiter` is cast because this repo never runs
// `convex codegen` in CI, so `_generated/api.d.ts` cannot carry the
// component's typed name. The cast is to the constructor's own parameter
// type, never `any`.
//
// CAPTCHA (hCaptcha or Turnstile) sits in reserve at OTP and submit if abuse
// appears: documented here, not enforced in code. If scripted sign-ups or
// submissions ever show up, wire the provider challenge into the OTP verify
// step and the submit confirm, then tighten the windows below.
type RateLimiterComponent = ConstructorParameters<typeof RateLimiter>[0]

const component = (
  components as unknown as { rateLimiter: RateLimiterComponent }
).rateLimiter

export const rateLimiter = new RateLimiter(component, {
  draftSave: { kind: "fixed window", rate: 1000, period: HOUR },
  draftReplace: { kind: "fixed window", rate: 30, period: HOUR },
  submit: { kind: "fixed window", rate: 30, period: HOUR },
  uploadUrl: { kind: "fixed window", rate: 120, period: HOUR },
  saveFile: { kind: "fixed window", rate: 120, period: HOUR },
  inviteCreate: { kind: "fixed window", rate: 30, period: HOUR },
  inviteClaim: { kind: "fixed window", rate: 30, period: HOUR },
})
