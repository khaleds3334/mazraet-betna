"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardAction } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { advanceOrder } from "@/lib/actions/orders";
import { useToast } from "@/hooks/useToast";

/**
 * What a weighed order's card offers next (A-50). Weighing is behind it and the
 * invoice is settled, so both stages read the same: one button that hands the
 * order on, and the invoice beside it.
 *
 * The two stages differ only in wording and weight — lime while the birds are
 * still being prepared, dark green for the last step, which is the one the admin
 * should not tap by mistake.
 */
const STAGE = {
  weighed: {
    to: "ready",
    label: "جاهز للاستلام",
    icon: "checkDouble",
    done: "الطلب بقى جاهز للاستلام",
    variant: "primary",
  },
  ready: {
    to: "delivered",
    label: "تم استلام الطلب",
    icon: "delivered",
    done: "الطلب اتسلّم",
    variant: "brand",
  },
} as const satisfies Record<
  string,
  {
    to: "ready" | "delivered";
    label: string;
    icon: IconName;
    done: string;
    variant: "primary" | "brand";
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
      // Not a critical write — no money moved, and the card keeps showing the
      // true state either way — so a toast carries the right weight (rule 11).
      toast.error(result.error);
      return;
    }
    toast.success(step.done);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <CardAction
        variant={step.variant}
        icon={step.icon}
        grow
        onClick={advance}
        disabled={saving}
      >
        {step.label}
      </CardAction>

      {/* Not a control yet: the invoice screen (A-6x) is designed, not built. */}
      <CardAction variant="outline" icon="invoice" interactive={false}>
        الفاتورة
      </CardAction>
    </div>
  );
}
