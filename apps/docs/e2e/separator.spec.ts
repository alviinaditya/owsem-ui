import { expect, test } from "@playwright/test";
import { demo, pageTests, picker, visit } from "./example-page.ts";

pageTests("separator", {
  examples: ["Default", "Vertical", "Custom line"],
  parts: ["Root"],
  specimen: ".ow-separator",
});

test("horizontal by default, vertical in a row, and a custom line colors only itself", async ({
  page,
}) => {
  await visit(page, "/en/separator");
  const separator = demo(page).getByRole("separator");
  await expect(separator).toHaveCount(1);
  await expect(separator).toHaveAttribute("aria-orientation", "horizontal");

  await picker(page).getByRole("button", { name: "Vertical" }).click();
  const lines = demo(page).getByRole("separator");
  await expect(lines).toHaveCount(2);
  await expect(lines.first()).toHaveAttribute("aria-orientation", "vertical");
  const box = await lines.first().boundingBox();
  expect(box?.width ?? 99).toBeLessThanOrEqual(1);
  expect(box?.height ?? 0).toBeGreaterThan(10);

  const color = (el: Element) => getComputedStyle(el).borderBlockStartColor;
  await picker(page).getByRole("button", { name: "Default" }).click();
  const plain = await demo(page).getByRole("separator").evaluate(color);
  await picker(page).getByRole("button", { name: "Custom line" }).click();
  const custom = await demo(page).getByRole("separator").evaluate(color);
  expect(custom).not.toBe(plain);
});
