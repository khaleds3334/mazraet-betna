import { cn } from "@/lib/utils";

/**
 * The dashed "add one more" control from the design — «اضافة فرخة اخري» on the
 * weighing sheet (A-52), «اضافة ملاحظة» on the add-order sheet (A-56).
 *
 * A dashed outline rather than a solid one because of what it offers: something
 * optional, that isn't there yet. A solid-bordered `ActionButton` sits at the
 * same weight as «حفظ» and reads as part of the form; this reads as the empty
 * space where another row could go, which is exactly what tapping it makes
 * (Khaled, 2026-08-21).
 *
 * The outline comes from the `dashed-frame` utility in `globals.css` — see the
 * note there for why it is a masked SVG rather than `border-dashed`.
 */
export function DashedAddButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "dashed-frame min-h-11 w-full rounded-[10px] bg-surface-page text-base text-foreground",
        className,
      )}
    >
      {label}
    </button>
  );
}
