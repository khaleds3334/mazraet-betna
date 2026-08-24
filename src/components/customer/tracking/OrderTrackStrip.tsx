import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import type { OrderStage } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The stages that get the flat strip. «قيد المراجعة» gets the timeline (C-40). */
export type TrackedStage = Extract<
  OrderStage,
  "weighed" | "cleaning" | "ready"
>;

/**
 * One mark on the strip. A **stage** is something the farm does to the order and
 * takes a 52px circle; a **gate** is the checkpoint between two stages and takes
 * a 34px one — smaller because it is not work being done, it is a fact becoming
 * true.
 *
 * Three looks, and the design uses the same one for a stage under way and a gate
 * still open — pale fill, lime edge. They mean the same thing: this is where the
 * order is standing right now.
 */
interface Mark {
  icon: IconName;
  gate?: boolean;
  state: "done" | "current" | "todo";
}

/**
 * **The strip is five marks, never six.** Between the four stages sit two gates:
 * the customer confirming the price (before slaughtering) and the order becoming
 * ready (before collection). The design shows only the one in play — the gate
 * just passed, or the one being waited on — so the row stays the same length at
 * every stage and the eye lands on the single checkpoint that matters.
 *
 * Written as three literal rows rather than derived from a longer chain: there
 * are exactly three states, the design draws all three, and a rule general
 * enough to produce them would take longer to read than they do.
 */
const STRIP: Record<TrackedStage, Mark[]> = {
  // Weighed, and the price is waiting on the customer — the open gate is the
  // only live thing on the strip, and the stages past it have not begun.
  weighed: [
    { icon: "ordersWaiting", state: "done" },
    { icon: "weight", state: "done" },
    { icon: "priceConfirm", gate: true, state: "current" },
    { icon: "ordersProcessing", state: "todo" },
    { icon: "delivered", state: "todo" },
  ],
  // Confirmed: the gate fills in, and the stage past it takes over as the live
  // one — the birds are being cleaned right now.
  cleaning: [
    { icon: "ordersWaiting", state: "done" },
    { icon: "weight", state: "done" },
    { icon: "priceConfirm", gate: true, state: "done" },
    { icon: "ordersProcessing", state: "current" },
    { icon: "delivered", state: "todo" },
  ],
  // Cleaning is finished, so the price gate is old news and the strip shows the
  // next one instead. Nothing is live: the order is waiting on the customer to
  // come, and «الاستلام» has not happened.
  ready: [
    { icon: "ordersWaiting", state: "done" },
    { icon: "weight", state: "done" },
    { icon: "ordersProcessing", state: "done" },
    { icon: "checkDouble", gate: true, state: "done" },
    { icon: "delivered", state: "todo" },
  ],
};

/** Lime fill · pale fill with a lime edge · nothing but a grey edge. */
const LOOK: Record<Mark["state"], string> = {
  done: "border-primary bg-primary text-foreground",
  current: "border-primary bg-surface text-foreground",
  todo: "border-muted text-muted",
};

/**
 * The compact stage strip on C-41→C-43 — the same four stages the vertical
 * timeline draws on C-40, laid flat. From «تم الوزن» onwards the invoice is what
 * the screen is for, and the stages become a reminder of where you are rather
 * than the subject.
 */
export function OrderTrackStrip({ stage }: { stage: TrackedStage }) {
  const marks = STRIP[stage];

  return (
    // RTL: the first child lands on the RIGHT, which is where the design starts
    // the order — «مراجعة الطلب» on the right, «الاستلام» on the left.
    //
    // The design's row is 302px, which does not fit a 320px phone (288px between
    // the gutters). So the circles are fixed and the RULES give way: `w-full`
    // hands the row the screen's width, and the only things in it allowed to
    // shrink are the lines between the marks. At 360px and up nothing shrinks
    // and the strip measures exactly as drawn.
    <ol className="flex w-full items-center justify-center">
      {marks.map((mark, index) => (
        <li key={mark.icon} className="flex items-center">
          {/* The rule between two marks hangs off the one after it, so the first
              mark simply has none and nothing has to know it is first. 20px
              between two stages and 10px beside a gate — the gate is 18px
              narrower, and the design spends that on its two rules. */}
          {index > 0 && (
            <span
              aria-hidden
              className={cn(
                // #6E7C73 in the design — the same grey at every stage, not
                // lime behind the marks already passed (checked against the
                // exported vector, not the render).
                // Shrinkable on purpose (no `shrink-0`), down to a floor —
                // a rule that vanishes turns the strip into loose beads.
                "h-px min-w-1 bg-muted",
                mark.gate || marks[index - 1].gate ? "w-2.5" : "w-5",
              )}
            />
          )}

          {/* Sized, not padded. Padding plus a border would make the circle
              54px, and these have to line up against a 52px design. */}
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border",
              mark.gate ? "size-[34px]" : "size-[52px]",
              LOOK[mark.state],
            )}
          >
            <Icon name={mark.icon} size={mark.gate ? 14 : 24} />
          </span>
        </li>
      ))}
    </ol>
  );
}
