import { defineApp } from "convex/server";
import component from "@convex-dev/rate-limiter/convex.config.js";

// App-level component wiring for #40. Registers the official
// @convex-dev/rate-limiter component as `rateLimiter`; the named limits live
// in ./rateLimits.ts and are enforced per-user inside the authenticated
// write-path mutations only.
const createApp = () => {
  const app = defineApp();
  app.use(component);
  return app;
};

export default createApp();
