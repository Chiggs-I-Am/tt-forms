import { defineApp } from "convex/server"
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js"

// App-level component wiring for #40. Registers the official
// @convex-dev/rate-limiter component as `rateLimiter`; the named limits live
// in ./rateLimits.ts and are enforced per-user inside the authenticated
// write-path mutations only.
const app = defineApp()
app.use(rateLimiter)

export default app
