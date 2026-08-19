import { Icon } from "@/components/ui";
import { pluralizeCustomer } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Both pills are the same outline shape; only the colours tell them apart. */
const PILL =
  "flex min-h-11 shrink-0 items-center gap-1 rounded-md border bg-surface-page px-3 text-base";

/**
 * The row under the toolbar on the customers screen: how many customers the list
 * is showing (A-30), and the «الآجل» filter that narrows it to the ones who
 * still owe money (A-31).
 *
 * The filter still sets `?debt=1`, so the choice survives a refresh and the back
 * button — but it filters rows the browser already holds, so it does it without
 * asking the server for them again (D-31). The count is not tappable: it reports
 * the list, it doesn't change it.
 */
export function CustomersFilterBar({
  count,
  debtOnly,
  onToggle,
}: {
  count: number;
  debtOnly: boolean;
  onToggle: (debtOnly: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      <div className={cn(PILL, "border-brand-olive text-foreground")}>
        <Icon name="customers" size={14} className="shrink-0" />
        <span className="optical-center whitespace-nowrap">
          {pluralizeCustomer(count)}
        </span>
      </div>

      <button
        type="button"
        aria-pressed={debtOnly}
        onClick={() => onToggle(!debtOnly)}
        className={cn(
          PILL,
          debtOnly
            ? "border-accent-tan text-accent-tan"
            : "border-control-border text-control-border",
        )}
      >
        <Icon name="customers" size={14} className="shrink-0" />
        <span className="optical-center">الآجل</span>
      </button>
    </div>
  );
}
