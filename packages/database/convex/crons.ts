import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

// Daily expiry sweep for #36. convex-test cannot run crons, so tests call
// purgeExpired directly; this schedule only wires it in production.
const crons = cronJobs()
crons.daily(
  "purge-expired-drafts",
  { hourUTC: 5, minuteUTC: 0 },
  internal.drafts.purgeExpired,
  {}
)

export default crons
