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
