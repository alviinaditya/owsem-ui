"use client";

import { Toggle, Toolbar, Tooltip } from "owsem-ui/base";
import { type CSSProperties, type ReactElement, useState } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import { format } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    toolbar: "Format",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    undo: "Urungkan",
    shared: "Delay {ms} ms, bersama",
    each: "Delay {ms} ms, per tombol",
    top: "Atas",
    right: "Kanan",
    bottom: "Bawah",
    left: "Kiri",
    light: "Terang",
    dark: "Gelap",
    label: "Label",
    shortcut: "Dengan shortcut",
    plain: "Tanpa panah",
  },
  en: {
    toolbar: "Formatting",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    shared: "{ms} ms delay, shared",
    each: "{ms} ms delay, each",
    top: "Top",
    right: "Right",
    bottom: "Bottom",
    left: "Left",
    light: "Light",
    dark: "Dark",
    label: "Label",
    shortcut: "With shortcut",
    plain: "No arrow",
  },
} satisfies Record<Lang, Record<string, string>>;

type Side = "top" | "right" | "bottom" | "left";
type Theme = "light" | "dark";
type ToolKey = "bold" | "italic" | "underline" | "undo";

const THEMES: readonly Theme[] = ["light", "dark"];
const TOOLS: readonly { key: ToolKey; icon: IconName; shortcut: string; toggle: boolean }[] = [
  { key: "bold", icon: "bold", shortcut: "⌘B", toggle: true },
  { key: "italic", icon: "italic", shortcut: "⌘I", toggle: true },
  { key: "underline", icon: "underline", shortcut: "⌘U", toggle: true },
  { key: "undo", icon: "undo-2", shortcut: "⌘Z", toggle: false },
];

const initial = { side: "top", arrow: "on", group: "on", delay: "600", bg: "", fg: "" };
type Cfg = typeof initial;

/**
 * Tooltips portal into the demo itself, so they take the stage's theme and scale, and Inspect
 * finds them: into an empty box out of the layout. A container from state: Base UI waits while it
 * is null.
 */
function usePortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return { container, box: <div ref={setContainer} className="demo-portal" /> };
}

/** A tooltip with its label and shortcut, around any trigger. */
function Tip({
  trigger,
  label,
  shortcut,
  side,
  arrow,
  container,
  open,
  delay,
  style,
}: {
  trigger: ReactElement<Record<string, unknown>>;
  label: string;
  shortcut?: string;
  side: Side;
  arrow: boolean;
  container: HTMLElement | null;
  open?: boolean | undefined;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <Tooltip.Root {...(open ? { open } : {})}>
      <Tooltip.Trigger render={trigger} {...(delay ? { delay } : {})} />
      <Tooltip.Portal container={container}>
        <Tooltip.Positioner side={side} style={style}>
          <Tooltip.Popup>
            {arrow ? <Tooltip.Arrow /> : null}
            {label}
            {shortcut ? <kbd>{shortcut}</kbd> : null}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** A formatting toolbar whose buttons each have a tooltip, and a line naming the delay. */
function Demo({ cfg, lang, openFirst }: { cfg: Cfg; lang: Lang; openFirst?: boolean }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const [on, setOn] = useState<Record<string, boolean>>({ bold: true });
  const grouped = cfg.group === "on";
  const delay = Number(cfg.delay);
  const style = {
    "--ow-tooltip-bg": cfg.bg || undefined,
    "--ow-tooltip-fg": cfg.fg || undefined,
  } as CSSProperties;
  const tools = TOOLS.map((tool, i) => {
    const label = t[tool.key];
    const props = {
      "aria-label": label,
      startIcon: <Icon name={tool.icon} />,
      "data-demo": tool.key,
    };
    const trigger = tool.toggle ? (
      <Toolbar.Button
        render={
          <Toggle
            pressed={on[tool.key] ?? false}
            onPressedChange={(pressed) => setOn((current) => ({ ...current, [tool.key]: pressed }))}
          />
        }
        {...props}
      />
    ) : (
      <Toolbar.Button {...props} />
    );
    return (
      <Tip
        key={tool.key}
        trigger={trigger}
        label={label}
        shortcut={tool.shortcut}
        side={cfg.side as Side}
        arrow={cfg.arrow === "on"}
        container={portal.container}
        open={openFirst && i === 0}
        {...(grouped ? {} : { delay })}
        style={style}
      />
    );
  });
  const bar = <Toolbar.Root aria-label={t.toolbar}>{tools}</Toolbar.Root>;
  return (
    <div className="demo-tooltip">
      {grouped ? <Tooltip.Provider delay={delay}>{bar}</Tooltip.Provider> : bar}
      <p className="demo-caption">{format(grouped ? t.shared : t.each, { ms: cfg.delay })}</p>
      {portal.box}
    </div>
  );
}

/** One trigger per side, each tooltip open on its own side. */
function Placement({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const sides: readonly Side[] = ["top", "left", "right", "bottom"];
  return (
    <div className="demo-tooltip demo-tooltip-sides">
      {sides.map((side) => (
        <Tip
          key={side}
          trigger={
            <Toggle aria-label={t[side]} startIcon={<Icon name="pin" />} data-side-demo={side} />
          }
          label={t[side]}
          side={side}
          arrow={cfg.arrow === "on"}
          container={portal.container}
          open
        />
      ))}
      {portal.box}
    </div>
  );
}

/** A matrix cell: a trigger with its tooltip open above it, in the cell's theme. */
function Cell({
  theme,
  label,
  shortcut,
  arrow,
}: {
  theme: Theme;
  label: string;
  shortcut?: string;
  arrow: boolean;
}) {
  const portal = usePortal();
  return (
    <div data-theme={theme} className="demo-cell demo-tooltip-cell">
      <Tip
        trigger={<Toggle aria-label={label} startIcon={<Icon name="bold" />} />}
        label={label}
        {...(shortcut ? { shortcut } : {})}
        side="top"
        arrow={arrow}
        container={portal.container}
        open
      />
      {portal.box}
    </div>
  );
}

/** The tooltip in both themes: a label, a label with its shortcut, and no arrow. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const rows = [
    { label: t.label, shortcut: undefined, arrow: true },
    { label: t.shortcut, shortcut: "⌘B", arrow: true },
    { label: t.plain, shortcut: "⌘B", arrow: false },
  ];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={rows.map((row) => ({
        label: row.label,
        cells: THEMES.map((theme) => (
          <Cell
            key={theme}
            theme={theme}
            label={t.bold}
            arrow={row.arrow}
            {...(row.shortcut ? { shortcut: row.shortcut } : {})}
          />
        )),
      }))}
    />
  );
}

// The first tooltip waits for the delay; along the toolbar the rest open at once. Off the
// toolbar for longer than the group's timeout, the delay comes back.
const group: SceneScript = async (stage) => {
  await stage.point(stage.get('[data-demo="bold"]'));
  await stage.wait(1100);
  for (const key of ["italic", "underline", "undo"]) {
    await stage.point(stage.get(`[data-demo="${key}"]`));
    await stage.wait(700);
  }
  await stage.point(stage.get(".demo-caption"));
  await stage.wait(900);
  await stage.point(stage.get('[data-demo="italic"]'));
  await stage.wait(1100);
  await stage.point(stage.get(".demo-caption"));
  await stage.wait(400);
};

const tooltipLab = defineLab({
  initial,
  controls: [
    {
      key: "side",
      type: "choice",
      label: { id: "Sisi", en: "Side" },
      options: (["top", "right", "bottom", "left"] as const).map((side) => ({
        value: side,
        label: { id: TEXT.id[side], en: TEXT.en[side] },
      })),
    },
    {
      key: "arrow",
      type: "choice",
      label: { id: "Panah", en: "Arrow" },
      options: [
        { value: "on", label: { id: "Ada", en: "On" } },
        { value: "off", label: { id: "Tidak", en: "Off" } },
      ],
    },
    {
      key: "group",
      type: "choice",
      label: { id: "Delay", en: "Delay" },
      options: [
        { value: "on", label: { id: "Bersama", en: "Shared" } },
        { value: "off", label: { id: "Per tombol", en: "Each" } },
      ],
    },
    {
      key: "delay",
      type: "choice",
      label: { id: "Lama delay", en: "Delay length" },
      options: ["300", "600", "1000"].map((ms) => ({
        value: ms,
        label: { id: `${ms} ms`, en: `${ms} ms` },
      })),
    },
    {
      key: "bg",
      type: "color",
      label: { id: "Permukaan", en: "Surface" },
      token: "--ow-tooltip-bg",
    },
    { key: "fg", type: "color", label: { id: "Teks", en: "Text" }, token: "--ow-tooltip-fg" },
  ],

  parts: [
    {
      name: "Trigger",
      selector: '[data-demo="bold"]',
      note: {
        id: "Tombol yang diberi label. Nama aksesibelnya tetap miliknya; tooltip hanya visual.",
        en: "The button it labels. Its accessible name stays its own; the tooltip is visual only.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-tooltip__popup",
      note: {
        id: "Permukaan gelap solid tanpa material, setinggi 24px untuk satu baris.",
        en: "A solid dark surface with no material, 24px tall for one line.",
      },
      tokens: { "--ow-tooltip-bg": "--_bg", "--ow-tooltip-fg": "--_fg" },
    },
    {
      name: "Arrow",
      selector: ".ow-tooltip__arrow",
      note: {
        id: "Segitiga ke arah trigger, dijaga Base UI tetap di tengah trigger.",
        en: "A triangle toward the trigger, kept on the trigger's center by Base UI.",
      },
    },
    {
      name: "Shortcut",
      selector: ".ow-tooltip__popup kbd",
      note: {
        id: "kbd di dalam popup: shortcut setelah label, sedikit lebih redup.",
        en: "A kbd inside the popup: the shortcut after the label, a little dimmer.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? ['import { Toggle, Toolbar, Tooltip } from "owsem-ui/base";']
      : [
          'import { Toggle } from "@/components/owsem/toggle";',
          'import { Toolbar } from "@/components/owsem/toolbar";',
          'import { Tooltip } from "@/components/owsem/tooltip";',
        ];
    const grouped = cfg.group === "on";
    const custom = cfg.bg || cfg.fg;
    const delay = cfg.delay === "600" ? "" : ` delay={${cfg.delay}}`;
    const side = cfg.side === "top" ? "" : ` side="${cfg.side}"`;
    const tools = [
      '        <Tool label="Bold" shortcut="⌘B" icon={<Bold />} toggle />',
      '        <Tool label="Italic" shortcut="⌘I" icon={<Italic />} toggle />',
      '        <Tool label="Underline" shortcut="⌘U" icon={<Underline />} toggle />',
      '        <Tool label="Undo" shortcut="⌘Z" icon={<Undo2 />} />',
    ];
    const bar = ['      <Toolbar.Root aria-label="Formatting">', ...tools, "      </Toolbar.Root>"];
    const usage = [
      ...imports,
      'import { Bold, Italic, Underline, Undo2 } from "lucide-react";',
      'import type { ReactElement } from "react";',
      "",
      "interface ToolProps {",
      "  label: string;",
      "  shortcut: string;",
      "  icon: ReactElement;",
      "  toggle?: boolean;",
      "}",
      "",
      "function Tool({ label, shortcut, icon, toggle }: ToolProps) {",
      "  return (",
      "    <Tooltip.Root>",
      "      <Tooltip.Trigger",
      ...(grouped || !delay ? [] : [`       ${delay}`]),
      "        render={",
      "          <Toolbar.Button",
      "            render={toggle ? <Toggle /> : undefined}",
      "            aria-label={label}",
      "            startIcon={icon}",
      "          />",
      "        }",
      "      />",
      "      <Tooltip.Portal>",
      `        <Tooltip.Positioner${side}>`,
      `          <Tooltip.Popup${custom ? ' className="tip"' : ""}>`,
      ...(cfg.arrow === "on" ? ["            <Tooltip.Arrow />"] : []),
      "            {label}",
      "            <kbd>{shortcut}</kbd>",
      "          </Tooltip.Popup>",
      "        </Tooltip.Positioner>",
      "      </Tooltip.Portal>",
      "    </Tooltip.Root>",
      "  );",
      "}",
      "",
      "export function FormattingBar() {",
      "  return (",
      ...(grouped
        ? [
            `    <Tooltip.Provider${delay}>`,
            ...bar.map((line) => `  ${line}`),
            "    </Tooltip.Provider>",
          ]
        : bar.map((line) => line.slice(2))),
      "  );",
      "}",
    ];
    const files = [{ name: "formatting-bar.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}-tooltip`;
      files.push({
        name: "tip.css",
        code: [
          "/* The popup itself: tooltips render in a portal, outside the trigger's subtree. */",
          ".tip {",
          ...(cfg.bg ? [`  ${token}-bg: ${cfg.bg};`] : []),
          ...(cfg.fg ? [`  ${token}-fg: ${cfg.fg};`] : []),
          "}",
        ].join("\n"),
      });
    }
    return files;
  },

  scenes: {
    group: { cfg: { group: "on" }, play: group },
    placement: { demo: (cfg, lang) => <Placement cfg={cfg} lang={lang} /> },
    anatomy: { inspect: true, demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} openFirst /> },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function TooltipLab(props: LabProps) {
  return <LabShell lab={tooltipLab} {...props} />;
}
