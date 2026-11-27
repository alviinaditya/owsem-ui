"use client";

import {
  Accordion,
  Autocomplete,
  Avatar,
  Button,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  Combobox,
  Dialog,
  Drawer,
  Field,
  Fieldset,
  Form,
  Input,
  Kbd,
  Menu,
  Meter,
  NavigationMenu,
  NumberField,
  OTPField,
  Popover,
  PreviewCard,
  Progress,
  Radio,
  RadioGroup,
  ScrollArea,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  Toast,
  Toggle,
  ToggleGroup,
  Toolbar,
  Tooltip,
} from "owsem-ui/base";
import {
  CodeBlock,
  ColorPicker,
  CommandMenu,
  CopyButton,
  TableOfContents,
  TreeRailNav,
} from "owsem-ui/owsem";
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
    period: "Periode",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    undo: "Urungkan",
    docs: "Dokumen",
    blog: "Blog",
    share: "Bagikan",
    shareTitle: "Bagikan link",
    shareBody: "Siapa pun bisa melihat.",
    discardTitle: "Buang draf?",
    discardBody: "Perubahan hilang.",
    keep: "Lanjut",
    discard: "Buang",
    docsLink: "dokumentasi",
    docsRead: "Baca",
    docsTitle: "Dokumentasi",
    docsBody: "Contoh langsung.",
    edit: "Edit",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    file: "Berkas",
    view: "Tampilan",
    rightClick: "Klik kanan",
    products: "Produk",
    pricing: "Harga",
    tokens: "Token",
    glide: "Glide",
    guides: "Panduan",
    start: "Mulai",
    theming: "Tema",
    components: "Komponen",
    search: "Cari…",
    email: "Email",
    emailHint: "Untuk masuk.",
    address: "Alamat",
    city: "Kota",
    commands: "Perintah",
    newFile: "File baru",
    openRecent: "Buka terbaru",
    settings: "Pengaturan",
    toolbar: "Format teks",
    contents: "Di halaman ini",
    files: "File",
    sections: ["Instalasi", "Tema", "Pemakaian", "API"],
    alerts: "Notifikasi",
    sounds: "Suara",
    upload: "Mengunggah",
    storage: "Penyimpanan",
    workWeek: "Minggu kerja",
    focus: "Fokus",
    meetings: "Rapat",
    quantity: "Jumlah",
    volume: "Volume",
    code: "Kode",
    details: "Detail",
    shipping: "Pengiriman",
    returns: "Pengembalian",
    payment: "Pembayaran",
    freeShipping: "Gratis ongkir.",
    toastInfo: "Versi baru tersedia",
    toastWarning: "Penyimpanan hampir penuh",
    toastSaved: "Perubahan disimpan",
    toastSavedBody: "Draf sudah diperbarui.",
    fruit: "Buah",
    fruitNames: ["Apel", "Pisang", "Ceri"],
  },
  en: {
    create: "New",
    cancel: "Cancel",
    day: "Day",
    week: "Week",
    month: "Month",
    period: "Period",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    docs: "Docs",
    blog: "Blog",
    share: "Share",
    shareTitle: "Share link",
    shareBody: "Anyone with it can view.",
    discardTitle: "Discard draft?",
    discardBody: "Changes are lost.",
    keep: "Keep",
    discard: "Discard",
    docsLink: "the docs",
    docsRead: "Read",
    docsTitle: "Docs",
    docsBody: "Live examples.",
    edit: "Edit",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    file: "File",
    view: "View",
    rightClick: "Right click",
    products: "Products",
    pricing: "Pricing",
    tokens: "Tokens",
    glide: "Glide",
    guides: "Guides",
    start: "Getting started",
    theming: "Theming",
    components: "Components",
    search: "Search…",
    email: "Email",
    emailHint: "To sign in.",
    address: "Address",
    city: "City",
    commands: "Commands",
    newFile: "New file",
    openRecent: "Open recent",
    settings: "Settings",
    toolbar: "Text format",
    contents: "On this page",
    files: "Files",
    sections: ["Installation", "Theming", "Usage", "API"],
    alerts: "Alerts",
    sounds: "Sounds",
    upload: "Uploading",
    storage: "Storage",
    workWeek: "Working week",
    focus: "Focus",
    meetings: "Meetings",
    quantity: "Quantity",
    volume: "Volume",
    code: "Code",
    details: "Details",
    shipping: "Shipping",
    returns: "Returns",
    payment: "Payment",
    freeShipping: "Free shipping.",
    toastInfo: "A new version is out",
    toastWarning: "Storage almost full",
    toastSaved: "Changes saved",
    toastSavedBody: "The draft is up to date.",
    fruit: "Fruit",
    fruitNames: ["Apple", "Banana", "Cherry"],
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

/**
 * Opened without a pointer, Base UI scrolls the highlighted item into view, and with it the page:
 * the index would slide down to this preview on every load. Its items never scroll anything.
 */
const stayPut = (el: HTMLElement | null) => {
  if (el) el.scrollIntoView = () => {};
};

// Pinned open without taking focus or the page's scroll (Base UI's undocumented `initialFocus`).
const pinned = { open: true, modal: false } as const;
const keepFocus = { initialFocus: false } as object;

function PopoverPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Popover.Root {...pinned}>
        <Popover.Trigger render={<Button size="sm" variant="secondary" />}>
          {t.share}
        </Popover.Trigger>
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

function DialogPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Dialog.Root {...pinned}>
        <Dialog.Portal container={portal.container}>
          <Dialog.Popup {...keepFocus}>
            <Dialog.Title>{t.shareTitle}</Dialog.Title>
            <Dialog.Description>{t.shareBody}</Dialog.Description>
            <Dialog.Close render={<Button size="sm" />}>{t.share}</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {portal.box}
    </>
  );
}

/** A bottom sheet, pinned open in the card and not modal, so the page stays usable. */
function DrawerPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Drawer.Root {...pinned}>
        <Drawer.Portal container={portal.container}>
          <Drawer.Popup {...keepFocus}>
            <Drawer.Title>{t.shareTitle}</Drawer.Title>
            <div className="component-preview-row">
              <Drawer.Close render={<Button size="sm" />}>{t.share}</Drawer.Close>
            </div>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
      {portal.box}
    </>
  );
}

/**
 * A stack of three toasts held in the card: no timers and no focus taken, and nothing announced
 * (the whole preview is inert and hidden from assistive technology). globals.css places the
 * viewport against the card, not the window.
 */
function ToastPreview({ t }: { t: Text }) {
  const portal = usePortal();
  const [manager] = useState(() => Toast.createToastManager());
  useEffect(() => {
    manager.add({ id: "p1", title: t.toastInfo, type: "info", timeout: 0 });
    manager.add({ id: "p2", title: t.toastWarning, type: "warning", timeout: 0 });
    manager.add({
      id: "p3",
      title: t.toastSaved,
      description: t.toastSavedBody,
      type: "success",
      timeout: 0,
      actionProps: { children: t.undo },
    });
    return () => manager.close();
  }, [manager, t]);
  return (
    <>
      <Toast.Provider toastManager={manager}>
        <Toast.Portal container={portal.container}>
          <Toast.Viewport />
        </Toast.Portal>
      </Toast.Provider>
      {portal.box}
    </>
  );
}

/**
 * Alert Dialog is always modal, so a pinned one would make the page around it inert. This is its
 * markup drawn by its own classes: the look of the open alert, with nothing to press.
 */
function AlertDialogPreview({ t }: { t: Text }) {
  return (
    <div className="component-preview-alert" aria-hidden="true">
      <div className="ow-alert-dialog__backdrop" />
      <div className="ow-alert-dialog__popup">
        <h2 className="ow-alert-dialog__title">{t.discardTitle}</h2>
        <p className="ow-alert-dialog__description">{t.discardBody}</p>
        <div className="component-preview-row">
          <Button size="sm" variant="outline" tabIndex={-1}>
            {t.keep}
          </Button>
          <Button size="sm" tabIndex={-1}>
            {t.discard}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreviewCardPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <p className="component-preview-text">
        {t.docsRead}{" "}
        <PreviewCard.Root open>
          <PreviewCard.Trigger href="/">{t.docsLink}</PreviewCard.Trigger>
          <PreviewCard.Portal container={portal.container}>
            <PreviewCard.Positioner side="bottom">
              <PreviewCard.Popup>
                <PreviewCard.Arrow />
                <strong>{t.docsTitle}</strong>
                <p>{t.docsBody}</p>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
      </p>
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
        <Menu.Trigger render={<Button size="sm" variant="secondary" />}>{t.edit}</Menu.Trigger>
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

/**
 * Context Menu's popup is Menu's, so a pinned Menu draws it beside an area: a context menu itself
 * opens at the pointer, which a preview has none of.
 */
function ContextMenuPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Menu.Root {...pinned}>
        <Menu.Trigger nativeButton={false} render={<div className="component-preview-area" />}>
          {t.rightClick}
        </Menu.Trigger>
        <Menu.Portal container={portal.container}>
          <Menu.Positioner side="inline-end" align="start" alignOffset={0}>
            <Menu.Popup size="sm" {...keepFocus}>
              <Menu.Item>
                <Icon name="copy" />
                {t.copy}
                <kbd>⌘C</kbd>
              </Menu.Item>
              <Menu.Item>
                <Icon name="clipboard" />
                {t.paste}
                <kbd>⌘V</kbd>
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item>{t.edit}</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {portal.box}
    </>
  );
}

function MenubarPreview({ t }: { t: Text }) {
  const portal = usePortal();
  // Held open inside a Menubar, Base UI shuts a menu when nothing in the bar has focus: this is the
  // bar's look made of its classes, with a plain Menu open under one trigger.
  return (
    <>
      <div className="ow-menubar ow-menubar--sm">
        <span className="ow-menubar__trigger ow-menubar__trigger--sm">{t.file}</span>
        <Menu.Root {...pinned}>
          <Menu.Trigger
            nativeButton={false}
            render={<span />}
            className="ow-menubar__trigger ow-menubar__trigger--sm"
          >
            {t.edit}
          </Menu.Trigger>
          <Menu.Portal container={portal.container}>
            <Menu.Positioner align="start" positionMethod="absolute">
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
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <span className="ow-menubar__trigger ow-menubar__trigger--sm">{t.view}</span>
      </div>
      {portal.box}
    </>
  );
}

function NavigationMenuPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      {/* Small, with title-only links, so the open panel fits the card. */}
      <NavigationMenu.Root value="products" aria-label={t.products} size="sm">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>{t.products}</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#" tabIndex={-1}>
                <strong>{t.tokens}</strong>
              </NavigationMenu.Link>
              <NavigationMenu.Link href="#" tabIndex={-1}>
                <strong>{t.glide}</strong>
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="#" tabIndex={-1}>
              {t.pricing}
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal container={portal.container}>
          <NavigationMenu.Positioner positionMethod="absolute">
            <NavigationMenu.Popup inert />
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>
      {portal.box}
    </>
  );
}

function SelectPreview({ t }: { t: Text }) {
  const portal = usePortal();
  return (
    <>
      <Select.Root {...pinned} defaultValue={t.week} size="sm">
        <Select.Trigger aria-label={t.period} />
        <Select.Portal container={portal.container}>
          <Select.Positioner alignItemWithTrigger={false}>
            {/* Inert, so the open list leaves focus with the page. */}
            <Select.Popup inert>
              <Select.Item ref={stayPut} value={t.day}>
                {t.day}
              </Select.Item>
              <Select.Item ref={stayPut} value={t.week}>
                {t.week}
              </Select.Item>
              <Select.Item ref={stayPut} value={t.month}>
                {t.month}
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {portal.box}
    </>
  );
}

/**
 * Floating UI hides the page around an open combobox from assistive technology, and a pinned one
 * would hide the whole index. So the field is live and closed, and its list is a picture: the
 * classes the open popup and its items wear, under the field.
 */
function ListPicture({ names, picked }: { names: readonly string[]; picked?: string | undefined }) {
  return (
    <div className="component-preview-list ow-select__popup ow-select__popup--sm ow-combobox__popup">
      <div className="ow-select__list ow-combobox__list">
        {names.map((name) => (
          <div
            key={name}
            className="ow-select__item ow-combobox__item"
            data-selected={name === picked ? "" : undefined}
          >
            {name}
            {picked === undefined ? null : (
              <span
                className="ow-select__item-indicator"
                data-selected={name === picked ? "" : undefined}
              >
                <Icon name="check" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComboboxPreview({ t }: { t: Text }) {
  return (
    <div className="component-preview-field">
      <Combobox.Root items={t.fruitNames} defaultValue={t.fruitNames[1]} size="sm">
        <Combobox.InputGroup>
          <Combobox.Input aria-label={t.fruit} />
          <Combobox.Clear />
          <Combobox.Trigger />
        </Combobox.InputGroup>
      </Combobox.Root>
      <ListPicture names={t.fruitNames} picked={t.fruitNames[1]} />
    </div>
  );
}

function AutocompletePreview({ t }: { t: Text }) {
  return (
    <div className="component-preview-field">
      <Autocomplete.Root items={t.fruitNames} defaultValue={t.fruitNames[0]} size="sm">
        <Autocomplete.Input aria-label={t.fruit} />
      </Autocomplete.Root>
      <ListPicture names={t.fruitNames} />
    </div>
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
  checkbox: (t) => (
    <div className="component-preview-checkbox">
      <label>
        <Checkbox.Root indeterminate /> {t.guides}
      </label>
      <label>
        <Checkbox.Root checked /> {t.docs}
      </label>
      <label>
        <Checkbox.Root /> {t.blog}
      </label>
    </div>
  ),
  switch: (t) => (
    <div className="component-preview-row">
      <Switch.Root checked aria-label={t.alerts} />
      <Switch.Root aria-label={t.sounds} />
    </div>
  ),
  "checkbox-group": (t) => (
    <CheckboxGroup
      size="sm"
      aria-label={t.guides}
      defaultValue={["docs"]}
      allValues={["docs", "blog"]}
    >
      <label>
        <Checkbox.Root parent />
        {t.guides}
      </label>
      <label>
        <Checkbox.Root value="docs" />
        {t.docs}
      </label>
      <label>
        <Checkbox.Root value="blog" />
        {t.blog}
      </label>
    </CheckboxGroup>
  ),
  "number-field": (t) => (
    <NumberField.Root size="sm" defaultValue={3} min={0} className="component-preview-bar">
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input aria-label={t.quantity} />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  ),
  slider: (t) => (
    <Slider.Root
      size="sm"
      defaultValue={62}
      aria-label={t.volume}
      className="component-preview-bar"
    />
  ),
  "otp-field": (t) => <OTPField.Root size="sm" length={4} defaultValue="48" aria-label={t.code} />,
  accordion: (t) => (
    <div className="component-preview-bar">
      <Accordion.Root size="sm" defaultValue={[t.shipping]}>
        {[t.shipping, t.returns, t.payment].map((label) => (
          <Accordion.Item key={label} value={label}>
            <Accordion.Trigger>{label}</Accordion.Trigger>
            <Accordion.Panel>{t.freeShipping}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  ),
  collapsible: (t) => (
    <div className="component-preview-bar">
      <Collapsible.Root size="sm" defaultOpen>
        <Collapsible.Trigger>{t.details}</Collapsible.Trigger>
        <Collapsible.Panel>{t.freeShipping}</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  ),
  avatar: () => (
    <Avatar.Group size="lg">
      <Avatar.Root>
        <Avatar.Fallback>AR</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Fallback>BS</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Fallback>+3</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>
  ),
  progress: (t) => (
    <div className="component-preview-bar">
      <Progress.Root value={64} size="sm">
        <Progress.Label>{t.upload}</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  ),
  meter: (t) => (
    <div className="component-preview-bar">
      <Meter.Group defaultActive="focus" size="sm">
        <Meter.Root value={32} max={40} aria-label={t.workWeek}>
          <Meter.Track>
            <Meter.Segment name="focus" value={14} />
            <Meter.Segment name="meetings" value={9} />
            <Meter.Segment name="reviews" value={6} />
            <Meter.Segment name="support" value={3} />
          </Meter.Track>
        </Meter.Root>
        <Meter.Legend aria-label={t.workWeek}>
          <Meter.LegendItem name="focus">{t.focus}</Meter.LegendItem>
          <Meter.LegendItem name="meetings">{t.meetings}</Meter.LegendItem>
        </Meter.Legend>
      </Meter.Group>
    </div>
  ),
  field: (t) => (
    <Field.Root>
      <Field.Label>{t.email}</Field.Label>
      <Field.Control size="sm" placeholder="ana@owsem.dev" />
      <Field.Description>{t.emailHint}</Field.Description>
    </Field.Root>
  ),
  fieldset: (t) => (
    <Fieldset.Root className="component-preview-fieldset">
      <Fieldset.Legend>{t.address}</Fieldset.Legend>
      <Field.Root>
        <Field.Label>{t.city}</Field.Label>
        <Field.Control size="sm" placeholder="Bandung" />
      </Field.Root>
    </Fieldset.Root>
  ),
  form: (t) => (
    <Form className="component-preview-form">
      <Field.Root invalid>
        <Field.Label>{t.email}</Field.Label>
        <Field.Control size="sm" defaultValue="ana@" />
      </Field.Root>
      <Button size="sm" type="button">
        {t.create}
      </Button>
    </Form>
  ),
  input: (t) => (
    <Input
      size="sm"
      aria-label={t.search}
      placeholder={t.search}
      startIcon={<Icon name="search" />}
    />
  ),
  toggle: (t) => (
    <div className="component-preview-row">
      <Toggle pressed aria-label={t.bold} startIcon={<Icon name="bold" />} />
      <Toggle aria-label={t.italic} startIcon={<Icon name="italic" />} />
      <Toggle aria-label={t.underline} startIcon={<Icon name="underline" />} />
    </div>
  ),
  "radio-group": (t) => (
    <RadioGroup size="sm" value="week" aria-label={t.week}>
      <label>
        <Radio.Root value="day" />
        {t.day}
      </label>
      <label>
        <Radio.Root value="week" />
        {t.week}
      </label>
      <label>
        <Radio.Root value="month" />
        {t.month}
      </label>
    </RadioGroup>
  ),
  "toggle-group": (t) => (
    <ToggleGroup.Root size="sm" value={["week"]} aria-label={t.week}>
      <ToggleGroup.Item value="day">{t.day}</ToggleGroup.Item>
      <ToggleGroup.Item value="week">{t.week}</ToggleGroup.Item>
      <ToggleGroup.Item value="month">{t.month}</ToggleGroup.Item>
    </ToggleGroup.Root>
  ),
  tabs: (t) => (
    <Tabs.Root value="docs">
      <Tabs.List size="sm" aria-label={t.guides}>
        <Tabs.Tab value="docs">{t.docs}</Tabs.Tab>
        <Tabs.Tab value="guides">{t.guides}</Tabs.Tab>
        <Tabs.Tab value="blog">{t.blog}</Tabs.Tab>
      </Tabs.List>
    </Tabs.Root>
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
  dialog: (t) => <DialogPreview t={t} />,
  popover: (t) => <PopoverPreview t={t} />,
  "alert-dialog": (t) => <AlertDialogPreview t={t} />,
  drawer: (t) => <DrawerPreview t={t} />,
  toast: (t) => <ToastPreview t={t} />,
  "preview-card": (t) => <PreviewCardPreview t={t} />,
  "scroll-area": (t) => (
    <ScrollArea.Root className="component-preview-scroll" fade>
      <ul>
        {[...t.sections, t.components, t.guides, t.docs, t.blog].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </ScrollArea.Root>
  ),
  tooltip: (t) => <TooltipPreview t={t} />,
  "context-menu": (t) => <ContextMenuPreview t={t} />,
  menubar: (t) => <MenubarPreview t={t} />,
  "navigation-menu": (t) => <NavigationMenuPreview t={t} />,
  menu: (t) => <MenuPreview t={t} />,
  select: (t) => <SelectPreview t={t} />,
  combobox: (t) => <ComboboxPreview t={t} />,
  autocomplete: (t) => <AutocompletePreview t={t} />,
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
  "code-block": (t) => (
    <CodeBlock.Root defaultValue="tsx" className="component-preview-code">
      <CodeBlock.Header>
        <CodeBlock.List aria-label={t.files}>
          <CodeBlock.Tab value="tsx" icon={<Icon name="atom" />}>
            App.tsx
          </CodeBlock.Tab>
          <CodeBlock.Tab value="css" icon={<Icon name="palette" />}>
            app.css
          </CodeBlock.Tab>
        </CodeBlock.List>
        <CodeBlock.Copy labels={{ copy: t.copy }} />
      </CodeBlock.Header>
      <CodeBlock.Panel value="tsx">
        <pre>
          <code>
            <span className="tk-kw">import</span> {"{ "}
            <span className="tk-type">Button</span>
            {" }"}
            {"\n"}
            <span className="tk-kw">export</span> <span className="tk-kw">default</span>{" "}
            <span className="tk-fn">App</span>
          </code>
        </pre>
      </CodeBlock.Panel>
    </CodeBlock.Root>
  ),
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
