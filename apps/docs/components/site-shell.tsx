import Link from "next/link";
// Its own entry: in this layout, the barrel would reference every Base component's client code.
import { ScrollArea } from "owsem-ui/components/scroll-area";
import ui from "owsem-ui/package.json";
import type { ReactNode } from "react";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { buildSearchIndex } from "@/lib/search-index";
import { DocsSearch } from "./docs-search";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { SearchButton, SidebarClose, SidebarToggle } from "./sidebar-toggle";
import { ThemeSwitcher } from "./theme-switcher";
import { TokenSetupPanel } from "./token-setup";

/**
 * Every page: the sidebar beside the content, and no top bar. The sidebar's head holds the brand
 * (and, as a panel, its close button), its tree scrolls, and its foot keeps the site's settings;
 * below 1100 px it is a panel opened from the dock. It lives in the root layout, so it stays
 * mounted from page to page: the trail travels between them, and the sidebar keeps its scroll
 * position. The search (DS-5) opens from the rail's origin, the dock, or ⌘K.
 */
export function SiteShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const dict = getDictionary(lang);
  // Nothing is published before the first release; package.json says 0.0.0 until then.
  const version = ui.version === "0.0.0" ? dict.nav.prerelease : `v${ui.version}`;
  return (
    <div className="site">
      <div className="site-sidebar" id="site-sidebar">
        <div className="site-sidebar-head">
          <Link href={`/${lang}`} className="sidebar-brand">
            <Logo />
            OwsemUI
          </Link>
          <span className="sidebar-version">{version}</span>
          <SidebarClose label={dict.nav.close} />
        </div>
        <ScrollArea.Root className="site-sidebar-scroll" fade>
          {/* Its links take the keyboard, so it is no tab stop itself. */}
          <ScrollArea.Viewport id="site-sidebar-scroll" tabIndex={-1}>
            {/* As wide as the sidebar, so a long label truncates rather than scrolls. */}
            <ScrollArea.Content style={{ minWidth: 0 }}>
              <Sidebar lang={lang} />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar />
        </ScrollArea.Root>
        <div className="site-sidebar-foot">
          <div className="site-sidebar-switchers">
            <ThemeSwitcher labels={dict.theme} />
            <LanguageSwitcher lang={lang} label={dict.language.label} />
          </div>
        </div>
      </div>
      {/* The skip link's target: past the sidebar, at the page's own content. */}
      <div id="content" className="site-main">
        {children}
      </div>
      <div className="dock">
        <SidebarToggle label={dict.nav.menu} />
        <SearchButton label={dict.search.button} />
      </div>
      <TokenSetupPanel labels={dict.tokens} />
      <DocsSearch
        groups={buildSearchIndex(lang, dict)}
        labels={dict.search}
        families={dict.catalog.families}
        soon={dict.catalog.soon}
      />
    </div>
  );
}
