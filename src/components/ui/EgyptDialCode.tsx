import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Egypt flag plus the dialling code, shown beside a phone number — the
 * login field and the admin PIN screen both use it.
 *
 * Two details that are easy to get wrong and hard to spot:
 * - The code is pinned `dir="ltr"`, so the "+" always lands before the digit
 *   rather than leaving the order to the bidi algorithm on an RTL page.
 * - Almarai draws "+" on the maths axis, 0.124em below where a digit centres,
 *   which reads as the sign sitting low against the number. The nudge puts it
 *   back on the digit's centre, in `em` so it holds at any font size.
 *
 * The flag is a static image exported from Figma, not a Hugeicon, so it renders
 * through `next/image` instead of `<Icon>`.
 */
export function EgyptDialCode({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <Image
        src="/images/flag-egypt.svg"
        alt=""
        width={22}
        height={22}
        className="size-[22px] shrink-0"
      />
      <span dir="ltr" className="text-heading">
        <span className="relative top-[-0.124em]">+</span>
        <span>2</span>
      </span>
    </span>
  );
}
