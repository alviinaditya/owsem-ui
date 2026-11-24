"use client";

import { Field, OTPField, type OTPFieldSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    code: "Kode verifikasi",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    grouped: "Kode aktivasi",
    pin: "PIN",
    help: "Kami mengirim 6 angka ke ponsel Anda. Kodenya 123456.",
    error: "Kode salah. Coba lagi.",
  },
  en: {
    code: "Verification code",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    grouped: "Activation code",
    pin: "PIN",
    help: "We texted 6 digits to your phone. The code is 123456.",
    error: "That code is wrong. Try again.",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly OTPFieldSize[] = ["sm", "md", "lg"];

function Default({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="code" className="demo-otp">
      <Field.Label>{TEXT[lang].code}</Field.Label>
      <OTPField.Root length={6} />
    </Field.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col demo-otp">
      {SIZES.map((size) => (
        <OTPField.Root key={size} size={size} length={4} aria-label={TEXT[lang][size]} />
      ))}
    </div>
  );
}

function Grouped({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="activation" className="demo-otp">
      <Field.Label>{TEXT[lang].grouped}</Field.Label>
      <OTPField.Root length={6}>
        <OTPField.Input />
        <OTPField.Input aria-label="2" />
        <OTPField.Input aria-label="3" />
        <span aria-hidden="true" className="demo-otp-dash">
          –
        </span>
        <OTPField.Input aria-label="4" />
        <OTPField.Input aria-label="5" />
        <OTPField.Input aria-label="6" />
      </OTPField.Root>
    </Field.Root>
  );
}

function WithError({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [code, setCode] = useState("");
  const invalid = code.length === 6 && code !== "123456";
  return (
    <Field.Root name="code" invalid={invalid} className="demo-otp">
      <Field.Label>{t.code}</Field.Label>
      <OTPField.Root length={6} value={code} onValueChange={setCode} />
      <Field.Description>{t.help}</Field.Description>
      <Field.Error match={invalid}>{t.error}</Field.Error>
    </Field.Root>
  );
}

function Masked({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="pin" className="demo-otp">
      <Field.Label>{TEXT[lang].pin}</Field.Label>
      <OTPField.Root length={4} mask defaultValue="48" />
    </Field.Root>
  );
}

const imp = (setup: TokenSetup, field = true) => [
  ...(field ? [`import { Field } from "${importPath(setup, "field")}";`] : []),
  `import { OTPField } from "${importPath(setup, "otp-field")}";`,
];

export const otpFieldDefinition = defineComponent({
  item: "otp-field",
  imports: ["OTPField"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Root tanpa children menggambar satu slot untuk tiap karakter. Field.Label menamai semuanya; menempel satu kode utuh mengisi semua slot.",
        en: "Root with no children draws one slot for each character. Field.Label names them all; pasting a whole code fills every slot.",
      },
      uses: ["OTPField", "Field"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("VerifyCode", imp(setup), [
          '<Field.Root name="code">',
          `  <Field.Label>${TEXT[lang].code}</Field.Label>`,
          "  <OTPField.Root length={6} />",
          "</Field.Root>",
        ]),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "Slot berbentuk persegi setinggi Input: 32, 40, atau 48px. Tanpa Field, aria-label menamai grup dan tiap slotnya.",
        en: "Each slot is a square as tall as an Input: 32, 40, or 48px. Without a Field, aria-label names the group and each slot.",
      },
      uses: ["OTPField"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup, false),
          SIZES.map(
            (size) =>
              `<OTPField.Root size="${size}" length={4} aria-label="${TEXT[lang][size]}" />`,
          ),
        ),
      ],
    },
    {
      id: "grouped",
      title: { id: "Berkelompok", en: "Grouped" },
      description: {
        id: "Beri slot sendiri sebagai children dan taruh pemisah di antaranya dengan markup biasa. Slot pertama dinamai Field.Label; beri sisanya aria-label.",
        en: "Give your own slots as children and put a separator between them with plain markup. The first slot is named by Field.Label; give the rest an aria-label.",
      },
      uses: ["OTPField", "Field"],
      demo: (lang) => <Grouped lang={lang} />,
      code: (setup, lang) => [
        exampleFile("ActivationCode", imp(setup), [
          '<Field.Root name="activation">',
          `  <Field.Label>${TEXT[lang].grouped}</Field.Label>`,
          "  <OTPField.Root length={6}>",
          "    <OTPField.Input />",
          '    <OTPField.Input aria-label="2" />',
          '    <OTPField.Input aria-label="3" />',
          '    <span aria-hidden="true">–</span>',
          '    <OTPField.Input aria-label="4" />',
          '    <OTPField.Input aria-label="5" />',
          '    <OTPField.Input aria-label="6" />',
          "  </OTPField.Root>",
          "</Field.Root>",
        ]),
      ],
    },
    {
      id: "error",
      title: { id: "Dengan error", en: "With an error" },
      description: {
        id: "Saat kode lengkap tapi salah, Field menandainya invalid: slot jadi critical dan seluruh baris bergetar sekali. Ketik 123456 untuk menghapusnya.",
        en: "When the code is complete but wrong, Field marks it invalid: the slots turn critical and the whole row shakes once. Type 123456 to clear it.",
      },
      uses: ["OTPField", "Field"],
      demo: (lang) => <WithError lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "CheckCode",
            ['import { useState } from "react";', ...imp(setup)],
            [
              '<Field.Root name="code" invalid={invalid}>',
              `  <Field.Label>${t.code}</Field.Label>`,
              "  <OTPField.Root length={6} value={code} onValueChange={setCode} />",
              `  <Field.Description>${t.help}</Field.Description>`,
              `  <Field.Error match={invalid}>${t.error}</Field.Error>`,
              "</Field.Root>",
            ],
            [
              '  const [code, setCode] = useState("");',
              '  const invalid = code.length === 6 && code !== "123456";',
            ],
          ),
        ];
      },
    },
    {
      id: "masked",
      title: { id: "Disamarkan", en: "Masked" },
      description: {
        id: "mask menyembunyikan karakter seperti kolom kata sandi; validationType mengatur karakter yang diterima.",
        en: "mask hides the characters like a password field; validationType sets which characters are accepted.",
      },
      uses: ["OTPField", "Field"],
      demo: (lang) => <Masked lang={lang} />,
      code: (setup, lang) => [
        exampleFile("PinCode", imp(setup), [
          '<Field.Root name="pin">',
          `  <Field.Label>${TEXT[lang].pin}</Field.Label>`,
          '  <OTPField.Root length={4} mask defaultValue="48" />',
          "</Field.Root>",
        ]),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Field.Root className="demo-otp">
        <Field.Label>{TEXT[lang].code}</Field.Label>
        <OTPField.Root length={4} size="lg" defaultValue="48" />
      </Field.Root>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-otp-field",
      note: {
        id: "Div dengan role group yang menata slot dalam satu baris dari tepi awal, 0,5em satu sama lain, sejajar dengan label dan errornya. Tanpa children ia menggambar satu Input untuk tiap length. size-nya adalah font dan --py yang dibaca semua slot; baris ini yang bergetar saat invalid.",
        en: "A div with the group role that lays the slots in a row from the start edge, 0.5em apart, in line with its label and error. With no children it draws one Input for each length. Its size is the font and --py that every slot reads; this row is what shakes when invalid.",
      },
    },
    {
      name: "Input",
      selector: ".ow-otp-field__input",
      size: true,
      note: {
        id: "Satu slot: persegi setinggi Input dengan isian 6% dari warna teks (9% saat hover), satu angka tabular di tengah, dan cincin fokus. Invalid mewarnainya critical; disabled meredupkannya.",
        en: "One slot: a square as tall as an Input with a 6% tint of the text color (9% on hover), one tabular digit in the middle, and the focus ring. Invalid turns it critical; disabled dims it.",
      },
      tokens: {
        "--ow-fg": "--_bg",
      },
    },
  ],
});

export default function OTPFieldPage(props: ExamplePageProps) {
  return <ComponentPage definition={otpFieldDefinition} {...props} />;
}
