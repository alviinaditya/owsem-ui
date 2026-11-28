const QUERY = "(prefers-reduced-motion: reduce)";

/** The media query list, for code that listens for the setting to change. Client only. */
export const reducedMotionQuery = (): MediaQueryList => window.matchMedia(QUERY);

/** Whether the user asked for less motion, read when called. Client only. */
export const prefersReducedMotion = (): boolean => reducedMotionQuery().matches;
