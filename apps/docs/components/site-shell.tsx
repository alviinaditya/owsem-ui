import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { ScrollFade } from "./scroll-fade";
import { Sidebar } from "./sidebar";

/**
 * Every page: the sidebar beside the content. It lives in the root layout, so it stays mounted
 * from page to page: the trail travels between them, and the sidebar keeps its scroll position.
 */
export function SiteShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <div className="site">
      <ScrollFade className="site-sidebar" id="site-sidebar">
        <Sidebar lang={lang} />
      </ScrollFade>
      {/* The skip link's target: past the sidebar, at the page's own content. */}
      <div id="content" className="site-main">
        {children}
      </div>
    </div>
  );
}
