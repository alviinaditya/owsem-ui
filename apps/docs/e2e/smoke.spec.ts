import { expect, test } from "@playwright/test";
import { demo } from "./example-page.ts";

test("serves the registry at /r without a language prefix (DS-7)", async ({ request }) => {
  const catalog = await request.get("/r/registry.json", { maxRedirects: 0 });
  expect(catalog.ok()).toBe(true);
  expect(catalog.headers()["access-control-allow-origin"]).toBe("*");

  for (const name of [
    "core",
    "core-cn",
    "tokens",
    "button",
    "button-tailwind",
    "separator",
    "toggle-group",
  ]) {
    const item = await request.get(`/r/${name}.json`, { maxRedirects: 0 });
    expect(item.ok()).toBe(true);
    expect((await item.json()).name).toBe(name);
  }
});

test("a registry item brings only what it imports, and the flavors stay apart", async ({
  request,
}) => {
  const item = async (name: string) => (await request.get(`/r/${name}.json`)).json();
  const paths = (entry: { files?: { path: string }[] }) => (entry.files ?? []).map((f) => f.path);

  // Core is split per module; no component depends on the whole of it.
  const separator = await item("separator");
  expect(separator.registryDependencies).toEqual(["@owsem/core-cn", "@owsem/tokens"]);
  const button = await item("button");
  expect(button.registryDependencies).not.toContain("@owsem/core");
  expect(button.registryDependencies).not.toContain("@owsem/tailwind-setup");

  // The Tailwind flavor has its own set, its own setup, and the packages it needs.
  const tailwind = await item("button-tailwind");
  expect(tailwind.registryDependencies).toContain("@owsem/tailwind-setup");
  expect(tailwind.registryDependencies).toContain("@owsem/core-cn-tailwind");
  expect(tailwind.dependencies).toContain("class-variance-authority");
  expect(paths(tailwind).some((path) => path.endsWith(".css"))).toBe(false);
  expect(paths(await item("tailwind-setup"))).toEqual(["src/tailwind-setup/tailwind.css"]);

  // Nothing in the registry carries the repo's lint pragmas or PRD ids.
  for (const name of ["button", "tokens", "core-glide", "combobox-tailwind"]) {
    for (const file of (await item(name)).files) {
      expect(file.content, `${name}/${file.path}`).not.toMatch(
        /biome-ignore|\b(?:NF|FR|TK|DP|DS|CLI|DX)-\d+/,
      );
    }
  }
});

test("renders a component page in each language", async ({ page }) => {
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
  "/en/switch",
  "/id/toggle-group",
  "/en/command-menu",
  "/en/scroll-area",
  "/id/table-of-contents",
  "/en/icon-morph",
  "/id/copy-button",
  "/en/code-block",
  "/id/tabs",
  "/en/button",
  "/en/checkbox",
  "/en/radio-group",
  "/en/dialog",
  "/en/select",
  "/id/combobox",
  "/en/autocomplete",
  "/en/input",
  "/id/field",
  "/en/fieldset",
  "/id/form",
  "/en/avatar",
  "/id/progress",
  "/en/meter",
  "/id/meter",
  "/en/accordion",
  "/id/checkbox-group",
  "/en/number-field",
  "/id/slider",
  "/en/otp-field",
  "/id/alert-dialog",
  "/en/preview-card",
  "/id/drawer",
  "/en/context-menu",
  "/id/menubar",
  "/en/navigation-menu",
  "/id/navigation-menu",
  "/id/toast",
  "/id/collapsible",
]) {
  test(`${path} has no horizontal scroll (DS-9)`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
