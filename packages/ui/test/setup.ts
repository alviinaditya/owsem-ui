// Order matters: the rAF counter must wrap requestAnimationFrame before components load.
import "./raf-counter.ts";
import "vitest-browser-react";
import { beforeEach } from "vitest";
import { userEvent } from "vitest/browser";
import "../src/styles.css";
import "./page.css";

// The real pointer rests where the last test left it, and a popup or a field rendered under it
// takes its hover. Park it at the viewport's far corner, where no test content is drawn.
beforeEach(async () => {
  await userEvent.hover(document.documentElement, { position: { x: 1270, y: 790 }, force: true });
});
