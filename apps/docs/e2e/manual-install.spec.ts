import { expect, type Page, test } from "@playwright/test";
import { catalog, isAvailable } from "../lib/catalog.ts";
import { docs, visit } from "./example-page.ts";

// The Manual install in a component page's Docs (Installation): files to copy, in numbered steps.
// Every component has both flavors; both are in the page and one is hidden, so a check looks at
// what is visible. CSS is the flavor until the visitor picks Tailwind.
const manual = (page: Page) => docs(page).locator(".manual");

async function openManual(page: Page, path: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, `${path}#installation`);
  await docs(page).getByRole("tab", { name: "Manual" }).click();
  await expect(manual(page)).toBeVisible();
}

test.beforeEach(async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the Docs column needs a wide screen");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

test("the Command tab keeps the npm install; Manual lists the steps and the files", async ({
  page,
}) => {
  await visit(page, "/en/sidebar#installation");
  await expect(docs(page).getByRole("tab", { name: "Command" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(docs(page).getByText("pnpm add owsem-ui")).toBeVisible();

  await docs(page).getByRole("tab", { name: "Manual" }).click();
  await expect(docs(page).getByText("pnpm add owsem-ui")).toBeHidden();
  const steps = manual(page).locator(".manual-step__title:visible");
  await expect(steps).toHaveText([
    "Install the dependencies",
    "Add the theme tokens",
    "Copy the component files",
    "Update the import paths",
  ]);
  await expect(manual(page).locator(".manual-step:visible").first()).toContainText(
    "@base-ui/react",
  );
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "lib/owsem/tokens.css",
    "components/owsem/sidebar/sidebar.tsx",
    "components/owsem/sidebar/sidebar.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(manual(page)).toContainText('@import "./lib/owsem/tokens.css";');
});

test("the Manual files are not in the page until the tab opens", async ({ page, request }) => {
  const html = await (await request.get("/en/button")).text();
  expect(html).not.toContain("button-variants");
  expect(html).not.toContain("use-ripple");
  await openManual(page, "/en/button");
  await expect(manual(page)).toContainText("button-variants");
});

test("every component page's Manual offers the Tailwind choice", async ({ request }) => {
  const names = catalog.filter(isAvailable).map((entry) => entry.name);
  expect(names.length).toBe(47);
  for (const name of names) {
    const data = await (await request.get(`/api/manual/${name}`)).json();
    expect(data.css.flavor, name).toBe("css");
    expect(data.tailwind?.flavor, name).toBe("tailwind");
    expect(data.tailwind.files.length, name).toBeGreaterThan(0);
    expect(
      data.tailwind.files.filter((file: { path: string }) => file.path.endsWith(".css")),
      name,
    ).toEqual([]);
    // Comments for this repo are not for a copied file.
    for (const { path, code } of [...data.css.files, ...data.tailwind.files]) {
      expect(code, path).not.toMatch(/Generated from|Tailwind CSS v4 twin/);
    }
  }
});

test("Sidebar and Tree Rail Nav show the Styling choice, and no note that Tailwind is coming", async ({
  page,
}) => {
  for (const path of ["/en/sidebar", "/en/tree-rail-nav"]) {
    await openManual(page, path);
    await expect(manual(page).getByRole("group", { name: "Styling" })).toBeVisible();
    await expect(manual(page)).not.toContainText("is coming");
  }
});

test("dependencies are a command per package manager", async ({ page }) => {
  await openManual(page, "/en/sidebar");
  const block = manual(page).locator(".manual-step:visible").first();
  await expect(block).toContainText("pnpm add @base-ui/react@~");
  await block.getByRole("tab", { name: "npm", exact: true }).click();
  await expect(block).toContainText("npm install @base-ui/react@~");
});

test("Copy takes the whole file, and Expand shows all of a collapsed one", async ({ page }) => {
  await openManual(page, "/en/sidebar");
  const block = manual(page)
    .locator(".manual-file:visible")
    .filter({
      has: page.locator(".ow-code-block__title", { hasText: "sidebar/sidebar.tsx" }),
    });
  const code = block.locator(".manual-file__code");
  await expect(code).toHaveAttribute("data-collapsed", "true");
  const collapsed = (await code.boundingBox())?.height ?? 0;
  expect(collapsed).toBeLessThanOrEqual(241);

  await block.getByRole("button", { name: "Copy" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  // Lines past the collapsed 240px are in what was copied.
  expect(copied.split("\n").length).toBeGreaterThan(40);
  expect(copied).toContain("export function SidebarRoot");

  const toggle = block.getByRole("button", { name: "Expand" });
  await toggle.click();
  await expect(code).not.toHaveAttribute("data-collapsed", "true");
  // All of it is drawn once the height has landed.
  await expect.poll(() => code.innerText()).toBe(copied);
  await expect
    .poll(async () => (await code.boundingBox())?.height ?? 0)
    .toBeGreaterThan(collapsed + 200);
  await expect(block.getByRole("button", { name: "Collapse" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await block.getByRole("button", { name: "Collapse" }).click();
  await expect(code).toHaveAttribute("data-collapsed", "true");
});

test("a folder is named once, above its files, and a file's whole name is in its header", async ({
  page,
}) => {
  await openManual(page, "/en/field");
  await expect(manual(page).locator(".manual-folder__path:visible")).toHaveText([
    "lib/owsem/",
    "components/owsem/field/",
    "components/owsem/input/",
    "lib/owsem/",
  ]);
  // Read out with its folder, but only the name is seen, and it is never cut.
  const titles = await manual(page)
    .locator(".manual-folder .ow-code-block__title:visible")
    .evaluateAll((els) =>
      els.map((el) => ({
        path: el.textContent,
        seen: [...el.childNodes]
          .filter((n) => n instanceof Text)
          .map((n) => n.data.trim())
          .join(""),
        cut: el.scrollWidth > el.clientWidth,
      })),
    );
  expect(titles).toContainEqual({
    path: "components/owsem/field/field.tsx",
    seen: "field.tsx",
    cut: false,
  });
  expect(titles.filter((title) => title.cut)).toEqual([]);
});

test("Expand and Collapse ease the height, and turn around mid-way", async ({ page }) => {
  await openManual(page, "/en/color-picker");
  const block = manual(page)
    .locator(".manual-file:visible")
    .filter({
      has: page.locator(".ow-code-block__title", { hasText: "color-picker/color-picker.tsx" }),
    });
  /** The panel's heights over 700 ms after the button is pressed (and again, after `again` ms). */
  const heights = (again?: number) =>
    block.evaluate(async (el, wait) => {
      const code = el.querySelector(".manual-file__code") as HTMLElement;
      const button = el.querySelector(".manual-file__toggle") as HTMLElement;
      const seen: number[] = [];
      let on = true;
      const tick = () => {
        seen.push(Math.round(code.getBoundingClientRect().height));
        if (on) requestAnimationFrame(tick);
      };
      button.click();
      if (wait !== undefined) setTimeout(() => button.click(), wait);
      requestAnimationFrame(tick);
      await new Promise((resolve) => setTimeout(resolve, 700));
      on = false;
      return seen;
    }, again);
  const opening = await heights();
  expect(new Set(opening).size).toBeGreaterThan(4);
  // The whole file is drawn once it rests.
  await expect
    .poll(() => block.locator(".manual-file__code").innerText())
    .toContain("export function ColorPickerPopover");
  const closing = await heights();
  expect(new Set(closing).size).toBeGreaterThan(4);
  expect(closing.at(-1)).toBeLessThanOrEqual(241);
  const turned = await heights(120);
  expect(Math.max(...turned)).toBeGreaterThan(241);
  expect(turned.at(-1)).toBeLessThanOrEqual(241);
});

test("reduced motion: Expand shows the file at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openManual(page, "/en/color-picker");
  const block = manual(page)
    .locator(".manual-file:visible")
    .filter({
      has: page.locator(".ow-code-block__title", { hasText: "color-picker/color-picker.tsx" }),
    });
  await block.getByRole("button", { name: "Expand" }).click();
  await expect
    .poll(() => block.locator(".manual-file__code").evaluate((el) => el.getAnimations().length))
    .toBe(0);
  await expect(block.locator(".manual-file__code")).toContainText(
    "export function ColorPickerPopover",
  );
});

test("Manual lists only the files the component imports", async ({ page }) => {
  await openManual(page, "/en/tabs");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  await expect(titles.filter({ hasText: "components/owsem/toggle-group/thumb.ts" })).toHaveCount(1);
  await expect(titles.filter({ hasText: "toggle-group/toggle-group.tsx" })).toHaveCount(0);
  await expect(titles.filter({ hasText: "toggle-group/toggle-group.css" })).toHaveCount(0);
  // Glide installs with its CSS in the CSS flavor.
  for (const path of ["lib/owsem/glide/use-glide.tsx", "lib/owsem/glide/glide.css"]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
});

test("Tailwind Tabs: the thumb and Glide with its classes, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/tabs");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/tabs/tabs.tsx",
    "components/owsem/tabs/tabs-variants.ts",
    "components/owsem/toggle-group/thumb.ts",
    "lib/owsem/glide/use-glide.tsx",
    "lib/owsem/glide/glide.ts",
    "lib/owsem/glide/glide-variants.ts",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: ".css" }).filter({ hasText: "glide" })).toHaveCount(0);
  await expect(titles.filter({ hasText: "tabs.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "lib/owsem/glide/glide-variants.ts");
  expect(classes).toContain("relative isolate");
  const hook = await copyVisibleFile(page, "lib/owsem/glide/use-glide.tsx");
  expect(hook).toContain('from "./glide-variants"');
  expect(hook).toContain('from "../cn"');
  expect(hook).not.toContain(".css");
});

test("the tokens file keeps only the tokens the component reads", async ({ page }) => {
  await openManual(page, "/en/button");
  const tokens = manual(page)
    .locator(".manual-file:visible")
    .filter({ has: page.locator(".ow-code-block__title", { hasText: "lib/owsem/tokens.css" }) })
    .first();
  await tokens.getByRole("button", { name: "Copy" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("--ow-accent:");
  expect(copied).not.toContain("--ow-tooltip-bg");
  expect(copied).not.toContain("--ow-backdrop");
  expect(copied).toContain("@layer owsem.tokens {");
});

test("the page does not scroll sideways in the narrow column", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await visit(page, "/en/sidebar#installation");
  await docs(page).getByRole("tab", { name: "Manual" }).click();
  const scroll = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    docs: (() => {
      const el = document.querySelector(".cp-docs-scroll");
      return el ? el.scrollWidth - el.clientWidth : 0;
    })(),
  }));
  expect(scroll).toEqual({ page: 0, docs: 0 });
});

test("a component with a Tailwind flavor: the switch swaps the files, and is remembered", async ({
  page,
}) => {
  await openManual(page, "/en/button");
  const flavor = manual(page).getByRole("group", { name: "Styling" });
  await expect(flavor.getByRole("button", { name: "CSS" })).toHaveAttribute("aria-pressed", "true");
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "button.css" }),
  ).toHaveCount(1);

  await flavor.getByRole("button", { name: "Tailwind v4" }).click();
  await expect(manual(page).locator(".manual-step:visible").first()).toContainText(" cn");
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "button.css" }),
  ).toHaveCount(0);
  await expect(manual(page)).toContainText('@import "./lib/owsem/tailwind.css";');
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "lib/owsem/tailwind.css" }),
  ).toHaveCount(1);

  await page.reload();
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
  await docs(page).getByRole("tab", { name: "Manual" }).click();
  await expect(
    manual(page).getByRole("group", { name: "Styling" }).getByRole("button", {
      name: "Tailwind v4",
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

async function openTailwindManual(page: Page, path: string) {
  await openManual(page, path);
  await manual(page)
    .getByRole("group", { name: "Styling" })
    .getByRole("button", {
      name: "Tailwind v4",
    })
    .click();
}

/** What Copy puts on the clipboard for the visible file whose title has `path`. */
async function copyVisibleFile(page: Page, path: string): Promise<string> {
  const file = manual(page)
    .locator(".manual-file:visible")
    .filter({ has: page.locator(".ow-code-block__title", { hasText: path }) });
  await file.getByRole("button", { name: "Copy" }).click();
  return page.evaluate(() => navigator.clipboard.readText());
}

test("Tailwind Switch: its class map and only the bridge parts it uses, no CSS file", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/switch");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/switch/switch.tsx",
    "components/owsem/switch/switch-variants.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/tokens.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "switch.css" })).toHaveCount(0);
  const dependencies = manual(page).locator(".manual-step:visible").first();
  await expect(dependencies).toContainText("class-variance-authority");
  await expect(dependencies).toContainText("Tailwind CSS v4.1 or newer");
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  // The thumb's registered properties and its two variants, and nothing of Input's or Button's.
  expect(bridge).toContain("@property --_switch-travel");
  expect(bridge).toContain("@property --_switch-held");
  expect(bridge).toContain("@custom-variant ow-label-hover");
  expect(bridge).toContain("@custom-variant ow-switch-held");
  expect(bridge).not.toContain("@custom-variant held ");
  expect(bridge).not.toContain("ow-input-invalid");
  expect(bridge).not.toContain("@keyframes");
  const classes = await copyVisibleFile(page, "switch/switch-variants.ts");
  expect(classes).toContain("group/ow-switch");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Progress: its class map and only the keyframes it names, no CSS file", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/progress");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/progress/progress.tsx",
    "components/owsem/progress/progress-variants.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/tokens.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "progress.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-progress-travel");
  expect(bridge).not.toContain("@keyframes ow-spin");
  expect(bridge).not.toContain("@custom-variant");
  const classes = await copyVisibleFile(page, "progress/progress-variants.ts");
  expect(classes).toContain("ow-progress-travel");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Accordion: its class map, and no keyframes or CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/accordion");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/accordion/accordion.tsx",
    "components/owsem/accordion/accordion-variants.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/tokens.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "accordion.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).not.toContain("@keyframes ow-progress-travel");
  const classes = await copyVisibleFile(page, "accordion/accordion-variants.ts");
  expect(classes).toContain("group/ow-accordion");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Number Field: its class map and its shake, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/number-field");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/number-field/number-field.tsx",
    "components/owsem/number-field/number-field-variants.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/tokens.css",
    "lib/owsem/shake.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "number-field.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-number-field-shake");
  expect(bridge).toContain("@keyframes ow-number-field-blink");
  expect(bridge).not.toContain("@keyframes ow-progress-travel");
  const classes = await copyVisibleFile(page, "number-field/number-field-variants.ts");
  expect(classes).toContain("ow-number-field-shake");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Slider: its class map, and no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/slider");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/slider/slider.tsx",
    "components/owsem/slider/slider-variants.ts",
    "lib/owsem/tokens.css",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "slider.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "slider/slider-variants.ts");
  expect(classes).toContain("data-dragging:has-[:focus]");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind OTP Field: its class map and its shake, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/otp-field");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/otp-field/otp-field.tsx",
    "components/owsem/otp-field/otp-field-variants.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/tokens.css",
    "lib/owsem/shake.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "otp-field.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-otp-field-shake");
  expect(bridge).toContain("@keyframes ow-otp-field-blink");
  const classes = await copyVisibleFile(page, "otp-field/otp-field-variants.ts");
  expect(classes).toContain("ow-otp-field-shake");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Checkbox Group: its class map, Glide, and the size Checkbox reads", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/checkbox-group");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/checkbox-group/checkbox-group.tsx",
    "components/owsem/checkbox-group/checkbox-group-variants.ts",
    "lib/owsem/checkbox-group-size.ts",
    "lib/owsem/glide/use-glide.tsx",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "checkbox-group.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "checkbox-group/checkbox-group-variants.ts");
  expect(classes).toContain("label:has([role=checkbox])");
});

test("Tailwind Copy Button: the components it draws, and its keyframes", async ({ page }) => {
  await openTailwindManual(page, "/en/copy-button");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/copy-button/copy-button-variants.ts",
    "components/owsem/button/button-variants.ts",
    "components/owsem/icon-morph/icon-morph.tsx",
    "components/owsem/tooltip/tooltip.tsx",
    "lib/owsem/use-ripple.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: /^components\/.*\.css/ })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-copy-button-draw");
  expect(bridge).toContain("@keyframes ow-spin");
  expect(bridge).toContain("@custom-variant held ");
});

test("Tailwind Popover: the Core modules it imports, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/popover");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/popover/popover.tsx",
    "components/owsem/popover/popover-variants.ts",
    "lib/owsem/resting-anchor.ts",
    "lib/owsem/scroll-lock.ts",
    "lib/owsem/merge-refs.ts",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "popover.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "popover/popover-variants.ts");
  expect(classes).toContain("group/ow-popover");
  // scroll-lock.ts has a `held:` of its own, which is no class.
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).not.toContain("@custom-variant");
});

test("Tailwind Alert Dialog: the Core modules it imports, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/alert-dialog");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/alert-dialog/alert-dialog.tsx",
    "components/owsem/alert-dialog/alert-dialog-variants.ts",
    "lib/owsem/scroll-lock.ts",
    "lib/owsem/merge-refs.ts",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "alert-dialog.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "alert-dialog/alert-dialog-variants.ts");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Drawer: the Core modules it imports, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/drawer");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/drawer/drawer.tsx",
    "components/owsem/drawer/drawer-variants.ts",
    "lib/owsem/scroll-lock.ts",
    "lib/owsem/merge-refs.ts",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "drawer.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "drawer/drawer-variants.ts");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Toast: the Button it draws, no CSS file, and the spinner's keyframes", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/toast");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/toast/toast.tsx",
    "components/owsem/toast/toast-variants.ts",
    "components/owsem/button/button.tsx",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "toast.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "toast/toast-variants.ts");
  expect(classes).not.toMatch(/import .*\.css/);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-spin");
});

test("Tailwind Preview Card: the Core modules it imports, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/preview-card");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/preview-card/preview-card.tsx",
    "components/owsem/preview-card/preview-card-variants.ts",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "preview-card.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "preview-card/preview-card-variants.ts");
  expect(classes).not.toMatch(/import .*\.css/);
});

test("Tailwind Combobox: the Input and Select class maps it shares, the shake in the bridge", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/combobox");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/combobox/combobox.tsx",
    "components/owsem/combobox/combobox-variants.ts",
    "components/owsem/input/input-variants.ts",
    "components/owsem/select/select-variants.ts",
    "lib/owsem/glide/use-glide.tsx",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "combobox.css" })).toHaveCount(0);
  const classes = await copyVisibleFile(page, "combobox/combobox-variants.ts");
  expect(classes).not.toMatch(/import .*\.css/);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-input-shake");
});

test("Tailwind Autocomplete: Combobox's files and class maps, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/autocomplete");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/autocomplete/autocomplete.tsx",
    "components/owsem/autocomplete/autocomplete-variants.ts",
    "components/owsem/combobox/combobox.tsx",
    "components/owsem/combobox/combobox-variants.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "autocomplete.css" })).toHaveCount(0);
});

test("Tailwind Scroll Area: its one custom variant in the bridge", async ({ page }) => {
  await openTailwindManual(page, "/en/scroll-area");
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "scroll-area.css" }),
  ).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@custom-variant ow-scroll-area-fade");
  expect(bridge).not.toContain("@custom-variant ow-label-hover");
  expect(bridge).not.toContain("@keyframes");
});

test("Tailwind Toolbar and Command Menu: the variants they use in the bridge", async ({ page }) => {
  await openTailwindManual(page, "/en/toolbar");
  const toolbar = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(toolbar).toContain("@custom-variant ow-toolbar-quiet (:where(&));");
  expect(toolbar).not.toContain("@custom-variant ow-reduced-transparency");
  await openTailwindManual(page, "/en/command-menu");
  const menu = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(menu).toContain("@custom-variant ow-reduced-transparency");
  expect(menu).not.toContain("@custom-variant ow-toolbar-quiet");
  await openTailwindManual(page, "/en/select");
  const select = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(select).toContain("@keyframes ow-select-shake");
  expect(select).toContain("@custom-variant ow-input-invalid");
});

test("Tailwind Color Picker: its class map, the held variant, and its helpers, no CSS file", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/color-picker");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/color-picker/color-picker.tsx",
    "components/owsem/color-picker/color-picker-variants.ts",
    "components/owsem/color-picker/color.ts",
    "lib/owsem/resting-anchor.ts",
    "lib/owsem/merge-refs.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "color-picker.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@custom-variant held ");
  expect(bridge).not.toContain("@keyframes");
  const classes = await copyVisibleFile(page, "color-picker/color-picker-variants.ts");
  expect(classes).toContain("group/ow-color-picker-area");
  expect(classes).not.toMatch(/import .*\.css/);
  const code = await copyVisibleFile(page, "color-picker/color-picker.tsx");
  expect(code).not.toContain(".css");
});

test("Tailwind Table of Contents: its class map and the tracker, no CSS file", async ({ page }) => {
  await openTailwindManual(page, "/en/table-of-contents");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/table-of-contents/table-of-contents.tsx",
    "components/owsem/table-of-contents/table-of-contents-variants.ts",
    "components/owsem/table-of-contents/tracker.ts",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "table-of-contents.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).not.toContain("@custom-variant");
  expect(bridge).not.toContain("@keyframes");
  const classes = await copyVisibleFile(page, "table-of-contents/table-of-contents-variants.ts");
  expect(classes).toContain("data-visible:opacity-100");
});

test("Tailwind Sidebar: its class map, the indicator, and the pulse's keyframes, no CSS file", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/sidebar");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/sidebar/sidebar.tsx",
    "components/owsem/sidebar/sidebar-variants.ts",
    "components/owsem/sidebar/sidebar.indicator.ts",
    "lib/owsem/glide/glide-variants.ts",
    "lib/owsem/scroll-lock.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: ".css" })).toHaveCount(2);
  await expect(titles.filter({ hasText: "sidebar.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-sidebar-swell");
  expect(bridge).toContain("@keyframes ow-sidebar-ping");
  expect(bridge).toContain("@custom-variant ow-sidebar-lit");
  expect(bridge).not.toContain("ow-tree-rail-nav");
  const classes = await copyVisibleFile(page, "sidebar/sidebar-variants.ts");
  expect(classes).toContain("group/ow-sidebar-indicator");
  expect(classes).not.toMatch(/import .*\.css/);
  const indicator = await copyVisibleFile(page, "sidebar/sidebar.indicator.ts");
  expect(indicator).toContain("sidebarSlots.liquid");
  expect(indicator).not.toContain(".css");
});

test("Tailwind Tree Rail Nav: its class map and the rail, with the marquee and its variants", async ({
  page,
}) => {
  await openTailwindManual(page, "/en/tree-rail-nav");
  const titles = manual(page).locator(".ow-code-block__title:visible");
  for (const path of [
    "components/owsem/tree-rail-nav/tree-rail-nav.tsx",
    "components/owsem/tree-rail-nav/tree-rail-nav-variants.ts",
    "components/owsem/tree-rail-nav/tree-rail.ts",
    "lib/owsem/glide/use-glide.tsx",
    "lib/owsem/glide/glide-variants.ts",
    "lib/owsem/tailwind.css",
    "lib/owsem/cn.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(titles.filter({ hasText: "tree-rail-nav.css" })).toHaveCount(0);
  const bridge = await copyVisibleFile(page, "lib/owsem/tailwind.css");
  expect(bridge).toContain("@keyframes ow-tree-rail-nav-marquee-rtl");
  expect(bridge).toContain("@custom-variant ow-tree-rail-nav-resting-current");
  expect(bridge).toContain("@custom-variant ow-tree-rail-nav-running");
  expect(bridge).not.toContain("ow-sidebar");
  const classes = await copyVisibleFile(page, "tree-rail-nav/tree-rail-nav-variants.ts");
  expect(classes).toContain("group/ow-tree-rail-nav-item");
  expect(classes).not.toMatch(/import .*\.css/);
});
