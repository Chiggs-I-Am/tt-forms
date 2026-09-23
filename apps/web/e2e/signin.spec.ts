import { expect, test } from "@playwright/test"

// Anonymous sign-in page: both Google and email-OTP paths render with the
// real-email versus fake-answers split. Clicking through needs a live
// backend and a real inbox or Google consent, so the authenticated script
// lives in ./authenticated-manual.md instead.
test("sign-in page shows Google, OTP, and the email split", async ({
  page,
}) => {
  await page.goto("/signin")
  await expect(
    page.getByRole("heading", { name: "Sign in to save your progress" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Continue with Google" })
  ).toBeVisible()
  await expect(page.getByLabel("Email address")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Send sign-in code" })
  ).toBeVisible()
  await expect(
    page.getByText("Your sign-in email is real and only used for")
  ).toBeVisible()

  await page.getByLabel("Email address").fill("applicant@example.com")
  await page.getByRole("button", { name: "Send sign-in code" }).click()
  // Live backend: the code step appears. Without one the client surfaces
  // its honest send failure. Either proves the OTP form is wired. The
  // hidden Next route announcer is excluded from the alert match.
  await expect(
    page
      .getByLabel("8-digit code")
      .or(page.locator('[role="alert"]:not(#__next-route-announcer__)'))
  ).toBeVisible({ timeout: 15000 })
})
