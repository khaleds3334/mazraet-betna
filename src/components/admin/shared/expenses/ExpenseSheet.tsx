"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet, Chip, CloseButton } from "@/components/ui";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/lib/constants";
import type { CycleDashboard } from "@/lib/queries/cycles";
import { FeedExpenseForm } from "./FeedExpenseForm";
import { SimpleExpenseForm } from "./SimpleExpenseForm";
import { UtilitiesExpenseForm } from "./UtilitiesExpenseForm";

/** Right-to-left order — العلف sits on the right, matching the design. */
const CATEGORIES: ExpenseCategory[] = ["feed", "utilities", "medicine", "other"];

/**
 * "تسجيل مصاريف" (A-15): a bottom sheet with category chips and a per-category
 * form. العلف records a feed purchase (بادي/نامي bags + price → `feed`); every
 * other category records a description + amount (→ `expense`). Each form owns its
 * own save; `done` closes the sheet and refreshes the dashboard figures.
 *
 * **Closing it without saving throws the typing away.** Other sheets keep a
 * half-finished entry on purpose — a new cycle or a screen of weights is work you
 * don't want to redo — but this one opens on figures the app worked out for him:
 * the bags still to buy, and the price of the last bag. Half-edited numbers
 * sitting there on the next opening look exactly like those defaults, and he has
 * no way to tell that ١٤٠٠ is something he typed yesterday and not what the feed
 * actually costs (Khaled, 2026-08-21). Every opening starts from what the app
 * knows: category back to العلف, forms remounted through `session`.
 */
export function ExpenseSheet({
  open,
  onClose,
  feed,
}: {
  open: boolean;
  onClose: () => void;
  feed: CycleDashboard["feed"];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<ExpenseCategory>("feed");
  // Bumped on every opening; the forms are keyed on it, so each one arrives new.
  const [session, setSession] = useState(0);

  // Adjusting state to a changed prop, which React does during render rather than
  // in an effect: an effect would let one frame of the old numbers through as the
  // sheet slides up.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSession((n) => n + 1);
      setCategory("feed");
    }
  }

  function done() {
    onClose();
    router.refresh();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="تحديد نوع المصاريف"
      header={
        // Title AND chips are pinned: the chips are how you leave a long form,
        // and a form long enough to scroll is exactly when you want out of it —
        // the same reasoning that put the ✕ up here (T-45, Khaled 2026-08-21).
        <div className="flex flex-col gap-6 px-screen pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-h6 font-bold text-heading">تحديد نوع المصاريف</h2>
            <CloseButton onClick={onClose} />
          </div>

          {/* Category chips — horizontally scrollable, feed-first (right in RTL). */}
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={EXPENSE_CATEGORY_LABEL[c]}
                selected={category === c}
                onClick={() => setCategory(c)}
              />
            ))}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6 px-screen pt-2">
        {category === "feed" ? (
          <FeedExpenseForm key={session} feed={feed} onDone={done} />
        ) : category === "utilities" ? (
          <UtilitiesExpenseForm key={session} onDone={done} />
        ) : (
          <SimpleExpenseForm
            key={`${session}-${category}`}
            category={category}
            onDone={done}
          />
        )}
      </div>
    </BottomSheet>
  );
}
