import type { ReactNode } from "react";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { ScrollFade } from "./scroll-fade";
import { Sidebar } from "./sidebar";
import { SidebarToggle } from "./sidebar-toggle";
import { ThemeSwitcher } from "./theme-switcher";
import { TokenSetupButton, TokenSetupPanel } from "./token-setup";

/**
 * Every page: the sidebar beside the content, and no top bar. The sidebar scrolls its tree and
 * keeps the site's settings in its foot; below 1100 px it is a panel opened from a dock at the
 * bottom. It lives in the root layout, so it stays mounted from page to page: the trail travels
 * between them, and the sidebar keeps its scroll position.
 */
export function SiteShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const dict = getDictionary(lang);
  return (
    <div className="site">
      <div className="site-sidebar" id="site-sidebar">
        <ScrollFade className="site-sidebar-scroll" id="site-sidebar-scroll">
          <Sidebar lang={lang} />
        </ScrollFade>
        <div className="site-sidebar-foot">
          <TokenSetupButton labels={dict.tokens} />
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
      </div>
      <TokenSetupPanel labels={dict.tokens} />
    </div>
  );
}
