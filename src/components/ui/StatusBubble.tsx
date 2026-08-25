import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

/**
 * The round tone marker beside a message — good news, a warning, or something
 * that went wrong (C-15).
 *
 * The same three tones the toast uses, in the same three token pairs, because
 * they are the same three things being said: one of them fades after four
 * seconds and the other sits in a list, and a customer should not have to learn
 * two colour languages for that. `Toast` keeps its own box because it is a bar
 * with text in it, not a circle — what is shared is the vocabulary, which lives
 * here in one map.
 *
 * **Bare glyphs, not the toast's icons.** A tick, an exclamation and a cross —
 * `success`/`warning`/`error` in the icon map are all drawn *inside* their own
 * circle or triangle, and a shape inside this disc is a shape inside a shape
 * (Khaled, 2026-08-25). The design draws each bubble as one solid mark.
 */
const TONE = {
  success: { box: "bg-success-surface", icon: "text-success", name: "check" },
  warning: {
    box: "bg-warning-surface",
    icon: "text-warning",
    name: "exclamation",
  },
  error: { box: "bg-error-surface", icon: "text-error", name: "close" },
} as const;

export type StatusTone = keyof typeof TONE;

export function StatusBubble({
  tone,
  className,
}: {
  tone: StatusTone;
  className?: string;
}) {
  const look = TONE[tone];

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[38px] shrink-0 items-center justify-center rounded-full",
        look.box,
        className,
      )}
    >
      <Icon name={look.name} size={22} className={look.icon} />
    </span>
  );
}
