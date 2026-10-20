import { expect, type Page, test } from "@playwright/test";
import { SIDE_PANEL_WIDTH } from "../components/lab/layout.ts";
import { openSheet, stage, stageTool } from "./lab.ts";

const stageBody = (page: Page) => page.locator(".lab-stage-body");
const lab = (page: Page) => page.locator(".lab");
const scene = async (page: Page, id: string) => {
  await openSheet(page);
  await page.evaluate((id) => document.getElementById(`scene-${id}`)?.scrollIntoView(), id);
};

test("scenes shape the stage as you scroll (DS-2)", async ({ page }, testInfo) => {
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
  if (testInfo.project.name === "mobile-390") {
    // The sheet covers the stage's panels there, so scenes leave them shut.
    await expect(stage(page)).toContainText("Ship it");
    await expect(stageBody(page)).not.toHaveAttribute("data-code");
  } else {
    await expect(stageBody(page)).toHaveAttribute("data-code", "scene");
    await expect(stage(page).getByRole("tab", { name: "usage.tsx" })).toBeVisible();
  }

  // Leaving the scene gives the stage back.
  await scene(page, "anatomy");
  await expect(stageBody(page)).not.toHaveAttribute("data-code");
  await expect(stage(page).getByRole("separator")).toHaveCount(1);
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
  await expect(code).toContainText("--ow-line-dark: #ff0000;");
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

  // A click on an empty part of the stage is enough to put focus there. (A narrow Lab is all
  // fixed layers, so the body has no box to click away on.)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await stageBody(page).click({ position: { x: 8, y: 8 } });
  await page.keyboard.press("c");
  await expect(stageBody(page)).not.toHaveAttribute("data-code");
});

test("the header names each stage shortcut this Lab has", async ({ page }) => {
  const hint = page.locator(".lab-hint");
  await page.goto("/en/separator");
  await expect(hint).toContainText("I Inspect");
  await expect(hint).toContainText("C Code");
  await expect(hint).not.toContainText("Replay");
  await page.goto("/en/tree-rail-nav");
  await expect(hint).toContainText("R Replay");
});

test("the stage theme changes the whole stage, and the stage only (DS-12)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/separator");
  // The stage background is a gradient between its own color and the page's, on the body beside
  // the narrative and on the whole stage below 960 px.
  const background = () =>
    page
      .locator(".lab-stage")
      .evaluate(
        (el) =>
          getComputedStyle(el).backgroundImage +
          getComputedStyle(el.querySelector(".lab-stage-body") ?? el).backgroundImage,
      );
  const bar = () =>
    page.locator(".lab-stage-bar").evaluate((el) => getComputedStyle(el).backgroundColor);
  // Without a choice the stage follows the site, server render included.
  await expect(stage(page)).not.toHaveAttribute("data-theme");
  const dark = await background();
  const darkBar = await bar();

  await stageTool(page, "Stage theme");
  await expect(stage(page)).toHaveAttribute("data-theme", "light");
  expect(await background()).not.toBe(dark);
  // The toolbar goes light with the stage.
  expect(await bar()).not.toBe(darkBar);
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

test("the docs sheet opens from the stage, half or full, and shuts (DS-10)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the sheet only exists below 960 px");
  await page.goto("/id/separator");
  // Shut: the stage fills the screen, the caption under the demo names the component.
  const caption = page.locator(".lab-caption");
  await expect(caption.getByRole("heading", { level: 1 })).toHaveText("Separator");
  await expect(page.locator(".lab-narrative")).toBeHidden();

  const docs = stage(page).getByRole("button", { name: "Dokumentasi" });
  await expect(docs).toHaveAttribute("aria-expanded", "false");
  await docs.click();
  await expect(lab(page)).toHaveAttribute("data-sheet", "half");
  await expect(docs).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Dokumentasi Separator")).toBeFocused();
  await expect(caption).toBeHidden();
  await expect(stage(page).getByRole("separator")).toBeVisible();

  // The handle switches half and full; under the full sheet only the toolbar shows.
  const handle = page.getByRole("button", { name: "Seret atau ketuk untuk mengubah tinggi" });
  await handle.click();
  await expect(lab(page)).toHaveAttribute("data-sheet", "full");
  await expect(stage(page).getByRole("separator")).toBeHidden();
  await handle.click();
  await expect(lab(page)).toHaveAttribute("data-sheet", "half");

  // Escape shuts it and hands focus back to the toolbar.
  await page.keyboard.press("Escape");
  await expect(lab(page)).toHaveAttribute("data-sheet", "closed");
  await expect(docs).toBeFocused();
  await expect(caption).toBeVisible();
});

test("wide screens keep the narrative beside the stage, with no sheet", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the sheet replaces the column below 960 px");
  await page.goto("/en/separator");
  await expect(page.locator(".lab-narrative")).toBeVisible();
  for (const part of [".lab-tool-docs", ".lab-sheet-handle", ".lab-sheet-head", ".lab-scene-nav"]) {
    await expect(page.locator(part)).toBeHidden();
  }
  await expect(page.locator(".lab-caption")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Separator");
});

test("the docs sheet and the stage's panels take turns under the demo", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the sheet only exists below 960 px");
  await page.goto("/en/separator");
  const docs = stage(page).getByRole("button", { name: "Docs", exact: true });
  await docs.click();
  await expect(lab(page)).toHaveAttribute("data-sheet", "half");
  await stage(page).getByRole("button", { name: "Controls" }).click();
  await expect(lab(page)).toHaveAttribute("data-sheet", "closed");
  await expect(stageBody(page)).toHaveAttribute("data-controls", "");
  await docs.click();
  await expect(lab(page)).toHaveAttribute("data-sheet", "half");
  await expect(stageBody(page)).not.toHaveAttribute("data-controls");
});

test("a narrow Lab has the menu at the top left, the toolbar at the top right", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a narrow Lab's layout");
  await page.goto("/en/separator");
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeVisible();
  // Search sits beside Menu in the same well (DS-5).
  await expect(page.locator(".dock").getByRole("button", { name: "Search" })).toBeVisible();
  // The menu button's well and the toolbar's share a row.
  const menu = await page.locator(".dock").boundingBox();
  const bar = await page.locator(".lab-stage-bar").boundingBox();
  if (!menu || !bar) throw new Error("The menu and the toolbar need boxes.");
  expect(menu.x).toBeLessThan(20);
  expect(menu.y).toBeLessThan(20);
  expect(Math.abs(bar.y - menu.y)).toBeLessThan(2);
  expect(390 - (bar.x + bar.width)).toBeLessThan(20);
  expect(bar.x).toBeGreaterThan(menu.x + menu.width);
});

test("the sidebar's head has the brand and its close button; the scrim shuts it too", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the sidebar is a panel below 1100 px");
  await page.goto("/en/separator");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const sidebar = page.locator("#site-sidebar");
  await menu.click();
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator(".site-sidebar-head")).toContainText("OwsemUI");
  // The dock steps aside; the head's button closes the panel and hands focus back to it.
  await expect(menu).toBeHidden();
  await sidebar.getByRole("button", { name: "Close menu" }).click();
  await expect(sidebar).toBeHidden();
  await expect(menu).toBeFocused();

  await menu.click();
  await expect(sidebar).toBeVisible();
  await page.mouse.click(375, 600);
  await expect(sidebar).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("the toolbar fits a 320 px screen, stage theme and tokens in its More menu", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a phone's widths");
  await page.setViewportSize({ width: 320, height: 640 });
  // The dock holds Menu and Search; the widest toolbar has Replay.
  for (const path of ["/id/separator", "/en/tree-rail-nav#scene-trail", "/id/command-menu"]) {
    await page.goto(path);
    const bar = await page.locator(".lab-stage-bar").boundingBox();
    const menu = await page.locator(".dock").boundingBox();
    if (!bar || !menu) throw new Error("The toolbar and the menu need boxes.");
    expect(bar.x + bar.width, path).toBeLessThanOrEqual(320);
    expect(bar.x, path).toBeGreaterThan(menu.x + menu.width);
  }
  await page.goto("/en/separator");
  const more = stage(page).getByRole("button", { name: "More", exact: true });
  await expect(stage(page).getByRole("button", { name: "Stage theme" })).toBeHidden();
  await more.click();
  await page
    .locator(".lab-more")
    .getByRole("button", { name: /Stage theme/ })
    .click();
  await expect(stage(page)).toHaveAttribute("data-theme");

  // The token setup takes the menu's place, under the toolbar, and gives focus back to More.
  await page
    .locator(".lab-more")
    .getByRole("button", { name: /Token setup/ })
    .click();
  const panel = page.getByRole("dialog", { name: "Token setup" });
  await expect(panel).toBeVisible();
  await expect(page.locator(".lab-more")).toBeHidden();
  expect((await panel.boundingBox())?.y).toBeLessThan(100);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(more).toBeFocused();
});

test("the stage toolbar opens the token setup under it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a wide stage has its own Tokens button");
  await page.goto("/en/separator");
  const tokens = stage(page).getByRole("button", { name: "Tokens", exact: true });
  // Just the name: the prefix is in the panel.
  await expect(tokens).not.toContainText("--");
  await tokens.click();
  const panel = page.getByRole("dialog", { name: "Token setup" });
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("The panel needs a box.");
  expect(box.y).toBeLessThan(100);
  expect(viewport.width - (box.x + box.width)).toBeLessThan(24);
});

test("on a narrow stage Inspect docks under the demo, which keeps its size (DS-3)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "a phone's stage");
  await page.goto("/en/tree-rail-nav");
  const nav = stage(page).locator(".ow-tree-rail-nav");
  const before = (await nav.boundingBox())?.width ?? 0;
  await stage(page).getByRole("button", { name: "Inspect" }).click();
  const dock = page.locator(".lab-inspect-dock");
  await expect(dock).toBeVisible();
  // The names with the card under them, no leader lines, and the demo barely smaller.
  await expect(dock.getByRole("group", { name: "Parts" }).getByRole("button")).toHaveCount(9);
  await expect(dock.getByRole("region", { name: "Root" })).toBeVisible();
  await expect(page.locator(".lab-inspect-lines")).toHaveCount(0);
  await expect(page.locator(".lab-caption")).toBeHidden();
  await expect
    .poll(async () => (await nav.boundingBox())?.width ?? 0)
    .toBeGreaterThan(before * 0.8);
  // Every name in view: they wrap rather than scroll. Pointing at one does not pick it.
  const names = dock.getByRole("group", { name: "Parts" });
  for (const name of await names.getByRole("button").all()) await expect(name).toBeInViewport();
  await names.getByRole("button", { name: "Toggle" }).hover();
  await expect(names.getByRole("button", { name: "Root" })).toHaveAttribute("aria-pressed", "true");
  await names.getByRole("button", { name: "Toggle" }).click();
  await expect(names.getByRole("button", { name: "Toggle" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Under the open docs sheet, the names alone.
  await openSheet(page);
  await expect(dock).toHaveAttribute("data-brief", "");
  await expect(dock.getByRole("region", { name: "Root" })).toHaveCount(0);
});

test("a scene link takes the sheet to its scene; a drag down shuts it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the sheet only exists below 960 px");
  await page.goto("/en/separator");
  await openSheet(page);
  const links = page.getByRole("navigation", { name: "Scenes" });
  await links.getByRole("link", { name: /States and variants/ }).click();
  await expect(page.locator("#scene-states")).toHaveAttribute("data-active", "");
  await expect(links.getByRole("link", { name: /States and variants/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page).toHaveURL(/#scene-states$/);
  // A mouse wheel over the row scrolls it sideways.
  const row = page.locator(".lab-scene-nav .scroll-fade");
  const before = await row.evaluate((el) => el.scrollLeft);
  await row.hover();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  await expect(stage(page).getByRole("separator").first()).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );

  const handle = page.getByRole("button", { name: "Drag or tap to change the height" });
  const box = await handle.boundingBox();
  if (!box) throw new Error("The handle has no box.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, 800, { steps: 8 });
  await page.mouse.up();
  await expect(lab(page)).toHaveAttribute("data-sheet", "closed");
  // The scene stays as it was read.
  await expect(stage(page).getByRole("separator").first()).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
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
    await expect(card.locator("li", { hasText: "--ow-accent" })).toContainText(/#[0-9A-F]{6}/);
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

test("the states scene sets the themes side by side, then gives the demo back (DS-2)", async ({
  page,
}) => {
  await page.goto("/en/tree-rail-nav");
  const navs = stage(page).getByRole("navigation");
  await expect(navs).toHaveCount(1);
  await scene(page, "states");
  await expect(stage(page).getByRole("columnheader")).toHaveText(["Light", "Dark"]);
  await expect(navs).toHaveCount(4);
  const cell = (name: string) => stage(page).getByRole("navigation", { name });
  await expect(cell("Dark, Group closed").getByRole("button", { name: "Guides" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  // Each column is in its own theme.
  const background = (name: string) =>
    cell(name).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await background("Light, Group open")).not.toBe(await background("Dark, Group open"));
  // The pointer picks Installation in each.
  await expect(cell("Light, Group open").locator("a[aria-current]")).toHaveText("Installation");
  await expect(cell("Dark, Group open").locator("a[aria-current]")).toHaveText("Installation");

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
