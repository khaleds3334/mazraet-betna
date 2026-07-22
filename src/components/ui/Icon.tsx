import { HugeiconsIcon } from "@hugeicons/react";
import { icons, type IconName } from "@/lib/icons";

/**
 * The only way icons render in the app. Screens use semantic names (`weight`,
 * `home`) from /lib/icons.ts, never Hugeicons imports. Color comes from Tailwind
 * text classes via `currentColor`.
 *
 * Decorative by default (aria-hidden). Pass `label` for a meaningful icon that
 * conveys information on its own (e.g. an icon-only button).
 */
export function Icon({
  name,
  size = 24,
  className,
  label,
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
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
