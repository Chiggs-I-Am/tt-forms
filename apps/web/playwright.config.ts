import { defineConfig } from "@playwright/test"

// Anonymous browser flows for #40. One chromium project against a local
// `bun run dev` on port 3100: port 3000 is left alone because a sibling
// checkout may already serve it. Convex backend env (NEXT_PUBLIC_CONVEX_URL
// plus the server-side Convex auth vars) is required for anything past the
// honest no-backend states: point NEXT_PUBLIC_CONVEX_URL at a real
// deployment and the section-render and fill-persistence specs exercise the
// live versions instead of skipping. Without a backend the dev server runs
// on the dummy URL below and every server read falls back to its honest
// denied/empty notice, which is what the specs assert here.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  // Cold Next dev compiles can take a few seconds per route; tolerate them.
  expect: { timeout: 15_000 },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "bun run dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_CONVEX_URL:
        process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://example.invalid",
    },
  },
})
