"use client";

import { GlideHighlight, useGlide } from "owsem-ui/core";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    list: "Daftar, sumbu y",
    row: "Baris, sumbu x",
    items: ["Profil", "Keamanan", "Tagihan", "Notifikasi"],
    tabs: ["Ringkasan", "Aktivitas", "Pengaturan"],
    disabled: "Tagihan",
    hint: "Arahkan pointer ke celah di antara item, lalu klik.",
    picked: "Dipilih:",
  },
  en: {
    list: "List, y axis",
    row: "Row, x axis",
    items: ["Profile", "Security", "Billing", "Notifications"],
    tabs: ["Overview", "Activity", "Settings"],
    disabled: "Billing",
    hint: "Point at the gaps between items, then click.",
    picked: "Picked:",
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

/** A list and a row with Glide; the disabled item is skipped and gap clicks pick the lit item. */
export function GlideDemo({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const list = useGlide<HTMLDivElement>();
  const row = useGlide<HTMLDivElement>({ axis: "x" });
  const [picked, setPicked] = useState("");
  const item = (label: string) => (
    <button
      key={label}
      type="button"
      data-glide-item=""
      disabled={label === t.disabled}
      onClick={() => setPicked(label)}
    >
      {label}
    </button>
  );
  return (
    <div className="glide-demo">
      <figure>
        <figcaption>{t.list}</figcaption>
        <div ref={list.ref} className="glide-demo-list">
          <GlideHighlight glide={list} />
          {t.items.map(item)}
        </div>
      </figure>
      <figure>
        <figcaption>{t.row}</figcaption>
        <div ref={row.ref} className="glide-demo-row">
          <GlideHighlight glide={row} />
          {t.tabs.map(item)}
        </div>
      </figure>
      <p className="glide-demo-status" role="status">
        {picked ? `${t.picked} ${picked}` : t.hint}
      </p>
    </div>
  );
}
