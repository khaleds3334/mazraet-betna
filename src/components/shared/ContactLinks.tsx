import { PhoneGlyph, WhatsAppGlyph } from "./ContactGlyphs";
import { whatsappNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";

/**
 * The two round contact shortcuts beside a customer: a phone call and WhatsApp.
 * Used on the order card (A-50) and on each customer row (A-30).
 * FR-12 has the admin ringing the customer when the weights he asked for aren't
 * available, so these are the fastest path out of the list to a conversation.
 *
 * The marks themselves live in `ContactGlyphs` — the customer's «تواصل معنا»
 * popup draws the same two at its own sizes (T-19, T-73).
 */
const CIRCLE =
  "flex size-[38px] shrink-0 items-center justify-center rounded-full bg-surface text-foreground";

export function ContactLinks({
  phone,
  className,
}: {
  phone: string;
  /** Lets a screen set its own spacing — A-30 draws the pair 8px apart. */
  className?: string;
}) {
  // Call first, so right-to-left the row reads number → call → WhatsApp, which is
  // the order both designs draw (order card 3295:9577, customer row 3281:5648).
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <a href={`tel:${phone}`} aria-label="اتصال بالعميل" className={CIRCLE}>
        <PhoneGlyph className="size-[18px]" />
      </a>

      <a
        href={`https://wa.me/${whatsappNumber(phone)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="مراسلة على واتساب"
        className={CIRCLE}
      >
        <WhatsAppGlyph className="size-[18px]" />
      </a>
    </div>
  );
}
