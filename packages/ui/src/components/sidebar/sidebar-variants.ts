// No "use client": the classes of Sidebar can be used from Server Components.

/** The classes of every part, and of the elements the indicator draws itself. */
export const sidebarSlots = {
  provider: "ow-sidebar__provider",
  root: "ow-sidebar",
  backdrop: "ow-sidebar__backdrop",
  header: "ow-sidebar__header",
  content: "ow-sidebar__content",
  footer: "ow-sidebar__footer",
  group: "ow-sidebar__group",
  groupLabel: "ow-sidebar__group-label",
  list: "ow-sidebar__list",
  item: "ow-sidebar__item",
  link: "ow-sidebar__link",
  label: "ow-sidebar__label",
  icon: "ow-sidebar__icon",
  badge: "ow-sidebar__badge",
  indicator: "ow-sidebar__indicator",
  trigger: "ow-sidebar__trigger",
  liquid: "ow-sidebar__liquid",
  liquidPart: "ow-sidebar__liquid-part",
  liquidDot: "ow-sidebar__liquid-dot",
  pulse: "ow-sidebar__pulse",
} as const;
