"use client";

import { TreeRailNav } from "owsem-ui/owsem";
import type { SceneInfo } from "./lab-shell";
import { useActiveScene } from "./scene-store";

/**
 * A Lab's scenes, under its row in the sidebar. While its page is shown (`live`), the scene being
 * read is the current step.
 */
export function SceneLinks({
  scenes,
  label,
  live,
}: {
  scenes: SceneInfo[];
  label: string;
  live: boolean;
}) {
  const active = useActiveScene();
  return (
    <TreeRailNav.List aria-label={label} aria-labelledby={undefined}>
      {scenes.map((scene, i) => (
        <TreeRailNav.Node key={scene.id}>
          <TreeRailNav.Link
            href={`#scene-${scene.id}`}
            current={live && scene.id === active ? "step" : undefined}
          >
            <span className="sidebar-scene-n">{String(i).padStart(2, "0")}</span>
            <TreeRailNav.Label>{scene.title}</TreeRailNav.Label>
          </TreeRailNav.Link>
        </TreeRailNav.Node>
      ))}
    </TreeRailNav.List>
  );
}
