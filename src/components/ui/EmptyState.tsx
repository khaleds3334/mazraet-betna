import { IconRing } from "./IconRing";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The "there's nothing here yet" block: a large lime glyph inside a thin ring
 * with one short line under it. Shared because every list screen needs the same
 * block and they differ only in the glyph and the sentence.
 *
 * The ring itself is `IconRing` — the tracking screen wears the same one over a
 * single order's card, which is what made it a component.
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
      <IconRing name={icon} />

      <p className="text-h6 font-bold text-foreground">{title}</p>
    </div>
  );
}
