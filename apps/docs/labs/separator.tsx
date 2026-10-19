"use client";

import { Separator } from "owsem-ui/base";
import type { CSSProperties } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { defineLab } from "@/components/lab/types";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    profile: "Profil",
    profileBody: "Nama, foto, dan bio publik.",
    security: "Keamanan",
    securityBody: "Kata sandi dan sesi yang aktif.",
    states: ["Draf", "Terbit", "Arsip"],
  },
  en: {
    profile: "Profile",
    profileBody: "Name, photo, and public bio.",
    security: "Security",
    securityBody: "Password and active sessions.",
    states: ["Draft", "Published", "Archived"],
  },
};

const initial = { orientation: "horizontal", dark: "", light: "" };

const separatorLab = defineLab({
  initial,
  controls: [
    {
      key: "orientation",
      type: "choice",
      label: { id: "Orientasi", en: "Orientation" },
      options: [
        { value: "horizontal", label: { id: "Horizontal", en: "Horizontal" } },
        { value: "vertical", label: { id: "Vertikal", en: "Vertical" } },
      ],
    },
    {
      key: "dark",
      type: "color",
      label: { id: "Garis gelap", en: "Dark line" },
      token: "--ow-line-dark",
    },
    {
      key: "light",
      type: "color",
      label: { id: "Garis terang", en: "Light line" },
      token: "--ow-line-light",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-separator",
      note: {
        id: "Garis gelap dan terang, digambar sebagai border. Base UI memberinya role separator.",
        en: "The dark and light lines, drawn as borders. Base UI gives it the separator role.",
      },
      tokens: {
        "--ow-separator-line-dark": "--_dark",
        "--ow-separator-line-light": "--_light",
      },
    },
  ],

  demo(cfg, lang) {
    const t = TEXT[lang];
    const style = {
      "--ow-separator-line-dark": cfg.dark || undefined,
      "--ow-separator-line-light": cfg.light || undefined,
    } as CSSProperties;
    if (cfg.orientation === "vertical") {
      return (
        <div className="demo-card demo-row" style={style}>
          {t.states.map((label, i) => (
            <span key={label} className="demo-row-item">
              {i > 0 ? <Separator orientation="vertical" /> : null}
              {label}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="demo-card" style={style}>
        <div>
          <p className="demo-title">{t.profile}</p>
          <p className="demo-muted">{t.profileBody}</p>
        </div>
        <Separator />
        <div>
          <p className="demo-title">{t.security}</p>
          <p className="demo-muted">{t.securityBody}</p>
        </div>
      </div>
    );
  },

  code(cfg, setup) {
    const custom = cfg.dark || cfg.light;
    const scope = custom ? ' className="settings"' : "";
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/separator";
    const imports = `import { Separator } from "${from}";`;
    const usage =
      cfg.orientation === "vertical"
        ? [
            imports,
            "",
            "export function Status() {",
            "  return (",
            `    <div${scope} style={{ display: "flex", gap: 12 }}>`,
            "      <span>Draft</span>",
            '      <Separator orientation="vertical" />',
            "      <span>Published</span>",
            "    </div>",
            "  );",
            "}",
          ]
        : [
            imports,
            "",
            "export function Settings() {",
            "  return (",
            `    <section${scope}>`,
            "      <h3>Profile</h3>",
            "      <Separator />",
            "      <h3>Security</h3>",
            "    </section>",
            "  );",
            "}",
          ];
    const files = [{ name: "usage.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}-separator-line`;
      // Isolated tokens are set on each Separator's root, so an inherited value would lose.
      const lines = [
        "/* Every Separator inside .settings */",
        setup.mode === "isolated" ? ".settings .ow-separator {" : ".settings {",
        ...(cfg.dark ? [`  ${token}-dark: ${cfg.dark};`] : []),
        ...(cfg.light ? [`  ${token}-light: ${cfg.light};`] : []),
        "}",
      ];
      files.push({ name: "settings.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    anatomy: { inspect: true },
    states: { cfg: { orientation: "vertical" } },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function SeparatorLab(props: LabProps) {
  return <LabShell lab={separatorLab} {...props} />;
}
