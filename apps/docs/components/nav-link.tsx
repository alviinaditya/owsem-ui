"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreeRailNav } from "owsem-ui/base";
import { type ReactNode, useEffect } from "react";
import { revealCurrentLink } from "./sidebar-toggle";

/** A sidebar row that marks itself as the current page and scrolls the sidebar to show itself. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const current = usePathname() === href;
  useEffect(() => {
    if (current) revealCurrentLink();
  }, [current]);
  return (
    <TreeRailNav.Link render={<Link href={href as Route} />} current={current}>
      {children}
    </TreeRailNav.Link>
  );
}
