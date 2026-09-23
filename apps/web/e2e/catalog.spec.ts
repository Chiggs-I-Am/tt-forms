import { expect, test } from "@playwright/test"

// Anonymous catalog flows: the landing search filters the static pilot
// catalog, and the catalog page lists every pilot with its agency.
test("landing search filters the pilot catalog", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Which form do you need?" })
  ).toBeVisible()

  const search = page.getByRole("combobox", { name: /search by name/i })
  await search.fill("passport")
  await expect(
    page.getByRole("option", { name: /passport/i }).first()
  ).toBeVisible()
  await expect(page.getByRole("option", { name: /passport/i })).toHaveCount(1)

  await search.fill("birth")
  await expect(
    page.getByRole("option", { name: /birth certificate/i })
  ).toBeVisible()
  await expect(page.getByRole("option", { name: /passport/i })).toHaveCount(0)
})

test("landing suggestion narrows to the matching form", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "police", exact: true }).click()
  await expect(
    page.getByRole("option", { name: /police service/i })
  ).toBeVisible()
  await expect(page.getByRole("option")).toHaveCount(1)
})

test("catalog lists all pilots with agencies", async ({ page }) => {
  await page.goto("/forms")
  await expect(
    page.getByRole("heading", { name: "Browse demo forms" })
  ).toBeVisible()
  await expect(page.getByText("Demonstration only.")).toBeVisible()
  await expect(page.getByText("Certificate of Character").first()).toBeVisible()
  await expect(
    page.getByText("Trinidad and Tobago Police Service")
  ).toBeVisible()
  await expect(page.getByText(/passport renewal/i).first()).toBeVisible()
  await expect(page.getByText(/birth certificate/i).first()).toBeVisible()
  await expect(page.getByText(/NIS registration/i).first()).toBeVisible()
})
