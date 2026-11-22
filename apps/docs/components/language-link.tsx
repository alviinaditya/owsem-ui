"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Toolbar } from "owsem-ui/base";
import { format, getDictionary } from "@/lib/dictionaries";
import { i18n, type Lang, languageNames } from "@/lib/i18n";
import { Icon } from "./icons/icon";
import { Tip } from "./tip";

/**
 * The Language menu: the trigger is the globe, and each language is a real link to
 * the current page in it (paths always start with /<lang>, proxy.ts, so each has its own URL for
 * search and sharing). Choosing one is a client-side navigation that keeps the scroll position;
 * RootState puts the theme back on <html> after the root layout swaps.
 */
export function LanguageMenu({
  lang,
  theme,
}: {
  lang: Lang;
  /** The stage's theme, which the portaled menu and tooltip would otherwise leave. */
  theme?: "light" | "dark" | undefined;
}) {
  const rest = usePathname().split("/").slice(2).join("/");
  const nav = getDictionary(lang).nav;
  return (
    <Menu.Root>
      <Tip
        trigger={
          <Toolbar.Button
            render={<Menu.Trigger />}
            className="cp-tool"
            aria-label={format(nav.languageNamed, { name: languageNames[lang] })}
          >
            <Icon name="languages" size={16} />
          </Toolbar.Button>
        }
        label={nav.language}
        theme={theme}
      />
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} data-theme={theme}>
          <Menu.Popup className="lang-menu">
            {i18n.languages.map((l) => (
              <Menu.LinkItem
                key={l}
                render={<Link href={`/${l}${rest ? `/${rest}` : ""}` as Route} scroll={false} />}
                hrefLang={l}
                lang={l}
                aria-current={l === lang ? "page" : undefined}
              >
                {languageNames[l]}
                {l === lang ? <Icon name="check" size={15} /> : null}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
