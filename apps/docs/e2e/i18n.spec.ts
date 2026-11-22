import { expect, test } from "@playwright/test";

for (const [acceptLanguage, lang] of [
  ["en-US,en;q=0.9", "en"],
  ["id-ID,id;q=0.9", "id"],
  ["fr-FR", "id"],
] as const) {
  test(`redirects unprefixed URLs by Accept-Language: ${acceptLanguage} -> ${lang}`, async ({
    request,
  }) => {
    for (const path of ["/", "/docs"]) {
      const response = await request.get(path, {
        headers: { "accept-language": acceptLanguage },
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(new URL(response.headers().location ?? "", "http://x").pathname).toBe(
        `/${lang}${path === "/" ? "" : path}`,
      );
    }
  });
}

test("renders each language with its own lang, text, and hreflang links", async ({ page }) => {
  await page.goto("/en/docs");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // The trigger names the current language; the menu lists each as a link.
  const trigger = page.getByRole("button", { name: "Language: English" });
  await trigger.click();
  const toId = page.getByRole("menuitem", { name: "Bahasa Indonesia" });
  await expect(toId).toBeVisible();
  await expect(toId).toHaveAttribute("hreflang", "id");
  await expect(page.getByRole("menuitem", { name: "English" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute(
    "href",
    /\/id\/docs$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    "href",
    /\/docs$/,
  );

  await toId.click();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await page.getByRole("button", { name: "Bahasa: Bahasa Indonesia" }).click();
  await expect(page.getByRole("menuitem", { name: "English" })).toHaveAttribute("hreflang", "en");
});

test("unknown pages return 404", async ({ request }) => {
  expect((await request.get("/en/does-not-exist")).status()).toBe(404);
  expect((await request.get("/en/docs/does-not-exist")).status()).toBe(404);
});
