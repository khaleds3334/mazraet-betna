import { Badge } from "@/components/ui";
import { SettingsGear } from "@/components/layout/SettingsGear";
import { formatCurrency, pluralizeDay } from "@/lib/format";

/**
 * Top of the selling dashboard (A-20): the settings gear, then the three
 * at-a-glance badges. In RTL the first child sits on the right, so the order
 * below renders as price · sale-state · age, matching the design.
 */
export function SellingHeader({
  ageDays,
  salePrice,
}: {
  ageDays: number;
  salePrice: number;
}) {
  return (
    <header className="flex flex-col gap-2">
      <SettingsGear />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="accent">{formatCurrency(salePrice)}</Badge>
        <Badge tone="primary">البيع متوفر</Badge>
        <Badge tone="danger">{pluralizeDay(ageDays)}</Badge>
      </div>
    </header>
  );
}
