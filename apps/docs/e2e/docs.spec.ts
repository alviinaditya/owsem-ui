import { readdirSync, readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { isChangesetFile, readChangesets } from "../lib/changelog.ts";
import { isColor, parseTokens } from "../lib/tokens.ts";

const main = (page: Page) => page.getByRole("main");
const repo = (path: string) => new URL(`../../../${path}`, import.meta.url);

test("the sidebar lists the docs pages in order", async ({ page }, testInfo) => {
  await page.goto("/id/docs/theming");
  if (testInfo.project.name === "mobile-390") {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await expect(page.getByRole("list", { name: "Dokumentasi" }).getByRole("link")).toHaveText([
    "Getting Started",
    "Tema",
    "Aksesibilitas",
    "Skills",
    "Changelog",
  ]);
});

test("the theming page lists every theme token with its light and dark value", async ({ page }) => {
  const tokens = parseTokens(readFileSync(repo("packages/ui/src/core/tokens/tokens.css"), "utf8"));
  await page.goto("/en/docs/theming");
  const table = page.locator("table.token-table");
  await expect(table.getByRole("columnheader")).toHaveText(["Token", "Light", "Dark"]);
  await expect(table.locator("tbody tr")).toHaveCount(tokens.length);
  for (const token of tokens) {
    const row = table.locator("tr", {
      has: page.getByRole("cell", { name: token.name, exact: true }),
    });
    await expect(row.getByRole("cell")).toHaveText([token.name, token.light, token.dark]);
    // Only literal colors get a swatch.
    await expect(row.locator(".token-table-chip")).toHaveCount(
      [token.light, token.dark].filter(isColor).length,
    );
  }
});

test("docs links open a Lab on the scene they name", async ({ page }) => {
  await page.goto("/en/docs/theming");
  await main(page).getByRole("link", { name: "Separator", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/separator#scene-customization$/);
  await expect(page.locator("#scene-customization")).toHaveAttribute("data-active", "");
});

test("the changelog shows the changesets waiting for release", async ({ page }) => {
  const dir = repo(".changeset/");
  const pending = readChangesets(
    readdirSync(dir)
      .filter(isChangesetFile)
      .map((file) => ({ file, source: readFileSync(new URL(file, dir), "utf8") })),
  );
  await page.goto("/id/docs/changelog");
  for (const pkg of pending) {
    const section = main(page).locator("section", {
      has: page.getByRole("heading", { level: 3, name: pkg.name }),
    });
    await expect(section.locator(".changelog-list > li")).toHaveCount(pkg.changes.length);
  }
  // Summaries render as markdown: code spans, not backticks.
  for (const body of await main(page).locator(".changelog-body").allTextContents()) {
    expect(body).not.toContain("`");
  }
  // No CHANGELOG.md before the first release.
  await expect(main(page).getByText("Belum ada versi yang dirilis.")).toBeVisible();
});

test("changesets are read the way Changesets reads them", () => {
  test.skip(test.info().project.name !== "desktop", "no page involved");
  for (const file of ["README.md", "AGENTS.md", "CLAUDE.md", ".hidden.md", "config.json"]) {
    expect(isChangesetFile(file), file).toBe(false);
  }
  const pending = readChangesets([
    { file: "a.md", source: '---\n"owsem-ui": patch # a comment\n"owsem": none\n---\n\nFix.' },
    { file: "b.md", source: "---\nowsem-ui: minor\n---\n\nAdd." },
  ]);
  expect(pending).toEqual([
    {
      name: "owsem-ui",
      bump: "minor",
      changes: [
        { file: "b.md", bump: "minor", summary: "Add." },
        { file: "a.md", bump: "patch", summary: "Fix." },
      ],
    },
  ]);
  expect(() =>
    readChangesets([{ file: "c.md", source: '---\n"owsem-ui": huge\n---\n\nX' }]),
  ).toThrow(/huge/);
});
