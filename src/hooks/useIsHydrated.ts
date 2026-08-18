"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to — the value only ever changes once, at hydration. */
const subscribe = () => () => {};

/**
 * `false` while rendering on the server, `true` once the browser has taken over.
 *
 * Overlays need this: they render through a portal into `document.body`, which
 * doesn't exist on the server. `useSyncExternalStore` hands React both snapshots
 * directly instead of flipping a state flag inside an effect, so there is no
 * extra render pass and no hydration mismatch.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // client
    () => false, // server
  );
}
