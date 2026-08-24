/**
 * Where "back" leads from the screen that is open right now.
 *
 * The phone's back gesture used to mean "home" from everywhere but home
 * (`BackGuard`). That is right for a tab, and wrong for a screen you walked
 * into: leaving one order's details should hand you back the list you opened it
 * from, not the front page.
 *
 * Rather than keep a table of routes here, the screen's own back button says
 * it. A screen that draws one already knows where it goes — this is the same
 * answer, made available to the gesture. Screens without a back button register
 * nothing, and the gesture keeps meaning "home" for them.
 *
 * One target at a time, because one screen is open at a time. The cleanup only
 * clears what it set, so a mount/unmount overlap during a navigation cannot
 * leave the next screen's target wiped.
 */
let target: string | null = null;

export function setBackTarget(href: string): () => void {
  target = href;
  return () => {
    if (target === href) target = null;
  };
}

export function getBackTarget(): string | null {
  return target;
}
