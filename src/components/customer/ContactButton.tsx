import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * The "تواصل معنا" pill (the orange chat-bubble button from the design). Reused
 * across customer screens. Presentational for now — no destination decided yet;
 * pass `className` to place it (e.g. `self-end` on the home screen).
 */
export function ContactButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1 rounded-full border border-accent-tan bg-accent-orange px-3.5 py-2.5 text-base font-bold text-primary-foreground shadow-card",
        className,
      )}
    >
      <Icon name="contact" size={24} />
      <span>تواصل معنا</span>
    </button>
  );
}
