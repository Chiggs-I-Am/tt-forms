import { expect, test } from "@playwright/test"

// Anonymous denied states: applicant and admin routes never leak rows or
// crash without sign-in or without a backend. Every branch below renders an
// honest notice with a way forward instead.
test("my applications asks anonymous visitors to sign in", async ({ page }) => {
  await page.goto("/applications")
  await expect(
    page.getByRole("heading", { name: "My applications" })
  ).toBeVisible()
  await expect(
    page.getByText("Sign in to see the applications you submitted.")
  ).toBeVisible()
  // The navbar may render its own sign-in link; the page notice is the last.
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible()
})

test("admin landing asks anonymous visitors to sign in", async ({ page }) => {
  await page.goto("/admin")
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible()
  await expect(page.getByText("Sign in first")).toBeVisible()
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible()
})

test("builder and applicant list show honest denied states", async ({
  page,
}) => {
  await page.goto("/admin/forms")
  await expect(
    page.getByRole("heading", { name: "Form builder" })
  ).toBeVisible()
  await expect(page.getByText("Developer-admin only")).toBeVisible()

  await page.goto("/admin/applicants")
  await expect(page.getByRole("heading", { name: "Applicants" })).toBeVisible()
  await expect(page.getByText("Developer-admin only")).toBeVisible()
})

test("unknown application id explains itself", async ({ page }) => {
  await page.goto("/applications/00000000000000000000000000000000")
  // Next's hidden route announcer also carries role=alert; exclude it so the
  // honest notice is the only match.
  const loadError = page.locator(
    '[role="alert"]:not(#__next-route-announcer__)'
  )
  await expect(
    page
      .getByText("Sign in to see the applications you submitted.")
      .or(loadError)
      .or(page.getByText("Submission not found."))
  ).toBeVisible()
})
