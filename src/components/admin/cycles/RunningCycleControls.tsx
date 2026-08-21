import { FeedTracker } from "@/components/admin/shared/FeedTracker";
import { RecordActions } from "@/components/admin/shared/RecordActions";
import type { CycleDashboard, CycleListItem } from "@/lib/queries/cycles";
import { EndSellingButton } from "./EndSellingButton";

/**
 * Everything the admin can do to the running cycle from the list, stacked under
 * its row. What appears depends on where the cycle is:
 *
 *   • **التربية** (A-43) — the two record actions. The row is still a way in, so
 *     the rest of the cycle stays one tap away on the dashboard.
 *   • **البيع** (A-44) — the record actions, the feed store, and the button that
 *     ends the cycle. The row stops being a way in here, because everything the
 *     selling cycle can be asked is already on it.
 *
 * The pieces are shared with the dashboards — the same expense form, the same
 * feed tiles — so a bag of feed is recorded identically wherever he is standing.
 */
export function RunningCycleControls({
  phase,
  feed,
  openOrders,
  availableChickens,
}: {
  phase: CycleListItem["phase"];
  feed: CycleDashboard["feed"];
  /** Orders still open on this cycle — ending it is refused while any are. */
  openOrders: number;
  availableChickens: number;
}) {
  return (
    <div className="relative flex flex-col gap-4 pt-1">
      <RecordActions feed={feed} />

      {phase === "selling" && (
        <>
          <FeedTracker feed={feed} />
          <EndSellingButton
            openOrders={openOrders}
            availableChickens={availableChickens}
          />
        </>
      )}
    </div>
  );
}
