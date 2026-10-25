import { type ComponentProps, ViewTransition } from "react";

/**
 * A page's <main>. When a navigation swaps pages, the old one fades out and the new one fades in,
 * rising a little; the sidebar and the dock stay put ("Page changes" in globals.css).
 */
export function PageMain(props: ComponentProps<"main">) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <main {...props} />
    </ViewTransition>
  );
}
