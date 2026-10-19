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
