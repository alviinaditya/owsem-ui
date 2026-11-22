import type { ReactNode } from "react";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { buildSearchIndex } from "@/lib/search-index";
import { DocsSearch } from "./docs-search";
import { SiteSidebar } from "./sidebar";
import { SidebarOpen, SiteSidebarProvider } from "./sidebar-toggle";
import { SiteTools } from "./site-theme";
import { TokenSetupPanel } from "./token-setup";

/**
 * Every page: the library's Sidebar beside the content, and no top bar. It lives in the root
 * layout, so it stays mounted from page to page and keeps its scroll position. A component page
 * carries its own sidebar, theme, and language buttons in its preview; the other pages get them floating at
 * the top corners. The search (DS-5) opens from the sidebar's head or ⌘K.
 */
export function SiteShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const dict = getDictionary(lang);
  return (
    <SiteSidebarProvider>
      <SiteSidebar lang={lang} />
      {/* The skip link's target: past the sidebar, at the page's own content. */}
      <div id="content" className="site-main">
        {children}
      </div>
      <SidebarOpen label={dict.cp.showSidebar} className="site-open" />
      <SiteTools lang={lang} label={dict.cp.theme} groupLabel={dict.nav.tools} />
      <TokenSetupPanel labels={dict.tokens} copyLabels={dict.common} />
      <DocsSearch
        groups={buildSearchIndex(lang, dict)}
        labels={dict.search}
        families={dict.catalog.families}
        soon={dict.catalog.soon}
      />
    </SiteSidebarProvider>
  );
}
