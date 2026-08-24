import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The four stages an order walks through, in order. Shared so the vertical
 * timeline here and the compact strip on the later states can never disagree
 * about what the stages are or what they are called.
 *
 * Spelling is corrected against the design, which has «زبح» for ذبح and «تقيم»
 * for تقييم (the sheet in 10-screen-naming-sheet.md collects these).
 */
export const ORDER_STEPS = [
  {
    icon: "ordersWaiting",
    title: "مراجعة الطلب",
    description: "يتم الان مراجعة طلب حضرتك و التأكد من توفر الاوزان المطلوبة",
  },
  {
    icon: "weight",
    title: "مرحلة وزن الفراخ",
    description:
      "هنا يتم وزن الفراخ و عرض الفاتورة النهائية بالوزن و السعر لكل فرخة و الاجمالي",
  },
  {
    icon: "ordersProcessing",
    title: "مرحلة ذبح و تنظيف الفراخ",
    description: "هنا يتم ذبح و تنظيف الفراخ و تكييس الفراخ و تجهيزها للاستلام",
  },
  {
    icon: "delivered",
    title: "المرحلة النهائية استلام الطلب",
    description:
      "هنا بيكون الطلب وصل لحضرتك و تقدر تقيّم الخدمة و تترك تعليق عن مستوي الخدمة",
  },
] as const satisfies readonly {
  icon: IconName;
  title: string;
  description: string;
}[];

/**
 * The vertical timeline on C-40 — where the order has got to, and what each
 * stage means. Only the stage it has reached is written in full colour; the
 * ones ahead of it are greyed, because they have not happened yet.
 *
 * The connector hangs off each icon rather than sitting between them, so the
 * last stage simply omits it and nothing has to know it is last.
 */
export function OrderSteps({
  activeStep = 0,
  badge,
}: {
  /** Index into `ORDER_STEPS` — the stage the order is at now. */
  activeStep?: number;
  /** Sits beside the active stage's title (the status pill in the design). */
  badge?: React.ReactNode;
}) {
  return (
    <ol className="flex flex-col">
      {ORDER_STEPS.map((step, index) => {
        const active = index === activeStep;
        const first = index === 0;
        const last = index === ORDER_STEPS.length - 1;

        return (
          // RTL: the first child of the row lands on the RIGHT, which is where
          // the design puts the circles — so the icon column is written first,
          // and inside the header the title before the badge.
          // Every stage is exactly as tall as its icon column — 64px circle
          // plus the 28px between circles — so the badge on the active one
          // cannot stretch it past the others. The design does the same: all
          // four steps are 96px there, set by the icon column and not the text.
          <li key={step.title} className="flex min-h-[92px] gap-4">
            {/* The circle sits halfway down its own section: a line segment
                above and below it, each taking whatever is left, so the two
                balance whatever the text does. The first stage has nothing
                above it and the last nothing below, and neither has to know
                it — the segment is simply left out. */}
            <div className="flex shrink-0 flex-col items-center">
              <div
                className={cn(
                  "w-px flex-1 border-l border-control-border",
                  first && "invisible",
                )}
              />

              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-full border",
                  active
                    ? "border-primary bg-surface text-foreground"
                    : "border-border text-muted",
                )}
              >
                <Icon name={step.icon} size={36} />
              </div>

              <div
                className={cn(
                  "w-px flex-1 border-l border-control-border",
                  last && "invisible",
                )}
              />
            </div>

            {/* A block, not a column of flex items, so the badge can float and
                the words run around it: the title and the first line of the
                description stop short of it, and the line under it takes the
                full width. That is also what keeps the gap under the title at
                4px on every stage — with the badge in the flow it was the
                badge's height that set it here, and this one sat lower than
                the rest. `self-center` centres the block in the 92px stage. */}
            <div className="flex-1 self-center py-3 text-right">
              {active && badge && (
                <span className="float-end ms-3">{badge}</span>
              )}

              <h2
                className={cn(
                  "text-base font-bold",
                  active ? "text-primary-foreground" : "text-muted",
                )}
              >
                {step.title}
              </h2>

              <p
                className={cn(
                  "mt-1 text-sm",
                  active ? "text-foreground" : "text-muted",
                )}
              >
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
