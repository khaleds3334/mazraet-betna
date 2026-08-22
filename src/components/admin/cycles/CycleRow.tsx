import Link from "next/link";
import { Badge, Icon } from "@/components/ui";
import type { BadgeTone } from "@/components/ui/Badge";
import { ChickIcon } from "@/components/admin/shared/ChickIcon";
import {
  formatArabicDate,
  formatArabicNumber,
  formatCurrency,
  pluralizeChick,
  pluralizeChicken,
} from "@/lib/format";
import type { CycleListItem } from "@/lib/queries/cycles";
import { CycleRowStat } from "./CycleRowStat";

/** How each phase introduces itself on the row's pill. */
const PHASE: Record<CycleListItem["phase"], { label: string; tone: BadgeTone }> =
  {
    raising: { label: "مرحلة التربية", tone: "success" },
    selling: { label: "مرحلة البيع", tone: "primary" },
    ended: { label: "دورة منتهية", tone: "danger" },
  };

/**
 * One cycle in the admin's list (A-42 → A-44): its name and phase, how long it
 * ran and on how many chicks, its headline figures, and whatever the cycle can
 * be asked from here (`children`). A finished cycle also reports its profit — a
 * running one has not earned it yet.
 *
 * `href` makes the row a way into the cycle, and brings the footer with it: the
 * debt line and the arrow are the same block, and both only mean something on a
 * row you can walk into. The selling row has neither, because everything it can
 * do is already on it (A-44).
 *
 * The link is a stretched overlay rather than a wrapper, because the running
 * cycle carries buttons and a link may not contain them: the content passes taps
 * through to the overlay underneath, and `children` takes its own back.
 */
export function CycleRow({
  cycle,
  href,
  children,
}: {
  cycle: CycleListItem;
  href?: string;
  children?: React.ReactNode;
}) {
  const phase = PHASE[cycle.phase];
  const title = cycle.name ?? "دورة بدون اسم";
  const ended = cycle.phase === "ended";

  return (
    // The divider between rows belongs to the list, not to a row — the last one
    // has nothing under it to be divided from.
    <article className="relative flex flex-col gap-2 bg-surface-page px-screen py-4">
      {href && (
        // `prefetch` in full, not just to the loading boundary: a farm has a
        // handful of cycles, they are all on screen at once, and the page behind
        // a row is six database reads the server can just as well do while he is
        // still looking at the list. Only in production — Next never prefetches
        // from a dev server.
        <Link href={href} prefetch replace className="absolute inset-0">
          <span className="sr-only">تفاصيل {title}</span>
        </Link>
      )}

      {/* Identity: the cycle's number and name, with its phase pill.
          How long it ran used to sit at the inline-end and was dropped — it is a
          number nobody acts on from a list, and it says the same thing the row's
          own start/end dates already do (Khaled, 2026-08-20). It is still on the
          cycle's page, where the reader came to read numbers. */}
      <div className="pointer-events-none relative flex items-center gap-3.5">
        <h2 className="flex min-w-0 items-baseline gap-1">
          <span className="text-h5 font-bold text-foreground">
            {formatArabicNumber(cycle.seq)}-
          </span>
          <span className="truncate text-h6 font-bold text-heading">{title}</span>
        </h2>
        <Badge tone={phase.tone} size="sm">
          {phase.label}
        </Badge>
      </div>

      {/* When it ran, and on how many birds. */}
      <div className="pointer-events-none relative flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-disabled">
        <span className="flex items-center gap-1.5">
          <Icon name="calendarStart" size={14} aria-hidden />
          {/* yyyy/M/d so the digit run reads day → month → year right-to-left. */}
          بدأ في : {formatArabicDate(cycle.startDate, "yyyy/M/d")}
          {ended && cycle.endedAt && (
            <> · الي : {formatArabicDate(cycle.endedAt, "yyyy/M/d")}</>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <ChickIcon size={15} />
          {pluralizeChick(cycle.chickCount)}
        </span>
      </div>

      {/* Headline figures, right→left: profit · expenses · mortality. Profit only
          exists once the cycle is closed — until then sales are still coming in
          and a half-earned number would read as the final one. */}
      <div className="pointer-events-none relative flex items-start justify-between gap-2 pt-1">
        {ended && (
          <CycleRowStat
            icon="income"
            label="ربح الدورة"
            value={formatArabicNumber(cycle.netProfit)}
            /* A cycle can end under water — sold short, or ended early. Green on
               a loss would read as a win, so the tone follows the sign (Khaled,
               2026-08-20); the label stays «ربح الدورة» either way. */
            tone={cycle.netProfit < 0 ? "danger" : "brand"}
          />
        )}
        <CycleRowStat
          icon="payment"
          label="مصاريف الدورة"
          value={formatArabicNumber(cycle.expensesTotal)}
          tone="danger"
        />
        <CycleRowStat
          icon="mortality"
          label="عدد النافق"
          value={pluralizeChicken(cycle.mortalityCount)}
          tone="tan"
        />
      </div>

      {children}

      {/* What the cycle is still owed, and the way in. */}
      {href && (
        <div className="pointer-events-none relative flex items-center justify-between gap-2 pt-1">
          <p className="flex min-w-0 items-center gap-2 text-lg text-accent-brown">
            <Icon name="debt" size={24} className="shrink-0" aria-hidden />
            {cycle.debt > 0
              ? `متبقي مبلغ ديون ${formatCurrency(cycle.debt)}`
              : "لا توجد ديون خاصة بالدورة"}
          </p>
          <Icon
            name="openDetails"
            size={35}
            strokeWidth={2}
            absoluteStrokeWidth
            className="shrink-0 text-foreground"
            aria-hidden
          />
        </div>
      )}
    </article>
  );
}
