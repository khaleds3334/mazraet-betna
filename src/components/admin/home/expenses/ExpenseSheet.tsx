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

  function done() {
    onClose();
    router.refresh();
  }

  return (
    <BottomSheet open={open} onClose={onClose} label="تحديد نوع المصاريف">
      <div className="flex flex-col gap-6 px-screen pt-6">
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

        {category === "feed" ? (
          <FeedExpenseForm feed={feed} onDone={done} />
        ) : category === "utilities" ? (
          <UtilitiesExpenseForm onDone={done} />
        ) : (
          <SimpleExpenseForm key={category} category={category} onDone={done} />
        )}
      </div>
    </BottomSheet>
  );
}
