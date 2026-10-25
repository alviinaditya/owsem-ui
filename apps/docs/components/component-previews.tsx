"use client";

import {
  Button,
  Kbd,
  Menu,
  Popover,
  Separator,
  Toggle,
  ToggleGroup,
  Toolbar,
  Tooltip,
} from "owsem-ui/base";
import { ColorPicker, CommandMenu, CopyButton, TableOfContents, TreeRailNav } from "owsem-ui/owsem";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { ComponentName } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { FrozenMorph } from "./frozen-morph";
import { Icon } from "./icons/icon";

const TEXT = {
  id: {
    create: "Baru",
    cancel: "Batal",
    day: "Hari",
    week: "Minggu",
    month: "Bulan",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    undo: "Urungkan",
    docs: "Dokumen",
    blog: "Blog",
    share: "Bagikan",
    shareTitle: "Bagikan link",
    shareBody: "Siapa pun bisa melihat.",
    edit: "Edit",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    guides: "Panduan",
    start: "Mulai",
    theming: "Tema",
    components: "Komponen",
    search: "Cari…",
    commands: "Perintah",
    newFile: "File baru",
    openRecent: "Buka terbaru",
    settings: "Pengaturan",
    toolbar: "Format teks",
    contents: "Di halaman ini",
    sections: ["Instalasi", "Tema", "Pemakaian", "API"],
  },
  en: {
    create: "New",
    cancel: "Cancel",
    day: "Day",
    week: "Week",
    month: "Month",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    docs: "Docs",
    blog: "Blog",
    share: "Share",
    shareTitle: "Share link",
    shareBody: "Anyone with it can view.",
    edit: "Edit",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    guides: "Guides",
    start: "Getting started",
    theming: "Theming",
    components: "Components",
    search: "Search…",
    commands: "Commands",
    newFile: "New file",
    openRecent: "Open recent",
    settings: "Settings",
    toolbar: "Text format",
    contents: "On this page",
    sections: ["Installation", "Theming", "Usage", "API"],
  },
};

type Text = (typeof TEXT)[Lang];

/**
 * Popups portal into the preview itself, so they stay in the card: a container from state, since
 * Base UI waits while it is null.
 */
function usePortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return { container, box: <div ref={setContainer} className="component-preview-portal" /> };
}

// Pinned open without taking focus or the page's scroll (Base UI's undocumented `initialFocus`).
const pinned = { open: true, modal: false } as const;
const keepFocus = { initialFocus: false } as object;

function PopoverPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Popover.Root {...pinned}>
        <Popover.Trigger render={<Button size="sm" variant="outline" />}>{t.share}</Popover.Trigger>
        <Popover.Portal container={portal.container}>
          <Popover.Positioner side="bottom">
            <Popover.Popup {...keepFocus}>
              <Popover.Arrow />
              <Popover.Title>{t.shareTitle}</Popover.Title>
              <Popover.Description>{t.shareBody}</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {portal.box}
    </>
  );
}

function TooltipPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Tooltip.Root open>
        <Tooltip.Trigger
          render={<Toggle pressed aria-label={t.bold} startIcon={<Icon name="bold" />} />}
        />
        <Tooltip.Portal container={portal.container}>
          <Tooltip.Positioner side="top">
            <Tooltip.Popup>
              <Tooltip.Arrow />
              {t.bold}
              <kbd>⌘B</kbd>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      {portal.box}
    </>
  );
}

function MenuPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Menu.Root {...pinned}>
        <Menu.Trigger render={<Button size="sm" variant="outline" />}>{t.edit}</Menu.Trigger>
        <Menu.Portal container={portal.container}>
          <Menu.Positioner side="inline-end" align="start">
            <Menu.Popup size="sm" {...keepFocus}>
              <Menu.Item>
                <Icon name="scissors" />
                {t.cut}
                <kbd>⌘X</kbd>
              </Menu.Item>
              <Menu.Item>
                <Icon name="copy" />
                {t.copy}
                <kbd>⌘C</kbd>
              </Menu.Item>
              <Menu.Item disabled>
                <Icon name="clipboard" />
                {t.paste}
                <kbd>⌘V</kbd>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {portal.box}
    </>
  );
}

function CommandMenuPreview({ t }: { t: Text }) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const items = [
    { value: "new", label: t.newFile, icon: "plus" },
    { value: "recent", label: t.openRecent, icon: "file-text" },
    { value: "settings", label: t.settings, icon: "sliders-horizontal" },
  ] as const;
  return (
    <div ref={setFrame} className="component-preview-command">
      <CommandMenu.Root items={[...items]} {...pinned} shortcut={false}>
        {frame ? (
          <CommandMenu.Popup
            aria-label={t.commands}
            size="sm"
            container={frame}
            initialFocus={false}
            finalFocus={false}
          >
            <CommandMenu.Input aria-label={t.commands} placeholder={t.search} />
            <CommandMenu.List>
              {(item: (typeof items)[number]) => (
                <CommandMenu.Item key={item.value} value={item}>
                  <CommandMenu.ItemIcon>
                    <Icon name={item.icon} />
                  </CommandMenu.ItemIcon>
                  <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>
                </CommandMenu.Item>
              )}
            </CommandMenu.List>
          </CommandMenu.Popup>
        ) : null}
      </CommandMenu.Root>
    </div>
  );
}

/** A page sketch that reads along: scrolled to its second section, so the marker stands there. */
function TableOfContentsPreview({ t }: { t: Text }) {
  const id = useId();
  const article = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (article.current) article.current.scrollTop = 48;
  }, []);
  return (
    <div className="component-preview-toc">
      <div ref={article} className="component-preview-toc-article">
        {t.sections.map((section, i) => (
          <div key={section}>
            <span id={`${id}-${i}`} />
            <span />
            <span />
          </div>
        ))}
      </div>
      <TableOfContents.Root aria-label={t.contents}>
        <TableOfContents.List>
          {t.sections.map((section, i) => (
            <TableOfContents.Item key={section}>
              <TableOfContents.Link href={`#${id}-${i}`}>{section}</TableOfContents.Link>
            </TableOfContents.Item>
          ))}
        </TableOfContents.List>
      </TableOfContents.Root>
    </div>
  );
}

/** Each built component, small and still: what a visitor gets on its page, minus the motion. */
const LIVE: Partial<Record<ComponentName, (t: Text) => ReactNode>> = {
  button: (t) => (
    <div className="component-preview-row">
      <Button size="sm" startIcon={<Icon name="plus" />}>
        {t.create}
      </Button>
      <Button size="sm" variant="secondary">
        {t.cancel}
      </Button>
    </div>
  ),
  toggle: (t) => (
    <div className="component-preview-row">
      <Toggle pressed aria-label={t.bold} startIcon={<Icon name="bold" />} />
      <Toggle aria-label={t.italic} startIcon={<Icon name="italic" />} />
      <Toggle aria-label={t.underline} startIcon={<Icon name="underline" />} />
    </div>
  ),
  "toggle-group": (t) => (
    <ToggleGroup.Root size="sm" value={["week"]} aria-label={t.week}>
      <ToggleGroup.Item value="day">{t.day}</ToggleGroup.Item>
      <ToggleGroup.Item value="week">{t.week}</ToggleGroup.Item>
      <ToggleGroup.Item value="month">{t.month}</ToggleGroup.Item>
    </ToggleGroup.Root>
  ),
  toolbar: (t) => (
    <Toolbar.Root size="sm" aria-label={t.toolbar}>
      <Toolbar.Button
        render={<Toggle pressed />}
        aria-label={t.bold}
        startIcon={<Icon name="bold" />}
      />
      <Toolbar.Button
        render={<Toggle />}
        aria-label={t.italic}
        startIcon={<Icon name="italic" />}
      />
      <Toolbar.Button
        render={<Toggle />}
        aria-label={t.underline}
        startIcon={<Icon name="underline" />}
      />
      <Toolbar.Separator />
      <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
    </Toolbar.Root>
  ),
  separator: (t) => (
    <div className="component-preview-separator">
      <strong>OwsemUI</strong>
      <Separator />
      <div className="component-preview-row">
        {t.docs}
        <Separator orientation="vertical" />
        {t.components}
        <Separator orientation="vertical" />
        {t.blog}
      </div>
    </div>
  ),
  kbd: () => (
    <div className="component-preview-keys">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </div>
  ),
  popover: (t) => <PopoverPreview t={t} />,
  tooltip: (t) => <TooltipPreview t={t} />,
  menu: (t) => <MenuPreview t={t} />,
  "tree-rail-nav": (t) => (
    <TreeRailNav.Root aria-label={t.guides} className="component-preview-tree">
      <TreeRailNav.List>
        <TreeRailNav.Node>
          <TreeRailNav.Link href="#">{t.start}</TreeRailNav.Link>
        </TreeRailNav.Node>
        <TreeRailNav.Node defaultOpen>
          <TreeRailNav.Toggle>{t.components}</TreeRailNav.Toggle>
          <TreeRailNav.Panel>
            <TreeRailNav.List>
              <TreeRailNav.Node>
                <TreeRailNav.Link href="#" current>
                  Button
                </TreeRailNav.Link>
              </TreeRailNav.Node>
              <TreeRailNav.Node>
                <TreeRailNav.Link href="#">Menu</TreeRailNav.Link>
              </TreeRailNav.Node>
            </TreeRailNav.List>
          </TreeRailNav.Panel>
        </TreeRailNav.Node>
      </TreeRailNav.List>
    </TreeRailNav.Root>
  ),
  "command-menu": (t) => <CommandMenuPreview t={t} />,
  "table-of-contents": (t) => <TableOfContentsPreview t={t} />,
  "copy-button": (t) => (
    <div className="component-preview-copy">
      <code>pnpm add owsem-ui</code>
      <CopyButton value="pnpm add owsem-ui" labels={{ copy: t.copy }} showLabel size="sm" />
    </div>
  ),
  // One swap, Copy to Check, held at its start, mid-way, and at rest.
  "icon-morph": () => (
    <div className="component-preview-row">
      {[0, 120, null].map((at) => (
        <span key={String(at)} className="component-preview-morph">
          <FrozenMorph from="copy" to="check" at={at} size={22} />
        </span>
      ))}
    </div>
  ),
  "color-picker": () => (
    <ColorPicker
      defaultValue="#7c6ab8"
      alpha={false}
      inputs={false}
      eyeDropper={false}
      swatches={false}
    />
  ),
};

/*
 * Components not built yet: a line sketch of each, in a 160 × 96 box. `F` is a filled bar (text),
 * `B` an outlined box.
 */
const F = (x: number, y: number, w: number, h = 5, o = 0.5) => (
  <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="currentColor" stroke="none" opacity={o} />
);
const B = (x: number, y: number, w: number, h: number, r = 5) => (
  <rect x={x} y={y} width={w} height={h} rx={r} />
);

const SKETCHES: Partial<Record<ComponentName, ReactNode>> = {
  field: (
    <>
      {F(36, 22, 32)}
      {B(36, 33, 88, 22)}
      {F(44, 42, 36, 4, 0.35)}
      {F(36, 63, 56, 4, 0.3)}
    </>
  ),
  fieldset: (
    <>
      {B(28, 18, 104, 66, 7)}
      {F(36, 15, 36, 6, 0.6)}
      {B(38, 30, 84, 18)}
      {B(38, 56, 84, 18)}
    </>
  ),
  form: (
    <>
      {B(36, 14, 88, 18)}
      {B(36, 38, 88, 18)}
      <rect x={36} y={64} width={38} height={18} rx={5} fill="currentColor" opacity={0.6} />
    </>
  ),
  input: (
    <>
      {B(28, 36, 104, 24, 6)}
      {F(38, 46, 40, 5, 0.4)}
      <path d="M82 43v11" />
    </>
  ),
  checkbox: (
    <>
      <rect x={42} y={38} width={20} height={20} rx={5} fill="currentColor" opacity={0.6} />
      <path d="m46 48 4 4 8-8" stroke="var(--docs-surface)" strokeWidth={2.4} />
      {F(70, 45, 48)}
    </>
  ),
  "radio-group": (
    <>
      {[26, 48, 70].map((y, i) => (
        <g key={y}>
          <circle cx={52} cy={y} r={8} />
          {i === 0 ? <circle cx={52} cy={y} r={4} fill="currentColor" stroke="none" /> : null}
          {F(66, y - 2.5, 40 - i * 6)}
        </g>
      ))}
    </>
  ),
  switch: (
    <>
      <rect x={44} y={37} width={40} height={22} rx={11} fill="currentColor" opacity={0.6} />
      <circle cx={73} cy={48} r={8} fill="var(--docs-surface)" stroke="none" />
      {F(92, 45, 30)}
    </>
  ),
  select: (
    <>
      {B(30, 36, 100, 24, 6)}
      {F(40, 46, 44)}
      <path d="m112 45 5 5 5-5" />
    </>
  ),
  dialog: (
    <>
      {B(26, 12, 108, 72, 8)}
      {F(38, 24, 48, 6, 0.6)}
      {F(38, 37, 80, 4, 0.35)}
      {F(38, 46, 64, 4, 0.35)}
      {B(70, 62, 26, 13, 4)}
      <rect x={100} y={62} width={24} height={13} rx={4} fill="currentColor" opacity={0.6} />
    </>
  ),
  tabs: (
    <>
      {B(26, 16, 36, 18, 5)}
      {F(34, 23, 20)}
      {F(70, 23, 20, 5, 0.35)}
      {F(100, 23, 22, 5, 0.35)}
      <path d="M26 42h108" opacity={0.5} />
      {F(26, 54, 96, 4, 0.35)}
      {F(26, 64, 76, 4, 0.35)}
      {F(26, 74, 86, 4, 0.35)}
    </>
  ),
  "scroll-area": (
    <>
      {B(36, 12, 88, 72, 7)}
      {[24, 36, 48, 60, 72].map((y, i) => (
        <g key={y}>{F(46, y, 52 - (i % 2) * 14, 4, 0.35)}</g>
      ))}
      <rect x={115} y={20} width={3} height={26} rx={1.5} fill="currentColor" stroke="none" />
    </>
  ),
  "checkbox-group": (
    <>
      {[26, 48, 70].map((y, i) => (
        <g key={y}>
          {i < 2 ? (
            <>
              <rect
                x={44}
                y={y - 8}
                width={16}
                height={16}
                rx={4}
                fill="currentColor"
                opacity={0.6}
              />
              <path d={`m47 ${y} 3 3 7-7`} stroke="var(--docs-surface)" strokeWidth={2} />
            </>
          ) : (
            <rect x={44} y={y - 8} width={16} height={16} rx={4} />
          )}
          {F(68, y - 2.5, 44 - i * 6)}
        </g>
      ))}
    </>
  ),
  "number-field": (
    <>
      {B(36, 36, 88, 24, 6)}
      <path d="M60 36v24M100 36v24M43 48h10M107 48h10M112 43v10" />
      {F(72, 46, 16)}
    </>
  ),
  slider: (
    <>
      {F(26, 46, 108, 4, 0.3)}
      {F(26, 46, 62, 4, 0.7)}
      <circle cx={88} cy={48} r={9} fill="var(--docs-surface)" />
    </>
  ),
  combobox: (
    <>
      {B(30, 12, 100, 20, 5)}
      {F(38, 20, 30)}
      <path d="m114 19 4 4 4-4" />
      {B(30, 38, 100, 46, 6)}
      <rect x={34} y={42} width={92} height={13} rx={4} fill="currentColor" opacity={0.18} />
      {F(40, 46, 44)}
      {F(40, 61, 52, 5, 0.35)}
      {F(40, 73, 36, 5, 0.35)}
    </>
  ),
  autocomplete: (
    <>
      {B(30, 14, 100, 20, 5)}
      {F(38, 22, 26)}
      <path d="M68 19v10" />
      {B(30, 40, 100, 34, 6)}
      <rect x={34} y={44} width={92} height={12} rx={4} fill="currentColor" opacity={0.18} />
      {F(40, 47, 50)}
      {F(40, 62, 38, 5, 0.35)}
    </>
  ),
  "alert-dialog": (
    <>
      {B(30, 12, 100, 72, 8)}
      <circle cx={46} cy={30} r={8} />
      <path d="M46 26v4M46 34v0.5" />
      {F(60, 24, 46, 6, 0.6)}
      {F(60, 36, 56, 4, 0.35)}
      {B(66, 62, 26, 13, 4)}
      <rect x={96} y={62} width={26} height={13} rx={4} fill="currentColor" opacity={0.6} />
    </>
  ),
  toast: (
    <>
      <rect x={52} y={26} width={84} height={24} rx={6} opacity={0.4} />
      <rect x={46} y={36} width={92} height={28} rx={6} opacity={0.6} />
      <rect x={40} y={46} width={100} height={32} rx={7} fill="var(--docs-surface)" />
      {F(50, 56, 50)}
      {F(50, 66, 34, 4, 0.35)}
    </>
  ),
  accordion: (
    <>
      {F(30, 18, 52)}
      <path d="m120 17 4 4 4-4M30 32h100" />
      {F(30, 42, 44)}
      <path d="m120 46 4-4 4 4" />
      {F(30, 54, 84, 4, 0.35)}
      {F(30, 63, 70, 4, 0.35)}
      <path d="M30 74h100" />
      {F(30, 82, 40)}
    </>
  ),
  collapsible: (
    <>
      {F(36, 20, 56)}
      <path d="m118 19 4 4 4-4" />
      {B(36, 34, 88, 44, 6)}
      {F(46, 46, 60, 4, 0.35)}
      {F(46, 56, 44, 4, 0.35)}
      {F(46, 66, 52, 4, 0.35)}
    </>
  ),
  "otp-field": (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          {B(29 + i * 18 + (i > 2 ? 4 : 0), 36, 14, 22, 4)}
          {i < 3 ? (
            <circle cx={36 + i * 18} cy={47} r={2.5} fill="currentColor" stroke="none" />
          ) : null}
        </g>
      ))}
    </>
  ),
  drawer: (
    <>
      <rect x={30} y={8} width={100} height={80} rx={8} opacity={0.4} />
      <path d="M30 48h100v32a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill="var(--docs-surface)" />
      {F(70, 54, 20, 4, 0.6)}
      {F(42, 66, 56, 4, 0.35)}
      {F(42, 75, 40, 4, 0.35)}
    </>
  ),
  "preview-card": (
    <>
      {F(40, 12, 40, 5, 0.6)}
      <path d="M40 21h40" opacity={0.6} />
      {B(40, 28, 84, 56, 7)}
      <circle cx={56} cy={44} r={8} />
      {F(70, 38, 40)}
      {F(70, 48, 28, 4, 0.35)}
      {F(50, 62, 64, 4, 0.35)}
      {F(50, 71, 48, 4, 0.35)}
    </>
  ),
  "context-menu": (
    <>
      <path d="M44 16v18l5-5 4 8 3-1.5-4-8h7z" fill="currentColor" opacity={0.6} />
      {B(56, 32, 70, 54, 6)}
      <rect x={60} y={36} width={62} height={13} rx={4} fill="currentColor" opacity={0.18} />
      {F(66, 40, 36)}
      {F(66, 55, 44, 5, 0.35)}
      {F(66, 70, 30, 5, 0.35)}
    </>
  ),
  menubar: (
    <>
      {B(20, 12, 120, 20, 5)}
      <rect x={24} y={15} width={28} height={14} rx={4} fill="currentColor" opacity={0.18} />
      {F(29, 20, 18)}
      {F(60, 20, 20, 5, 0.35)}
      {F(88, 20, 22, 5, 0.35)}
      {B(24, 36, 64, 48, 6)}
      {F(32, 46, 40, 5, 0.35)}
      {F(32, 58, 30, 5, 0.35)}
      {F(32, 70, 44, 5, 0.35)}
    </>
  ),
  "navigation-menu": (
    <>
      {F(30, 14, 26)}
      {F(66, 14, 26, 5, 0.35)}
      {F(102, 14, 26, 5, 0.35)}
      {B(24, 28, 112, 56, 7)}
      {B(32, 36, 44, 40, 5)}
      {F(86, 40, 40, 5, 0.6)}
      {F(86, 51, 32, 4, 0.35)}
      {F(86, 62, 40, 5, 0.6)}
      {F(86, 73, 28, 4, 0.35)}
    </>
  ),
  avatar: (
    <>
      <circle cx={58} cy={48} r={16} fill="var(--docs-surface)" />
      <circle cx={80} cy={48} r={16} fill="var(--docs-surface)" />
      <circle cx={102} cy={48} r={16} fill="var(--docs-surface)" />
      <circle cx={102} cy={43} r={5} />
      <path d="M93 58a9 9 0 0 1 18 0" />
    </>
  ),
  progress: (
    <>
      {F(30, 34, 40)}
      {F(112, 34, 18, 5, 0.35)}
      {F(30, 48, 100, 8, 0.25)}
      {F(30, 48, 64, 8, 0.7)}
    </>
  ),
  meter: (
    <>
      {F(30, 34, 46)}
      {F(108, 34, 22, 5, 0.35)}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={30 + i * 20.5}
          y={48}
          width={18}
          height={8}
          rx={2}
          fill="currentColor"
          opacity={i < 3 ? 0.7 : 0.25}
          stroke="none"
        />
      ))}
    </>
  ),
  "lumen-rail-nav": (
    <>
      <path d="M52 14v68" opacity={0.4} />
      <path d="M52 14v34" strokeWidth={3} />
      {[22, 40, 58, 76].map((y, i) => (
        <g key={y}>
          <circle cx={52} cy={y} r={3} fill="currentColor" stroke="none" />
          {F(64, y - 2.5, 44 - i * 6, 5, i === 1 ? 0.8 : 0.35)}
        </g>
      ))}
      <circle cx={52} cy={40} r={8} opacity={0.3} />
    </>
  ),
  "number-ticker": (
    <>
      {["1", "2", "8"].map((digit, i) => (
        <g key={digit}>
          {B(48 + i * 22, 30, 20, 36, 5)}
          <text
            x={58 + i * 22}
            y={55}
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize={20}
            fontFamily="var(--font-mono), monospace"
          >
            {digit}
          </text>
        </g>
      ))}
      <path d="M118 42v-8m-3 3 3-3 3 3" />
    </>
  ),
  "spotlight-card": (
    <>
      <defs>
        <radialGradient id="sketch-spotlight">
          <stop offset="0" stopColor="currentColor" stopOpacity={0.35} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={58} cy={34} r={34} fill="url(#sketch-spotlight)" stroke="none" />
      {B(30, 14, 100, 68, 8)}
      {F(42, 52, 46, 6, 0.6)}
      {F(42, 64, 64, 4, 0.35)}
    </>
  ),
};

/**
 * The preview at the top of an index card: the component itself while it is built, else a sketch.
 * Decorative: inert and hidden from assistive tech, since the card's text says it all.
 */
export function ComponentPreview({
  name,
  lang,
  soon,
}: {
  name: ComponentName;
  lang: Lang;
  /** Shown over the sketch of a component not built yet. */
  soon: string;
}) {
  const live = LIVE[name];
  return (
    <div className="component-preview" aria-hidden="true" inert>
      {live ? (
        <div className="component-preview-live" data-preview={name}>
          {live(TEXT[lang])}
        </div>
      ) : (
        <>
          <svg
            className="component-preview-sketch"
            aria-hidden="true"
            viewBox="0 0 160 96"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {SKETCHES[name] ?? B(30, 18, 100, 60, 8)}
          </svg>
          <span className="component-preview-soon">{soon}</span>
        </>
      )}
    </div>
  );
}
