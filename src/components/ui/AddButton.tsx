import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** One shape for both modes — the live button and the inert copy of it. */
const SHAPE =
  "flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-brand bg-brand px-4 text-base text-surface-page";

/**
 * The green "add" action at the top of a list screen — «اضافة طلب» (A-50) and
 * «اضافة عميل» (A-30). The design draws one button for both, so it lives here
 * instead of being redrawn per screen; only the label and the glyph change.
 *
 * Without `onClick` it renders as a plain shape rather than a button — the
 * orders screen before the farm has a cycle, where the chrome is drawn so the
 * screen reads as empty rather than broken, but nothing on it can be tapped.
 * Same pattern as `OrderTabChip`.
 */
export function AddButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: IconName;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex size-5 items-center justify-center">
        <Icon name={icon} size={14} />
      </span>
      <span className="optical-center">{label}</span>
    </>
  );

  if (!onClick) return <span className={SHAPE}>{content}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(SHAPE, "transition-transform active:scale-[0.99]")}
    >
      {content}
    </button>
  );
}
