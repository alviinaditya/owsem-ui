"use client";

import { Checkbox, CheckboxGroup, type CheckboxSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    updates: "Kabari saya soal rilis baru",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    all: "Semua tugas",
    tests: "Jalankan tes",
    changelog: "Tulis changelog",
    tag: "Beri tag rilis",
    notify: "Kabari saya lewat",
    email: "Email",
    push: "Notifikasi push",
    sms: "SMS",
    disabled: "Nonaktif",
    disabledOn: "Nonaktif, dicentang",
    readOnly: "Hanya baca",
    invalid: "Invalid",
    invalidOn: "Invalid, dicentang",
  },
  en: {
    updates: "Tell me about new releases",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    all: "All tasks",
    tests: "Run the tests",
    changelog: "Write the changelog",
    tag: "Tag the release",
    notify: "Notify me by",
    email: "Email",
    push: "Push notifications",
    sms: "SMS",
    disabled: "Disabled",
    disabledOn: "Disabled, checked",
    readOnly: "Read-only",
    invalid: "Invalid",
    invalidOn: "Invalid, checked",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly CheckboxSize[] = ["sm", "md", "lg"];
const TASKS = ["tests", "changelog", "tag"] as const;
type Task = (typeof TASKS)[number];
const CHANNELS = ["email", "push", "sms"] as const;

function Default({ lang }: { lang: Lang }) {
  return (
    <label className="demo-checkbox-label">
      <Checkbox.Root />
      {TEXT[lang].updates}
    </label>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col">
      {SIZES.map((size) => (
        <label key={size} className="demo-checkbox-label">
          <Checkbox.Root size={size} defaultChecked />
          {TEXT[lang][size]}
        </label>
      ))}
    </div>
  );
}

/** A parent box over its tasks: a minus for some, a check for all. */
function Checklist({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [done, setDone] = useState<Record<Task, boolean>>({
    tests: true,
    changelog: false,
    tag: false,
  });
  const count = TASKS.filter((task) => done[task]).length;
  return (
    <div className="demo-col">
      <label className="demo-checkbox-label">
        <Checkbox.Root
          checked={count === TASKS.length}
          indeterminate={count > 0 && count < TASKS.length}
          onCheckedChange={(on) => setDone({ tests: on, changelog: on, tag: on })}
        />
        {t.all}
      </label>
      <div className="demo-checkbox-tasks">
        {TASKS.map((task) => (
          <label key={task} className="demo-checkbox-label">
            <Checkbox.Root
              checked={done[task]}
              onCheckedChange={(on) => setDone((current) => ({ ...current, [task]: on }))}
            />
            {t[task]}
          </label>
        ))}
      </div>
    </div>
  );
}

function Group({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <CheckboxGroup aria-label={t.notify} defaultValue={["email"]}>
      {CHANNELS.map((channel) => (
        <label key={channel}>
          <Checkbox.Root value={channel} />
          {t[channel]}
        </label>
      ))}
    </CheckboxGroup>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-col">
      <label className="demo-checkbox-label">
        <Checkbox.Root disabled />
        {t.disabled}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root disabled defaultChecked />
        {t.disabledOn}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root readOnly defaultChecked />
        {t.readOnly}
      </label>
    </div>
  );
}

function Invalid({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-col">
      <label className="demo-checkbox-label">
        <Checkbox.Root aria-invalid />
        {t.invalid}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root aria-invalid defaultChecked />
        {t.invalidOn}
      </label>
    </div>
  );
}

const imp = (setup: TokenSetup, ...extra: string[]) => [
  `import { Checkbox } from "${importPath(setup, "checkbox")}";`,
  ...extra,
];

const label = (text: string, box: string) => [
  '<label className="task">',
  `  ${box}`,
  `  ${text}`,
  "</label>",
];

const TASK_CSS = {
  name: "task.css",
  code: [".task {", "  display: flex;", "  align-items: center;", "  gap: 0.5em;", "}"].join("\n"),
};

export const checkboxDefinition = defineComponent({
  item: "checkbox",
  imports: ["Checkbox"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Checkbox di dalam label: labelnya memberi nama dan ikut menjadi target tekan.",
        en: "A checkbox inside a label: the label names it and is a press target too.",
      },
      uses: ["Checkbox"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("Updates", imp(setup), label(TEXT[lang].updates, "<Checkbox.Root />")),
        TASK_CSS,
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg mengikuti ukuran font Button; area tekannya tetap 24px.",
        en: "sm, md, and lg follow Button's font sizes; the press target stays 24px.",
      },
      uses: ["Checkbox"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) =>
            label(TEXT[lang][size], `<Checkbox.Root size="${size}" defaultChecked />`),
          ),
        ),
        TASK_CSS,
      ],
    },
    {
      id: "indeterminate",
      title: { id: "Indeterminate", en: "Indeterminate" },
      description: {
        id: "Kotak induk: checked bila semua selesai, indeterminate bila sebagian, dari state Anda.",
        en: "A parent box: checked when all are done, indeterminate when some are, from your own state.",
      },
      uses: ["Checkbox"],
      demo: (lang) => <Checklist lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Checklist",
            ['import { useState } from "react";', ...imp(setup)],
            [
              '<label className="task">',
              "  <Checkbox.Root",
              "    checked={count === 3}",
              "    indeterminate={count > 0 && count < 3}",
              "    onCheckedChange={(on) => setDone({ tests: on, changelog: on, tag: on })}",
              "  />",
              `  ${t.all}`,
              "</label>",
              ...TASKS.flatMap((task) =>
                label(
                  t[task],
                  `<Checkbox.Root checked={done.${task}} onCheckedChange={(on) => setDone({ ...done, ${task}: on })} />`,
                ),
              ),
            ],
            [
              "  const [done, setDone] = useState({ tests: true, changelog: false, tag: false });",
              "  const count = Object.values(done).filter(Boolean).length;",
            ],
          ),
          TASK_CSS,
        ];
      },
    },
    {
      id: "group",
      title: { id: "Grup", en: "Group" },
      description: {
        id: "Untuk sekumpulan kotak, pakai [Checkbox Group](/id/checkbox-group): ia memegang value yang dicentang bersama dan menamai grupnya. Fieldset dengan satu name juga bisa, tanpa value bersama.",
        en: "For a set of boxes, use [Checkbox Group](/en/checkbox-group): it holds the checked values together and names the group. A Fieldset with one name also works, without a shared value.",
      },
      uses: ["Checkbox", "CheckboxGroup"],
      demo: (lang) => <Group lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Channels",
            imp(setup, `import { CheckboxGroup } from "${importPath(setup, "checkbox-group")}";`),
            [
              `<CheckboxGroup aria-label="${t.notify}" defaultValue={["email"]}>`,
              ...CHANNELS.flatMap((channel) =>
                [
                  "<label>",
                  `  <Checkbox.Root value="${channel}" />`,
                  `  ${t[channel]}`,
                  "</label>",
                ].map((line) => `  ${line}`),
              ),
              "</CheckboxGroup>",
            ],
          ),
        ];
      },
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled dan readOnly sama-sama mengabaikan tekanan; readOnly tampil seperti biasa.",
        en: "disabled and readOnly both ignore presses; readOnly keeps the normal look.",
      },
      uses: ["Checkbox"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("Locked", imp(setup), [
            ...label(t.disabled, "<Checkbox.Root disabled />"),
            ...label(t.disabledOn, "<Checkbox.Root disabled defaultChecked />"),
            ...label(t.readOnly, "<Checkbox.Root readOnly defaultChecked />"),
          ]),
          TASK_CSS,
        ];
      },
    },
    {
      id: "invalid",
      title: { id: "Invalid", en: "Invalid" },
      description: {
        id: "Di dalam Field yang invalid, atau dengan aria-invalid: kotak menjadi critical dan bergetar sekali; dicentang, isiannya critical solid.",
        en: "In an invalid Field, or with aria-invalid: the box turns critical and shakes once; checked, its fill is the solid critical.",
      },
      uses: ["Checkbox"],
      demo: (lang) => <Invalid lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("Invalid", imp(setup), [
            ...label(t.invalid, "<Checkbox.Root aria-invalid />"),
            ...label(t.invalidOn, "<Checkbox.Root aria-invalid defaultChecked />"),
          ]),
          TASK_CSS,
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => <Checkbox.Root indeterminate aria-label={TEXT[lang].all} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-checkbox",
      note: {
        id: "Kotaknya: span dari Base UI dengan role checkbox, dan input tersembunyi di sampingnya. Isian 10% dari warna teks tanpa tepi saat mati (13% hover, 16% ditekan), warna utama saat dicentang.",
        en: "The box: Base UI's span with the checkbox role, and a hidden input beside it. A 10% tint of the text color with no edge while off (13% on hover, 16% held), the primary material while checked.",
      },
      size: true,
      tokens: {
        "--ow-accent": "--_accent",
        "--ow-primary-shadow": "--_accent-shadow",
        "--ow-on-accent": "--_on-accent",
        "--ow-fg": "--_fg",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-checkbox__indicator",
      note: {
        id: "Mengisi kotak dan digambar sendiri bila Root tanpa children. Base UI melepasnya saat mati, setelah memudar.",
        en: "Fills the box, and draws itself when Root has no children. Base UI unmounts it while off, once it has faded.",
      },
    },
    {
      name: "Glyph",
      selector: '[data-glyph="minus"]',
      note: {
        id: 'data-glyph="check" atau "minus": bertumpuk di satu sel dan saling memudar. Children mengganti keduanya dengan node apa pun.',
        en: 'data-glyph="check" or "minus": stacked in one cell, crossfading. Children replace both with any node.',
      },
    },
  ],
});

export default function CheckboxPage(props: ExamplePageProps) {
  return <ComponentPage definition={checkboxDefinition} {...props} />;
}
