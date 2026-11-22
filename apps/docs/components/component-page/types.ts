import type { ComponentFiles } from "@/lib/component-files";
import type { Token } from "@/lib/highlight";
import type { Lang } from "@/lib/i18n";

/** Text for every docs language; the type check fails until each one exists. */
export type Localized = Record<Lang, string>;

/** A named part, outlined by Inspect with its public tokens. */
export interface Part {
  name: string;
  /** Finds the part in the demo; the first match is the one outlined. */
  selector: string;
  note: Localized;
  /**
   * Its public tokens, each with the private property the part resolves it into: a public token
   * is unset until someone sets it, so the popover shows the value in use.
   */
  tokens?: Readonly<Record<string, string>>;
  /** Anatomy: also draw the part's own size (such as an icon or a thumb) as a dimension. */
  size?: boolean;
}

export interface CodeFile {
  name: string;
  code: string;
}

/** The files of the Manual install, read on the server: CSS always, Tailwind v4 when it exists. */
export interface ManualFiles extends ComponentFiles {
  /** Each file's tokens by path, highlighted on the server: the client does no tokenizing. */
  lines: Record<string, Token[][]>;
}

/** What /api/manual/<component> returns: CSS always, Tailwind v4 when it exists. */
export interface ManualData {
  css: ManualFiles;
  tailwind?: ManualFiles;
}

/** What the page passes for the Manual tab: enough to draw it; the files load on first open. */
export interface ManualInstall {
  name: string;
  tailwind: boolean;
}
