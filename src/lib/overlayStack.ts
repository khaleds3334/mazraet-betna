/**
 * Every overlay that is open right now, oldest first — the bottom sheets, the
 * dialogs, and the customer drawer. It exists for one reason: so the phone's
 * back gesture can close the thing on top instead of leaving the screen under it
 * (`BackGuard`).
 *
 * A module-level stack rather than a context, for the same reason the toast
 * store is one: a sheet is opened from whatever button happens to need it, and
 * wrapping the app in a provider to reach them all buys nothing.
 *
 * **Registration order is stacking order.** A dialog opened from inside a sheet
 * mounts after the sheet, so closing the last one registered is always closing
 * the one the user is actually looking at — the same ordering the z-index ladder
 * encodes (T-40).
 *
 * Registration lives inside `BottomSheet`, `Modal` and `Sidebar`, never at a
 * call site: every overlay in the app is one of those three, so they all answer
 * the back gesture without any screen having to remember to ask for it.
 */

interface Overlay {
  id: number;
  close: () => void;
}

let stack: Overlay[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Called by an overlay as it opens. Hand back the id it closes with. */
export function openOverlay(close: () => void): number {
  const id = ++counter;
  stack = [...stack, { id, close }];
  emit();
  return id;
}

/** Called as an overlay closes — by its own cleanup, or by us. Idempotent. */
export function closeOverlay(id: number) {
  const next = stack.filter((overlay) => overlay.id !== id);
  if (next.length === stack.length) return;
  stack = next;
  emit();
}

/**
 * Close the topmost overlay. False when there was none — which is the back
 * gesture's cue that the press meant something else.
 *
 * It leaves the stack before it is told to close, so the `onClose` it runs can
 * open another overlay without the two fighting over the top slot.
 */
export function closeTopOverlay(): boolean {
  const top = stack.at(-1);
  if (!top) return false;
  closeOverlay(top.id);
  top.close();
  return true;
}

export function subscribeOverlays(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
