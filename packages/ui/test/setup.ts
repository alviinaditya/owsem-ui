// Order matters: the rAF counter must wrap requestAnimationFrame before components load.
import "./raf-counter.ts";
import "vitest-browser-react";
import "../src/styles.css";
