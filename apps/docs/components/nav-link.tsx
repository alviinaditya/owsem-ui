"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "owsem-ui/owsem";
import type { ReactNode } from "react";

/** A sidebar row: a router link that marks itself as the current page. */
export function SidebarLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Sidebar.Item render={<Link href={href as Route} />} active={usePathname() === href}>
      {children}
    </Sidebar.Item>
  );
}
