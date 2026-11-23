// No "use client": the classes of Tree Rail Nav can be used from Server Components.

/** The classes of every part, the React parts' and the rail's own drawing. */
export const treeRailNavSlots = {
  root: "ow-tree-rail-nav",
  tree: "ow-tree-rail-nav__tree",
  list: "ow-tree-rail-nav__list",
  node: "ow-tree-rail-nav__node",
  item: "ow-tree-rail-nav__item",
  chevron: "ow-tree-rail-nav__chevron",
  panel: "ow-tree-rail-nav__panel",
  icon: "ow-tree-rail-nav__icon",
  origin: "ow-tree-rail-nav__origin",
  label: "ow-tree-rail-nav__label",
  labelText: "ow-tree-rail-nav__label-text",
  rail: "ow-tree-rail-nav__rail",
  railBase: "ow-tree-rail-nav__rail-base",
  railActive: "ow-tree-rail-nav__rail-active",
  railTrail: "ow-tree-rail-nav__rail-trail",
  railNodes: "ow-tree-rail-nav__rail-nodes",
  railNode: "ow-tree-rail-nav__rail-node",
  railMarker: "ow-tree-rail-nav__rail-marker",
  railHalo: "ow-tree-rail-nav__rail-halo",
  railDot: "ow-tree-rail-nav__rail-dot",
} as const;
