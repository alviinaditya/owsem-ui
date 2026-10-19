"use client";

import { usePathname } from "next/navigation";
import { TreeRailNav } from "owsem-ui/base";
import type { ReactNode } from "react";
import type { SceneInfo } from "./lab/lab-shell";
import { SceneLinks } from "./lab/scene-links";

/**
 * A component with a Lab: its scenes hang under its row and open while its page is shown. The
 * sidebar stays mounted across pages, so the page decides this, not the server render.
 */
export function SidebarLabNode({
  href,
  scenes,
  label,
  children,
}: {
  href: string;
  scenes: SceneInfo[];
  label: string;
  children: ReactNode;
}) {
  const open = usePathname() === href;
  return (
    <TreeRailNav.Node open={open}>
      {children}
      <TreeRailNav.Panel>
        <SceneLinks scenes={scenes} label={label} live={open} />
      </TreeRailNav.Panel>
    </TreeRailNav.Node>
  );
}
