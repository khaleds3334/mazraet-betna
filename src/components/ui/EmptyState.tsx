import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The "there's nothing here yet" block: a large lime glyph inside a thin ring
 * with one short line under it. Shared because every list screen needs the same
 * block and they differ only in the glyph and the sentence.
 */
export function EmptyState({
  icon,
  title,
  className,
}: {
  icon: IconName;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-9 text-center", className)}
    >
      <div className="flex size-33 shrink-0 items-center justify-center rounded-full border border-border">
        {/*
          Figma draws this glyph at 2px no matter how big it is. The icon's own
          1.5 weight is stated in a 24-unit grid, so at 104px it would render
          ~6.5px thick — hence the absolute weight, a deliberate departure from
          the rule in Icon.tsx rather than an oversight.
        */}
        <Icon
          name={icon}
          size={104}
          strokeWidth={2}
          absoluteStrokeWidth
          className="text-primary"
        />
      </div>

      <p className="text-h6 font-bold text-foreground">{title}</p>
    </div>
  );
}
