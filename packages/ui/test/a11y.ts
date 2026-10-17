import axe from "axe-core";

// "wcag22aa" also enables target-size (WCAG 2.5.8, FR-14), which is off by default.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const targets = (result: axe.Result) => result.nodes.map((node) => node.target.join(" "));

export interface AxeReport {
  violations: { id: string; impact: string | null | undefined; nodes: string[] }[];
  /** Text contrast axe could not compute (e.g. over material depth gradients). */
  contrastUnknown: string[];
}

export async function axeReport(root: Element): Promise<AxeReport> {
  const result = await axe.run(root, { runOnly: { type: "tag", values: TAGS } });
  return {
    violations: result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ id: v.id, impact: v.impact, nodes: targets(v) })),
    contrastUnknown: result.incomplete.filter((v) => v.id === "color-contrast").flatMap(targets),
  };
}
