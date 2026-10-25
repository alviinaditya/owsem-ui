import { expect, test } from "@playwright/test";
import { catalog, isAvailable } from "../lib/catalog.ts";
import { openSheet } from "./lab.ts";

const robots = (page: import("@playwright/test").Page) => page.locator('meta[name="robots"]');

test("the sidebar lists every catalog component", async ({ page }, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  }
  const sidebar = page.getByRole("navigation", { name: "Documentation navigation" });
  for (const entry of catalog) {
    const name = isAvailable(entry) ? entry.title : `${entry.title} Soon`;
    await expect(sidebar.getByRole("link", { name, exact: true })).toHaveCount(1);
  }
});

test("the sidebar fades the edges that have more to scroll", async ({ page }, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  }
  const scroller = page.locator("#site-sidebar-scroll");
  await expect(scroller).not.toHaveAttribute("data-fade-top");
  await expect(scroller).toHaveAttribute("data-fade-bottom", "");
  await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(scroller).toHaveAttribute("data-fade-top", "");
  await expect(scroller).not.toHaveAttribute("data-fade-bottom");
});

test("planned components show Coming soon and stay out of search", async ({ page }) => {
  await page.goto("/en/meter");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Meter" })).toBeVisible();
  await expect(main.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Meter", exact: true })).toHaveAttribute(
    "href",
    "https://base-ui.com/react/components/meter",
  );
  await expect(robots(page)).toHaveAttribute("content", /noindex/);

  await page.goto("/en/separator");
  await expect(robots(page)).toHaveCount(0);
});

test("a Lab links the components before and after it", async ({ page }) => {
  await page.goto("/en/separator");
  // Below 960 px the links end the docs sheet.
  await openSheet(page);
  const nav = page.getByRole("navigation", { name: "Component" });
  await expect(nav.getByRole("link", { name: "Previous: Collapsible" })).toHaveAttribute(
    "rel",
    "prev",
  );
  await expect(nav.getByRole("link", { name: "Next: Kbd" })).toHaveAttribute("rel", "next");
});

test("the index filters components by family", async ({ page }) => {
  await page.goto("/en");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Separator", exact: true })).toBeVisible();

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

test("the mobile menu opens and closes after navigating", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the menu button only shows below 900 px");
  await page.goto("/id/docs");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const sidebar = page.getByRole("navigation", { name: "Navigasi dokumentasi" });
  await expect(sidebar).toBeHidden();

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  // Escape inside the panel closes it and returns focus to the button.
  await expect(sidebar.getByRole("link").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(sidebar).toBeHidden();
  await menu.click();
  await sidebar.getByRole("link", { name: "Separator" }).click();
  await expect(page).toHaveURL(/\/id\/separator$/);
  await expect(sidebar).toBeHidden();

  // Going back to the page where it was opened keeps it closed.
  await page.goBack();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(sidebar).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("the sidebar's trail runs to the page, then to the scene being read (DS-14)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the sidebar is a menu panel below 1100 px");
  await page.goto("/en/separator");
  const sidebar = page.locator("#site-sidebar");
  await expect(sidebar.getByRole("link", { name: "Separator", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // The deepest current row wins: the scene, under its component.
  await expect(sidebar.locator("[data-arrived]")).toContainText("Overview");
  await page.evaluate(() =>
    document.getElementById("scene-states")?.scrollIntoView({ behavior: "instant" }),
  );
  await expect(sidebar.locator("[data-arrived]")).toContainText("States and variants", {
    timeout: 4000,
  });
});

test("sidebar groups close and open again (DS-14)", async ({ page }, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  }
  const sidebar = page.getByRole("navigation", { name: "Documentation navigation" });
  const display = sidebar.getByRole("button", { name: "Display" });
  const meter = sidebar.getByRole("link", { name: "Meter Soon" });
  await expect(display).toHaveAttribute("aria-expanded", "true");
  await display.click();
  await expect(display).toHaveAttribute("aria-expanded", "false");
  await expect(meter).toBeHidden();
  await display.click();
  await expect(meter).toBeVisible();
});

test("the sidebar stays mounted from the docs to a Lab, so the trail travels there", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the sidebar is a menu panel below 1100 px");
  await page.goto("/en/docs/glide");
  const sidebar = page.locator("#site-sidebar");
  await sidebar.evaluate((el) => el.setAttribute("data-mark", "before"));
  await sidebar.getByRole("link", { name: "Separator", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/separator$/);
  // Same element: not remounted by the change of layout.
  await expect(sidebar).toHaveAttribute("data-mark", "before");
  await expect(sidebar.locator("[data-arrived]")).toContainText("Overview", { timeout: 4000 });
});

test("no top bar: the sidebar's foot holds the settings, and a dock opens it below 1100 px", async ({
  page,
}, testInfo) => {
  await page.goto("/en/docs");
  await expect(page.getByRole("banner")).toHaveCount(0);
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const foot = page.locator(".site-sidebar-foot");
  if (testInfo.project.name === "mobile-390") {
    await expect(foot).toBeHidden();
    // The dock sits at the top left, above the page's text, as on a Lab.
    const dock = await page.locator(".dock").boundingBox();
    const title = await page.getByRole("heading", { level: 1 }).boundingBox();
    if (!dock || !title) throw new Error("The dock and the title need boxes.");
    expect(dock.x).toBeLessThan(20);
    expect(dock.y).toBeLessThan(20);
    expect(title.y).toBeGreaterThan(dock.y + dock.height);
    await menu.click();
  } else {
    await expect(menu).toBeHidden();
  }
  await expect(foot.getByRole("group", { name: "Theme" })).toBeVisible();
  await expect(foot.getByRole("navigation", { name: "Language" })).toBeVisible();
  // The token setup opens from the Labs (stage toolbar, Token chips), not from the foot.
  await expect(foot.getByRole("button", { name: /Token/ })).toHaveCount(0);
});

test("a navigation fades between pages, and the sidebar stays put", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the sidebar is a panel below 1100 px");
  await page.goto("/en/docs/glide");
  // Records the animations of the next view transition once it is ready.
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      const transition = start(update);
      transition.ready.then(() => {
        document.documentElement.dataset.animations = document
          .getAnimations()
          .flatMap((animation) =>
            animation instanceof CSSAnimation ? animation.animationName : [],
          )
          .join(" ");
      });
      return transition;
    };
  });
  const sidebar = page.getByRole("navigation", { name: "Documentation navigation" });
  await sidebar.getByRole("link", { name: "Button", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/button$/);
  await expect(page.locator("html")).toHaveAttribute("data-animations", /page-fade.*page-rise/);
  await expect(page.locator(".site-sidebar")).toHaveCSS("view-transition-name", "site-sidebar");
});
