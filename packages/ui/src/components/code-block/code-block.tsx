"use client";

import { Tabs } from "@base-ui/react/tabs";
import {
  Children,
  type ComponentPropsWithoutRef,
  cloneElement,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  isValidElement,
  type ReactElement,
  type Ref,
  type RefAttributes,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { withClassName } from "../../core/class-name";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { CopyButton, type CopyButtonProps } from "../copy-button/copy-button";
import { IconMorph } from "../icon-morph/icon-morph";
import { createThumb } from "../toggle-group/thumb";
import "./code-block.css";

const cls = {
  root: "ow-code-block",
  header: "ow-code-block__header",
  icon: "ow-code-block__icon",
  title: "ow-code-block__title",
  list: "ow-code-block__list",
  thumb: "ow-code-block__thumb",
  tab: "ow-code-block__tab",
  copy: "ow-code-block__copy",
  panel: "ow-code-block__panel",
} as const;

// The thumb is placed before the first paint; the server has no layout, so it falls back without
// React 18's warning (and the active tab draws its own key until then).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// (Context.Provider, not <Context>: React 18.2 is a supported peer.)
const RootContext = createContext<{
  root: RefObject<HTMLDivElement | null>;
  /** The active tab's value, as far as Root knows it: set, or the last one picked. */
  value: unknown;
}>({ root: { current: null }, value: undefined });

const assignRef = <T,>(ref: Ref<T> | undefined, el: T | null) => {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as { current: T | null }).current = el;
};

/** The text of the panel on show: the code to copy. */
function shownText(root: HTMLElement | null): string {
  if (!root) return "";
  const panel = [...root.querySelectorAll<HTMLElement>(`.${cls.panel}`)].find(
    (el) =>
      el.closest(`.${cls.root}`) === root && !el.hidden && !el.hasAttribute("data-ending-style"),
  );
  return panel?.textContent ?? "";
}

/** The one leading icon: it morphs into the next when its key changes. */
function LeadingIcon({ icon }: { icon: ReactElement | null }) {
  return (
    <span className={cls.icon} aria-hidden="true">
      <IconMorph>{icon}</IconMorph>
    </span>
  );
}

export type CodeBlockRootProps = Omit<Tabs.Root.Props, "orientation">;

/**
 * The outer card: a header, then the code in an inner card over its lower edge. With tabs it is
 * Base UI's Tabs root: `value`, `defaultValue`, and `onValueChange` pick the snippet on show.
 */
export const CodeBlockRoot: ForwardRefExoticComponent<
  CodeBlockRootProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CodeBlockRootProps>(function CodeBlockRoot(
  { className, value, defaultValue, onValueChange, ...props },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const [picked, setPicked] = useState<unknown>(defaultValue);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      assignRef(ref, el);
    },
    [ref],
  );
  return (
    <RootContext.Provider value={{ root, value: value === undefined ? picked : value }}>
      <Tabs.Root
        {...props}
        ref={setRef}
        className={withClassName(cls.root, className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          setPicked(next);
          onValueChange?.(next, details);
        }}
      />
    </RootContext.Provider>
  );
});

export type CodeBlockHeaderProps = ComponentPropsWithoutRef<"div">;

/** The row above the code: an icon with a Title or a List of tabs, and Copy at the end. */
export const CodeBlockHeader: ForwardRefExoticComponent<
  CodeBlockHeaderProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CodeBlockHeaderProps>(function CodeBlockHeader(
  { className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={className ? `${cls.header} ${className}` : cls.header} {...props} />
  );
});

export interface CodeBlockTitleProps extends ComponentPropsWithoutRef<"span"> {
  /** The icon before it, such as the file type's. A new `key` morphs it into the next. */
  icon?: ReactElement | null | undefined;
}

/** The name of a single snippet, such as its file. It names the code for assistive technology. */
export const CodeBlockTitle: ForwardRefExoticComponent<
  CodeBlockTitleProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, CodeBlockTitleProps>(function CodeBlockTitle(
  { icon, className, id, ...props },
  ref,
) {
  const own = useId();
  return (
    <>
      {icon ? <LeadingIcon icon={icon} /> : null}
      <span
        ref={ref}
        id={id ?? own}
        className={className ? `${cls.title} ${className}` : cls.title}
        {...props}
      />
    </>
  );
});

export interface CodeBlockTabProps extends Omit<Tabs.Tab.Props, "ref"> {
  /**
   * Its snippet's icon, which leads the list while the tab is active and morphs into the next
   * tab's. Tabs whose icons share a `key` keep the one icon still.
   */
  icon?: ReactElement | null | undefined;
}

/** One snippet's tab: Base UI's Tab. */
export const CodeBlockTab: ForwardRefExoticComponent<
  CodeBlockTabProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, CodeBlockTabProps>(function CodeBlockTab(
  { icon: _icon, className, ...props },
  ref,
) {
  return <Tabs.Tab {...props} ref={ref} className={withClassName(cls.tab, className)} />;
});

export type CodeBlockListProps = Omit<Tabs.List.Props, "ref">;

/**
 * The tabs, one per snippet: Base UI's Tabs list, with arrow keys that pick as they move. A thumb
 * slides under the active tab, as in Toggle Group. It scrolls sideways when the tabs do not fit,
 * and the active tab's icon leads it.
 */
export const CodeBlockList: ForwardRefExoticComponent<
  CodeBlockListProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CodeBlockListProps>(function CodeBlockList(
  { className, children, activateOnFocus = true, ...props },
  ref,
) {
  const { value } = useContext(RootContext);
  const glide = useGlide<HTMLDivElement>({ items: `.${cls.tab}`, axis: "x" });
  const list = useRef<HTMLDivElement | null>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  useBeforePaint(() => {
    if (!list.current || !thumb.current) return;
    const instance = createThumb(list.current, thumb.current, `.${cls.tab}`, "data-active");
    return () => instance.destroy();
  }, []);
  const glideRef = glide.ref;
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      list.current = el;
      glideRef(el);
      assignRef(ref, el);
    },
    [glideRef, ref],
  );
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
        {...props}
        ref={setRef}
        activateOnFocus={activateOnFocus}
        className={withClassName(cls.list, className)}
      >
        <GlideHighlight glide={glide} />
        <span ref={thumb} className={cls.thumb} aria-hidden="true" />
        {children}
      </Tabs.List>
    </>
  );
});

export interface CodeBlockCopyProps extends Omit<CopyButtonProps, "value"> {
  /** The text to copy. Default: the text of the panel on show. */
  value?: CopyButtonProps["value"] | undefined;
}

/** Copy Button, at the end of the header: it copies the snippet on show. */
export const CodeBlockCopy: ForwardRefExoticComponent<
  CodeBlockCopyProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, CodeBlockCopyProps>(function CodeBlockCopy(
  { value, className, ...props },
  ref,
) {
  const { root } = useContext(RootContext);
  return (
    <CopyButton
      size="sm"
      showLabel
      {...props}
      ref={ref}
      className={withClassName(cls.copy, className)}
      value={value ?? (() => shownText(root.current))}
    />
  );
});

export interface CodeBlockPanelProps extends ComponentPropsWithoutRef<"div"> {
  /** The tab it belongs to; leave it out for a single snippet. */
  value?: Tabs.Tab.Value;
  /** With tabs: keep it in the DOM while another tab is active. */
  keepMounted?: boolean | undefined;
}

/**
 * The inner card holding the code, such as a highlighted `<pre>`. It scrolls sideways for long
 * lines, and the keyboard can scroll it.
 */
export const CodeBlockPanel: ForwardRefExoticComponent<
  CodeBlockPanelProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CodeBlockPanelProps>(function CodeBlockPanel(
  { value, keepMounted, className, ...props },
  ref,
) {
  const name = className ? `${cls.panel} ${className}` : cls.panel;
  return value === undefined ? (
    <SinglePanel {...props} ref={ref} className={name} />
  ) : (
    <Tabs.Panel {...props} ref={ref} value={value} keepMounted={keepMounted} className={name} />
  );
});

/** A panel without tabs: focusable while its code overflows, named by the Title if there is one. */
const SinglePanel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function SinglePanel(props, ref) {
    const panel = useRef<HTMLDivElement | null>(null);
    // null while it fits; else the Title's id, or "" without a Title.
    const [label, setLabel] = useState<string | null>(null);
    useEffect(() => {
      const el = panel.current;
      if (!el) return;
      const check = () => {
        const title = el.closest(`.${cls.root}`)?.querySelector(`.${cls.title}`);
        setLabel(el.scrollWidth > el.clientWidth ? (title?.id ?? "") : null);
      };
      // The panel resizes with the page, and its code with what it holds.
      const observer = new ResizeObserver(check);
      observer.observe(el);
      for (const child of el.children) observer.observe(child);
      return () => observer.disconnect();
    }, []);
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        panel.current = el;
        assignRef(ref, el);
      },
      [ref],
    );
    // A region named by the Title, or a plain focusable box without one.
    const scrollable =
      label === null
        ? {}
        : label
          ? { role: "region", "aria-labelledby": label, tabIndex: 0 }
          : { tabIndex: 0 };
    return <div ref={setRef} {...scrollable} {...props} />;
  },
);
