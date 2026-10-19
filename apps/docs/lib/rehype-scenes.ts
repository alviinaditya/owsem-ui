import { sep } from "node:path";

// Minimal hast shapes; the full @types/hast is not a direct dependency.
interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const section = (scene: string): HastNode => ({
  type: "element",
  tagName: "section",
  properties: { dataScene: scene },
  children: [],
});

/**
 * Lab pages only (content/labs/): wraps the text before the first h2 in an "overview" section
 * and each h2 with what follows it in a section named after the h2's id, so `## Anatomy
 * [#anatomy]` becomes `<section data-scene="anatomy">`. ESM imports stay at the top level.
 */
export function rehypeScenes() {
  return (tree: HastNode, file: { path?: string }) => {
    if (!file.path?.includes(`${sep}content${sep}labs${sep}`)) return;
    const root: HastNode[] = [];
    let current = section("overview");
    root.push(current);
    for (const node of tree.children ?? []) {
      if (node.type === "mdxjsEsm") {
        root.push(node);
        continue;
      }
      if (node.type === "element" && node.tagName === "h2") {
        current = section(String(node.properties?.id ?? ""));
        root.push(current);
      }
      current.children?.push(node);
    }
    tree.children = root;
  };
}
