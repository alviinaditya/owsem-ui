import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("checkbox", {
  examples: ["Default", "Sizes", "Indeterminate", "Group", "Disabled"],
  parts: ["Root", "Indicator", "Glyph"],
  specimen: '.ow-checkbox[data-indeterminate] [data-glyph="minus"]',
});

test("a label presses its box, and the parent shows a minus or a check", async ({ page }) => {
  await visit(page, "/en/checkbox");
  const updates = demo(page).getByRole("checkbox", { name: "Tell me about new releases" });
  await expect(updates).toHaveAttribute("aria-checked", "false");
  // The label's text, not the box.
  await demo(page).getByText("Tell me about new releases").click();
  await expect(updates).toHaveAttribute("aria-checked", "true");

  await pick(page, "Indeterminate");
  const all = demo(page).getByRole("checkbox", { name: "All tasks" });
  const tag = demo(page).getByRole("checkbox", { name: "Tag the release" });
  const changelog = demo(page).getByRole("checkbox", { name: "Write the changelog" });
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await expect(all.locator('[data-glyph="minus"]')).toHaveCSS("opacity", "1");
  await demo(page).getByText("Tag the release").click();
  await expect(tag).toHaveAttribute("aria-checked", "true");
  await demo(page).getByText("Write the changelog").click();
  await expect(changelog).toHaveAttribute("aria-checked", "true");
  await expect(all).toHaveAttribute("aria-checked", "true");
  await expect(all.locator('[data-glyph="check"]')).toHaveCSS("opacity", "1");
  await expect(all.locator('[data-glyph="minus"]')).toHaveCSS("opacity", "0");
  // The parent takes all of them off, and its Indicator leaves.
  await all.click();
  await expect(tag).toHaveAttribute("aria-checked", "false");
  await expect(all.locator(".ow-checkbox__indicator")).toHaveCount(0);
});

test("a Checkbox Group names a set of boxes and holds their values", async ({ page }) => {
  await visit(page, "/en/checkbox");
  await pick(page, "Group");
  const group = demo(page).getByRole("group", { name: "Notify me by" });
  await expect(group.getByRole("checkbox")).toHaveCount(3);
  await expect(group.getByRole("checkbox", { name: "Email" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("a disabled box ignores presses, and sizes grow", async ({ page }) => {
  await visit(page, "/en/checkbox");
  await pick(page, "Disabled");
  const off = demo(page).getByRole("checkbox", { name: "Disabled", exact: true });
  await off.click({ force: true });
  await expect(off).toHaveAttribute("aria-checked", "false");
  await pick(page, "Sizes");
  const widths = await demo(page)
    .locator(".ow-checkbox")
    .evaluateAll((els) =>
      els.map((el) => Math.round(Number.parseFloat(getComputedStyle(el).width))),
    );
  expect(widths).toEqual([19, 20, 22]);
});
