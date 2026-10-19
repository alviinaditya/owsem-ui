import type { TOCItemType } from "fumadocs-core/toc";
import type { ReactNode } from "react";
import { catalog, isAvailable } from "./catalog";
import type { Lang } from "./i18n";
import { labSource } from "./source";

/**
 * The fixed Lab section order (DS-2), by heading id (`## Anatomi [#anatomy]`): up to three
 * signature scenes, then these, with customization only for components that have tokens.
 */
const TEMPLATES = [
  ["anatomy", "states", "keyboard", "customization", "ship"],
  ["anatomy", "states", "keyboard", "ship"],
].map((ids) => ids.join(","));

/** The scenes of a Lab after the overview, checked against the template. */
export function labScenes(name: string, toc: TOCItemType[]): { id: string; title: ReactNode }[] {
  const scenes = toc
    .filter((item) => item.depth === 2)
    .map((item) => ({ id: item.url.replace(/^#/, ""), title: item.title }));
  const ids = scenes.map((scene) => scene.id);
  const anatomy = ids.indexOf("anatomy");
  const signature = anatomy < 0 ? ids : ids.slice(0, anatomy);
  if (anatomy < 0 || signature.length > 3 || !TEMPLATES.includes(ids.slice(anatomy).join(","))) {
    throw new Error(
      `Lab "${name}" has sections [${ids.join(", ")}]. Expected up to 3 signature scenes, then ` +
        "anatomy, states, keyboard, customization (optional), ship, each as `## Title [#id]`.",
    );
  }
  return scenes;
}

/** A Lab page's scenes, the overview first; undefined when the component has no Lab yet. */
export function labPageScenes(
  name: string,
  lang: Lang,
  overview: string,
): { id: string; title: ReactNode }[] | undefined {
  const entry = catalog.find((e) => e.name === name);
  const page = entry && isAvailable(entry) ? labSource.getPage([name], lang) : undefined;
  if (!page) return undefined;
  return [{ id: "overview", title: overview }, ...labScenes(name, page.data.toc)];
}
