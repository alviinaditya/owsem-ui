import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

// The tooltip is in a portal on the body; the one closing stays a moment, without data-open.
const open = (page: Page) => page.locator(".ow-tooltip__popup[data-open]");

pageTests("avatar", {
  examples: ["Default", "Sizes", "Fallback", "Group", "Names"],
  parts: ["Root", "Image", "Fallback", "Group"],
  specimen: ".ow-avatar",
});

test("the picture loads over the initials, from inline data and no request", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith("data:") && !url.startsWith("http://localhost")) outside.push(url);
  });
  await visit(page, "/en/avatar");
  const avatar = demo(page).locator(".ow-avatar");
  await expect(avatar.locator("img")).toHaveAttribute("alt", "Ana Rahman");
  await expect(avatar.locator(".ow-avatar__fallback")).toHaveCount(0);
  expect(outside).toEqual([]);
});

test("the sizes are 32, 40, and 48px circles", async ({ page }) => {
  await visit(page, "/en/avatar");
  await pick(page, "Sizes");
  const avatars = demo(page).locator(".ow-avatar");
  await expect(avatars).toHaveCount(3);
  const boxes = await avatars.evaluateAll((els) =>
    els.map((el) => [el.getBoundingClientRect().width, el.getBoundingClientRect().height]),
  );
  expect(boxes).toEqual([
    [32, 32],
    [40, 40],
    [48, 48],
  ]);
});

test("a broken picture leaves the fallback, and an icon is centered", async ({ page }) => {
  await visit(page, "/en/avatar");
  await pick(page, "Fallback");
  const avatars = demo(page).locator(".ow-avatar");
  await expect(avatars).toHaveCount(3);
  await expect(avatars.nth(0)).toContainText("AR");
  await expect(avatars.nth(1).locator("svg")).toBeVisible();
  await expect(avatars.nth(2).locator("img")).toHaveCount(0);
  await expect(avatars.nth(2)).toContainText("BS");
  const captions = demo(page).locator(".demo-avatar-captioned > span:not(.ow-avatar)");
  await expect(captions).toHaveText(["No image", "Icon", "Broken image"]);
  await expect(page.getByRole("img", { name: "Budi Santoso" })).toBeVisible();
});

test("a group overlaps its avatars, cuts them out, and its links show a whole focus ring", async ({
  page,
}) => {
  await visit(page, "/en/avatar");
  await pick(page, "Group");
  const group = demo(page).getByRole("group", { name: "Design team" });
  await expect(group).toHaveCount(2);
  const avatars = group.first().locator(".ow-avatar");
  await expect(avatars).toHaveCount(4);
  const lefts = await avatars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
  // Each starts an eighth of its width before the one before ends: 40 × 0.875.
  expect((lefts[1]?.left ?? 0) - (lefts[0]?.left ?? 0)).toBeCloseTo(35, 0);
  const masks = await avatars.evaluateAll((els) => els.map((el) => getComputedStyle(el).maskImage));
  expect(masks.slice(0, 3).every((mask) => mask.includes("radial-gradient"))).toBe(true);
  expect(masks[3]).toBe("none");
  await page.getByRole("link", { name: "Ana" }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ana" })).toBeFocused();
  const first = avatars.first();
  expect(await first.evaluate((el) => getComputedStyle(el).maskImage)).toBe("none");
  expect(await first.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe("2px");
});

test("hovering an avatar shows its name, then the next one's, and the avatar shows whole", async ({
  page,
}) => {
  await visit(page, "/en/avatar");
  await pick(page, "Names");
  const group = demo(page).getByRole("group", { name: "Team members" });
  const ana = group.getByRole("button", { name: "Ana Rahman" });
  const budi = group.getByRole("button", { name: "Budi Santoso" });
  await ana.hover();
  await expect(open(page)).toHaveText("Ana Rahman");
  expect(await ana.evaluate((el) => getComputedStyle(el).maskImage)).toBe("none");
  expect(await ana.evaluate((el) => getComputedStyle(el).zIndex)).toBe("1");
  await budi.hover();
  await expect(open(page)).toHaveText("Budi Santoso");
  expect(await budi.evaluate((el) => getComputedStyle(el).maskImage)).toBe("none");
  expect(await ana.evaluate((el) => getComputedStyle(el).maskImage)).not.toBe("none");
});

test("hovering the second avatar cuts the third one at its start as well as at its end", async ({
  page,
}) => {
  await visit(page, "/en/avatar");
  await pick(page, "Names");
  const group = demo(page).getByRole("group", { name: "Team members" });
  const avatars = group.locator(".ow-avatar");
  const layers = (index: number) =>
    avatars
      .nth(index)
      .evaluate((el) => getComputedStyle(el).maskImage.split("radial-gradient").length - 1);
  expect(await layers(2)).toBe(1);
  await group.getByRole("button", { name: "Budi Santoso" }).hover();
  await expect.poll(() => layers(2)).toBe(2);
  await expect(open(page)).toHaveText("Budi Santoso");
});

test("Tab reaches each avatar and its tooltip opens on focus", async ({ page }) => {
  await visit(page, "/en/avatar");
  await pick(page, "Names");
  const group = demo(page).getByRole("group", { name: "Team members" });
  await group.getByRole("button", { name: "Ana Rahman" }).focus();
  await page.keyboard.press("Tab");
  await expect(group.getByRole("button", { name: "Budi Santoso" })).toBeFocused();
  await expect(open(page)).toHaveText("Budi Santoso");
});
