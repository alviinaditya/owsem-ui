"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { revealCurrentLink } from "./sidebar-toggle";

/** A link that marks itself as the current page and scrolls the sidebar to show itself. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const current = usePathname() === href;
  useEffect(() => {
    if (current) revealCurrentLink();
  }, [current]);
  return (
    <Link href={href as Route} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
