import { expect, test } from "@playwright/test";
import { demo } from "./lab.ts";

test("serves the registry at /r without a language prefix (DS-7)", async ({ request }) => {
  const catalog = await request.get("/r/registry.json", { maxRedirects: 0 });
  expect(catalog.ok()).toBe(true);
  expect(catalog.headers()["access-control-allow-origin"]).toBe("*");

  for (const name of ["core", "button", "separator", "toggle-group"]) {
    const item = await request.get(`/r/${name}.json`, { maxRedirects: 0 });
    expect(item.ok()).toBe(true);
    expect((await item.json()).name).toBe(name);
  }
});

test("renders a component Lab in each language", async ({ page }) => {
  for (const lang of ["id", "en"]) {
    await page.goto(`/${lang}/separator`);
    await expect(page.getByRole("heading", { level: 1, name: "Separator" })).toBeVisible();
    await expect(demo(page).getByRole("separator")).toBeVisible();
  }
});

for (const path of [
  "/id",
  "/en/docs",
  "/id/docs/theming",
  "/id/docs/glide",
  "/en/docs/accessibility",
  "/id/docs/skills",
  "/en/docs/changelog",
  "/id/separator",
  "/id/toggle-group",
  "/en/command-menu",
  "/id/table-of-contents",
  "/en/button",
]) {
  test(`${path} has no horizontal scroll (DS-9)`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
