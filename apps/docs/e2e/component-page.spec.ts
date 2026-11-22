import { expect, type Locator, type Page, test } from "@playwright/test";
import { demo, docs, preview, sheet, specimen, tools, visit } from "./example-page.ts";

// The preview-first component pages (examples/): Button and Switch.
const html = (page: Page) => page.locator("html");

/** What each example's code must name, and the class its demo renders for it. */
const EXAMPLES = {
  button: {
    selector: ".ow-button",
    names: ["Button", "IconButton"],
    ids: {
      Default: ["<Button variant"],
      Sizes: ["<Button size"],
      Icons: ["<Button", "<IconButton"],
      Loading: ["<Button", "loading"],
      Disabled: ["<Button", "disabled"],
    },
  },
  switch: {
    selector: ".ow-switch",
    names: ["Switch"],
    ids: {
      Default: ["<Switch.Root"],
      Sizes: ["<Switch.Root"],
      Icon: ["<Switch.Root", "<Switch.Thumb>"],
      Disabled: ["<Switch.Root"],
      Controlled: ["<Switch.Root", "onCheckedChange"],
    },
  },
} as const;

const desktopOnly = (testInfo: { project: { name: string } }) =>
  testInfo.project.name !== "desktop";

test("the page opens on the preview alone: title, family, tools, and the examples", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "a wide screen shows every tool");
  await visit(page, "/en/switch");
  await expect(page.getByRole("heading", { level: 1, name: "Switch" })).toBeVisible();
  await expect(preview(page).locator(".cp-badge")).toHaveText("Base");
  for (const name of ["Install", "Inspect", "Docs", "Theme"]) {
    await expect(tools(page).getByRole("button", { name, exact: true })).toBeVisible();
  }
  await tools(page).getByRole("button", { name: "Language: English" }).click();
  await expect(page.getByRole("menuitem", { name: "Bahasa Indonesia" })).toHaveAttribute(
    "href",
    "/id/switch",
  );
  await page.keyboard.press("Escape");
  await expect(demo(page).getByRole("switch")).toBeVisible();
  // No grid at rest, and the docs wait for a request.
  await expect(preview(page).locator(".cp-body")).not.toHaveAttribute("data-inspect");
  await expect(docs(page)).toBeHidden();
  await expect(tools(page).getByRole("button", { name: "Code", exact: true })).toHaveCount(0);
  const picker = page.getByRole("group", { name: "Examples" });
  await expect(picker.getByRole("button")).toHaveCount(5);
  await expect(picker.getByRole("button", { name: "Default" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the tools have shortcuts that work outside fields, and tooltips that say them", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "keys and tooltips need a wide screen");
  await visit(page, "/en/button");
  const keys = await tools(page)
    .locator("[aria-keyshortcuts]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-keyshortcuts")));
  expect(keys).toEqual(["I", "D", "T"]);

  const tip = page.locator(".ow-tooltip__popup");
  await expect(async () => {
    await page.mouse.move(0, 0);
    await tools(page).getByRole("button", { name: "Docs", exact: true }).hover();
    await expect(tip).toHaveText("DocsD", { timeout: 1500 });
  }).toPass();

  await page.mouse.move(0, 400);
  await page.keyboard.press("i");
  await expect(preview(page).locator(".cp-body")).toHaveAttribute("data-inspect", "");
  await page.keyboard.press("d");
  await expect(tools(page).getByRole("button", { name: "Docs" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.keyboard.press("i");
  await expect(preview(page).locator(".cp-body")).not.toHaveAttribute("data-inspect");

  // A field keeps its keys: the search box takes "d" as text.
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox");
  await search.fill("d");
  await expect(search).toHaveValue("d");
  await expect(html(page)).toHaveAttribute("data-docs-open", "");
});

test("the example picker switches the demo, and the docs' code follows the example", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "needs the docs beside the preview");
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, "/en/switch#examples");
  const picker = page.getByRole("group", { name: "Examples" });
  await expect(demo(page).getByRole("switch")).toHaveCount(1);
  await expect(docs(page).locator("#example-default")).toContainText("Email alerts");

  await picker.getByRole("button", { name: "Sizes" }).click();
  await expect(demo(page).getByRole("switch")).toHaveCount(3);
  await expect(docs(page).locator("#example-sizes")).toContainText('size="sm"');
  await expect(docs(page).locator("#example-sizes")).toContainText('size="lg"');
  await expect(docs(page).locator("#example-sizes")).toContainText("sizes.tsx");

  await picker.getByRole("button", { name: "Controlled" }).click();
  await expect(demo(page).getByText("Dark mode is off")).toBeVisible();
  await demo(page).getByRole("switch").click();
  await expect(demo(page).getByText("Dark mode is on")).toBeVisible();
  await expect(docs(page).locator("#example-controlled")).toContainText("onCheckedChange={setOn}");
});

for (const [name, spec] of Object.entries(EXAMPLES)) {
  test(`${name}: every example's code names what its demo renders`, async ({ page }, testInfo) => {
    test.skip(desktopOnly(testInfo), "needs the docs beside the preview");
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit(page, `/en/${name}#examples`);
    const picker = page.getByRole("group", { name: "Examples" });
    for (const [title, needles] of Object.entries(spec.ids)) {
      await picker.getByRole("button", { name: title, exact: true }).click();
      await expect(picker.getByRole("button", { name: title, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const code = docs(page).locator(`#example-${title.toLowerCase()} .docs-code`).first();
      const shown = (await code.textContent()) ?? "";
      for (const needle of needles) expect(shown, `${title}: ${needle}`).toContain(needle);
      // As many elements in the demo as the code writes.
      const written = (shown.match(/<(Button|IconButton|Switch\.Root)[\s/>]/g) ?? []).length;
      await expect(demo(page).locator(spec.selector)).toHaveCount(written);
      // The demo renders only components the code imports.
      const imported = /import \{([^}]*)\} from "owsem-ui\/base"/.exec(shown)?.[1] ?? "";
      expect(
        spec.names.some((n) => imported.includes(n)),
        `${title}: import`,
      ).toBe(true);
    }
  });
}

/** One measurement tag by kind (height, width, pl, pt, radius, ...). */
const tag = (page: Page, kind: string) =>
  sheet(page).locator(`.sp-tag[data-kind="${kind}"]`).first();
/** The scale the specimen is zoomed by. */
const scaleOf = (el: Locator) =>
  el.evaluate((node) => getComputedStyle(node).scale.split(" ")[0] ?? "1");
/** The layout of the preview and every element of its demo: what Inspect must not move. */
const layoutBoxes = (page: Page) =>
  page.evaluate(() => {
    const frames = [".cp-preview", ".cp-body", ".cp-stage", ".cp-picker"].map((selector) => {
      const r = document.querySelector(selector)?.getBoundingClientRect();
      return r ? [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 10) / 10) : null;
    });
    // Layout boxes, not painted ones: offset metrics ignore opacity and transforms.
    const demo = [...document.querySelectorAll<HTMLElement>(".cp-demo *")].map((el) => [
      el.offsetLeft,
      el.offsetTop,
      el.offsetWidth,
      el.offsetHeight,
    ]);
    return { frames, demo };
  });

test("Inspect magnifies a complete specimen into a spec sheet and never reflows the demo", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "the full sheet needs a wide preview");
  await visit(page, "/en/button");
  const before = await layoutBoxes(page);
  const second = demo(page).getByRole("button", { name: "Secondary" });

  await page.keyboard.press("i");
  await expect(sheet(page).locator(".sp-label").first()).toBeVisible();
  await page.waitForTimeout(1100);
  expect(await layoutBoxes(page)).toEqual(before);
  // Only opacity changes on the demo; the specimen is a faint grey wireframe, zoomed by scale.
  await expect(demo(page).locator(".cp-demo")).toHaveCSS("opacity", "0");
  await expect(specimen(page)).toHaveCSS("opacity", "0.5");
  expect(Number.parseFloat(await scaleOf(specimen(page)))).toBeGreaterThan(1);
  // The specimen is inert and has no lingering will-change once settled.
  await expect(specimen(page)).toHaveAttribute("aria-hidden", "true");
  await expect(specimen(page)).toHaveJSProperty("inert", true);
  await expect(specimen(page)).toHaveCSS("will-change", "auto");

  // It is the complete Button, icons included, though the Default example has none.
  await expect(demo(page).locator(".ow-button__icon")).toHaveCount(0);
  await expect(specimen(page).locator(".ow-button__icon")).toHaveCount(2);
  for (const name of ["Root", "Icon", "Label", "End icon", "Ripple"]) {
    await expect(
      sheet(page).getByRole("button", { name: `${name} part`, exact: true }),
    ).toBeVisible();
  }
  // Spinner is a state, not part of the specimen.
  await expect(sheet(page).getByRole("button", { name: "Spinner part" })).toHaveCount(0);

  // Numbers are the specimen's real px, from its computed styles.
  const measured = await specimen(page)
    .locator(".ow-button")
    .evaluate((el) => {
      const style = getComputedStyle(el);
      const n = (v: string) => String(Math.round(Number.parseFloat(v) * 10) / 10);
      return {
        height: n(style.height),
        width: n(style.width),
        left: n(style.paddingLeft),
        top: n(style.paddingTop),
        radius: n(style.borderTopLeftRadius),
      };
    });
  await expect(tag(page, "height")).toHaveText(`h ${measured.height}`);
  await expect(tag(page, "width")).toHaveText(`w ${measured.width}`);
  await expect(tag(page, "pl")).toHaveText(measured.left);
  await expect(tag(page, "pt")).toHaveText(measured.top);
  await expect(tag(page, "radius")).toHaveText(`r ${measured.radius}`);
  await expect(sheet(page).locator(".sp-summary")).toContainText(`height ${measured.height}`);
  await expect(sheet(page).locator(".sp-title")).toHaveText("Button anatomy");
  await expect(sheet(page).locator(".sp-svg")).toHaveAttribute("aria-hidden", "true");

  // Another example keeps the same specimen; the demo stays hidden and unmoved.
  await specimen(page).evaluate((el) => {
    el.dataset.k = "same";
  });
  await page
    .getByRole("group", { name: "Examples" })
    .getByRole("button", { name: "Loading" })
    .click();
  await expect(specimen(page)).toHaveAttribute("data-k", "same");
  await expect(sheet(page).getByRole("button", { name: "Root part" })).toBeVisible();
  await page
    .getByRole("group", { name: "Examples" })
    .getByRole("button", { name: "Default" })
    .click();

  // Off: the specimen glides home and the demo is back, with the layout as it was.
  await page.keyboard.press("i");
  await expect(preview(page).locator(".cp-body")).not.toHaveAttribute("data-inspect");
  await page.waitForTimeout(700);
  await expect(sheet(page)).toHaveCount(0);
  await expect(second).toBeVisible();
  await expect(demo(page).locator(".cp-demo")).toHaveCSS("opacity", "1");
  expect(await layoutBoxes(page)).toEqual(before);
});

test("Inspect opens as a morph from the demo's instance, with no snap", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "the full sheet needs a wide preview");
  await visit(page, "/en/button");
  const origin = await demo(page).locator(".ow-button").first().boundingBox();
  if (!origin) throw new Error("no origin");
  // Rects of the specimen's button on every frame from the key press.
  await page.evaluate(() => {
    const w = window as unknown as { frames: [number, number, number][] };
    w.frames = [];
    const sample = () => {
      const el = document.querySelector(".sp-specimen .ow-button");
      if (el) {
        const r = el.getBoundingClientRect();
        w.frames.push([r.left + r.width / 2, r.top + r.height / 2, r.height]);
      }
      if (w.frames.length < 40) requestAnimationFrame(sample);
    };
    document.addEventListener("keydown", () => requestAnimationFrame(sample), { once: true });
  });
  await page.keyboard.press("i");
  await page.waitForTimeout(900);
  const frames = await page.evaluate(
    () => (window as unknown as { frames: [number, number, number][] }).frames,
  );
  const [first, ...rest] = frames;
  if (!first) throw new Error("no frames");
  // The first painted frame sits on the origin: same centre, same height.
  expect(Math.abs(first[0] - (origin.x + origin.width / 2))).toBeLessThan(4);
  expect(Math.abs(first[1] - (origin.y + origin.height / 2))).toBeLessThan(4);
  expect(Math.abs(first[2] - origin.height)).toBeLessThan(4);
  // It grows from there to the middle of the preview, over several frames.
  const last = frames[frames.length - 1] as [number, number, number];
  expect(last[2]).toBeGreaterThan(origin.height * 2);
  expect(rest.filter((f) => f[2] > first[2] + 2 && f[2] < last[2] - 2).length).toBeGreaterThan(3);
  const body = await preview(page).locator(".cp-body").boundingBox();
  if (!body) throw new Error("no body");
  expect(Math.abs(last[1] - (body.y + 60 + (body.height - 124) / 2))).toBeLessThan(40);
});

test("Escape closes a part's popover, then Inspect", async ({ page }, testInfo) => {
  test.skip(desktopOnly(testInfo), "the full sheet needs a wide preview");
  await visit(page, "/en/button");
  await page.keyboard.press("i");
  // No instance switcher: the specimen is the complete component.
  await expect(sheet(page).getByRole("button", { name: "Next instance" })).toHaveCount(0);
  await expect(sheet(page).locator(".sp-which")).toHaveCount(0);

  // A part's name opens its note and tokens; Escape closes that, then Inspect.
  const rootLabel = sheet(page).getByRole("button", { name: "Root part" });
  await rootLabel.click();
  const pop = page.getByRole("dialog", { name: "Root" });
  await expect(pop).toBeVisible();
  await expect(pop).toContainText("--ow-radius");
  await expect(pop).toContainText("--ow-accent");
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(preview(page).locator(".cp-body")).toHaveAttribute("data-inspect", "");
  await page.keyboard.press("Escape");
  await expect(preview(page).locator(".cp-body")).not.toHaveAttribute("data-inspect");
});

test("Switch's specimen is checked and carries an icon in its thumb", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "the full sheet needs a wide preview");
  await visit(page, "/en/switch");
  await page.keyboard.press("i");
  await expect(sheet(page).getByRole("button", { name: "Thumb part" })).toBeVisible();
  await expect(specimen(page).locator(".ow-switch[data-checked]")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-switch__thumb svg")).toHaveCount(1);
});

test("on a narrow preview the sheet keeps names, height, and padding inside it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a phone's layout");
  await visit(page, "/en/button");
  await tools(page).getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menu").getByRole("menuitemcheckbox", { name: "Inspect" }).click();
  await expect(sheet(page).locator(".sp-label").first()).toBeVisible();
  await page.waitForTimeout(900);
  await expect(tag(page, "width")).toHaveCount(0);
  await expect(tag(page, "radius")).toHaveCount(0);
  const body = await preview(page).locator(".cp-body").boundingBox();
  const boxes = await sheet(page)
    .locator(".sp-label, .sp-tag, .sp-header")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
  expect(boxes.length).toBeGreaterThan(2);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual((body?.x ?? 0) - 0.5);
    expect(box.right).toBeLessThanOrEqual((body?.x ?? 0) + (body?.width ?? 0) + 0.5);
  }
});

test("the docs open on request, remember it, and open at a hash", async ({ page }, testInfo) => {
  test.skip(desktopOnly(testInfo), "a column needs a wide screen");
  await visit(page, "/en/switch");
  const button = tools(page).getByRole("button", { name: "Docs" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(docs(page)).toBeVisible();
  await expect(docs(page).getByRole("heading", { level: 2 })).toHaveCount(8);
  const sections = await docs(page)
    .getByRole("heading", { level: 2 })
    .evaluateAll((els) => els.map((el) => el.id));
  expect(sections).toEqual([
    "installation",
    "usage",
    "examples",
    "anatomy",
    "api",
    "accessibility",
    "theming",
    "motion",
  ]);
  // A column beside the preview: 440 px, or 42% of a narrower screen.
  const width = page.viewportSize()?.width ?? 0;
  await expect
    .poll(async () => Math.round((await docs(page).boundingBox())?.width ?? 0))
    .toBe(Math.round(Math.min(440, width * 0.42)));

  // Kept across visits.
  await page.reload();
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
  await expect(docs(page)).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Close docs" }).click();
  await expect(docs(page)).toBeHidden();
  await page.reload();
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
  await expect(docs(page)).toBeHidden();

  // A link to a section opens the panel at it.
  await visit(page, "/en/switch#api");
  await expect(docs(page)).toBeVisible();
  await expect(docs(page).locator("#api")).toBeInViewport();
  await expect(docs(page).locator("#installation")).not.toBeInViewport();
  // The page itself does not scroll away.
  expect(await page.evaluate(() => document.querySelector(".cp")?.scrollTop)).toBe(0);
});

test("docs are a column and the sidebar becomes a drawer below 1280 px, and comes back on close", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "needs a wide screen");
  await page.setViewportSize({ width: 1024, height: 800 });
  await visit(page, "/en/switch");
  const sidebar = page.getByRole("navigation", { name: "Documentation navigation" });
  const opener = page.locator(".cp-heading .sidebar-open");
  await expect(sidebar).toBeVisible();
  await expect(opener).toBeHidden();
  const before = await preview(page).boundingBox();

  await page.keyboard.press("d");
  await expect(docs(page)).toBeVisible();
  await page.waitForTimeout(700);
  // The sidebar is gone from the page and the preview meets the window; the panel is a flat
  // column (no overlay) that the preview narrows for.
  await expect(sidebar).toHaveCount(0);
  await expect(opener).toBeVisible();
  const after = await preview(page).boundingBox();
  const panel = await docs(page).boundingBox();
  const bar = await tools(page).boundingBox();
  if (!before || !after || !panel || !bar) throw new Error("boxes");
  expect(after.x).toBeLessThan(before.x);
  expect(after.x + after.width).toBeLessThanOrEqual(panel.x);
  expect(Math.round(panel.width)).toBe(Math.round(Math.min(440, 1024 * 0.42)));
  expect(await docs(page).evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
  expect(bar.x + bar.width).toBeLessThanOrEqual(after.x + after.width);

  // The top-left button opens the drawer over the page; the docs stay open.
  await opener.click();
  const drawer = page.getByRole("dialog", { name: "Documentation navigation" });
  await expect(drawer).toBeVisible();
  await expect(docs(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(html(page)).toHaveAttribute("data-docs-open", "");
  await page.keyboard.press("Control+b");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Button", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/button$/);
  await expect(drawer).toBeHidden();
  await expect(docs(page)).toBeVisible();

  // Closing the docs brings the column back as it was; the visitor's choice is untouched.
  await page.keyboard.press("d");
  await expect(docs(page)).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Documentation navigation" })).toBeVisible();
  await expect(opener).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("owsem-sidebar"))).toBeNull();
  await page.waitForTimeout(500);
  const back = await preview(page).boundingBox();
  expect(Math.round(back?.x ?? 0)).toBe(Math.round(before.x));

  // A reload with the docs open starts in the same mode.
  await page.keyboard.press("d");
  await page.reload();
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
  await expect(opener).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Documentation navigation" })).toHaveCount(0);
});

test("an example's Show in preview button switches the preview", async ({ page }, testInfo) => {
  test.skip(desktopOnly(testInfo), "needs the docs beside the preview");
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, "/en/switch#examples");
  const example = docs(page).locator("#example-sizes");
  await expect(example.getByRole("heading", { name: "Sizes" })).toBeVisible();
  const show = example.getByRole("button", { name: "Show in preview" });
  await expect(show).toHaveAttribute("aria-pressed", "false");
  await show.click();
  await expect(show).toHaveAttribute("aria-pressed", "true");
  await expect(demo(page).getByRole("switch")).toHaveCount(3);
  // The whole header is the click target (the button covers it, so force the click).
  const other = docs(page).locator("#example-default");
  await other.getByRole("heading").click({ force: true });
  await expect(other.getByRole("button", { name: "Show in preview" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(show).toHaveAttribute("aria-pressed", "false");
  await example.getByText("follow Button's font sizes").click({ force: true });
  await expect(show).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("group", { name: "Examples" }).getByRole("button", { name: "Sizes" }),
  ).toHaveAttribute("aria-pressed", "true");
  // The anatomy table's part names turn Inspect on.
  await docs(page).locator("#anatomy").scrollIntoViewIfNeeded();
  await docs(page).getByRole("button", { name: "Thumb" }).click();
  await expect(preview(page).locator(".cp-body")).toHaveAttribute("data-inspect", "");
  await expect(page.getByRole("dialog", { name: "Thumb" })).toBeVisible();
});

test("Install opens a popover with the commands per package manager, the import, and Token setup", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "needs a wide screen");
  await visit(page, "/en/switch");
  await tools(page).getByRole("button", { name: "Install" }).click();
  const popup = page.getByRole("dialog", { name: /Install/ });
  await expect(popup).toBeVisible();
  const tabs = popup.getByRole("tablist", { name: "Package manager" });
  for (const pm of ["pnpm", "npm", "yarn", "bun"]) {
    await expect(tabs.getByRole("tab", { name: pm, exact: true })).toBeVisible();
  }
  await expect(popup).toContainText("pnpm add owsem-ui");
  await tabs.getByRole("tab", { name: "bun", exact: true }).click();
  await expect(popup).toContainText("bun add owsem-ui");
  await expect(popup).toContainText('import { Switch } from "owsem-ui/base";');
  await expect(popup.getByRole("button", { name: /Token setup/ })).toBeVisible();

  // The guide link opens the docs at Installation.
  await popup.getByRole("button", { name: "Installation guide" }).click();
  await expect(docs(page)).toBeVisible();
  await expect(docs(page).locator("#installation")).toBeInViewport();
  await expect(page).toHaveURL(/#installation$/);
  // The choice is kept, and the docs' own commands follow it.
  await expect(
    docs(page).locator("#installation ~ .cp-docs-install, .cp-docs-install"),
  ).toContainText("bun add owsem-ui");
});

test("Theme changes the whole site, follows the system until pressed, and is kept", async ({
  page,
}, testInfo) => {
  test.skip(desktopOnly(testInfo), "the Theme button shows on a wide screen");
  await page.emulateMedia({ colorScheme: "dark" });
  await visit(page, "/en/switch");
  await expect(html(page)).not.toHaveAttribute("data-theme");
  const background = () =>
    page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  const dark = await background();

  await tools(page).getByRole("button", { name: "Theme" }).click();
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  expect(await background()).not.toBe(dark);
  // The sidebar and the preview both follow.
  await expect(page.locator(".site-sidebar")).toHaveCSS("background-color", await background());

  await page.reload();
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  await page.keyboard.press("t");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("owsem-theme"))).toBe("dark");
});

test("a narrow screen: the preview fills it, the toolbar keeps Install, Docs, and a menu", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a phone's layout");
  await visit(page, "/en/switch");
  const box = await preview(page).boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 390 });
  expect(box?.height).toBeGreaterThanOrEqual(840);
  const bar = tools(page);
  await expect(bar.getByRole("button", { name: "Install" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Docs" })).toBeVisible();
  for (const name of ["Inspect", "Theme"]) {
    await expect(bar.getByRole("button", { name, exact: true })).toBeHidden();
  }
  await expect(bar.getByRole("button", { name: "Language: English" })).toBeVisible();
  await bar.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitemcheckbox", { name: "Inspect" })).toBeVisible();
  await expect(menu.getByRole("menuitemcheckbox", { name: "Code" })).toHaveCount(0);
  await expect(menu.getByRole("menuitem", { name: "Bahasa Indonesia" })).toHaveCount(0);
  await menu.getByRole("menuitem", { name: "Theme" }).click();
  await expect(html(page)).toHaveAttribute("data-theme", /light|dark/);
  await expect(page.locator(".cp-heading .sidebar-open")).toBeVisible();
});

test("a narrow screen: the docs are a bottom sheet over the preview, and a link opens it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a phone's layout");
  await visit(page, "/en/switch");
  await expect(docs(page)).toBeHidden();
  await tools(page).getByRole("button", { name: "Docs" }).click();
  await expect(docs(page)).toBeVisible();
  // Nothing in the sheet scrolls the page or the sheet sideways, and its scrollbar is hidden.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const scroller = docs(page).locator(".cp-docs-scroll");
  expect(await scroller.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(scroller).toHaveCSS("scrollbar-width", "none");
  await expect(docs(page)).toHaveCSS("border-top-left-radius", /^[1-9]/);
  const sheet = await docs(page).boundingBox();
  expect(sheet?.y).toBeGreaterThan(200);
  expect((sheet?.y ?? 0) + (sheet?.height ?? 0)).toBeCloseTo(844, 0);
  // The preview stays above it, with the picker.
  await expect(page.getByRole("group", { name: "Examples" })).toBeInViewport();
  // The handle makes it taller, and Escape shuts it.
  await docs(page).locator(".cp-docs-handle").click();
  await expect.poll(async () => (await docs(page).boundingBox())?.y ?? 999).toBeLessThan(100);
  await page.keyboard.press("Escape");
  await expect(docs(page)).toBeHidden();

  await visit(page, "/en/switch#accessibility");
  await expect(docs(page)).toBeVisible();
  await expect(docs(page).locator("#accessibility")).toBeInViewport();
  // A phone's sheet always starts shut: nothing is remembered.
  await visit(page, "/en/switch");
  await expect(docs(page)).toBeHidden();
});

test("the pages are English and Indonesian alike", async ({ page }, testInfo) => {
  test.skip(desktopOnly(testInfo), "needs a wide screen");
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, "/id/switch#examples");
  await expect(page.getByRole("heading", { level: 1, name: "Switch" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Contoh" })).toBeVisible();
  await expect(docs(page).getByRole("heading", { name: "Contoh" })).toBeVisible();
  await expect(
    docs(page).getByRole("button", { name: "Tampilkan di pratinjau" }).first(),
  ).toBeVisible();
  const ids = await docs(page)
    .getByRole("heading", { level: 2 })
    .evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toHaveLength(8);
});

test("phone: Inspect with the docs sheet half open keeps its sheet clear of the bar and picker", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a phone's layout");
  await visit(page, "/en/button");
  await tools(page).getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menu").getByRole("menuitemcheckbox", { name: "Inspect" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await tools(page).getByRole("button", { name: "Docs" }).click();
  await expect(docs(page)).toBeVisible();
  await expect(sheet(page).locator(".sp-label").first()).toBeVisible();
  await page.waitForTimeout(1500);
  const boxes = await page.evaluate(() => {
    const rect = (el: Element) => el.getBoundingClientRect().toJSON();
    const bar = document.querySelector(".cp-bar") as HTMLElement;
    const picker = document.querySelector(".cp-picker") as HTMLElement;
    const barBottom = Math.max(...[...bar.children].map((c) => c.getBoundingClientRect().bottom));
    return {
      barBottom,
      pickerTop: picker.getBoundingClientRect().top,
      items: [...document.querySelectorAll(".sp-header, .sp-tag, .sp-label")].map(rect),
    };
  });
  expect(boxes.items.length).toBeGreaterThan(3);
  for (const [i, a] of boxes.items.entries()) {
    expect(a.top).toBeGreaterThanOrEqual(boxes.barBottom + 8);
    expect(a.bottom).toBeLessThanOrEqual(boxes.pickerTop - 8);
    for (const b of boxes.items.slice(i + 1)) {
      const apart =
        a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
      expect(apart).toBe(true);
    }
  }
});

test("the docs section row stays inside the panel, and the last section can be reached", async ({
  page,
}, testInfo) => {
  await visit(page, "/en/button");
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1440, height: 900 });
  await tools(page).getByRole("button", { name: "Docs" }).click();
  await expect(docs(page)).toBeVisible();
  const links = docs(page).locator(".cp-docs-nav a");
  await expect(links.first()).toHaveAttribute("aria-current", "location");
  // The row's right edge is within the panel's content edge (its padding).
  const edges = await page.evaluate(() => {
    const row = document.querySelector(".cp-docs-nav .ow-scroll-area__viewport") as HTMLElement;
    const scroller = document.querySelector(".cp-docs-scroll") as HTMLElement;
    const pad = Number.parseFloat(getComputedStyle(scroller).paddingRight);
    return {
      row: row.getBoundingClientRect().right,
      content: scroller.getBoundingClientRect().right - pad,
    };
  });
  expect(edges.row).toBeLessThanOrEqual(edges.content + 0.5);
  // Scrolled to the end, the last section is the current one.
  const last = links.last();
  await docs(page)
    .locator(".cp-docs-scroll")
    .evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
  await expect(last).toHaveAttribute("aria-current", "location");
  await expect(last).toBeInViewport();
  // And a click on it gets there from the top.
  await docs(page)
    .locator(".cp-docs-scroll")
    .evaluate((el) => {
      el.scrollTop = 0;
    });
  await expect(links.first()).toHaveAttribute("aria-current", "location");
  await last.click();
  await expect(last).toHaveAttribute("aria-current", "location");
});
