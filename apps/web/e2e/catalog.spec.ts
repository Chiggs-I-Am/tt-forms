import { expect, test } from "@playwright/test";

// Anonymous catalog flows: the landing search filters the static pilot
// catalog, and the catalog page lists every pilot with its agency.
test("landing search filters the pilot catalog", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Which form do you need?" })
  ).toBeVisible();

  const search = page.getByRole("combobox", { name: /search by name/iu });
  await search.fill("passport");
  await expect(
    page.getByRole("option", { name: /passport/iu }).first()
  ).toBeVisible();
  await expect(page.getByRole("option", { name: /passport/iu })).toHaveCount(1);

  await search.fill("birth");
  await expect(
    page.getByRole("option", { name: /birth certificate/iu })
  ).toBeVisible();
  await expect(page.getByRole("option", { name: /passport/iu })).toHaveCount(0);
});

test("landing suggestion narrows to the matching form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { exact: true, name: "police" }).click();
  await expect(
    page.getByRole("option", { name: /police service/iu })
  ).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(1);
});

test("catalog lists all pilots with agencies", async ({ page }) => {
  await page.goto("/forms");
  await expect(
    page.getByRole("heading", { name: "Browse demo forms" })
  ).toBeVisible();
  await expect(page.getByText("Demonstration only.")).toBeVisible();
  await expect(
    page.getByText("Certificate of Character").first()
  ).toBeVisible();
  await expect(
    page.getByText("Trinidad and Tobago Police Service")
  ).toBeVisible();
  await expect(page.getByText(/passport renewal/iu).first()).toBeVisible();
  await expect(page.getByText(/birth certificate/iu).first()).toBeVisible();
  await expect(page.getByText(/NIS registration/iu).first()).toBeVisible();
});
