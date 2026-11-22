import { expect, type Locator, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("icon-morph", {
  examples: ["Default", "Icon button", "Toggle", "With a label", "Duration"],
  parts: ["Root", "Item"],
  specimen: ".ow-icon-morph__item",
});

const size = (button: Locator) =>
  button.evaluate((el: HTMLElement) => [el.offsetWidth, el.offsetHeight]);

test("an icon swaps in place, and the old one leaves unread", async ({ page }) => {
  await visit(page, "/en/icon-morph");
  const play = demo(page).getByRole("button", { name: "Play" });
  const before = await size(play);
  await play.click();
  const pause = demo(page).getByRole("button", { name: "Pause" });
  const items = pause.locator(".ow-icon-morph__item");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toHaveAttribute("data-ending-style", "");
  await expect(items.first()).toHaveAttribute("aria-hidden", "true");
  expect(await size(pause)).toEqual(before);
  // Once the swap ends, only the new icon is left.
  await expect(items).toHaveCount(1);
  await expect(items).not.toHaveAttribute("data-ending-style");
});

test("Like fills its heart in the toggle, and Copy link checks off then goes back", async ({
  page,
}) => {
  await visit(page, "/en/icon-morph");
  const like = demo(page).getByRole("button", { name: "Like" });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like.locator(".ow-icon-morph__item")).toHaveCount(1);

  const copy = demo(page).getByRole("button", { name: "Copy link" });
  await copy.click();
  await expect(demo(page).getByRole("status")).toHaveText("Link copied");
  await expect(demo(page).getByRole("status")).toHaveText("");
});

test("a longer duration keeps the old icon around longer", async ({ page }) => {
  await visit(page, "/en/icon-morph");
  await pick(page, "Duration");
  const play = demo(page).getByRole("button", { name: "Play" });
  await play.click();
  const items = demo(page).getByRole("button", { name: "Pause" }).locator(".ow-icon-morph__item");
  await expect(items).toHaveCount(2);
  await page.waitForTimeout(400);
  await expect(items).toHaveCount(2);
  await expect(items).toHaveCount(1);
});
