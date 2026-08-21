import { Badge } from "@/components/ui";
import { SettingsGear } from "@/components/layout/SettingsGear";
import { AddOrderLauncher } from "@/components/admin/orders/add/AddOrderLauncher";
import type { CustomerOption } from "@/lib/queries/customers";
import { formatCurrency, pluralizeDay } from "@/lib/format";

/**
 * Top of the selling dashboard (A-20): «اضافة طلب» facing the settings gear, then
 * the three at-a-glance badges. In RTL the first child sits on the right, so the
 * badge row renders as price · sale-state · age, matching the design.
 *
 * **«اضافة طلب» is here as well as on the orders screen** (Khaled, 2026-08-21).
 * This is the screen the admin is looking at when a customer walks up, and the
 * order he takes from him is the same order either screen books — same launcher,
 * so there is one add-order sheet in the project, not two that drift.
 *
 * The whole header is pinned by the dashboard that renders it: what it holds is
 * the price, whether the sale is open, and the way to take an order — none of
 * which stop being true because he scrolled down to read the figures.
 */
export function SellingHeader({
  ageDays,
  salePrice,
  customers,
  weights,
  defaultCleaning,
  cleaningPrice,
}: {
  ageDays: number;
  salePrice: number;
  /** Everything «اضافة طلب» needs — see `AddOrderLauncher`. */
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
  cleaningPrice: number;
}) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <AddOrderLauncher
          customers={customers}
          weights={weights}
          defaultCleaning={defaultCleaning}
          salePrice={salePrice}
          cleaningPrice={cleaningPrice}
          saleOpen
        />
        <SettingsGear />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="accent">{formatCurrency(salePrice)}</Badge>
        <Badge tone="primary">البيع متوفر</Badge>
        <Badge tone="danger">{pluralizeDay(ageDays)}</Badge>
      </div>
    </header>
  );
}
