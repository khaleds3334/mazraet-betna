"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { advanceOrder } from "@/lib/actions/orders";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

/**
 * What a weighed order's card offers next (A-50). Weighing is behind it and the
 * invoice is settled, so both stages read the same: one button that hands the
 * order on, and the invoice beside it.
 *
 * The two stages differ only in wording and weight â lime while the birds are
 * still being prepared, dark green for the last step, which is the one the
 * admin should not tap by mistake.
 */
const STAGE = {
  weighed: {
    to: "ready",
    label: "Ø¬Ø§ÙØ² ÙÙØ§Ø³ØªÙØ§Ù",
    icon: "checkDouble",
    done: "Ø§ÙØ·ÙØ¨ Ø¨ÙÙ Ø¬Ø§ÙØ² ÙÙØ§Ø³ØªÙØ§Ù",
    button: "border-primary bg-primary text-foreground",
    glyph: "bg-primary text-foreground",
  },
  ready: {
    to: "delivered",
    label: "ØªÙ Ø§Ø³ØªÙØ§Ù Ø§ÙØ·ÙØ¨",
    icon: "delivered",
    done: "Ø§ÙØ·ÙØ¨ Ø§ØªØ³ÙÙÙ",
    button: "border-brand bg-brand text-surface-page",
    glyph: "bg-primary text-foreground",
  },
} as const satisfies Record<
  string,
  {
    to: "ready" | "delivered";
    label: string;
    icon: IconName;
    done: string;
    button: string;
    glyph: string;
  }
>;

export function OrderStageActions({
  orderId,
  stage,
}: {
  orderId: string;
  stage: keyof typeof STAGE;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const step = STAGE[stage];

  async function advance() {
    setSaving(true);
    const result = await advanceOrder(orderId, step.to);
    setSaving(false);

    if (!result.ok) {
      // Not a critical write â no money moved, and the card keeps showing the
      // true state either way â so a toast carries the right weight (rule 11).
      toast.error(result.error);
      return;
    }
    toast.success(step.done);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={advance}
        disabled={saving}
        className={cn(
          "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border px-3 text-base disabled:opacity-60",
          step.button,
        )}
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full",
            step.glyph,
          )}
        >
          <Icon name={step.icon} size={14} />
        </span>
        <span className="optical-center">{step.label}</span>
      </button>

      {/* A plain box, not a button: the invoice screen (A-6x) is designed but not
          built, and something that looks tappable and isn't is worse than
          something that plainly waits. It becomes a link the day that exists. */}
      <div className="flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-md border border-brand-olive bg-surface-page px-3 text-base text-foreground">
        <span className="flex size-5 items-center justify-center">
          <Icon name="invoice" size={14} />
        </span>
        <span className="optical-center">Ø§ÙÙØ§ØªÙØ±Ø©</span>
      </div>
    </div>
  );
}
