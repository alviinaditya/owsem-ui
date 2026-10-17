"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** A link that marks itself as the current page. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href as Route} aria-current={usePathname() === href ? "page" : undefined}>
      {children}
    </Link>
  );
}
