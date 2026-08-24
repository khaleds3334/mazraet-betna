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
          <li key={step.title} className="flex gap-4">
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

            {/* 14px top and bottom, so consecutive stages sit 28px apart while
                the connector still runs unbroken between the circles. */}
            <div className="flex flex-1 flex-col gap-1 py-3.5 text-right">
              <div className="flex items-center justify-between gap-3">
                <h2
                  className={cn(
                    "text-base font-bold",
                    active ? "text-primary-foreground" : "text-muted",
                  )}
                >
                  {step.title}
                </h2>
                {active && badge}
              </div>

              <p
                className={cn(
                  "text-sm",
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
