import { expect, type Page, test } from "@playwright/test";
import { SIDE_PANEL_WIDTH } from "../components/lab/layout.ts";

const stage = (page: Page) => page.getByRole("region", { name: "Stage" });
const stageBody = (page: Page) => page.locator(".lab-stage-body");
const scene = (page: Page, id: string) =>
  page.evaluate((id) => document.getElementById(`scene-${id}`)?.scrollIntoView(), id);

test("scenes shape the stage as you scroll (DS-2)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/en/separator");
  await expect(stage(page)).toContainText("Live · Separator");
  await expect(stage(page).getByRole("separator")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );

  await scene(page, "states");
  await expect(stage(page)).toContainText("States and variants");
  await expect(stage(page).getByRole("separator").first()).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );

  await scene(page, "ship");
  await expect(stageBody(page)).toHaveAttribute("data-code", "");
  await expect(stage(page).getByRole("tab", { name: "usage.tsx" })).toBeVisible();

  // Leaving the scene gives the stage back.
  await scene(page, "anatomy");
  await expect(stageBody(page)).not.toHaveAttribute("data-code");
  await expect(stage(page).getByRole("separator")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  expect(errors).toEqual([]);
});

test("the sidebar lists the Lab's scenes and marks the one being read", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the sidebar is a menu panel below 1100 px");
  await page.goto("/en/separator");
  const scenes = page.getByRole("list", { name: "Scenes" });
  await expect(scenes.getByRole("link", { name: /Overview/ })).toHaveAttribute(
    "aria-current",
    "step",
  );

  await scene(page, "states");
  await expect(scenes.getByRole("link", { name: /States and variants/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  // A scene picked from the sidebar is marked even when it is too short to reach the line.
  await scenes.getByRole("link", { name: /Keyboard and accessibility/ }).click();
  await expect(scenes.getByRole("link", { name: /Keyboard and accessibility/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(stage(page)).toContainText("Keyboard and accessibility");
});

test("on a tall window the page's start and end pick the first and last scene", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "a tall desktop window");
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto("/en/separator");
  const scenes = page.getByRole("list", { name: "Scenes" });
  await expect(scenes.getByRole("link", { name: /Overview/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(scenes.getByRole("link", { name: /Ship it/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
});

test("controls rewrite the code", async ({ page }) => {
  await page.goto("/en/separator");
  await stage(page).getByRole("button", { name: "Controls" }).click();
  await stage(page).getByLabel("Vertical").check();
  await stage(page).getByLabel("Dark line", { exact: true }).fill("#ff0000");
  await expect(stage(page).getByRole("separator").first()).toHaveCSS(
    "border-inline-start-color",
    "rgb(255, 0, 0)",
  );

  // On a narrow stage the code drawer takes the controls' slot.
  await stage(page).getByRole("button", { name: "Code" }).click();
  const code = stage(page).getByRole("tabpanel");
  await expect(code).toContainText('<Separator orientation="vertical" />');
  await stage(page).getByRole("tab", { name: "settings.css" }).click();
  await expect(code).toContainText("--ow-separator-line-dark: #ff0000;");
});

test("a color takes short hex and goes back to the theme's own", async ({ page }) => {
  await page.goto("/en/separator");
  await stage(page).getByRole("button", { name: "Controls" }).click();
  const hex = stage(page).getByLabel("Dark line", { exact: true });
  const picker = stage(page).getByLabel("Dark line (color picker)");
  await hex.fill("f00");
  await expect(picker).toHaveValue("#ff0000");
  await hex.blur();
  await expect(hex).toHaveValue("#ff0000");

  await stage(page).getByRole("button", { name: "Dark line: Use the theme default" }).click();
  await expect(hex).toHaveValue("");
  await expect(hex).toBeFocused();
  // The picker opens on the theme's color.
  const token = await stageBody(page).evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--ow-line-dark").trim(),
  );
  await picker.focus();
  await expect(picker).toHaveValue(token);
});

test("the code is highlighted, tags apart from text", async ({ page }) => {
  await page.goto("/en/separator");
  await stage(page).getByRole("button", { name: "Code" }).click();
  const code = stage(page).locator(".live-code");
  const tag = code.locator("span[style]", { hasText: /^(section|div)$/ }).first();
  await expect(tag).toBeVisible();
  const color = (el: Element) => getComputedStyle(el).color;
  expect(await tag.evaluate(color)).not.toBe(await code.evaluate(color));
});

test("the install tab follows the chosen package manager, the header too", async ({ page }) => {
  await page.goto("/en/separator");
  await stage(page).getByRole("button", { name: "Code" }).click();
  await stage(page).getByRole("tab", { name: "Install" }).click();
  const pane = stage(page).getByRole("tabpanel");
  await expect(pane).toContainText("pnpm dlx shadcn add @owsem/separator");

  await pane.getByRole("radio", { name: "npm", exact: true }).check();
  await expect(pane).toContainText("npm install owsem-ui");
  await expect(pane).toContainText("npx shadcn add @owsem/separator");
  const header = page.locator(".install");
  await expect(header).toContainText("npm install owsem-ui");

  // Kept for the next visit.
  await page.reload();
  await expect(header).toContainText("npm install owsem-ui");
});

test("a long command hides its scrollbar and fades where it continues", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "needs a command wider than its box");
  await page.goto("/en/separator");
  await stage(page).getByRole("button", { name: "Code" }).click();
  await stage(page).getByRole("tab", { name: "Install" }).click();
  const command = stage(page).locator(".command-text > .scroll-fade").nth(1);
  await expect(command).toHaveAttribute("data-fade-right", "");
  await expect(command).not.toHaveAttribute("data-fade-left");
  await command.evaluate((el) => el.scrollTo(el.scrollWidth, 0));
  await expect(command).toHaveAttribute("data-fade-left", "");
  await expect(command).not.toHaveAttribute("data-fade-right");
  // No scrollbar takes room under the text.
  const scrollbar = await command.evaluate(
    (el) => el.getBoundingClientRect().height - el.clientHeight,
  );
  expect(scrollbar).toBeLessThan(1);
});

test("stage shortcuts work only with focus on the stage (WCAG 2.1.4)", async ({ page }) => {
  await page.goto("/en/separator");
  await page.keyboard.press("c");
  await expect(stageBody(page)).not.toHaveAttribute("data-code");

  await stage(page).getByRole("button", { name: "Controls" }).focus();
  await page.keyboard.press("c");
  await expect(stageBody(page)).toHaveAttribute("data-code", "");

  // A click on an empty part of the stage is enough to put focus there.
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await stageBody(page).click({ position: { x: 8, y: 8 } });
  await page.keyboard.press("c");
  await expect(stageBody(page)).not.toHaveAttribute("data-code");
});

test("the header names each stage shortcut this Lab has", async ({ page }, testInfo) => {
  const hint = page.locator(".lab-hint");
  await page.goto("/en/separator");
  await expect(hint).toContainText("I Inspect");
  await expect(hint).toContainText("C Code");
  await expect(hint).not.toContainText("Replay");
  await page.goto("/en/tree-rail-nav");
  await expect(hint).toContainText("R Replay");
  // H folds the pane, which only exists below 960 px.
  const pane = hint.getByText("Preview");
  if (testInfo.project.name === "mobile-390") await expect(pane).toBeVisible();
  else await expect(pane).toBeHidden();
});

test("the stage theme changes the stage only (DS-12)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/separator");
  // The stage background is a gradient between its own color and the page's.
  const background = () => stageBody(page).evaluate((el) => getComputedStyle(el).backgroundImage);
  // Without a choice the stage follows the site, server render included.
  await expect(stageBody(page)).not.toHaveAttribute("data-theme");
  const dark = await background();

  await stage(page).getByRole("button", { name: "Stage theme" }).click();
  await expect(stageBody(page)).toHaveAttribute("data-theme", "light");
  expect(await background()).not.toBe(dark);
  await expect(page.locator(".lab-drawer")).not.toHaveCSS(
    "background-color",
    await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor),
  );
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("the code drawer ends at the side panel's line, closing included", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the side panel needs a wide stage");
  await page.setViewportSize({ width: 1920, height: 925 });
  await page.goto("/en/separator");
  for (const name of ["Controls", "Code"]) {
    const tool = stage(page).getByRole("button", { name });
    if ((await tool.getAttribute("aria-pressed")) !== "true") await tool.click();
  }
  const edge = (selector: string, side: "left" | "right") =>
    page.locator(selector).evaluate((el, side) => el.getBoundingClientRect()[side], side);
  const line = (await edge(".lab-stage-body", "right")) - SIDE_PANEL_WIDTH;
  await expect.poll(() => edge(".lab-controls", "left")).toBe(line);
  expect(await edge(".lab-drawer", "right")).toBe(line);

  // The drawer keeps its width while it slides away.
  await stage(page).getByRole("button", { name: "Code" }).click();
  await expect(stageBody(page)).not.toHaveAttribute("data-code");
  expect(await edge(".lab-drawer", "right")).toBe(line);
});

test("the preview pane folds and remembers it (DS-10)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the pane only exists below 960 px");
  await page.goto("/id/separator");
  const toggle = stage(page).getByRole("button", { name: "Sembunyikan pratinjau" });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-lab-pane", "hidden");
  await expect(stage(page).getByRole("separator")).toBeHidden();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-lab-pane", "hidden");
  await stage(page).getByRole("button", { name: "Tampilkan pratinjau" }).click();
  await expect(stage(page).getByRole("separator")).toBeVisible();
});

test("H folds the pane without moving the text or the scene", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the pane only exists below 960 px");
  await page.goto("/en/separator");
  await scene(page, "keyboard");
  await expect(stage(page)).toContainText("Keyboard and accessibility");
  const paragraph = page.locator("#scene-keyboard p").first();
  // Focusing the fixed stage must not scroll the page either.
  await stage(page).getByRole("button", { name: "Controls" }).focus();
  const before = await paragraph.evaluate((el) => el.getBoundingClientRect().top);
  expect(before).toBeGreaterThan(0);

  await page.keyboard.press("h");
  await expect(page.locator("html")).toHaveAttribute("data-lab-pane", "hidden");
  // The hidden tool handed focus to the pane toggle, so H works again.
  await expect(stage(page).getByRole("button", { name: "Show preview" })).toBeFocused();
  expect(
    Math.abs((await paragraph.evaluate((el) => el.getBoundingClientRect().top)) - before),
  ).toBeLessThan(2);
  await page.waitForTimeout(400);
  await expect(stage(page)).toContainText("Keyboard and accessibility");

  await page.keyboard.press("h");
  await expect(page.locator("html")).not.toHaveAttribute("data-lab-pane");
});

const current = (page: Page) => stage(page).locator("a[aria-current]");

test("the anatomy scene outlines each part, and a part's name picks it (DS-3)", async ({
  page,
}, testInfo) => {
  await page.goto("/en/tree-rail-nav");
  const inspect = stage(page).getByRole("button", { name: "Inspect" });
  await expect(inspect).toHaveAttribute("aria-pressed", "false");
  await scene(page, "anatomy");
  await expect(inspect).toHaveAttribute("aria-pressed", "true");
  const chips = stage(page).getByRole("group", { name: "Parts" }).getByRole("button");
  await expect(chips).toHaveCount(9);

  // The first outline is Root's, on the nav itself, once the demo has made room for the names.
  await expect
    .poll(async () => {
      const box = await page.locator(".lab-ibox").first().boundingBox();
      const nav = await stage(page).locator(".ow-tree-rail-nav").boundingBox();
      return box && nav ? Math.abs(box.x - nav.x) + Math.abs(box.height - nav.height) : -1;
    })
    .toBeLessThan(1);

  // A name in the anatomy table picks the part on the stage.
  await page
    .locator(".lab-narrative")
    .getByRole("button", { name: "Origin", exact: true })
    .evaluate((el: HTMLElement) => el.click());
  await expect(chips.filter({ hasText: "Origin" })).toHaveAttribute("aria-pressed", "true");

  // On a wide stage the part's card shows its tokens with the values in use.
  if (testInfo.project.name !== "mobile-390") {
    await chips.filter({ hasText: "Root" }).click();
    const card = page.locator("section.lab-part-card");
    await expect(card.locator("li", { hasText: "--ow-tree-rail-r1" })).toContainText("34px");
    await expect(card.locator("li", { hasText: "--ow-tree-rail-trail" })).toContainText(
      /#[0-9A-F]{6}/,
    );
  }

  await scene(page, "states");
  await expect(inspect).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".lab-inspect")).toHaveCount(0);
});

test("a scene's animation plays on its own; the visitor's press stops it (DS-11)", async ({
  page,
}) => {
  await page.goto("/en/tree-rail-nav");
  await expect(current(page)).toHaveText("Dark mode");
  await scene(page, "trail");
  await expect(stage(page).getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(current(page)).toHaveText("Installation");

  // A press of the visitor's own ends the run where it is.
  await stage(page).locator('a[href="#changelog"]').click();
  await expect(stage(page).getByRole("button", { name: "Replay" })).toBeVisible();
  await expect(current(page)).toHaveText("Changelog");
  await page.waitForTimeout(1600);
  await expect(current(page)).toHaveText("Changelog");

  await stage(page).getByRole("button", { name: "Replay" }).click();
  await expect(current(page)).toHaveText("Installation");
  // Leaving the scene mid-run puts the demo back as it was.
  await scene(page, "anatomy");
  await expect(current(page)).toHaveText("Dark mode");
  await expect(stage(page).getByRole("button", { name: /^(Replay|Stop)$/ })).toHaveCount(0);
});

test("under reduced motion a scene plays only when asked", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/tree-rail-nav");
  await scene(page, "trail");
  await expect(stage(page).getByRole("button", { name: "Replay" })).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(current(page)).toHaveText("Dark mode");

  const section = page.locator("#scene-trail");
  await section.getByRole("button", { name: "Play scene" }).click();
  await expect(current(page)).toHaveText("Installation");
  await section.getByRole("button", { name: "Stop" }).click();
  await expect(section.getByRole("button", { name: "Play scene" })).toBeVisible();
  await expect(current(page)).toHaveText("Dark mode");
});

test("a Lab without animations has no Play scene or Replay", async ({ page }) => {
  await page.goto("/en/separator");
  for (const id of ["anatomy", "states", "ship"]) {
    await scene(page, id);
    await expect(stage(page).getByRole("button", { name: "Replay" })).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "Play scene" })).toHaveCount(0);
  await expect(stage(page).getByRole("button", { name: "Inspect" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("the states scene sets the flavors side by side, then gives the demo back (DS-2)", async ({
  page,
}) => {
  await page.goto("/en/tree-rail-nav");
  const navs = stage(page).getByRole("navigation");
  await expect(navs).toHaveCount(1);
  await scene(page, "states");
  await expect(stage(page).getByRole("columnheader")).toHaveText(["Base", "Owsem"]);
  await expect(navs).toHaveCount(4);
  const cell = (name: string) => stage(page).getByRole("navigation", { name });
  await expect(cell("Owsem, Group closed").getByRole("button", { name: "Guides" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  // The pointer picks Installation in Base, then in Owsem.
  await expect(cell("Base, Group open").locator("a[aria-current]")).toHaveText("Installation");
  await expect(cell("Owsem, Group open").locator("a[aria-current]")).toHaveText("Installation");

  await scene(page, "keyboard");
  await expect(navs).toHaveCount(1);
});

test("the docs' element defaults never override a component's own styles (FR-8, FR-13)", async ({
  page,
}) => {
  await page.goto("/en/tree-rail-nav");
  const color = (href: string) =>
    stage(page)
      .locator(`a[href="${href}"]`)
      .evaluate((el) => getComputedStyle(el).color);
  // A disabled row is dimmer than a plain one: the docs' `a { color: inherit }` sits under it.
  expect(await color("#density")).not.toBe(await color("#install"));
  // The component's focus ring stays inside the row, not the docs' outward one.
  const install = stage(page).locator('a[href="#install"]');
  await install.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(install).toBeFocused();
  await expect(install).toHaveCSS("outline-offset", "-2px");
});

test("the scene being read stands out; the others recede (DS-2)", async ({ page }) => {
  await page.goto("/en/tree-rail-nav");
  const title = (id: string) => page.locator(`#scene-${id} h2`);
  await scene(page, "groups");
  await expect(page.locator("#scene-groups")).toHaveAttribute("data-active", "");
  const read = await title("groups").evaluate((el) => getComputedStyle(el).color);
  await expect(title("trail")).not.toHaveCSS("color", read);
  await expect(title("anatomy")).not.toHaveCSS("color", read);
  // Play scene sits beside the scene's number.
  const head = page.locator("#scene-groups .lab-scene-head");
  await expect(head.getByRole("button", { name: /^(Play scene|Stop)$/ })).toBeVisible();
});
