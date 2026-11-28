import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("table-of-contents", {
  examples: ["Default", "Flat", "Recolor"],
  parts: ["Root", "List", "Item", "Link", "Rail", "Marker"],
  specimen: ".ow-table-of-contents__marker[data-visible]",
});

test("the list follows its article, and a picked link holds", async ({ page }) => {
  await visit(page, "/en/table-of-contents");
  const toc = demo(page).getByRole("navigation", { name: "On this page" });
  const current = toc.locator('[aria-current="location"]');
  const article = demo(page).locator(".demo-toc-article");
  await expect(current).toHaveCount(0);
  await article.evaluate((el) => {
    el.scrollTop = (el.querySelector<HTMLElement>("#toc-theming")?.offsetTop ?? 0) - 8;
  });
  await expect(current).toHaveText("Theming");
  await expect(toc.locator(".ow-table-of-contents__marker")).toHaveAttribute("data-visible", "");
  // Components is too short to reach the line: the article goes as far as it can, and it holds.
  await toc.getByRole("link", { name: "Components" }).click();
  await expect(current).toHaveText("Components");
  await expect
    .poll(() => article.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
    .toBeLessThan(1);
  await expect(current).toHaveText("Components");
  // The demo's links scroll the article, not the page.
  expect(new URL(page.url()).hash).toBe("");
});

test("a wheel lets go of a picked link, and sub-sections nest under their section", async ({
  page,
}) => {
  await visit(page, "/en/table-of-contents");
  const toc = demo(page).getByRole("navigation", { name: "On this page" });
  const current = toc.locator('[aria-current="location"]');
  const article = demo(page).locator(".demo-toc-article");
  await toc.getByRole("link", { name: "Components" }).click();
  await expect(current).toHaveText("Components");
  await expect
    .poll(() => article.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
    .toBeLessThan(1);
  // A wheel of the visitor's own: the reading line decides again.
  await article.dispatchEvent("wheel", { deltaY: -40 });
  await article.evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(current).toHaveCount(0);
  // A sub-section is a list inside its section's item.
  const nested = toc.locator(".ow-table-of-contents__list .ow-table-of-contents__list");
  await expect(nested.getByRole("link")).toHaveText([
    "Light and dark",
    "Recoloring with theme tokens",
  ]);
  await expect(nested).toHaveAttribute("data-depth", "2");
});

test("the Flat example has one level, and Recolor sets the marker's token on the nav", async ({
  page,
}) => {
  await visit(page, "/en/table-of-contents");
  await pick(page, "Flat");
  await expect(demo(page).locator(".ow-table-of-contents__list")).toHaveCount(1);
  await expect(demo(page).getByRole("link")).toHaveCount(4);
  await pick(page, "Recolor");
  const marker = demo(page).locator(".ow-table-of-contents__marker");
  await expect(marker).toHaveAttribute("data-visible", "");
  const [recolored, plain] = await Promise.all([
    marker.evaluate((el) => getComputedStyle(el).stroke),
    (async () => {
      await pick(page, "Default");
      await demo(page)
        .locator(".demo-toc-article")
        .evaluate((el) => {
          el.scrollTop = (el.querySelector<HTMLElement>("#toc-theming")?.offsetTop ?? 0) - 8;
        });
      return demo(page)
        .locator(".ow-table-of-contents__marker")
        .evaluate((el) => getComputedStyle(el).stroke);
    })(),
  ]);
  expect(recolored).not.toBe(plain);
});
