// Generated from components/code-block by scripts/build-tailwind.ts; do not edit.
"use client";

import { Tabs } from "@base-ui/react/tabs";
import {
  Children,
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { GlideHighlight, useGlide } from "../lib/glide/use-glide";
import { useMergedRefs } from "../lib/merge-refs";
import { useBeforePaint } from "../lib/use-before-paint";
import { CopyButton, type CopyButtonProps } from "../copy-button/copy-button";
import { IconMorph } from "../icon-morph/icon-morph";
import { createThumb } from "../toggle-group/thumb";
import { codeBlockSlots } from "./code-block-variants";
import { createHeightGlide, type HeightGlide } from "./height-glide";

// The code finds its parts by these, never by class. Base UI gives every tab its role, also when
// another element renders it; the rest are this component's own data-slots.
const ROOT = '[data-slot="code-block"]';
const PANEL = '[data-slot="code-block-panel"]';
const TITLE = '[data-slot="code-block-title"]';
const TAB = '[role="tab"]';

const RootContext = createContext<{
  root: RefObject<HTMLDivElement | null>;
  /** The active tab's value, as far as Root knows it: set, or the last one picked. */
  value: unknown;
}>({ root: { current: null }, value: undefined });

/** The panel on show. */
function shownPanel(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  return (
    [...root.querySelectorAll<HTMLElement>(PANEL)].find(
      (el) => el.closest(ROOT) === root && !el.hidden && !el.hasAttribute("data-ending-style"),
    ) ?? null
  );
}

/** The text of the panel on show: the code to copy. */
function shownText(root: HTMLElement | null): string {
  return shownPanel(root)?.textContent ?? "";
}

/** The one leading icon: it morphs into the next when its key changes. */
function LeadingIcon({ icon }: { icon: ReactElement | null }): ReactElement {
  return (
    <span data-slot="code-block-icon" className={codeBlockSlots.icon} aria-hidden="true">
      <IconMorph>{icon}</IconMorph>
    </span>
  );
}

export interface CodeBlockRootProps extends Omit<Tabs.Root.Props, "orientation" | "className"> {
  className?: string | undefined;
}

/**
 * One surface: a header, then the code under it. With tabs it is Base UI's Tabs root: `value`,
 * `defaultValue`, and `onValueChange` pick the snippet on show.
 */
export function CodeBlockRoot({
  className,
  value,
  defaultValue,
  onValueChange,
  ref,
  ...props
}: CodeBlockRootProps): ReactElement {
  const root = useRef<HTMLDivElement | null>(null);
  const merged = useMergedRefs(root, ref);
  const [picked, setPicked] = useState<unknown>(defaultValue);
  const current = value === undefined ? picked : value;
  // The height eases when another snippet comes on show; the first render does not move.
  const glide = useRef<HeightGlide | null>(null);
  const seen = useRef<unknown>(current);
  useBeforePaint(() => {
    if (!root.current) return;
    glide.current = createHeightGlide(root.current, () => shownPanel(root.current));
    return () => glide.current?.destroy();
  }, []);
  useBeforePaint(() => {
    if (seen.current === current) return;
    seen.current = current;
    glide.current?.change();
  }, [current]);
  return (
    <RootContext.Provider value={{ root, value: current }}>
      <Tabs.Root
        {...props}
        // Found by this, so it stays.
        data-slot="code-block"
        ref={merged}
        className={cn(codeBlockSlots.root, className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          setPicked(next);
          onValueChange?.(next, details);
        }}
      />
    </RootContext.Provider>
  );
}

export interface CodeBlockHeaderProps extends Omit<ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/** The row above the code: an icon with a Title or a List of tabs, and Copy at the end. */
export function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps): ReactElement {
  return (
    <div
      data-slot="code-block-header"
      {...props}
      className={cn(codeBlockSlots.header, className)}
    />
  );
}

export interface CodeBlockTitleProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
  /** The icon before it, such as the file type's. A new `key` morphs it into the next. */
  icon?: ReactElement | null | undefined;
}

/** The name of a single snippet, such as its file. It names the code for assistive technology. */
export function CodeBlockTitle({
  icon,
  className,
  id,
  ...props
}: CodeBlockTitleProps): ReactElement {
  const own = useId();
  return (
    <>
      {icon ? <LeadingIcon icon={icon} /> : null}
      <span
        {...props}
        // Found by this, so it stays.
        data-slot="code-block-title"
        id={id ?? own}
        className={cn(codeBlockSlots.title, className)}
      />
    </>
  );
}

export interface CodeBlockTabProps extends Omit<Tabs.Tab.Props, "className"> {
  className?: string | undefined;
  /**
   * Its snippet's icon, which leads the list while the tab is active and morphs into the next
   * tab's. Tabs whose icons share a `key` keep the one icon still.
   */
  icon?: ReactElement | null | undefined;
}

/** One snippet's tab: Base UI's Tab. */
export function CodeBlockTab({
  icon: _icon,
  className,
  ...props
}: CodeBlockTabProps): ReactElement {
  return (
    <Tabs.Tab data-slot="code-block-tab" {...props} className={cn(codeBlockSlots.tab, className)} />
  );
}

export interface CodeBlockListProps extends Omit<Tabs.List.Props, "className"> {
  className?: string | undefined;
}

/**
 * The tabs, one per snippet: Base UI's Tabs list, with arrow keys that pick as they move. A thumb
 * slides under the active tab, as in Toggle Group. It scrolls sideways when the tabs do not fit,
 * and the active tab's icon leads it.
 */
export function CodeBlockList({
  className,
  children,
  activateOnFocus = true,
  ref,
  ...props
}: CodeBlockListProps): ReactElement {
  const { value } = useContext(RootContext);
  const glide = useGlide<HTMLDivElement>({ items: TAB, axis: "x", skip: "[data-active]" });
  const list = useRef<HTMLDivElement | null>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const merged = useMergedRefs(list, useMergedRefs(glide.ref, ref));
  useBeforePaint(() => {
    if (!list.current || !thumb.current) return;
    const instance = createThumb(list.current, thumb.current, TAB, "data-active");
    return () => instance.destroy();
  }, []);
  // The tabs' icons, read from the Tab elements; until a value is known, the first tab's.
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<CodeBlockTabProps> => isValidElement(child),
  );
  const active = tabs.find((tab) => tab.props.value === value) ?? tabs[0];
  const icon = active?.props.icon;
  return (
    <>
      {tabs.some((tab) => tab.props.icon) ? (
        <LeadingIcon
          icon={
            isValidElement(icon)
              ? cloneElement(icon, { key: icon.key ?? String(active?.props.value) })
              : null
          }
        />
      ) : null}
      <Tabs.List
        data-slot="code-block-list"
        {...props}
        ref={merged}
        activateOnFocus={activateOnFocus}
        className={cn(codeBlockSlots.list, className)}
      >
        <GlideHighlight glide={glide} />
        <span
          data-slot="code-block-thumb"
          ref={thumb}
          className={codeBlockSlots.thumb}
          aria-hidden="true"
        />
        {children}
      </Tabs.List>
    </>
  );
}

export interface CodeBlockCopyProps extends Omit<CopyButtonProps, "value"> {
  /** The text to copy. Default: the text of the panel on show. */
  value?: CopyButtonProps["value"] | undefined;
}

/** Copy Button, icon only at the end of the header, with its Tooltip: it copies the snippet on show. */
export function CodeBlockCopy({ value, className, ...props }: CodeBlockCopyProps): ReactElement {
  const { root } = useContext(RootContext);
  return (
    <CopyButton
      data-slot="code-block-copy"
      size="sm"
      {...props}
      className={cn(codeBlockSlots.copy, className)}
      value={value ?? (() => shownText(root.current))}
    />
  );
}

export interface CodeBlockPanelProps extends Omit<ComponentProps<"div">, "className"> {
  className?: string | undefined;
  /** The tab it belongs to; leave it out for a single snippet. */
  value?: Tabs.Tab.Value;
  /** With tabs: keep it in the DOM while another tab is active. */
  keepMounted?: boolean | undefined;
}

/**
 * The code, such as a highlighted `<pre>`, under the header on the same surface. It scrolls
 * sideways for long lines, and the keyboard can scroll it.
 */
export function CodeBlockPanel({
  value,
  keepMounted,
  className,
  ...props
}: CodeBlockPanelProps): ReactElement {
  const name = cn(codeBlockSlots.panel, className);
  return value === undefined ? (
    <SinglePanel {...props} className={name} />
  ) : (
    <Tabs.Panel
      {...props}
      // Found by this, so it stays.
      data-slot="code-block-panel"
      value={value}
      keepMounted={keepMounted}
      className={name}
    />
  );
}

/** A panel without tabs: focusable while its code overflows, named by the Title if there is one. */
function SinglePanel({ ref, ...props }: ComponentProps<"div">): ReactElement {
  const panel = useRef<HTMLDivElement | null>(null);
  const merged = useMergedRefs(panel, ref);
  // null while it fits; else the Title's id, or "" without a Title.
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const check = () => {
      const title = el.closest(ROOT)?.querySelector(TITLE);
      setLabel(el.scrollWidth > el.clientWidth ? (title?.id ?? "") : null);
    };
    // The panel resizes with the page, and its code with what it holds.
    const observer = new ResizeObserver(check);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, []);
  // A region named by the Title, or a plain focusable box without one.
  const scrollable =
    label === null
      ? {}
      : label
        ? { role: "region", "aria-labelledby": label, tabIndex: 0 }
        : { tabIndex: 0 };
  return (
    <div
      {...scrollable}
      {...props}
      // Found by this, so it stays.
      data-slot="code-block-panel"
      ref={merged}
    />
  );
}
