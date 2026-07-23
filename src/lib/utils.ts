/**
 * utils.ts — tiny shared helpers. Keep this file small; anything with real
 * business logic belongs in /lib/calculations, not here.
 */

type ClassValue = string | number | false | null | undefined;

/** Join class names, dropping falsy ones. Lets components compose Tailwind
 *  classes with conditional ones without a heavier dependency. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Whether `href` is the active nav destination for the current `pathname`.
 * Non-index routes match their sub-pages too (so /admin/cycles/… keeps the
 * الدورات tab lit); index/home routes ("/", "/admin") pass `exact` so they don't
 * stay lit on every child page. Shared by both bottom navs and the sidebar.
 */
export function isActivePath(
  pathname: string,
  href: string,
  exact = false,
): boolean {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
