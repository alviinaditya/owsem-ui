"use client";

import { Menu, Popover, ScrollArea, Toggle, ToggleGroup, Toolbar, Tooltip } from "owsem-ui/base";
import {
  type CSSProperties,
  createContext,
  Fragment,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Dictionary, format } from "@/lib/dictionaries";
import { type ComponentDefinition, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { DOCS_PANEL_STORAGE_KEY } from "@/lib/theme";
import { Icon } from "../icons/icon";
import { CodeLine, InstallTabs } from "../install";
import { LanguageMenu } from "../language-link";
import { registerPreviewPage, SidebarOpen } from "../sidebar-toggle";
import { toggleSiteTheme } from "../site-theme";
import { Tip } from "../tip";
import { TokenChip, useTokenNames, useTokenSetup } from "../token-setup";
import { ANATOMY_LEAVE_MS, Anatomy } from "./anatomy";
import { SHEET_FULL_GAP, SHEET_HALF } from "./layout";
import type { ManualInstall } from "./types";

/** What the page passes to a component's example module (examples/<name>.tsx). */
export interface ExamplePageProps {
  /** The component's display name. */
  title: string;
  lang: Lang;
  /** Its family's label, shown as a badge by the title. */
  family: { name: string; id: "base" | "owsem" };
  /** The Docs panel's lead line. */
  description: string;
  /** The Docs sections, in order: their ids are the hash links. */
  sections: { id: string; title: ReactNode }[];
  labels: Dictionary["cp"];
  common: Dictionary["common"];
  /** The Manual install's files for this component. */
  install: ManualInstall;
  /** After the Docs: the links to the components before and after. */
  footer: ReactNode;
  /** The Docs content (content/components/<lang>/<name>.mdx). */
  children: ReactNode;
}

interface PageContext {
  lang: Lang;
  definition: ComponentDefinition;
  labels: Dictionary["cp"];
  common: Dictionary["common"];
  install: ManualInstall;
  activeId: string;
  showExample: (id: string) => void;
  inspecting: boolean;
  /** Outlines a part on the preview, turning Inspect on. */
  inspectPart: (name: string) => void;
  inspectedPart: string | undefined;
  setInspect: (on: boolean) => void;
}

const PageContextValue = createContext<PageContext | null>(null);

/** The page's state, for the Docs content (MDX components in docs.tsx). */
export function usePage(): PageContext {
  const page = useContext(PageContextValue);
  if (!page) throw new Error("This belongs inside a ComponentPage.");
  return page;
}

// Sizes shared with globals.css (.cp-*); keep both in sync.
const NARROW = "(max-width: 767px)";
const DRAG_SLOP = 4;
const SHUT_BELOW = 0.25;

const subscribeMedia = (query: string) => (listener: () => void) => {
  const list = matchMedia(query);
  list.addEventListener("change", listener);
  return () => list.removeEventListener("change", listener);
};
const useMedia = (query: string): boolean =>
  useSyncExternalStore(
    useMemo(() => subscribeMedia(query), [query]),
    () => matchMedia(query).matches,
    () => false,
  );

// The Docs panel's state on a wide screen is <html data-docs-open> (kept across visits, and set
// before the first paint by lib/theme.ts), so the layout is right from the start; a narrow
// screen's sheet is React state and always starts shut.
const docsListeners = new Set<() => void>();
const docsAttribute = () => document.documentElement.dataset.docsOpen !== undefined;
const subscribeDocs = (listener: () => void) => {
  docsListeners.add(listener);
  return () => {
    docsListeners.delete(listener);
  };
};

function setDocsAttribute(open: boolean): void {
  if (open === docsAttribute()) return;
  if (open) document.documentElement.dataset.docsOpen = "";
  else delete document.documentElement.dataset.docsOpen;
  try {
    if (open) localStorage.setItem(DOCS_PANEL_STORAGE_KEY, "open");
    else localStorage.removeItem(DOCS_PANEL_STORAGE_KEY);
  } catch {
    // Storage blocked: it holds until the next page load.
  }
  for (const listener of docsListeners) listener();
}

type Sheet = "closed" | "half" | "full";

/** Keys that work while focus is not in a field, and that a menu or a tab list keeps for itself. */
const FIELDS =
  "input, select, textarea, [contenteditable], [role='tab'], [role='menu'], [role='combobox']";

interface Shortcut {
  run: () => void;
  /** The region this shortcut may hide; if focus is inside it, focus moves to `focus`. */
  hides?: Element | null | undefined;
  focus?: HTMLElement | null | undefined;
}

/**
 * The preview-first component page: a large preview card beside the sidebar, with a toolbar at its
 * top right, the examples' picker at its bottom, and the Docs in a panel that opens on request
 * (a column, or a bottom sheet on a phone). Examples replace scenes: the preview, its
 * code, and Inspect always follow the example picked.
 */
export function ComponentPage({
  definition,
  title,
  lang,
  family,
  description,
  sections,
  labels,
  common,
  install,
  footer,
  children,
}: ExamplePageProps & { definition: ComponentDefinition }) {
  const id = useId();
  const { examples, parts } = definition;
  const [activeId, setActiveId] = useState(examples[0]?.id ?? "");
  const active = examples.find((example) => example.id === activeId) ?? examples[0];
  // The example on the stage lags the picked one while it fades out.
  const [shownId, setShownId] = useState(activeId);
  const shown = examples.find((example) => example.id === shownId) ?? examples[0];
  const setup = useTokenSetup();

  const narrow = useMedia(NARROW);
  const [sheet, setSheet] = useState<Sheet>("closed");
  const wideOpen = useSyncExternalStore(subscribeDocs, docsAttribute, () => false);
  const docsOpen = narrow ? sheet !== "closed" : wideOpen;
  const [inspect, setInspectOn] = useState(false);
  // The part whose popover is open on the spec sheet.
  const [part, setPart] = useState<string | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLElement | null>());
  const drag = useRef<{ y: number; height: number; moved: boolean } | null>(null);
  useTokenNames(scrollerRef);

  // An open Docs panel below 1280 px turns the sidebar into a drawer (sidebar-toggle.tsx).
  useEffect(registerPreviewPage, []);

  // The Docs scroller hides its scrollbar; its edges fade where there is more to scroll.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      el.toggleAttribute("data-overflow-start", el.scrollTop > 1);
      el.toggleAttribute("data-overflow-end", el.scrollHeight - el.clientHeight - el.scrollTop > 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  // Transitions wait for the first paint, so a stored open panel does not slide in on load.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const inspectable = parts.length > 0 && !!definition.anatomy;
  const inspecting = inspect && inspectable;
  // Turned off, Inspect stays a moment to fade out (globals.css), then leaves.
  const [inspectShown, setInspectShown] = useState(inspecting);
  if (inspecting && !inspectShown) setInspectShown(true);
  useEffect(() => {
    if (inspecting || !inspectShown) return;
    const timer = setTimeout(() => setInspectShown(false), ANATOMY_LEAVE_MS);
    return () => clearTimeout(timer);
  }, [inspecting, inspectShown]);

  const setDocs = useCallback((open: boolean, { persist = true }: { persist?: boolean } = {}) => {
    if (matchMedia(NARROW).matches) {
      setSheet(open ? (current) => (current === "closed" ? "half" : current) : "closed");
    } else if (persist) setDocsAttribute(open);
    else if (open) {
      // From a link: shown now, but not kept as the visitor's choice.
      document.documentElement.dataset.docsOpen = "";
      for (const listener of docsListeners) listener();
    }
  }, []);

  // Scrolls the Docs only: scrollIntoView would also move the page's clipped boxes.
  const scrollToSection = useCallback((sectionId: string, smooth = false) => {
    const scroller = scrollerRef.current;
    const target = scroller?.querySelector(`#${CSS.escape(sectionId)}`);
    if (!scroller || !target) return;
    const top =
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      8;
    scroller.scrollTo({
      top,
      behavior:
        smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant",
    });
  }, []);

  // /en/switch#api opens the panel at that section, then keeps up with the hash.
  useEffect(() => {
    const fromHash = () => {
      const target = decodeURIComponent(location.hash.slice(1));
      if (!sections.some((section) => section.id === target)) return;
      setDocs(true, { persist: false });
      requestAnimationFrame(() => scrollToSection(target));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [sections, setDocs, scrollToSection]);

  // Scroll-spy: the section at the top of the Docs, and the chip row follows it.
  const [section, setSection] = useState(sections[0]?.id ?? "");
  const chipsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const spy = () => {
      const line = scroller.getBoundingClientRect().top + 24;
      let current = sections[0]?.id ?? "";
      for (const { id } of sections) {
        const el = scroller.querySelector(`#${CSS.escape(id)}`);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // The content ends before the last heading can reach the line: the end of it counts.
      const end = scroller.scrollHeight - scroller.clientHeight;
      if (scroller.scrollTop <= 1) current = sections[0]?.id ?? "";
      else if (end > 1 && end - scroller.scrollTop <= 4) current = sections.at(-1)?.id ?? current;
      setSection(current);
    };
    spy();
    scroller.addEventListener("scroll", spy, { passive: true });
    return () => scroller.removeEventListener("scroll", spy);
  }, [sections]);
  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>(`a[href="#${CSS.escape(section)}"]`);
    if (!row || !chip) return;
    // Centred-ish, in the row only (scrollIntoView would also move the page).
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
  }, [section]);

  const openAt = (sectionId: string) => {
    setDocs(true);
    history.replaceState(null, "", `#${sectionId}`);
    requestAnimationFrame(() => scrollToSection(sectionId, true));
  };

  const toggleDocs = () => {
    if (docsOpen) {
      setDocs(false);
      return;
    }
    setDocs(true);
    // Focus moves to the panel itself, so the next Tab reaches its section tabs.
    requestAnimationFrame(() => docsRef.current?.focus({ preventScroll: true }));
  };
  const closeDocs = () => {
    setDocs(false);
    buttons.current.get("docs")?.focus({ preventScroll: true });
  };
  const setInspect = (on: boolean) => {
    if (!inspectable) return;
    setInspectOn(on);
    if (!on) setPart(null);
  };

  // Escape inside the open sheet shuts it.
  useEffect(() => {
    const el = docsRef.current;
    if (!el || !docsOpen || !narrow) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.stopPropagation();
      closeDocs();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  });

  // Escape turns Inspect off, unless a part's popover or another layer is open to take it first.
  const escapeState = useRef({ inspecting, part, installOpen });
  escapeState.current = { inspecting, part, installOpen };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const now = escapeState.current;
      if (event.key !== "Escape" || event.defaultPrevented || !now.inspecting) return;
      if (now.part !== null || now.installOpen) return;
      if (!(event.target instanceof Element) || event.target.closest(`${FIELDS}, [role="menu"]`)) {
        return;
      }
      setInspect(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  });

  // Fade the example out, then swap in the picked one (it fades in by CSS on mount).
  useEffect(() => {
    if (activeId === shownId) return;
    const demo = demoRef.current?.querySelector<HTMLElement>(".cp-demo");
    if (!demo) {
      setShownId(activeId);
      return;
    }
    demo.inert = true;
    const style = getComputedStyle(demo);
    const fade = demo.animate([{ opacity: style.opacity }, { opacity: 0 }], {
      duration: Number.parseFloat(style.getPropertyValue("--docs-dur-out")) || 120,
      easing: "ease-out",
      fill: "forwards",
    });
    fade.finished.then(
      () => setShownId(activeId),
      () => {},
    );
    return () => {
      fade.cancel();
      demo.inert = false;
    };
  }, [activeId, shownId]);

  // Fit the demo into the room the preview has: transform only, never a relayout.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new example is a new demo to fit
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const fit = fitRef.current;
    const demo = demoRef.current;
    if (!body || !fit || !demo) return;
    const apply = () => {
      if (!demo.offsetWidth || !demo.offsetHeight) return;
      const style = getComputedStyle(body);
      const padX =
        Number.parseFloat(style.paddingInlineStart) + Number.parseFloat(style.paddingInlineEnd);
      const padY =
        Number.parseFloat(style.paddingBlockStart) + Number.parseFloat(style.paddingBlockEnd);
      const width = body.clientWidth - padX;
      const height = body.clientHeight - padY;
      const scale = Math.max(
        0.4,
        Math.min(1, (width - 24) / demo.offsetWidth, (height - 16) / demo.offsetHeight),
      );
      // None when there is nothing to do: a transform captures `position: fixed` inside it, which
      // is how Select lays its popup over its trigger.
      fit.style.transform = scale === 1 ? "none" : `scale(${scale.toFixed(3)})`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(body);
    observer.observe(demo);
    return () => observer.disconnect();
  }, [shownId]);

  // Single-key shortcuts while focus is not in a field. A shortcut that hides the focused element
  // hands focus to its own button, so the next press still works.
  const shortcuts = useRef<Record<string, Shortcut>>({});
  useLayoutEffect(() => {
    shortcuts.current = {
      ...(inspectable ? { i: { run: () => setInspect(!inspect) } } : {}),
      d: {
        run: toggleDocs,
        hides: docsOpen ? docsRef.current : null,
        focus: buttons.current.get("docs"),
      },
      t: { run: toggleSiteTheme },
    };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      if (event.target.closest(FIELDS)) return;
      const shortcut = shortcuts.current[event.key.toLowerCase()];
      if (!shortcut) return;
      event.preventDefault();
      const lost = shortcut.hides?.contains(document.activeElement) ?? false;
      shortcut.run();
      if (lost) shortcut.focus?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // The sheet's handle: a tap (or Enter) switches half and full height; a drag sets the height,
  // then settles on the nearest height when let go, or shuts the sheet when dragged low enough.
  const onHandleDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !docsRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      y: event.clientY,
      height: docsRef.current.getBoundingClientRect().height,
      moved: false,
    };
  };
  const onHandleMove = (event: PointerEvent<HTMLButtonElement>) => {
    const from = drag.current;
    if (!from) return;
    const dy = from.y - event.clientY;
    if (!from.moved && Math.abs(dy) < DRAG_SLOP) return;
    from.moved = true;
    setDragHeight(Math.max(0, Math.min(innerHeight - SHEET_FULL_GAP, from.height + dy)));
  };
  const onHandleUp = () => {
    const from = drag.current;
    if (!from?.moved || dragHeight === null) return;
    const half = innerHeight * SHEET_HALF;
    const full = innerHeight - SHEET_FULL_GAP;
    setSheet(
      dragHeight < innerHeight * SHUT_BELOW
        ? "closed"
        : dragHeight > (half + full) / 2
          ? "full"
          : "half",
    );
    setDragHeight(null);
  };
  const onHandleClick = () => {
    const from = drag.current;
    drag.current = null;
    if (from?.moved) return;
    setSheet((current) => (current === "full" ? "half" : "full"));
  };

  const names = definition.imports.join(", ");
  const importLine = `import { ${names} } from "${importPath(setup, definition.item)}";`;
  const docsId = `${id}-docs`;

  const context: PageContext = {
    lang,
    definition,
    labels,
    common,
    install,
    activeId: active?.id ?? "",
    showExample: setActiveId,
    inspecting,
    inspectPart: (name) => {
      setPart(name);
      setInspect(true);
    },
    inspectedPart: inspecting ? (part ?? undefined) : undefined,
    setInspect,
  };

  const sheetStyle =
    dragHeight === null ? undefined : ({ "--sheet-drag": `${dragHeight}px` } as CSSProperties);

  const tool = (key: string) => (el: HTMLElement | null) => {
    buttons.current.set(key, el);
  };

  return (
    <PageContextValue value={context}>
      <div
        ref={rootRef}
        className="cp"
        data-mounted={mounted ? "" : undefined}
        data-sheet={sheet}
        data-dragging={dragHeight === null ? undefined : ""}
        style={sheetStyle}
      >
        <section
          className="cp-preview"
          aria-label={labels.preview}
          // A click anywhere on it takes focus, so the page's own focus is a known place.
          tabIndex={-1}
        >
          <div className="cp-bar">
            <div className="cp-heading">
              <SidebarOpen label={labels.showSidebar} />
              <h1 className="cp-title">{title}</h1>
              <span className="cp-badge" data-family={family.id}>
                {family.name}
              </span>
            </div>
            <Tooltip.Provider>
              <Toolbar.Root ref={toolsRef} className="cp-tools" aria-label={labels.tools}>
                <Popover.Root open={installOpen} onOpenChange={setInstallOpen}>
                  <Toolbar.Button
                    render={<Popover.Trigger />}
                    className="cp-tool cp-tool-text"
                    ref={tool("install")}
                  >
                    {labels.install}
                  </Toolbar.Button>
                  <Popover.Portal>
                    <Popover.Positioner
                      anchor={toolsRef}
                      align="end"
                      sideOffset={8}
                      collisionPadding={8}
                    >
                      <Popover.Popup className="cp-install" aria-label={labels.installTitle}>
                        <Popover.Title className="cp-install-title">
                          {format(labels.installTitle, { name: title })}
                        </Popover.Title>
                        <InstallTabs item={definition.item} labels={common} />
                        <p className="cp-install-label">{labels.importLine}</p>
                        <CodeLine text={importLine} labels={common} lang="tsx" />
                        <div className="cp-install-foot">
                          <TokenChip lang={lang} />
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                              setInstallOpen(false);
                              openAt("installation");
                            }}
                          >
                            {labels.guide}
                          </button>
                        </div>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
                <Toolbar.Separator className="cp-tool-sep" />
                {inspectable ? (
                  <Tip
                    trigger={
                      <Toolbar.Button
                        render={<Toggle pressed={inspect} onPressedChange={setInspect} />}
                        className="cp-tool"
                        data-more=""
                        aria-keyshortcuts="I"
                        aria-label={labels.inspect}
                        ref={tool("inspect")}
                      >
                        <Icon name="scan" size={16} />
                      </Toolbar.Button>
                    }
                    label={labels.inspect}
                    shortcut="I"
                  />
                ) : null}
                <Tip
                  trigger={
                    <Toolbar.Button
                      className="cp-tool"
                      aria-expanded={docsOpen}
                      aria-controls={docsId}
                      aria-keyshortcuts="D"
                      aria-label={labels.docs}
                      onClick={toggleDocs}
                      ref={tool("docs")}
                    >
                      <Icon name="book-open" size={16} />
                    </Toolbar.Button>
                  }
                  label={labels.docs}
                  shortcut="D"
                />
                <Tip
                  trigger={
                    <Toolbar.Button
                      className="cp-tool"
                      data-more=""
                      aria-keyshortcuts="T"
                      aria-label={labels.theme}
                      onClick={toggleSiteTheme}
                      ref={tool("theme")}
                    >
                      <Icon name="contrast" size={16} />
                    </Toolbar.Button>
                  }
                  label={labels.theme}
                  shortcut="T"
                />
                <LanguageMenu lang={lang} />
                {/* Narrow screens: Inspect and Theme step into this menu. */}
                <Menu.Root>
                  <Tip
                    trigger={
                      <Toolbar.Button
                        render={<Menu.Trigger />}
                        className="cp-tool cp-tool-menu"
                        aria-label={labels.menu}
                      >
                        <Icon name="ellipsis" size={16} />
                      </Toolbar.Button>
                    }
                    label={labels.menu}
                  />
                  <Menu.Portal>
                    <Menu.Positioner align="end" sideOffset={8}>
                      <Menu.Popup className="cp-menu">
                        {inspectable ? (
                          <Menu.CheckboxItem checked={inspect} onCheckedChange={setInspect}>
                            <Menu.CheckboxItemIndicator />
                            {labels.inspect}
                          </Menu.CheckboxItem>
                        ) : null}
                        <Menu.Separator />
                        <Menu.Item onClick={toggleSiteTheme}>
                          <Icon name="contrast" size={15} />
                          {labels.theme}
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </Toolbar.Root>
            </Tooltip.Provider>
          </div>

          <div ref={bodyRef} className="cp-body" data-inspect={inspecting ? "" : undefined}>
            <div ref={fitRef} className="cp-fit">
              <div ref={demoRef} className="cp-stage">
                <Fragment key={shown?.id}>
                  <div className="cp-demo" data-example={shown?.id}>
                    {shown?.demo(lang)}
                  </div>
                </Fragment>
              </div>
            </div>

            {inspectShown && inspectable ? (
              <Anatomy
                leaving={!inspecting}
                name={title}
                parts={parts}
                specimen={definition.anatomy?.specimen(lang)}
                lang={lang}
                labels={labels}
                bodyRef={bodyRef}
                demoRef={demoRef}
                openPart={part}
                onOpenPart={setPart}
              />
            ) : null}
          </div>

          {examples.length > 1 ? (
            <div className="cp-picker">
              <ToggleGroup.Root
                aria-label={labels.examples}
                className="docs-choice"
                value={active ? [active.id] : []}
                onValueChange={([next]) => next && setActiveId(next)}
              >
                {examples.map((example) => (
                  <ToggleGroup.Item key={example.id} value={example.id} data-example={example.id}>
                    {example.title[lang]}
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
            </div>
          ) : null}
        </section>

        <aside
          ref={docsRef}
          id={docsId}
          className="cp-docs"
          aria-label={format(labels.docsTitle, { name: title })}
          tabIndex={-1}
          data-open={docsOpen ? "" : undefined}
          inert={!docsOpen}
        >
          <div className="cp-docs-inner">
            <button
              type="button"
              className="cp-sheet-handle cp-docs-handle"
              aria-label={labels.dragSheet}
              aria-controls={docsId}
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              onClick={onHandleClick}
            />
            {/* The section tabs and Close share one row; the panel's name is its aria-label. */}
            <div className="cp-docs-head">
              <nav className="cp-docs-nav" aria-label={labels.sections}>
                <ScrollArea.Root fade>
                  <ScrollArea.Viewport ref={chipsRef} tabIndex={-1}>
                    {sections.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        aria-current={item.id === section ? "location" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          history.replaceState(null, "", `#${item.id}`);
                          scrollToSection(item.id, true);
                        }}
                      >
                        {item.title}
                      </a>
                    ))}
                  </ScrollArea.Viewport>
                </ScrollArea.Root>
              </nav>
              <Tip
                trigger={
                  <button
                    type="button"
                    className="cp-docs-close"
                    aria-label={labels.closeDocs}
                    onClick={closeDocs}
                  >
                    <Icon name="x" size={16} />
                  </button>
                }
                label={labels.closeDocs}
                shortcut="D"
              />
            </div>
            <div ref={scrollerRef} className="cp-docs-scroll">
              <p className="lead">{description}</p>
              {children}
              {footer}
            </div>
          </div>
        </aside>
      </div>
    </PageContextValue>
  );
}
