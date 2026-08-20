import { formatArabicNumber } from "@/lib/format";
import type { AdminOrderTabKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The count bubble's fill per tab — the design gives each group its own colour so
 * the admin reads the row by shape, not by text: waiting = warm, running = blue,
 * done = solid green.
 */
const COUNT_TONE: Record<AdminOrderTabKey, string> = {
  new: "bg-warning-surface text-foreground",
  active: "bg-info-surface text-foreground",
  done: "bg-brand text-white",
};

/**
 * One chip of the orders tab bar: a group's name with how many orders sit in it.
 *
 * Without `onSelect` it renders as plain text rather than a button — that is the
 * archive view of a finished cycle (A-50), where every order is completed and
 * «المكتملة» is a label for the list below, not a choice between three.
 */
export function OrderTabChip({
  tab,
  label,
  count,
  selected = false,
  onSelect,
}: {
  tab: AdminOrderTabKey;
  label: string;
  count: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const className = cn(
    "flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-primary-hover px-2 text-sm text-foreground",
    selected ? "bg-primary" : "bg-transparent",
  );

  const content = (
    <>
      <span className="optical-center whitespace-nowrap">{label}</span>
      <span
        className={cn(
          "flex min-w-8 items-center justify-center rounded-full px-2 py-1.5",
          COUNT_TONE[tab],
        )}
      >
        <span className="optical-center">{formatArabicNumber(count)}</span>
      </span>
    </>
  );

  if (!onSelect) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={className}
    >
      {content}
    </button>
  );
}
