import { Icon } from "@/components/ui";

/**
 * The search box on the orders screen (A-50). Shape only for this pass — there
 * are no order cards to search yet, and "no result" has no design (Khaled,
 * 2026-08-18). It becomes a real input, driven by a URL param, in the session
 * that builds the cards; keeping it non-interactive until then means it never
 * opens a keyboard that leads nowhere.
 */
export function OrdersSearchBar() {
  return (
    <div className="px-screen">
      <div className="flex min-h-13 items-center gap-4 rounded-lg border border-border bg-surface px-4">
        <Icon name="search" size={32} className="shrink-0 text-muted" />
        <p className="truncate text-sm text-disabled">
          ابحث باسم العميل او رقم الطلب
        </p>
      </div>
    </div>
  );
}
