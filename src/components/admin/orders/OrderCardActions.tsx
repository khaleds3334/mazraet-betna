import { Icon } from "@/components/ui";
import { CancelOrderButton } from "./CancelOrderButton";

/**
 * The two actions on a pending order card: weigh it, or cancel it.
 *
 * Cancelling is real (A-51). Weighing is still a plain box, not a button — it
 * opens the weighing screen (A-52), which isn't built, so nothing is tappable
 * that leads nowhere.
 */
export function OrderCardActions({ orderId }: { orderId: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-primary bg-primary px-3 text-base text-foreground">
        <span className="flex size-5 items-center justify-center">
          <Icon name="weight" size={14} />
        </span>
        <span className="optical-center">وزن الفراخ</span>
      </div>

      <CancelOrderButton orderId={orderId} />
    </div>
  );
}
