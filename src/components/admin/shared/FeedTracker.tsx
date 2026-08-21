import { StatItem } from "@/components/ui";
import { remainingFeedBags } from "@/lib/calculations/feed";
import { formatArabicNumber } from "@/lib/format";
import type { CycleDashboard } from "@/lib/queries/cycles";
import { RecordFeedWithdrawalButton } from "./RecordFeedWithdrawalButton";

/**
 * The feed store at a glance: how many 50kg bags are needed for the whole cycle
 * (بادي / نامي), how many have been opened, and how many are left — with the
 * «سحب شكارة» action under them.
 *
 * Shown on the raising dashboard (A-11) and on the running cycle's row in the
 * list (A-44). Tiles read right→left: المطلوب · المسحوب · المتوفر.
 *
 * «المطلوب» is what is **still to buy** — the cycle's estimate minus what has
 * already been brought in, per phase. It used to hold the whole cycle's figure
 * for the whole cycle, so a store with every bag in it still read «١.٥ / ٥.٥» and
 * gave the admin nothing to act on; the number he wants standing in the feed shop
 * is how many more (Khaled, 2026-08-21). It reaches ٠ / ٠ once he has bought
 * everything, and the same subtraction fills the purchase form's bag counts.
 *
 * Halves and all (`١.٥ / ٥.٥`). It used to round to whole bags here to keep the
 * tile compact, while the create-cycle sheet showed the same cycle's halves — so
 * registering ١٠٠ كتكوت against «١.٥ و ٥.٥» landed on a dashboard saying «٢ و ٦»,
 * and one of the two had to be wrong. One number, in every place it appears.
 */
export function FeedTracker({ feed }: { feed: CycleDashboard["feed"] }) {
  const toBuy = remainingFeedBags(feed);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <StatItem
          label={"العلف\nالمطلوب"}
          value={`${formatArabicNumber(toBuy.badi)} / ${formatArabicNumber(toBuy.nami)}`}
        />
        <StatItem
          label={"العلف\nالمسحوب"}
          value={formatArabicNumber(feed.withdrawn)}
          valueClassName="text-accent-tan"
        />
        <StatItem
          label={"العلف\nالمتوفر"}
          value={formatArabicNumber(feed.available)}
        />
      </div>

      {/* Centered, at roughly the «تسجيل مصاريف» width — as the design places it. */}
      <div className="flex justify-center">
        <RecordFeedWithdrawalButton feed={feed} className="w-2/3" />
      </div>
    </div>
  );
}
