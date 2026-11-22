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
