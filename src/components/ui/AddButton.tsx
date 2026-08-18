import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";

/**
 * The green "add" action at the top of a list screen — «اضافة طلب» (A-50) and
 * «اضافة عميل» (A-30). The design draws one button for both, so it lives here
 * instead of being redrawn per screen; only the label and the glyph change.
 */
export function AddButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-brand bg-brand px-4 text-base text-surface-page transition-transform active:scale-[0.99]"
    >
      <span className="flex size-5 items-center justify-center">
        <Icon name={icon} size={14} />
      </span>
      <span className="optical-center">{label}</span>
    </button>
  );
}
