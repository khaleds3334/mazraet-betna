import { ComingSoon } from "@/components/ui";

/**
 * One order's tracking + invoice (C-40→C-46). Stub until the screen is built —
 * exists so «تتبع حالة الطلب» on the order-success screen (C-25) lands somewhere
 * instead of 404-ing straight after a customer's first order.
 */
export default function OrderTrackingPage() {
  return <ComingSoon title="تفاصيل الطلب" />;
}
