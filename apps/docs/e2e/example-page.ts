import { expect, type Page, test } from "@playwright/test";

/** Helpers for the preview-first component pages (examples/). */
export const preview = (page: Page) => page.getByRole("region", { name: "Preview" });
export const tools = (page: Page) => page.getByRole("toolbar", { name: "Preview tools" });
export const demo = (page: Page) => page.locator(".cp-stage");
export const docs = (page: Page) => page.locator(".cp-docs");
export const picker = (page: Page) => page.getByRole("group", { name: "Examples" });
export const specimen = (page: Page) => page.locator(".sp-specimen");
export const sheet = (page: Page) => page.locator(".sp");

/** Picks an example. A DOM click: on a phone the dev server's overlay badge can sit over the picker. */
export const pick = (page: Page, title: string) =>
  picker(page)
    .getByRole("button", { name: title, exact: true })
    .evaluate((el) => (el as HTMLElement).click());

/** Goes to a page and waits for it to hydrate: its keys and buttons answer from then on. */
export async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
}

const SECTIONS = [
  "installation",
  "usage",
  "examples",
  "anatomy",
  "api",
  "accessibility",
  "theming",
  "motion",
];

/**
 * The checks every example page shares: the picker switches the demos, Inspect shows the
 * complete specimen with its part buttons, and the Docs panel has its eight sections.
 */
export function pageTests(
  name: string,
  spec: { examples: string[]; parts: string[]; specimen: string },
) {
  test(`${name}: the examples picker switches the demos`, async ({ page }) => {
    await visit(page, `/en/${name}`);
    await expect(picker(page).getByRole("button")).toHaveCount(spec.examples.length);
    await expect(
      picker(page).getByRole("button", { name: spec.examples[0] ?? "" }),
    ).toHaveAttribute("aria-pressed", "true");
    const shown: string[] = [];
    for (const title of spec.examples) {
      await pick(page, title);
      await expect(picker(page).getByRole("button", { name: title, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      shown.push((await demo(page).innerHTML()).replace(/\s+/g, " "));
    }
    // Every example renders something of its own.
    expect(new Set(shown).size).toBe(spec.examples.length);
  });

  test(`${name}: Inspect shows the complete specimen with its parts`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
    await visit(page, `/en/${name}`);
    await page.keyboard.press("i");
    await expect(sheet(page).locator(".sp-label").first()).toBeVisible();
    await expect(specimen(page)).toHaveAttribute("aria-hidden", "true");
    await expect(specimen(page).locator(spec.specimen)).not.toHaveCount(0);
    for (const part of spec.parts) {
      await expect(
        sheet(page).getByRole("button", { name: `${part} part`, exact: true }),
      ).toBeVisible();
    }
  });

  test(`${name}: Inspect leaders point at their parts and never cross`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
    await visit(page, `/en/${name}`);
    await page.keyboard.press("i");
    await expect(sheet(page).locator(".sp-label").first()).toBeVisible();
    // Let the specimen land and the sheet settle.
    await expect(sheet(page).locator(".sp-ui")).toBeVisible();
    await page.waitForTimeout(1200);
    expect(await leaderProblems(page)).toEqual([]);
  });

  test(`${name}: the Docs panel has the eight sections`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "a column needs a wide screen");
    await visit(page, `/en/${name}`);
    await tools(page).getByRole("button", { name: "Docs", exact: true }).click();
    await expect(docs(page)).toBeVisible();
    const ids = await docs(page)
      .getByRole("heading", { level: 2 })
      .evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(SECTIONS);
  });
}

/** Geometry of the spec sheet's leaders, outlines, names and tags: what is wrong, if anything. */
export function leaderProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    type Pt = [number, number];
    type Box = { x: number; y: number; w: number; h: number };
    const svg = document.querySelector(".sp-svg") as SVGSVGElement;
    const origin = svg.getBoundingClientRect();
    const rel = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
    };
    const outlines = [...svg.querySelectorAll<SVGRectElement>(".sp-outline")].map((o) => ({
      name: o.dataset.part ?? "",
      root: o.hasAttribute("data-root"),
      x: Number(o.getAttribute("x")),
      y: Number(o.getAttribute("y")),
      w: Number(o.getAttribute("width")),
      h: Number(o.getAttribute("height")),
      r: Number(o.getAttribute("rx")) || 0,
    }));
    const root = outlines.find((o) => o.root);
    const leaders = [...svg.querySelectorAll<SVGGElement>(".sp-leader")].map((g) => {
      const d = g.querySelector("path")?.getAttribute("d") ?? "";
      const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
      const pts: Pt[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2)
        pts.push([nums[i] as number, nums[i + 1] as number]);
      const c = g.querySelector("circle") as SVGCircleElement;
      return {
        name: g.dataset.part ?? "",
        pts,
        dot: [Number(c.getAttribute("cx")), Number(c.getAttribute("cy"))] as Pt,
      };
    });
    const out: string[] = [];
    const edgeDist = (p: Pt, b: Box & { r?: number }) => {
      // On a rounded corner, the distance is to the arc.
      const r = b.r ?? 0;
      const cx = Math.min(Math.max(p[0], b.x + r), b.x + b.w - r);
      const cy = Math.min(Math.max(p[1], b.y + r), b.y + b.h - r);
      if (r > 0 && cx !== p[0] && cy !== p[1]) {
        return Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - r);
      }
      const dx = Math.max(b.x - p[0], 0, p[0] - (b.x + b.w));
      const dy = Math.max(b.y - p[1], 0, p[1] - (b.y + b.h));
      if (dx || dy) return Math.hypot(dx, dy);
      return Math.min(p[0] - b.x, b.x + b.w - p[0], p[1] - b.y, b.y + b.h - p[1]);
    };
    const inside = (a: Box, b: Box, tol: number) =>
      a.x <= b.x + tol &&
      a.y <= b.y + tol &&
      a.x + a.w >= b.x + b.w - tol &&
      a.y + a.h >= b.y + b.h - tol;
    const cross = (a: Pt, b: Pt, c: Pt) =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const segCross = (p: Pt, q: Pt, r: Pt, s: Pt) =>
      cross(p, q, r) * cross(p, q, s) < 0 && cross(r, s, p) * cross(r, s, q) < 0;
    const segBox = (p: Pt, q: Pt, b: Box, inset: number) => {
      let t0 = 0;
      let t1 = 1;
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const l = b.x + inset;
      const t = b.y + inset;
      const rt = b.x + b.w - inset;
      const bt = b.y + b.h - inset;
      if (rt <= l || bt <= t) return false;
      for (const [pp, qq] of [
        [-dx, p[0] - l],
        [dx, rt - p[0]],
        [-dy, p[1] - t],
        [dy, bt - p[1]],
      ] as Pt[]) {
        if (pp === 0) {
          if (qq < 0) return false;
        } else {
          const u = qq / pp;
          if (pp < 0) t0 = Math.max(t0, u);
          else t1 = Math.min(t1, u);
          if (t0 > t1) return false;
        }
      }
      return true;
    };
    const segs = (pts: Pt[]) => pts.slice(1).map((q, i) => [pts[i] as Pt, q] as [Pt, Pt]);

    for (const l of leaders) {
      const own = outlines.find((o) => o.name === l.name) ?? root;
      if (!own) continue;
      if (edgeDist(l.dot, own) > 2) out.push(`${l.name}: dot is not on its outline`);
      for (const o of outlines) {
        if (o === own || inside(o, own, 1.5)) continue;
        for (const [p, q] of segs(l.pts)) {
          if (segBox(p, q, o, 2)) out.push(`${l.name}: leader crosses ${o.name}`);
        }
      }
    }
    for (const [i, a] of leaders.entries()) {
      for (const b of leaders.slice(i + 1)) {
        for (const [p, q] of segs(a.pts)) {
          for (const [r, s] of segs(b.pts)) {
            if (segCross(p, q, r, s)) out.push(`${a.name} and ${b.name}: leaders cross`);
          }
        }
      }
    }
    const names = [...document.querySelectorAll(".sp-label")].map((el) => ({
      name: el.getAttribute("data-part") ?? "",
      box: rel(el),
    }));
    const tags = [...document.querySelectorAll(".sp-tag")].map((el) => rel(el));
    const overlap = (a: Box, b: Box) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (const [i, a] of names.entries()) {
      for (const b of names.slice(i + 1))
        if (overlap(a.box, b.box)) out.push(`${a.name} and ${b.name}: names overlap`);
      if (tags.some((t) => overlap(a.box, t))) out.push(`${a.name}: name overlaps a tag`);
      for (const l of leaders) {
        if (l.name === a.name) continue;
        for (const [p, q] of segs(l.pts)) {
          if (segBox(p, q, a.box, 1)) out.push(`${l.name}: leader crosses the name ${a.name}`);
        }
      }
    }
    return out;
  });
}
