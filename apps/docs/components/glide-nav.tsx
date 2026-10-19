"use client";

import { GlideHighlight, useGlide } from "owsem-ui/core";
import type { ComponentPropsWithoutRef } from "react";

/** A nav whose links share one hover highlight that glides to the nearest link (Glide). */
export function GlideNav({ children, ...props }: ComponentPropsWithoutRef<"nav">) {
  const glide = useGlide<HTMLElement>({ items: "a", maxDistance: 24 });
  return (
    <nav ref={glide.ref} {...props}>
      <GlideHighlight glide={glide} />
      {children}
    </nav>
  );
}
