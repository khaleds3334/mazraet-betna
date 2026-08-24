import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * A large glyph inside a thin ring — the mark at the top of a screen that has
 * one thing to say: the empty states, and the status of a single order being
 * tracked (C-31→C-34).
 *
 * Figma draws the glyph at 2px however big the ring is. The icon's own 1.5 is
 * stated in a 24-unit grid, so at 104px it would come out ~6.5px thick — hence
 * the absolute weight, a deliberate departure from the rule in `Icon.tsx`
 * rather than an oversight.
 */
export function IconRing({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-33 shrink-0 items-center justify-center rounded-full border border-border",
        className,
      )}
    >
      <Icon
        name={name}
        size={104}
        strokeWidth={2}
        absoluteStrokeWidth
        className="text-primary"
      />
    </div>
  );
}
