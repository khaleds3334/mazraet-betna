import { StatItem } from "@/components/ui";
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
 */
export function FeedTracker({ feed }: { feed: CycleDashboard["feed"] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <StatItem
          label={"العلف\nالمطلوب"}
          value={`${formatArabicNumber(Math.round(feed.requiredBadi))} / ${formatArabicNumber(Math.round(feed.requiredNami))}`}
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
        <RecordFeedWithdrawalButton className="w-2/3" />
      </div>
    </div>
  );
}
