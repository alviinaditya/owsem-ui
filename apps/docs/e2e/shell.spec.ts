import { expect, test } from "@playwright/test";
import { catalog, isAvailable, readingOrder } from "../lib/catalog.ts";
import { tools, visit } from "./example-page.ts";
import { showSidebar, sidebar as sidebarOf } from "./helpers.ts";

const robots = (page: import("@playwright/test").Page) => page.locator('meta[name="robots"]');

test("the sidebar lists the available components by family, each by title; planned ones stay on the index", async ({
  page,
}, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") await showSidebar(page);
  const sidebar = sidebarOf(page);
  await expect(sidebar.getByRole("group", { name: "Getting started" })).toBeVisible();
  for (const entry of catalog) {
    const link = sidebar.getByRole("link", { name: entry.title, exact: true });
    await expect(link).toHaveCount(isAvailable(entry) ? 1 : 0);
  }
  await expect(sidebar.getByText("Soon")).toHaveCount(0);
  // Base UI's components, then OwsemUI's own: a group each, its links by title.
  for (const [family, name] of [
    ["base", "Base components"],
    ["owsem", "Owsem components"],
  ] as const) {
    const titles = readingOrder
      .filter((entry) => entry.family === family && isAvailable(entry))
      .map((entry) => entry.title);
    expect([...titles].sort((a, b) => a.localeCompare(b, "en"))).toEqual(titles);
    await expect(sidebar.getByRole("group", { name }).getByRole("link")).toHaveText(titles);
  }
});

test("the sidebar's content scrolls on its own, and the page does not", async ({
  page,
}, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") await showSidebar(page);
  const scroller = page.locator("#site-sidebar-scroll");
  expect(await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  expect(await scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  // Long labels truncate inside it; only the height scrolls.
  expect(await scroller.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("planned components show Coming soon and stay out of search", async ({ page }) => {
  await page.goto("/en/combobox");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Combobox" })).toBeVisible();
  await expect(main.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Combobox", exact: true })).toHaveAttribute(
    "href",
    "https://base-ui.com/react/components/combobox",
  );
  await expect(robots(page)).toHaveAttribute("content", /noindex/);

  await page.goto("/en/separator");
  await expect(robots(page)).toHaveCount(0);
});

test("a component page links the components before and after it, as Buttons", async ({ page }) => {
  await visit(page, "/en/tabs");
  await tools(page).getByRole("button", { name: "Docs", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Component" });
  await nav.scrollIntoViewIfNeeded();
  // Base components by title: Switch, Tabs, Toast.
  await expect(nav.getByRole("link", { name: "Previous: Switch" })).toHaveAttribute("rel", "prev");
  await expect(nav.getByRole("link", { name: "Next: Toast" })).toHaveAttribute("rel", "next");
  for (const link of await nav.getByRole("link").all()) {
    await expect(link).toHaveClass(/\bow-button\b/);
    await expect(link).toHaveClass(/\bow-button--secondary\b/);
    await expect(link.locator("svg")).toHaveCount(1);
  }
});

test("the index shows Base, then Owsem, and filters by family", async ({ page }) => {
  await page.goto("/en");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Separator", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { level: 2 })).toHaveText([
    "Base components",
    "Owsem components",
  ]);
  const owsem = main.getByRole("region", { name: "Owsem components" });
  await expect(owsem.getByRole("link", { name: "Tree Rail Nav", exact: true })).toBeVisible();
  await expect(owsem.getByRole("link", { name: "Button", exact: true })).toHaveCount(0);

  const filter = main.getByRole("group", { name: "Family" });
  await filter.getByRole("button", { name: "Owsem" }).click();
  await expect(filter.getByRole("button", { name: "Owsem" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(main.getByRole("link", { name: "Separator", exact: true })).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Lumen Rail Nav", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Tree Rail Nav", exact: true })).toBeVisible();
  // A component has one type: Button, from Base UI, is Base only.
  await expect(main.getByRole("link", { name: "Button", exact: true })).toHaveCount(0);

  await filter.getByRole("button", { name: "Base" }).click();
  // Pressing the chosen family again keeps it: one is always chosen.
  await filter.getByRole("button", { name: "Base" }).click();
  await expect(filter.getByRole("button", { name: "Base" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(main.getByRole("link", { name: "Lumen Rail Nav", exact: true })).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Button", exact: true })).toBeVisible();
});

test("the index shows a grid or a list, and keeps the choice", async ({ page }) => {
  await page.goto("/en");
  const main = page.getByRole("main");
  const view = main.getByRole("group", { name: "View" });
  const preview = main.locator(".component-preview").first();
  await expect(preview).toBeVisible();

  await view.getByRole("button", { name: "List" }).click();
  await expect(view.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toBeHidden();

  // Laid out as a list from the first paint, before hydration.
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-index-view", "list");
  await expect(preview).toBeHidden();
  await expect(view.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");

  await view.getByRole("button", { name: "Grid" }).click();
  await expect(preview).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-index-view");
});

test("the mobile drawer opens and closes after navigating", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the drawer only exists below 768 px");
  await page.goto("/id/docs");
  const open = page.getByRole("button", { name: "Tampilkan sidebar" });
  const drawer = sidebarOf(page, "Navigasi dokumentasi");
  await expect(drawer).toBeHidden();

  await open.click();
  await expect(drawer).toBeVisible();
  // Escape shuts it and returns focus to the button.
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await drawer.getByRole("link", { name: "Separator" }).click();
  await expect(page).toHaveURL(/\/id\/separator$/);
  await expect(drawer).toBeHidden();

  // Going back to the page where it was opened keeps it closed.
  await page.goBack();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(drawer).toBeHidden();
});

test("the sidebar marks the page you are on", async ({ page }, testInfo) => {
  await page.goto("/en/separator");
  if (testInfo.project.name === "mobile-390") await showSidebar(page);
  const sidebar = sidebarOf(page);
  await expect(sidebar.getByRole("link", { name: "Separator", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(sidebar.locator('.ow-sidebar__content [aria-current="page"]')).toHaveCount(1);
  // A DOM click: the sidebar may still be scrolling Separator into view, which moves the rows
  // under a pointer.
  await sidebar
    .getByRole("link", { name: "Kbd", exact: true })
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page).toHaveURL(/\/en\/kbd$/);
  // The drawer shuts after a navigation.
  if (testInfo.project.name === "mobile-390") await showSidebar(page);
  await expect(sidebar.getByRole("link", { name: "Kbd", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(sidebar.locator('.ow-sidebar__content [aria-current="page"]')).toHaveCount(1);
});

test("Ctrl or ⌘ with B folds the sidebar and the page takes its room, and the choice is kept", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "a phone's sidebar is a drawer");
  await page.goto("/en/docs/glide");
  const sidebar = sidebarOf(page);
  const main = page.locator("#content");
  const open = (await main.boundingBox())?.width ?? 0;
  await expect(sidebar).toBeVisible();
  await page.keyboard.press("Control+b");
  await expect(sidebar).toBeHidden();
  await expect.poll(async () => (await main.boundingBox())?.width ?? 0).toBeGreaterThan(open + 200);
  // The open button is at the page's top left, and the choice survives a reload.
  await page.reload();
  await expect(sidebar).toBeHidden();
  await page.getByRole("button", { name: "Show sidebar" }).click();
  await expect(sidebar).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("owsem-sidebar"))).toBeNull();
  // The sidebar's own button folds it too.
  await sidebar.getByRole("button", { name: "Hide sidebar" }).click();
  await expect(sidebar).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("owsem-sidebar"))).toBe("hidden");
});

test("the sidebar stays mounted from the docs to a component page, so the trail travels there", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the sidebar is a drawer below 768 px");
  await page.goto("/en/docs/glide");
  await expect(page.locator(".site")).toHaveAttribute("data-mounted", "");
  const sidebar = page.locator("#site-sidebar");
  await sidebar.evaluate((el) => el.setAttribute("data-mark", "before"));
  await sidebar.getByRole("link", { name: "Separator", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/separator$/);
  // Same element: not remounted by the change of layout.
  await expect(sidebar).toHaveAttribute("data-mark", "before");
  await expect(sidebar.getByRole("link", { name: "Separator", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("no top bar: the language is a menu at the top right, and a button opens the sidebar below 768 px", async ({
  page,
}, testInfo) => {
  await page.goto("/en/docs");
  await expect(page.getByRole("banner")).toHaveCount(0);
  // Language is a menu beside Theme, at the page's top right; the sidebar has no foot.
  await expect(page.locator(".site-sidebar-foot")).toHaveCount(0);
  const tools = page.getByRole("toolbar", { name: "Page tools" });
  await expect(tools.getByRole("button", { name: "Theme" })).toBeVisible();
  await tools.getByRole("button", { name: "Language: English" }).click();
  await expect(page.getByRole("menuitem", { name: "Bahasa Indonesia" })).toHaveAttribute(
    "href",
    "/id/docs",
  );
  await expect(page.getByRole("button", { name: /Token/ })).toHaveCount(0);
  if (testInfo.project.name === "mobile-390") {
    // The button sits at the top left, above the page's text.
    const open = await page.getByRole("button", { name: "Show sidebar" }).boundingBox();
    const title = await page.getByRole("heading", { level: 1 }).boundingBox();
    if (!open || !title) throw new Error("The button and the title need boxes.");
    expect(open.x).toBeLessThan(20);
    expect(open.y).toBeLessThan(20);
    expect(title.y).toBeGreaterThan(open.y + open.height);
  } else {
    await expect(page.getByRole("button", { name: "Show sidebar" })).toBeHidden();
  }
});

test("a navigation fades the new page in, with no view transition to freeze the sidebar", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the sidebar is a drawer below 768 px");
  await page.goto("/en/docs/glide");
  await expect(page.locator(".site")).toHaveAttribute("data-mounted", "");
  // The page the server sent does not fade in.
  await expect(page.locator("main.page-enter")).not.toHaveAttribute("data-enter");
  // Counts view transitions on <html>, where the test can read it back.
  await page.evaluate(() => {
    const root = document.documentElement;
    const start = document.startViewTransition?.bind(document);
    root.dataset.viewTransitions = "0";
    if (start) {
      document.startViewTransition = (update) => {
        root.dataset.viewTransitions = String(Number(root.dataset.viewTransitions) + 1);
        return start(update);
      };
    }
  });
  await sidebarOf(page).getByRole("link", { name: "Button", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/button$/);
  const main = page.locator("main.page-enter");
  await expect(main).toHaveAttribute("data-enter", "");
  const names = await main.evaluate((el) =>
    el.getAnimations().flatMap((a) => (a instanceof CSSAnimation ? a.animationName : [])),
  );
  expect(names).toEqual(expect.arrayContaining(["page-fade", "page-rise"]));
  await expect(page.locator("html")).toHaveAttribute("data-view-transitions", "0");
});

test("the drawer has the brand and the search; Escape and the scrim shut it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the sidebar is a drawer below 768 px");
  await visit(page, "/en/tabs");
  const open = page.getByRole("button", { name: "Show sidebar" });
  const drawer = sidebarOf(page);
  await open.click();
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(".site-sidebar-head")).toContainText("OwsemUI");
  await expect(drawer.getByRole("button", { name: /Search docs/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(open).toBeFocused();

  await open.click();
  await expect(drawer).toBeVisible();
  await page.mouse.click(375, 600);
  await expect(drawer).toBeHidden();
});
