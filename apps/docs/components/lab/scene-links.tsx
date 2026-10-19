"use client";

import type { SceneInfo } from "./lab-shell";
import { useActiveScene } from "./scene-store";

/** The current Lab's scenes, nested under its entry in the sidebar; the one being read is marked. */
export function SceneLinks({ scenes, label }: { scenes: SceneInfo[]; label: string }) {
  const active = useActiveScene();
  return (
    <ol className="sidebar-scenes" aria-label={label}>
      {scenes.map((scene, i) => (
        <li key={scene.id}>
          <a href={`#scene-${scene.id}`} aria-current={scene.id === active ? "step" : undefined}>
            <span className="sidebar-scene-n">{String(i).padStart(2, "0")}</span>
            {scene.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
