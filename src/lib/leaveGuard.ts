/**
 * One screen at a time may ask to be consulted before the user walks off it.
 *
 * The settings screen is the reason it exists: everything on it is edited freely
 * and committed by «حفظ الاعدادات», so leaving without pressing that button
 * throws the lot away silently — a price the admin thought he had changed, and
 * no way to tell from the next screen that he hadn't (Khaled, 2026-08-22).
 *
 * A module-level slot rather than a context, like the overlay stack next to it:
 * the two places that have to ask — the back arrow in the header and the phone's
 * back gesture — are nowhere near the form in the tree, and neither of them
 * knows or should know that a form is what it is interrupting.
 *
 * **One at a time by design.** Two screens with unsaved work cannot both be on
 * screen, and a second registration replacing the first is the honest reading of
 * a screen that has moved on.
 */

/**
 * Returns true when the guard has taken the exit over — the screen is now asking
 * the user, and will call `proceed` itself if they say go. False means it had
 * nothing to say and the caller should carry on leaving.
 */
type Guard = (proceed: () => void) => boolean;

let guard: Guard | null = null;

/** Called by a screen with unsaved work, and again with null as it unmounts. */
export function setLeaveGuard(next: Guard | null) {
  guard = next;
}

/** Called by anything that is about to take the user off the current screen. */
export function askBeforeLeaving(proceed: () => void): boolean {
  return guard ? guard(proceed) : false;
}
