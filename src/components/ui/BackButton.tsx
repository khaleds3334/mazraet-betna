import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/**
 * Back navigation button — the rounded lime-tinted square from the design.
 * In RTL "back" points to the right. 48×48 so it clears the 44px touch target.
 * Renders a link; pass the destination as `href`.
 */
export function BackButton({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="رجوع"
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-surface p-2",
        "shadow-[0px_4px_2px_0px_rgba(217,249,157,0.15)]",
        className,
      )}
    >
      <Icon name="arrowRight" size={32} className="text-foreground" aria-hidden />
    </Link>
  );
}
