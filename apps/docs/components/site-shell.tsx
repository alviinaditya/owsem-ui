import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import type { SceneInfo } from "./lab/lab-shell";
import { ScrollFade } from "./scroll-fade";
import { Sidebar } from "./sidebar";

/** Every page: the sidebar beside the content. A Lab page also lists its scenes in the sidebar. */
export function SiteShell({
  lang,
  current,
  scenes,
  children,
}: {
  lang: Lang;
  current?: string | undefined;
  scenes?: SceneInfo[] | undefined;
  children: ReactNode;
}) {
  return (
    <div className="site">
      <ScrollFade className="site-sidebar" id="site-sidebar">
        <Sidebar lang={lang} current={current} scenes={scenes} />
      </ScrollFade>
      {/* The skip link's target: past the sidebar, at the page's own content. */}
      <div id="content" className="site-main">
        {children}
      </div>
    </div>
  );
}
