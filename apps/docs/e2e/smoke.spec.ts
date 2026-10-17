import { expect, test } from "@playwright/test";

test("serves the registry at /r without a language prefix (DS-7)", async ({ request }) => {
  const catalog = await request.get("/r/registry.json", { maxRedirects: 0 });
  expect(catalog.ok()).toBe(true);
  expect(catalog.headers()["access-control-allow-origin"]).toBe("*");

  const core = await request.get("/r/core.json", { maxRedirects: 0 });
  expect(core.ok()).toBe(true);
  expect((await core.json()).name).toBe("core");
});

for (const path of ["/id", "/en/docs"]) {
  test(`${path} has no horizontal scroll (DS-9)`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
