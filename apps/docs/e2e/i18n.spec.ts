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

test("renders each language with its own lang, text, and hreflang links", async ({
  page,
}, testInfo) => {
  // Below 1100 px the language switcher lives in the sidebar, which the dock's Menu opens.
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const mobile = testInfo.project.name === "mobile-390";
  await page.goto("/en/docs");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  if (mobile) await menu.click();
  await expect(page.getByRole("navigation", { name: "Language" })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute(
    "href",
    /\/id\/docs$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    "href",
    /\/docs$/,
  );

  await page.getByRole("link", { name: "Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  if (mobile) await menu.click();
  await expect(page.getByRole("navigation", { name: "Bahasa" })).toBeVisible();
});

test("unknown pages return 404", async ({ request }) => {
  expect((await request.get("/en/does-not-exist")).status()).toBe(404);
  expect((await request.get("/en/docs/does-not-exist")).status()).toBe(404);
});
