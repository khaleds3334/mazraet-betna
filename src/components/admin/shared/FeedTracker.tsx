import { StatItem } from "@/components/ui";
import { remainingFeedBags } from "@/lib/calculations/feed";
import { FEED_PHASE_TEXT } from "@/lib/feedColors";
import type { CycleDashboard } from "@/lib/queries/cycles";
import { FeedPhasePair } from "./FeedPhasePair";
import { RecordFeedWithdrawalButton } from "./RecordFeedWithdrawalButton";

/**
 * The feed store at a glance: how many 50kg bags are still to buy (بادي / نامي),
 * how many have been opened, and how many are left of each — with the «سحب شكارة»
 * action under them.
 *
 * Shown on the raising dashboard (A-11) and on the running cycle's row in the
 * list (A-44). Tiles read right→left: المطلوب · المسحوب · المتوفر.
 *
 * «المطلوب» is what is **still to buy** — the cycle's estimate minus what has
 * already been brought in, per phase. It used to hold the whole cycle's figure
 * for the whole cycle, so a store with every bag in it still read «١.٥ / ٥.٥» and
 * gave the admin nothing to act on; the number he wants standing in the feed shop
 * is how many more (D-44). It reaches ٠ / ٠ once he has bought everything, and the
 * same subtraction fills the purchase form's bag counts.
 *
 * Halves and all (`١.٥ / ٥.٥`). It used to round to whole bags here to keep the
 * tile compact, while the create-cycle sheet showed the same cycle's halves — so
 * registering ١٠٠ كتكوت against «١.٥ و ٥.٥» landed on a dashboard saying «٢ و ٦»,
 * and one of the two had to be wrong. One number, in every place it appears.
 *
 * **«المسحوب» carries each feed's own colour** — بادي lime, نامي tan (D-48) — so
 * the tile and the consumption grid under it name the same bag the same way. It
 * never changes colour: it is a running total, and going past the estimate is a
 * fact about one bag, marked on that bag's square below.
 *
 * **The red is one condition, said in two places** (D-46): a feed whose store has
 * run out. In المتوفر it marks the ٠ — that pile is gone. In المطلوب it marks the
 * bags he still owes the cycle, because owing bags is ordinary while owing them
 * with an empty store is the flock going hungry tomorrow. المطلوب at ٠ never
 * reddens: nothing more to buy is not a problem, whatever the store holds.
 */
export function FeedTracker({ feed }: { feed: CycleDashboard["feed"] }) {
  const toBuy = remainingFeedBags(feed);

  const badiOut = feed.availableBadi <= 0;
  const namiOut = feed.availableNami <= 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <StatItem
          label={"العلف\nالمطلوب"}
          value={
            <FeedPhasePair
              badi={toBuy.badi}
              nami={toBuy.nami}
              badiAlert={badiOut && toBuy.badi > 0}
              namiAlert={namiOut && toBuy.nami > 0}
            />
          }
        />
        <StatItem
          label={"العلف\nالمسحوب"}
          value={
            /* Always its own feed's colour. The tile is a running total, and a
               total that changes colour says the whole of it went past the
               estimate when only its last bag did — the grid below marks that
               bag, which is where it belongs (Khaled, 2026-08-21). */
            <FeedPhasePair
              badi={feed.withdrawnBadi}
              nami={feed.withdrawnNami}
              badiClassName={FEED_PHASE_TEXT.badi}
              namiClassName={FEED_PHASE_TEXT.nami}
            />
          }
        />
        <StatItem
          label={"العلف\nالمتوفر"}
          value={
            <FeedPhasePair
              badi={feed.availableBadi}
              nami={feed.availableNami}
              badiAlert={badiOut}
              namiAlert={namiOut}
            />
          }
        />
      </div>

      {/* Centered, at roughly the «تسجيل مصاريف» width — as the design places it. */}
      <div className="flex justify-center">
        <RecordFeedWithdrawalButton feed={feed} className="w-2/3" />
      </div>
    </div>
  );
}
