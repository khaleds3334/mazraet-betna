import { Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

/**
 * The top of the order screen (C-20): the farm's line, then today's kilo price
 * (FR-26).
 *
 * Label on the right, price pill on the left (Figma 3855:1337) — the heading
 * leads and the number is what the eye lands on last. The pill is the shared
 * `Badge`, whose `accent` tone is documented as this exact thing: the kilo
 * price. Rolling a bespoke orange span here is how two of them end up drifting
 * apart.
 *
 * It belongs to the form rather than to the page because the success screen
 * (C-25) replaces the whole screen, tagline and all — a heading owned by the
 * page would have stayed behind it.
 */
export function OrderHeader({ salePrice }: { salePrice: number }) {
  return (
    <>
      <h1 className="px-screen pt-4 pb-2 text-center text-h3 font-bold text-primary-foreground">
        من مزرعتنا لبيتك بكل حب
      </h1>

      <div className="flex items-center justify-between gap-3 px-screen py-2">
        <h2 className="text-h6 font-bold text-primary-foreground">
          سعر كيلو الفراخ
        </h2>
        <Badge tone="accent">{formatCurrency(salePrice)}</Badge>
      </div>
    </>
  );
}
