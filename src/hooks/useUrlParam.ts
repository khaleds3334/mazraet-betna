"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A view choice that lives in the URL but costs nothing to change — the orders
 * screen's tab, the customers screen's «الآجل» filter.
 *
 * Both are views of a list the page already loaded, so changing one is a filter,
 * not a fetch. Going through the router would re-run the whole page — auth,
 * farm, cycle, list — to hand back the very same rows, which is seconds of a
 * frozen screen for a boolean (D-31). So the URL is written with the browser's
 * own history API instead, and `popstate` brings back and forward along.
 *
 * The URL still carries it, which was always the point: a refresh, the back
 * button and a shared link all land on the same view.
 *
 * `read` and `write` must be stable across renders — define them at module
 * level, not inline, or the history listener is torn down on every render.
 */
export function useUrlParam<T>(
  param: string,
  initial: T,
  read: (raw: string | null) => T,
  write: (value: T) => string | null,
): [T, (next: T) => void] {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const onPopState = () =>
      setValue(read(new URLSearchParams(location.search).get(param)));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [param, read]);

  const set = useCallback(
    (next: T) => {
      setValue(next);

      const params = new URLSearchParams(location.search);
      const raw = write(next);
      if (raw === null) params.delete(param);
      else params.set(param, raw);

      const query = params.toString();
      window.history.pushState(
        null,
        "",
        query ? `${location.pathname}?${query}` : location.pathname,
      );
    },
    [param, write],
  );

  return [value, set];
}
