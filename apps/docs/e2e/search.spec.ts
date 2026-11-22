import { expect, type Page, test } from "@playwright/test";
import { catalog } from "../lib/catalog.ts";
import { showSidebar, sidebar as sidebarOf } from "./helpers.ts";

/** Goes to a page and waits for it to hydrate, so its keys and buttons answer. */
async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator(".site")).toHaveAttribute("data-mounted", "");
}

const dialog = (page: Page, name = "Search docs") => page.getByRole("dialog", { name });
const field = (page: Page) => dialog(page).getByRole("combobox");

test("⌘K or Ctrl K opens the docs search anywhere, and closes it (DS-5)", async ({ page }) => {
  await visit(page, "/en/docs/glide");
  await page.keyboard.press("Control+k");
  await expect(field(page)).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(dialog(page)).toBeHidden();
  await page.keyboard.press("Meta+k");
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
});

test("the sidebar's search field opens it, in the drawer on a phone; focus comes back", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile-390";
  await visit(page, "/en/docs");
  if (mobile) await showSidebar(page);
  const trigger = sidebarOf(page).getByRole("button", { name: /Search docs/ });
  await expect(trigger).toHaveAttribute("aria-keyshortcuts", "Meta+K Control+K");
  await trigger.click();
  await expect(field(page)).toBeFocused();
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
});

test("results are the pages, every component, and the components' docs sections, matched fuzzily", async ({
  page,
}) => {
  await visit(page, "/en/docs");
  await page.keyboard.press("Control+k");
  const list = dialog(page).getByRole("listbox");
  // With no query: pages and components, highlighted from the top; sections wait for a query.
  await expect(list.getByRole("group", { name: "Pages" })).toBeVisible();
  await expect(list.getByRole("group", { name: "Components" }).getByRole("option")).toHaveCount(
    catalog.length,
  );
  await expect(list.getByRole("group", { name: "Component docs" })).toHaveCount(0);

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

test("Enter opens a component, a Coming soon page, or a docs section", async ({ page }) => {
  await visit(page, "/en/docs");
  await page.keyboard.press("Control+k");
  await field(page).fill("separator");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/separator$/);
  await expect(dialog(page)).toBeHidden();

  await page.keyboard.press("Control+k");
  await expect(field(page)).toHaveValue("");
  // Planned until the owner's prototype is built.
  await field(page).fill("lumen rail nav");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/lumen-rail-nav$/);
  await expect(page.getByRole("main").getByText("Coming soon", { exact: true })).toBeVisible();

  await page.keyboard.press("Control+k");
  await field(page).fill("tabs theming");
  await expect(dialog(page).getByRole("option").first()).toContainText("Tabs · Theming");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/tabs#theming$/);
  await expect(page.locator(".cp-docs")).toBeVisible();
});

test("speaks the page's language", async ({ page }) => {
  await visit(page, "/id/docs");
  await page.keyboard.press("Control+k");
  const search = dialog(page, "Cari dokumentasi");
  await expect(search.getByRole("combobox")).toHaveAttribute(
    "placeholder",
    "Cari komponen, halaman, bagian…",
  );
  await expect(search.getByRole("group", { name: "Halaman" })).toBeVisible();
  await search.getByRole("combobox").fill("pemisah");
  await expect(search.getByRole("option").first()).toContainText("Separator");
});
