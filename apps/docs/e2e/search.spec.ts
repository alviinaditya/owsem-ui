import { expect, type Page, test } from "@playwright/test";
import { stage } from "./lab.ts";

const dialog = (page: Page, name = "Search docs") => page.getByRole("dialog", { name });
const field = (page: Page) => dialog(page).getByRole("combobox");

/** Opens the search the way the screen offers it: the sidebar's origin, or the dock. */
async function openFromPage(page: Page, mobile: boolean) {
  if (mobile) await page.locator(".dock").getByRole("button", { name: "Search" }).click();
  else
    await page
      .locator("#site-sidebar")
      .getByRole("button", { name: /Search docs/ })
      .click();
  await expect(field(page)).toBeFocused();
}

test("⌘K or Ctrl K opens the docs search anywhere, and closes it (DS-5)", async ({ page }) => {
  await page.goto("/en/docs/glide");
  await page.keyboard.press("Control+k");
  await expect(field(page)).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(dialog(page)).toBeHidden();
  await page.keyboard.press("Meta+k");
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
});

test("the rail's origin opens it, or the dock below 1100 px; focus comes back", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile-390";
  await page.goto("/en/docs");
  const trigger = mobile
    ? page.locator(".dock").getByRole("button", { name: "Search" })
    : page.locator("#site-sidebar").getByRole("button", { name: /Search docs/ });
  await expect(trigger).toHaveAttribute("aria-keyshortcuts", "Meta+K Control+K");
  await openFromPage(page, mobile);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  if (mobile) return;
  // The field sits on the rail with the rows' highlight, but a press at its lower edge is its
  // own, not the group's below it.
  const box = await trigger.boundingBox();
  if (!box) throw new Error("The trigger needs a box.");
  await page.mouse.click(box.x + 20, box.y + box.height - 2);
  await expect(field(page)).toBeFocused();
  await page.keyboard.press("Escape");
  const docs = page.locator("#site-sidebar").getByRole("button", { name: "Documentation" });
  await expect(docs).toHaveAttribute("aria-expanded", "true");
});

test("results are the pages, every component, and the Labs' scenes, matched fuzzily", async ({
  page,
}) => {
  await page.goto("/en/docs");
  await page.keyboard.press("Control+k");
  const list = dialog(page).getByRole("listbox");
  // With no query: pages and components, highlighted from the top; scenes wait for a query.
  await expect(list.getByRole("group", { name: "Pages" })).toBeVisible();
  await expect(list.getByRole("group", { name: "Components" }).getByRole("option")).toHaveCount(42);
  await expect(list.getByRole("group", { name: "Lab scenes" })).toHaveCount(0);

  // Family and status show on each component; the letters of a name in order find it.
  await field(page).fill("trn");
  await expect(list.getByRole("option").first()).toContainText("Tree Rail Nav");
  await expect(list.getByRole("option").first()).toContainText("Owsem");
  await field(page).fill("lumen");
  await expect(list.getByRole("option", { name: /Lumen Rail Nav/ })).toContainText("Soon");
  // A word in a page's headings.
  await field(page).fill("forced colors");
  await expect(list.getByRole("group", { name: "Pages" })).toBeVisible();

  await field(page).fill("zzqq");
  await expect(dialog(page)).toContainText("Nothing matches “zzqq”.");
  await expect(list).toBeHidden();
});

test("Enter opens a Lab, a Coming soon page, or a Lab's scene", async ({ page }) => {
  await page.goto("/en/docs");
  await page.keyboard.press("Control+k");
  await field(page).fill("separator");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/separator$/);
  await expect(dialog(page)).toBeHidden();

  await page.keyboard.press("Control+k");
  await expect(field(page)).toHaveValue("");
  await field(page).fill("button");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/button$/);
  await expect(page.getByRole("main").getByText("Coming soon", { exact: true })).toBeVisible();

  await page.keyboard.press("Control+k");
  await field(page).fill("opening and closing");
  await expect(dialog(page).getByRole("option").first()).toContainText("Tree Rail Nav · Scene 2");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/tree-rail-nav#scene-groups$/);
});

test("speaks the page's language", async ({ page }) => {
  await page.goto("/id/docs");
  await page.keyboard.press("Control+k");
  const search = dialog(page, "Cari dokumentasi");
  await expect(search.getByRole("combobox")).toHaveAttribute(
    "placeholder",
    "Cari komponen, halaman, scene…",
  );
  await expect(search.getByRole("group", { name: "Halaman" })).toBeVisible();
  await search.getByRole("combobox").fill("pemisah");
  await expect(search.getByRole("option").first()).toContainText("Separator");
});

test("on the Command Menu Lab, ⌘K on the stage drives the demo, not the docs search", async ({
  page,
}) => {
  await page.goto("/en/command-menu");
  const demo = stage(page).getByRole("dialog", { name: "Commands" });
  await expect(demo).toBeVisible();
  // The demo opens on the stage without taking focus from the reader.
  await expect(demo.getByRole("combobox")).not.toBeFocused();
  await stage(page).click({ position: { x: 8, y: 80 } });
  await page.keyboard.press("Control+k");
  await expect(demo).toBeHidden();
  await expect(dialog(page)).toBeHidden();
  await page.keyboard.press("Control+k");
  await expect(demo.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(demo).toBeHidden();
});
