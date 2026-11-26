"use client";

import { Switch, type SwitchSize } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    email: "Notifikasi email",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    dark: "Mode gelap",
    off: "Mati",
    on: "Menyala",
    disabled: "Nonaktif",
    readOnly: "Hanya baca",
    state: (on: boolean) => `Mode gelap ${on ? "menyala" : "mati"}`,
  },
  en: {
    email: "Email alerts",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    dark: "Dark mode",
    off: "Off",
    on: "On",
    disabled: "Disabled",
    readOnly: "Read-only",
    state: (on: boolean) => `Dark mode is ${on ? "on" : "off"}`,
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly SwitchSize[] = ["sm", "md", "lg"];

/** A row of labelled switches, one per line. */
function Stack({ children }: { children: ReactNode }) {
  return <div className="demo-col">{children}</div>;
}

function Row({ text, children }: { text: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Switch.Root renders the input
    <label className="demo-switch-row">
      {text}
      {children}
    </label>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Stack>
      <Row text={TEXT[lang].email}>
        <Switch.Root defaultChecked />
      </Row>
    </Stack>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <Stack>
      {SIZES.map((size) => (
        <Row key={size} text={TEXT[lang][size]}>
          <Switch.Root size={size} defaultChecked />
        </Row>
      ))}
    </Stack>
  );
}

function IconThumb({ lang }: { lang: Lang }) {
  const [on, setOn] = useState(true);
  return (
    <Stack>
      <Row text={TEXT[lang].dark}>
        <Switch.Root checked={on} onCheckedChange={setOn}>
          <Switch.Thumb>
            <Icon name={on ? "moon" : "sun"} />
          </Switch.Thumb>
        </Switch.Root>
      </Row>
    </Stack>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Stack>
      <Row text={t.disabled}>
        <Switch.Root disabled />
      </Row>
      <Row text={`${t.disabled}, ${t.on.toLowerCase()}`}>
        <Switch.Root disabled defaultChecked />
      </Row>
      <Row text={t.readOnly}>
        <Switch.Root readOnly defaultChecked />
      </Row>
    </Stack>
  );
}

function Controlled({ lang }: { lang: Lang }) {
  const [on, setOn] = useState(false);
  return (
    <Stack>
      <Row text={TEXT[lang].dark}>
        <Switch.Root checked={on} onCheckedChange={setOn} />
      </Row>
      <p className="demo-muted">{TEXT[lang].state(on)}</p>
    </Stack>
  );
}

const label = (text: string, ...inner: string[]) => [
  "<label>",
  `  ${text}`,
  ...inner.map((line) => `  ${line}`),
  "</label>",
];

export const switchDefinition = defineComponent({
  item: "switch",
  imports: ["Switch"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Switch di dalam label: labelnya memberi nama dan ikut menjadi target tekan.",
        en: "A switch inside a label: the label names it and is a press target too.",
      },
      uses: ["Switch"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "EmailAlerts",
          [`import { Switch } from "${importPath(setup, "switch")}";`],
          label(TEXT[lang].email, "<Switch.Root defaultChecked />"),
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg mengikuti ukuran font Button.",
        en: "sm, md, and lg follow Button's font sizes.",
      },
      uses: ["Switch"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [`import { Switch } from "${importPath(setup, "switch")}";`],
          SIZES.flatMap((size) =>
            label(TEXT[lang][size], `<Switch.Root size="${size}" defaultChecked />`),
          ),
        ),
      ],
    },
    {
      id: "icon",
      title: { id: "Ikon", en: "Icon" },
      description: {
        id: "Switch.Thumb sendiri bisa memuat ikon yang mengikuti state.",
        en: "Your own Switch.Thumb can hold an icon that follows the state.",
      },
      uses: ["Switch", "Switch.Thumb"],
      demo: (lang) => <IconThumb lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "DarkMode",
          [
            'import { useState } from "react";',
            `import { Switch } from "${importPath(setup, "switch")}";`,
            'import { Moon, Sun } from "lucide-react";',
          ],
          label(
            TEXT[lang].dark,
            "<Switch.Root checked={on} onCheckedChange={setOn}>",
            "  <Switch.Thumb>{on ? <Moon /> : <Sun />}</Switch.Thumb>",
            "</Switch.Root>",
          ),
          ["  const [on, setOn] = useState(true);"],
        ),
      ],
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled dan readOnly sama-sama mengabaikan tekanan; readOnly tampil seperti biasa.",
        en: "disabled and readOnly both ignore presses; readOnly keeps the normal look.",
      },
      uses: ["Switch"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Locked",
            [`import { Switch } from "${importPath(setup, "switch")}";`],
            [
              ...label(t.disabled, "<Switch.Root disabled />"),
              ...label(
                `${t.disabled}, ${t.on.toLowerCase()}`,
                "<Switch.Root disabled defaultChecked />",
              ),
              ...label(t.readOnly, "<Switch.Root readOnly defaultChecked />"),
            ],
          ),
        ];
      },
    },
    {
      id: "controlled",
      title: { id: "Terkontrol", en: "Controlled" },
      description: {
        id: "checked dan onCheckedChange menyimpan state di komponen Anda.",
        en: "checked and onCheckedChange keep the state in your component.",
      },
      uses: ["Switch"],
      demo: (lang) => <Controlled lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Controlled",
          [
            'import { useState } from "react";',
            `import { Switch } from "${importPath(setup, "switch")}";`,
          ],
          [
            ...label(TEXT[lang].dark, "<Switch.Root checked={on} onCheckedChange={setOn} />"),
            `<p>{on ? "${TEXT[lang].state(true)}" : "${TEXT[lang].state(false)}"}</p>`,
          ],
          ["  const [on, setOn] = useState(false);"],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Switch.Root defaultChecked aria-label={TEXT[lang].dark}>
        <Switch.Thumb>
          <Icon name="moon" />
        </Switch.Thumb>
      </Switch.Root>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-switch",
      note: {
        id: "Track dengan role switch dan aria-checked: tint 10% dari warna teks saat mati (13% hover), warna aksen saat menyala. Input tersembunyi di sebelahnya yang masuk ke form.",
        en: "The track, with the switch role and aria-checked: a 10% tint of the text color while off (13% on hover), the accent while on. A hidden input beside it goes to the form.",
      },
      tokens: {
        "--ow-accent": "--_accent",
        "--ow-primary-shadow": "--_accent-shadow",
        "--ow-focus": "--_focus",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Thumb",
      selector: ".ow-switch__thumb",
      size: true,
      note: {
        id: "Tombol putih dengan bayangan kecil. Saat bergerak ia memanjang dari sisi depannya, dan saat ditahan melebar ke arah tengah track. Tergambar sendiri bila Root tanpa children, dan bisa memuat ikon.",
        en: "The white key with a small shadow. It stretches from its leading edge while travelling, and widens toward the middle of the track while held. Root draws it without children, and it can hold an icon.",
      },
      tokens: {
        "--ow-on-accent": "--_key",
        "--ow-surface-shadow": "--_key-shadow",
        "--ow-fg": "--_ink",
      },
    },
  ],
});

export default function SwitchPage(props: ExamplePageProps) {
  return <ComponentPage definition={switchDefinition} {...props} />;
}
