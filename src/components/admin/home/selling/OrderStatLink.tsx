import Link from "next/link";
import { formatArabicNumber } from "@/lib/format";
import type { AdminOrderTabKey } from "@/lib/constants";
import type { IconName } from "@/lib/icons";
import { CycleStatCard, type StatTone } from "../shared/CycleStatCard";

/**
 * One of the three order tiles on the selling dashboard (A-20), and the tab of
 * the orders screen it belongs to.
 *
 * **A tile with orders in it is a link; an empty one is not.** «٠ طلبات جديدة» is
 * an answer, not an invitation — tapping it would open a list that says the same
 * thing one screen further from home, and a control that sometimes does nothing
 * teaches the admin that tapping is not worth trying (Khaled, 2026-08-21).
 *
 * The tile is unchanged in either case; only the wrapper differs. That is the
 * same arrangement `CycleExpensesCard` uses, and it keeps the design's tile as
 * the one definition of what these look like.
 */
export function OrderStatLink({
  tab,
  icon,
  label,
  count,
  tone,
}: {
  tab: AdminOrderTabKey;
  icon: IconName;
  label: string;
  count: number;
  tone: StatTone;
}) {
  const tile = (
    <CycleStatCard
      icon={icon}
      label={label}
      value={formatArabicNumber(count)}
      tone={tone}
    />
  );

  if (count === 0) return tile;

  return (
    <Link
      href={`/admin/orders?tab=${tab}`}
      aria-label={`${label} — افتح شاشة الطلبات`}
      className="flex transition-transform active:scale-[0.98]"
    >
      {tile}
    </Link>
  );
}
