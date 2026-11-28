import { useEffect, useLayoutEffect } from "react";

/** A layout effect on the client; on the server an ordinary effect, which never runs there. */
export const useBeforePaint: typeof useLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
