"use client";

import { CommandMenu, type CommandMenuPopupProps, type CommandMenuSize } from "owsem-ui/owsem";
import { type CSSProperties, useRef, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon, type IconName } from "@/components/icons/icon";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

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
  },
} satisfies Record<Lang, { groups: Group[] } & Record<string, unknown>>;

type Text = (typeof TEXT)[Lang];
type Backdrop = NonNullable<CommandMenuPopupProps["backdrop"]>;

// The bars of the app's chart, behind the glass (each height once: it is the key).
const BARS = [38, 52, 44, 70, 58, 84, 66, 92, 74, 60, 80, 96];

// An opaque panel: no token covers it, so the Popup is styled itself.
const solidStyle: CSSProperties = {
  backgroundColor: "var(--ow-raised-bg)",
  backdropFilter: "none",
};

/** The panel and its list, shared by the demo window and the specimen. */
function Palette({
  t,
  size = "md",
  solid = false,
  backdrop = "dim",
  container,
  focus = () => false,
  inert = false,
}: {
  t: Text;
  size?: CommandMenuSize | undefined;
  solid?: boolean | undefined;
  backdrop?: Backdrop | undefined;
  /** Where it renders; it waits until that box is in the page. */
  container: HTMLElement | null;
  /** Whether opening and closing move focus: only when the visitor opened it. */
  focus?: () => boolean;
  inert?: boolean;
}) {
  if (!container) return null;
  return (
    <CommandMenu.Popup
      aria-label={t.dialog}
      closeLabel={t.close}
      size={size}
      backdrop={backdrop}
      container={container}
      style={solid ? solidStyle : undefined}
      initialFocus={focus}
      finalFocus={focus}
      inert={inert || undefined}
    >
      <CommandMenu.Input aria-label={t.input} placeholder={t.placeholder} />
      <CommandMenu.Empty>{t.empty}</CommandMenu.Empty>
      <CommandMenu.List>
        {(group: Group) => (
          <CommandMenu.Group key={group.value} items={group.items}>
            <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>
            <CommandMenu.Collection>
              {(item: Command) => (
                <CommandMenu.Item key={item.value} value={item} disabled={item.disabled}>
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
    </CommandMenu.Popup>
  );
}

/**
 * An app window; the menu opens inside it, not over the docs. It starts open and takes no focus
 * until the visitor opens it. The docs search owns ⌘K here, so the demo's own shortcut is off.
 */
function Demo({
  lang,
  size,
  solid,
  backdrop,
  query = "",
}: {
  lang: Lang;
  size?: CommandMenuSize | undefined;
  solid?: boolean | undefined;
  backdrop?: Backdrop | undefined;
  query?: string;
}) {
  const t = TEXT[lang];
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const visitor = useRef(false);
  return (
    <div ref={setFrame} className="demo-command">
      <CommandMenu.Root
        items={t.groups}
        defaultOpen
        defaultValue={query}
        shortcut={false}
        modal={false}
        onOpenChange={(next, details) => {
          // The docs around the window have their own tools: moving focus or pressing outside the
          // window leaves its menu open.
          const target = details.event.target;
          const outside =
            details.reason === "outside-press" &&
            !(target instanceof Node && frame?.contains(target));
          if (!next && (details.reason === "focus-out" || outside)) details.cancel();
          else if (next) visitor.current = details.event.isTrusted;
        }}
      >
        <div className="demo-command-bar">
          <span className="demo-command-brand">
            <span className="demo-command-logo" />
            {t.app}
          </span>
          <CommandMenu.Trigger size={size === "lg" ? "md" : "sm"} className="demo-command-trigger">
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
        <Palette
          t={t}
          size={size}
          solid={solid}
          backdrop={backdrop}
          container={frame}
          focus={() => visitor.current}
        />
      </CommandMenu.Root>
    </div>
  );
}

/** One complete instance: the Trigger, and the open panel in a box of its own, inert. */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  // Two items a group and the small size keep the open panel short.
  const groups = t.groups.map((group) => ({ ...group, items: group.items.slice(0, 2) }));
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setBox} className="demo-command-specimen">
      <CommandMenu.Root items={groups} open shortcut={false} modal={false}>
        <CommandMenu.Trigger size="sm">
          {t.trigger}
          <CommandMenu.Shortcut aria-hidden="true">⌘K</CommandMenu.Shortcut>
        </CommandMenu.Trigger>
        <Palette t={t} size="sm" container={box} inert />
      </CommandMenu.Root>
    </div>
  );
}

const imp = (setup: TokenSetup) => [
  `import { CommandMenu } from "${
    isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/command-menu"
  }";`,
];

/** The menu as written in an app: groups of commands that run something, in one component. */
const file = (
  setup: TokenSetup,
  lang: Lang,
  {
    rootProps = [],
    popupProps = [],
    triggerProps = "",
  }: { rootProps?: string[]; popupProps?: string[]; triggerProps?: string } = {},
) => {
  const t = TEXT[lang];
  const [pages, actions] = t.groups;
  const row = (c: Command, run: string) =>
    `{ value: "${c.value}", label: "${c.label}"${c.shortcut ? `, keys: "${c.shortcut}"` : ""}, run: ${run} }`;
  const popup = [`aria-label="${t.dialog}"`, ...popupProps].join(" ");
  return exampleFile(
    "Commands",
    imp(setup),
    [
      `<CommandMenu.Root items={groups}${rootProps.map((p) => ` ${p}`).join("")}>`,
      `  <CommandMenu.Trigger${triggerProps}>`,
      `    ${t.trigger}`,
      "    <CommandMenu.Shortcut aria-hidden>⌘K</CommandMenu.Shortcut>",
      "  </CommandMenu.Trigger>",
      `  <CommandMenu.Popup ${popup}>`,
      `    <CommandMenu.Input aria-label="${t.input}" placeholder="${t.placeholder}" />`,
      `    <CommandMenu.Empty>${t.empty}</CommandMenu.Empty>`,
      "    <CommandMenu.List>",
      "      {(group) => (",
      "        <CommandMenu.Group key={group.value} items={group.items}>",
      "          <CommandMenu.GroupLabel>{group.value}</CommandMenu.GroupLabel>",
      "          <CommandMenu.Collection>",
      "            {(item) => (",
      "              <CommandMenu.Item key={item.value} value={item} onClick={item.run}>",
      "                <CommandMenu.ItemLabel>{item.label}</CommandMenu.ItemLabel>",
      "                {item.keys && <CommandMenu.Shortcut>{item.keys}</CommandMenu.Shortcut>}",
      "              </CommandMenu.Item>",
      "            )}",
      "          </CommandMenu.Collection>",
      "        </CommandMenu.Group>",
      "      )}",
      "    </CommandMenu.List>",
      "  </CommandMenu.Popup>",
      "</CommandMenu.Root>",
    ],
    [
      "  // ⌘K or Ctrl K opens it from anywhere; shortcut={false} turns that off.",
      "  const groups = [",
      `    { value: "${pages?.value}", items: [${pages?.items
        .slice(0, 2)
        .map((c) => row(c, `() => go("${c.value}")`))
        .join(", ")}] },`,
      `    { value: "${actions?.value}", items: [${actions?.items
        .slice(0, 2)
        .map((c) => row(c, c.value))
        .join(", ")}] },`,
      "  ];",
    ],
  );
};

export const commandMenuDefinition = defineComponent({
  item: "command-menu",
  imports: ["CommandMenu"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Tombol cari membuka panel: kolom cari, grup, item dengan ikon, deskripsi, dan tuts, serta footer.",
        en: "A search button opens the panel: a search field, groups, items with icons, descriptions and keycaps, and a footer.",
      },
      uses: ["CommandMenu"],
      demo: (lang) => <Demo lang={lang} />,
      code: (setup, lang) => [file(setup, lang)],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: 'size="lg" di Popup dan Trigger: teks 16px dan baris yang lebih tinggi.',
        en: 'size="lg" on the Popup and the Trigger: 16px text and taller rows.',
      },
      uses: ["CommandMenu"],
      demo: (lang) => <Demo lang={lang} size="lg" />,
      code: (setup, lang) => [
        file(setup, lang, { popupProps: ['size="lg"'], triggerProps: ' size="lg"' }),
      ],
    },
    {
      id: "blur",
      title: { id: "Latar blur", en: "Blur backdrop" },
      description: {
        id: 'backdrop="blur" juga memburamkan halaman di bawah scrim.',
        en: 'backdrop="blur" also blurs the page under the scrim.',
      },
      uses: ["CommandMenu"],
      demo: (lang) => <Demo lang={lang} backdrop="blur" />,
      code: (setup, lang) => [file(setup, lang, { popupProps: ['backdrop="blur"'] })],
    },
    {
      id: "solid",
      title: { id: "Padat", en: "Solid" },
      description: {
        id: "Panel tidak tembus pandang: Popup diberi warna raised sendiri, tanpa blur.",
        en: "An opaque panel: the Popup takes the raised color itself, with no blur.",
      },
      uses: ["CommandMenu"],
      demo: (lang) => <Demo lang={lang} solid />,
      code: (setup, lang) => [
        file(setup, lang, { popupProps: ['className="commands"'] }),
        {
          name: "commands.css",
          code: [
            ".commands {",
            `  background-color: var(--${setup.prefix}-raised-bg);`,
            "  backdrop-filter: none;",
            "}",
          ].join("\n"),
        },
      ],
    },
    {
      id: "empty",
      title: { id: "Kosong", en: "Empty" },
      description: {
        id: "Saat tidak ada yang cocok, Empty tampil dan diumumkan, dan daftar disembunyikan.",
        en: "When nothing matches, Empty shows and is announced, and the list hides.",
      },
      uses: ["CommandMenu"],
      demo: (lang) => <Demo lang={lang} query="zz" />,
      code: (setup, lang) => [file(setup, lang, { rootProps: ['defaultValue="zz"'] })],
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-command-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state dialog, item dan kata kunci daftar, serta shortcut. Inspect menandai kotak yang memuat Trigger dan panelnya.",
        en: "Renders no element: it holds the dialog state, the list's items and query, and the shortcut. Inspect outlines the box that holds the Trigger and its panel.",
      },
    },
    {
      name: "Trigger",
      selector: ".ow-command-menu__trigger",
      note: {
        id: "Tombol berupa kolom cari yang datar: isian 6% dari warna teks tanpa tepi, 9% saat hover. Shortcut Root diumumkan lewat aria-keyshortcuts.",
        en: "A button shaped like a flat search field: a 6% tint of the text color with no edge, 9% on hover. Root's shortcut is announced with aria-keyshortcuts.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-command-menu__popup",
      note: {
        id: "Panel kaca di atas material raised: Dialog Base UI di atas backdrop, berisi Autocomplete yang menyaring daftar.",
        en: "The glass panel on the raised material: a Base UI Dialog over a backdrop, holding the Autocomplete that filters the list.",
      },
      tokens: {
        "--ow-raised-bg": "--_solid",
        "--ow-popup-shadow": "--_shadow",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Input",
      selector: ".ow-command-menu__field",
      note: {
        id: "Kolom cari, combobox dengan aria-activedescendant. Fokus tetap di sini saat panah berpindah.",
        en: "The search field, a combobox with aria-activedescendant. Focus stays here while the arrows move.",
      },
    },
    {
      name: "List",
      selector: ".ow-command-menu__list",
      note: {
        id: "Listbox yang bergulir. Satu highlight Glide meluncur ke item yang disorot Base UI.",
        en: "A listbox that scrolls. One Glide highlight slides to the item Base UI highlights.",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-command-menu__group-label",
      note: {
        id: "Nama grup, sejajar dengan ikon item, dan label grup untuk screen reader.",
        en: "The group's name, in line with the items' icons, and its label for screen readers.",
      },
    },
    {
      name: "Item",
      selector: ".ow-command-menu__item",
      note: {
        id: "Satu perintah. onClick berjalan saat diklik atau Enter, lalu menu tertutup.",
        en: "One command. onClick runs on a click or Enter, then the menu closes.",
      },
    },
    {
      name: "Shortcut",
      selector: ".ow-command-menu__item .ow-command-menu__shortcut",
      note: {
        id: "Tuts Kbd, di ujung item, di Trigger, atau di Footer.",
        en: "A Kbd keycap, at an item's end, in the Trigger, or in the Footer.",
      },
    },
    {
      name: "Footer",
      selector: ".ow-command-menu__footer",
      note: {
        id: "Baris di bawah daftar, setelah satu garis tipis, untuk petunjuk tombol.",
        en: "A row under the list, past a hairline, for key hints.",
      },
    },
  ],
});

export default function CommandMenuPage(props: ExamplePageProps) {
  return <ComponentPage definition={commandMenuDefinition} {...props} />;
}
