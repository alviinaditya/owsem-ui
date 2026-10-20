"use client";

import { CommandMenu, type CommandMenuSize } from "owsem-ui/owsem";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript, type ScriptStage } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

interface Command {
  value: string;
  label: string;
  description?: string;
  icon: IconName;
  shortcut?: string;
  disabled?: boolean;
}

interface Group {
  value: string;
  items: Command[];
}

const TEXT = {
  id: {
    app: "Acme",
    trigger: "Cari…",
    dialog: "Perintah",
    input: "Cari perintah",
    placeholder: "Cari halaman atau aksi…",
    empty: "Tidak ada hasil",
    close: "Tutup",
    move: "Pindah",
    run: "Jalankan",
    dismiss: "Tutup",
    // Typed by the filter scene: it leaves one item in each group.
    query: "ga",
    // The states matrix's filtered cell.
    cellQuery: "tema",
    stats: [
      ["Pendapatan", "Rp 84 jt"],
      ["Pengguna", "2.418"],
      ["Uptime", "99,98%"],
    ],
    groups: [
      {
        value: "Halaman",
        items: [
          {
            value: "dashboard",
            label: "Dasbor",
            description: "Ringkasan minggu ini",
            icon: "layout-dashboard",
          },
          { value: "projects", label: "Proyek", description: "12 aktif", icon: "layers" },
          {
            value: "settings",
            label: "Pengaturan",
            description: "Profil, tim, tagihan",
            icon: "sliders-horizontal",
          },
        ],
      },
      {
        value: "Aksi",
        items: [
          { value: "new", label: "Dokumen baru", icon: "file-text", shortcut: "⌘N" },
          { value: "invite", label: "Undang anggota", icon: "user-plus", shortcut: "⌘I" },
          { value: "theme", label: "Ganti tema", icon: "contrast", shortcut: "⇧⌘L" },
          { value: "restore", label: "Pulihkan versi", icon: "rotate-ccw", disabled: true },
        ],
      },
    ],
    states: { results: "Hasil", filtered: "Tersaring", empty: "Kosong" },
    themes: { light: "Terang", dark: "Gelap" },
  },
  en: {
    app: "Acme",
    trigger: "Search…",
    dialog: "Commands",
    input: "Search commands",
    placeholder: "Search pages and actions…",
    empty: "No results",
    close: "Close",
    move: "Move",
    run: "Run",
    dismiss: "Close",
    query: "in",
    cellQuery: "theme",
    stats: [
      ["Revenue", "$5.2k"],
      ["Users", "2,418"],
      ["Uptime", "99.98%"],
    ],
    groups: [
      {
        value: "Pages",
        items: [
          {
            value: "dashboard",
            label: "Dashboard",
            description: "This week at a glance",
            icon: "layout-dashboard",
          },
          { value: "projects", label: "Projects", description: "12 active", icon: "layers" },
          {
            value: "settings",
            label: "Settings",
            description: "Profile, team, billing",
            icon: "sliders-horizontal",
          },
        ],
      },
      {
        value: "Actions",
        items: [
          { value: "new", label: "New document", icon: "file-text", shortcut: "⌘N" },
          { value: "invite", label: "Invite teammates", icon: "user-plus", shortcut: "⌘I" },
          { value: "theme", label: "Switch theme", icon: "contrast", shortcut: "⇧⌘L" },
          { value: "restore", label: "Restore version", icon: "rotate-ccw", disabled: true },
        ],
      },
    ],
    states: { results: "Results", filtered: "Filtered", empty: "Empty" },
    themes: { light: "Light", dark: "Dark" },
  },
} satisfies Record<Lang, { groups: Group[] } & Record<string, unknown>>;

type Text = (typeof TEXT)[Lang];

// The bars of the app's chart, behind the glass (each height once: it is the key).
const BARS = [38, 52, 44, 70, 58, 84, 66, 92, 74, 60, 80, 96];

const solidStyle = {
  "--ow-command-menu-bg": "var(--ow-panel)",
  "--ow-command-menu-blur": "0px",
} as CSSProperties;

/** The menu's panel and list, shared by the demo and the states matrix. */
function Palette({
  t,
  size,
  solid,
  container,
  focus,
  footer = true,
}: {
  t: Text;
  size: CommandMenuSize;
  solid: boolean;
  /** The window it opens in; it renders once the window is in the page. */
  container: HTMLDivElement | null;
  /** Whether opening and closing move focus: only when the visitor opened it, not a script. */
  focus: () => boolean;
  footer?: boolean;
}) {
  if (!container) return null;
  return (
    <CommandMenu.Popup
      aria-label={t.dialog}
      closeLabel={t.close}
      size={size}
      container={container}
      style={solid ? solidStyle : undefined}
      initialFocus={focus}
      finalFocus={focus}
    >
      <CommandMenu.Input aria-label={t.input} placeholder={t.placeholder} />
      <CommandMenu.Empty>{t.empty}</CommandMenu.Empty>
      <CommandMenu.List>
        {(group: Group) => (
          <CommandMenu.Group key={group.value} items={group.items}>
            <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>
            <CommandMenu.Collection>
              {(item: Command) => (
                <CommandMenu.Item
                  key={item.value}
                  value={item}
                  disabled={item.disabled}
                  data-command={item.value}
                >
                  <CommandMenu.ItemIcon>
                    <Icon name={item.icon} />
                  </CommandMenu.ItemIcon>
                  <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>
                  {item.description ? (
                    <CommandMenu.ItemDescription>{item.description}</CommandMenu.ItemDescription>
                  ) : null}
                  {item.shortcut ? (
                    <CommandMenu.Shortcut>{item.shortcut}</CommandMenu.Shortcut>
                  ) : null}
                </CommandMenu.Item>
              )}
            </CommandMenu.Collection>
          </CommandMenu.Group>
        )}
      </CommandMenu.List>
      {footer ? (
        <CommandMenu.Footer aria-hidden="true">
          <span>
            <CommandMenu.Shortcut>↑</CommandMenu.Shortcut>
            <CommandMenu.Shortcut>↓</CommandMenu.Shortcut>
            {t.move}
          </span>
          <span>
            <CommandMenu.Shortcut>↵</CommandMenu.Shortcut>
            {t.run}
          </span>
          <span>
            <CommandMenu.Shortcut>Esc</CommandMenu.Shortcut>
            {t.dismiss}
          </span>
        </CommandMenu.Footer>
      ) : null}
    </CommandMenu.Popup>
  );
}

/**
 * An app window; the menu opens inside it, not over the docs. ⌘K opens it while focus is on the
 * stage (elsewhere it opens the docs search). Scripts open and close it without taking focus.
 */
function Demo({ lang, size, solid }: { lang: Lang; size: CommandMenuSize; solid: boolean }) {
  const t = TEXT[lang];
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  const visitor = useRef(false);

  useEffect(() => {
    const stage = frame?.closest<HTMLElement>(".lab-stage");
    if (!stage) return;
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      visitor.current = event.isTrusted;
      setOpen((current) => !current);
    };
    stage.addEventListener("keydown", onKey);
    return () => stage.removeEventListener("keydown", onKey);
  }, [frame]);

  return (
    <div ref={setFrame} className="demo-command" data-query={t.query}>
      <CommandMenu.Root
        items={t.groups}
        open={open}
        shortcut={false}
        modal={false}
        onOpenChange={(next, details) => {
          const target = details.event.target;
          const within = (el: Element | null | undefined) =>
            target instanceof Node && Boolean(el?.contains(target));
          // The stage has other tools: presses outside the window, and keys outside the stage,
          // leave the menu open.
          const ignored =
            details.reason === "focus-out" ||
            (details.reason === "outside-press" && !within(frame)) ||
            (details.reason === "escape-key" && !within(frame?.closest(".lab-stage")));
          if (!next && ignored) return;
          if (next) visitor.current = details.event.isTrusted;
          setOpen(next);
        }}
      >
        <div className="demo-command-bar">
          <span className="demo-command-brand">
            <span className="demo-command-logo" />
            {t.app}
          </span>
          <CommandMenu.Trigger size="sm" className="demo-command-trigger">
            {t.trigger}
            <CommandMenu.Shortcut aria-hidden="true">⌘K</CommandMenu.Shortcut>
          </CommandMenu.Trigger>
        </div>
        <div className="demo-command-body">
          {t.stats.map(([label, value]) => (
            <div key={label} className="demo-command-card">
              <p className="demo-muted">{label}</p>
              <p className="demo-command-value">{value}</p>
            </div>
          ))}
          <div className="demo-command-card demo-command-chart" aria-hidden="true">
            {BARS.map((height) => (
              <span
                key={height}
                className="demo-command-column"
                style={{ blockSize: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <Palette t={t} size={size} solid={solid} container={frame} focus={() => visitor.current} />
      </CommandMenu.Root>
      {/* The keys a scene script presses, as keycaps. */}
      <div className="demo-keys" aria-hidden="true" />
    </div>
  );
}

type State = "results" | "filtered" | "empty";
type Theme = "light" | "dark";
const STATES: readonly State[] = ["results", "filtered", "empty"];
const THEMES: readonly Theme[] = ["light", "dark"];

/** One cell of the states matrix: a shorter list, open for good, in one theme. */
function Cell({ lang, state, theme }: { lang: Lang; state: State; theme: Theme }) {
  const t = TEXT[lang];
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  // Two items a group, the disabled one included.
  const groups = t.groups.map((group, i) => ({
    ...group,
    items: i === 0 ? group.items.slice(0, 2) : group.items.slice(2),
  }));
  const query = { results: "", filtered: t.cellQuery, empty: "zz" }[state];
  return (
    <div ref={setFrame} className="demo-command" data-cell={`${theme}-${state}`} data-theme={theme}>
      <CommandMenu.Root items={groups} defaultValue={query} open shortcut={false} modal={false}>
        <Palette
          t={t}
          size="sm"
          solid={false}
          container={frame}
          focus={() => false}
          footer={false}
        />
      </CommandMenu.Root>
    </div>
  );
}

function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t.themes[theme])}
      rows={STATES.map((state) => ({
        label: t.states[state],
        cells: THEMES.map((theme) => <Cell key={theme} lang={lang} state={state} theme={theme} />),
      }))}
    />
  );
}

// Scripts press keys by sending them to the menu, and show each press as keycaps.
const input = (stage: ScriptStage) => stage.get(".ow-command-menu-input") as HTMLInputElement;

async function press(stage: ScriptStage, caps: string[], init: KeyboardEventInit, to: Element) {
  const keys = stage.get(".demo-keys");
  keys.replaceChildren(
    ...caps.map((cap) => {
      const kbd = document.createElement("kbd");
      kbd.textContent = cap;
      return kbd;
    }),
  );
  keys.dataset.on = "";
  to.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
  to.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, ...init }));
  try {
    await stage.wait(550);
  } finally {
    delete keys.dataset.on;
  }
}

/** Types into the menu's input the way a keyboard would, one character at a time. */
function setQuery(field: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

// Escape shuts the menu at once, ⌘K opens it at once, and so does the trigger; it ends open.
const shortcut: SceneScript = async (stage) => {
  const keyboard = stage.get(".demo-command").closest(".lab-stage") ?? stage.get(".demo-command");
  await press(stage, ["Esc"], { key: "Escape" }, input(stage));
  await stage.wait(700);
  await press(stage, ["⌘", "K"], { key: "k", metaKey: true }, keyboard);
  await stage.wait(1400);
  await press(stage, ["Esc"], { key: "Escape" }, input(stage));
  await stage.wait(500);
  await stage.click(stage.get(".ow-command-menu-trigger"));
  await stage.wait(1000);
};

// Types a query, walks the matches with the arrows, then clears it.
const filter: SceneScript = async (stage) => {
  const query = stage.get(".demo-command").dataset.query ?? "";
  for (const char of query) {
    setQuery(input(stage), input(stage).value + char);
    await stage.wait(320);
  }
  await stage.wait(600);
  await press(stage, ["↓"], { key: "ArrowDown" }, input(stage));
  await stage.wait(500);
  await press(stage, ["↑"], { key: "ArrowUp" }, input(stage));
  await stage.wait(500);
  for (let i = query.length; i > 0; i--) {
    setQuery(input(stage), query.slice(0, i - 1));
    await stage.wait(260);
  }
  await stage.wait(600);
};

/** Points at an item; Base UI lights the item under a moving mouse. */
async function hover(stage: ScriptStage, value: string) {
  const item = stage.get(`[data-command="${value}"]`);
  await stage.point(item);
  item.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
}

// The pointer tours both groups, the keyboard steps across them, and it ends at the first item.
const groups: SceneScript = async (stage) => {
  for (const value of ["projects", "settings", "new", "theme"]) {
    await hover(stage, value);
    await stage.wait(650);
  }
  await press(stage, ["↑"], { key: "ArrowUp" }, input(stage));
  await stage.wait(400);
  await press(stage, ["↑"], { key: "ArrowUp" }, input(stage));
  await stage.wait(400);
  await hover(stage, "dashboard");
  await stage.wait(500);
};

const initial = { size: "md", surface: "glass" };

const commandMenuLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: [
        { value: "sm", label: { id: "sm", en: "sm" } },
        { value: "md", label: { id: "md", en: "md" } },
        { value: "lg", label: { id: "lg", en: "lg" } },
      ],
    },
    {
      key: "surface",
      type: "choice",
      label: { id: "Permukaan", en: "Surface" },
      options: [
        { value: "glass", label: { id: "Kaca", en: "Glass" } },
        { value: "solid", label: { id: "Padat", en: "Solid" } },
      ],
    },
  ],

  parts: [
    {
      name: "Trigger",
      selector: ".ow-command-menu-trigger",
      note: {
        id: "Tombol berupa kolom cari yang cekung. Shortcut Root diumumkan lewat aria-keyshortcuts.",
        en: "A button shaped like a sunken search field. Root's shortcut is announced with aria-keyshortcuts.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-command-menu-popup",
      note: {
        id: "Panel kaca: Dialog Base UI di atas backdrop, berisi Autocomplete yang menyaring daftar.",
        en: "The glass panel: a Base UI Dialog over a backdrop, holding the Autocomplete that filters the list.",
      },
      tokens: {
        "--ow-command-menu-bg": "--_bg",
        "--ow-command-menu-blur": "--_blur",
        "--ow-command-menu-edge": "--_edge",
        "--ow-command-menu-grain": "--_grain",
        "--ow-command-menu-width": "--_width",
        "--ow-command-menu-shadow": "--_shadow",
      },
    },
    {
      name: "Input",
      selector: ".ow-command-menu-field",
      note: {
        id: "Kolom cari, combobox dengan aria-activedescendant. Fokus tetap di sini saat panah berpindah.",
        en: "The search field, a combobox with aria-activedescendant. Focus stays here while the arrows move.",
      },
    },
    {
      name: "List",
      selector: ".ow-command-menu-list",
      note: {
        id: "Listbox yang bergulir. Satu highlight Glide meluncur ke item yang disorot Base UI.",
        en: "A listbox that scrolls. One Glide highlight slides to the item Base UI highlights.",
      },
    },
    {
      name: "Group",
      selector: ".ow-command-menu-group",
      note: {
        id: "Sekelompok item. Grup tanpa hasil ikut hilang saat menyaring.",
        en: "A group of items. A group with no matches goes while filtering.",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-command-menu-group-label",
      note: {
        id: "Nama grup, sejajar dengan ikon item, dan label grup untuk screen reader.",
        en: "The group's name, in line with the items' icons, and its label for screen readers.",
      },
    },
    {
      name: "Item",
      selector: ".ow-command-menu-item",
      note: {
        id: "Satu perintah. onClick berjalan saat diklik atau Enter, lalu menu tertutup.",
        en: "One command. onClick runs on a click or Enter, then the menu closes.",
      },
    },
    {
      name: "ItemIcon",
      selector: ".ow-command-menu-item-icon",
      note: {
        id: "Ikon dekoratif, seukuran font ditambah 2px, sejauh tepi atas dari tepi samping.",
        en: "A decorative icon, the font size plus 2px, as far from the side as from the top.",
      },
    },
    {
      name: "ItemDescription",
      selector: ".ow-command-menu-item-description",
      note: {
        id: "Teks redup di baris yang sama; mengalah lebih dulu saat ruang habis.",
        en: "Muted text on the same row; it gives way first when space runs out.",
      },
    },
    {
      name: "Shortcut",
      selector: ".ow-command-menu-item .ow-command-menu-shortcut",
      note: {
        id: "Tombol sebagai keycap timbul, di ujung item, di Trigger, atau di Footer.",
        en: "Keys as raised keycaps, at an item's end, in the Trigger, or in the Footer.",
      },
    },
    {
      name: "Footer",
      selector: ".ow-command-menu-footer",
      note: {
        id: "Baris di bawah daftar, setelah garis terukir, untuk petunjuk tombol.",
        en: "A row under the list, past an etched line, for key hints.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo lang={lang} size={cfg.size as CommandMenuSize} solid={cfg.surface === "solid"} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/command-menu";
    const solid = cfg.surface === "solid";
    const popup = [
      'aria-label="Commands"',
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(solid ? ['className="commands"'] : []),
    ].join(" ");
    const usage = [
      `import { CommandMenu } from "${from}";`,
      "",
      "const groups = [",
      '  { value: "Pages", items: [{ value: "dashboard", label: "Dashboard", run: openDashboard }] },',
      '  { value: "Actions", items: [{ value: "new", label: "New document", keys: "⌘N", run: create }] },',
      "];",
      "",
      "// ⌘K or Ctrl K opens it from anywhere; shortcut={false} turns that off.",
      "export function Commands() {",
      "  return (",
      "    <CommandMenu.Root items={groups}>",
      `      <CommandMenu.Trigger${cfg.size === "md" ? "" : ` size="${cfg.size}"`}>`,
      "        Search…",
      "        <CommandMenu.Shortcut aria-hidden>⌘K</CommandMenu.Shortcut>",
      "      </CommandMenu.Trigger>",
      `      <CommandMenu.Popup ${popup}>`,
      '        <CommandMenu.Input aria-label="Search commands" placeholder="Search…" />',
      "        <CommandMenu.Empty>No results</CommandMenu.Empty>",
      "        <CommandMenu.List>",
      "          {(group) => (",
      "            <CommandMenu.Group key={group.value} items={group.items}>",
      "              <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>",
      "              <CommandMenu.Collection>",
      "                {(item) => (",
      "                  <CommandMenu.Item key={item.value} value={item} onClick={item.run}>",
      "                    <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>",
      "                    {item.keys && <CommandMenu.Shortcut>{item.keys}</CommandMenu.Shortcut>}",
      "                  </CommandMenu.Item>",
      "                )}",
      "              </CommandMenu.Collection>",
      "            </CommandMenu.Group>",
      "          )}",
      "        </CommandMenu.List>",
      "      </CommandMenu.Popup>",
      "    </CommandMenu.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "commands.tsx", code: usage.join("\n") }];
    if (solid) {
      const token = `--${setup.prefix}-command-menu`;
      // The popup renders in the body, so its tokens go on the popup itself.
      const lines = [
        "/* An opaque panel instead of glass. */",
        setup.mode === "isolated" ? ".commands.ow-command-menu-popup {" : ".commands {",
        `  ${token}-bg: var(--${setup.prefix}-panel);`,
        `  ${token}-blur: 0px;`,
        "}",
      ];
      files.push({ name: "commands.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    shortcut: { play: shortcut },
    filter: { play: filter },
    groups: { play: groups },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function CommandMenuLab(props: LabProps) {
  return <LabShell lab={commandMenuLab} {...props} />;
}
