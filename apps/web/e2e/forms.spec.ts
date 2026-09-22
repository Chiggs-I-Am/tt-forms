import { expect, test } from "@playwright/test"

// Anonymous form-page flows, one spec per pilot slug. With a live Convex
// backend (see playwright.config.ts) each page renders every section from
// the published version; without one it renders the honest unavailable
// notice and keeps the static intro (agency, name, source, demo line).
const pilots = [
  {
    slug: "certificate-of-character",
    name: "Certificate of Character",
    agency: "Trinidad and Tobago Police Service",
  },
  {
    slug: "adult-passport-renewal",
    name: "Adult passport renewal (16+)",
    agency: "Immigration Division",
  },
  {
    slug: "computerized-birth-certificate",
    name: "Computerized birth certificate (RGD 14A)",
    agency: "Registrar General's Department",
  },
  {
    slug: "nis-ni4",
    name: "NIS registration (NI 4)",
    agency: "National Insurance Board",
  },
] as const

for (const pilot of pilots) {
  test(`${pilot.slug} shows its intro and sections or the honest fallback`, async ({
    page,
  }) => {
    await page.goto(`/forms/${pilot.slug}`)
    await expect(page.getByRole("heading", { name: pilot.name })).toBeVisible()
    await expect(page.getByText(pilot.agency).first()).toBeVisible()
    await expect(page.getByText("Official source:")).toBeVisible()
    await expect(
      page.getByText("Your sign-in email is real; every answer must be fake.")
    ).toBeVisible()

    const unavailable = page.getByText("This form is unavailable right now.")
    if (await unavailable.isVisible()) {
      await expect(
        page.getByText("The demo backend may be unreachable.")
      ).toBeVisible()
      return
    }
    // Live backend: every section of the published version renders.
    await expect(page.getByRole("progressbar")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible()
  })
}

test("local fill persists across reload via localStorage", async ({ page }) => {
  await page.goto("/forms/certificate-of-character")
  if (await page.getByText("This form is unavailable right now.").isVisible()) {
    test.skip(true, "Needs a live backend: no sections render without one.")
  }
  const firstName = page.getByLabel(/first name/i).first()
  await firstName.fill("Anya Bhim")
  await page.reload()
  await expect(page.getByLabel(/first name/i).first()).toHaveValue("Anya Bhim")
})
