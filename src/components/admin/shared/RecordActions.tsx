import { RecordExpenseButton } from "./expenses/RecordExpenseButton";
import { RecordMortalityButton } from "./RecordMortalityButton";
import type { CycleDashboard } from "@/lib/queries/cycles";

/**
 * The two things the admin records about a running cycle without leaving the
 * screen: «تسجيل مصاريف» (wide, on the inline-start) and «تسجيل نافق» on the
 * inline-end. One pair, drawn identically on the raising dashboard (A-11) and on
 * the running cycle's row in the list (A-43/A-44) — so a bag of feed is recorded
 * the same way from either, and there is one arrangement to keep correct.
 *
 * `feed` is what is in the store right now; the expense sheet's العلف form opens
 * on it. `available` is the birds the flock still has free — the ceiling on what
 * «تسجيل نافق» will accept (FR-23).
 */
export function RecordActions({
  feed,
  available,
}: {
  feed: CycleDashboard["feed"];
  available: number;
}) {
  return (
    <div className="flex items-stretch justify-between gap-3">
      <RecordExpenseButton feed={feed} className="flex-1" />
      <RecordMortalityButton available={available} className="shrink-0" />
    </div>
  );
}
