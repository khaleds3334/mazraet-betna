import { HugeiconsIcon } from "@hugeicons/react";
import { icons, type IconName } from "@/lib/icons";

/**
 * The only way icons render in the app. Screens use semantic names (`weight`,
 * `home`) from /lib/icons.ts, never Hugeicons imports. Color comes from Tailwind
 * text classes via `currentColor`.
 *
 * Decorative by default (aria-hidden). Pass `label` for a meaningful icon that
 * conveys information on its own (e.g. an icon-only button).
 *
 * ⚠️ Never give `strokeWidth` a default here. HugeiconsIcon copies the prop onto
 * EVERY path, `stroke: "currentColor"` included — so a path that is a baked
 * outline (`fill`, no stroke) gets an extra stroke painted around it and renders
 * at roughly double weight next to the real strokes. `store-verified-02` is one
 * such hybrid. Every icon already carries its own 1.5 width, which is the value
 * the design uses, so leaving it undefined renders each icon exactly as drawn.
 */
export function Icon({
  name,
  size = 24,
  className,
  label,
  strokeWidth,
}: {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
  /** Only set this to deliberately depart from the icon's own weight. */
  strokeWidth?: number;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      color="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
