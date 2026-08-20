"use client";

import { useState } from "react";
import { Button, InputField } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addExpense } from "@/lib/actions/expenses";
import type { ExpenseCategory } from "@/lib/constants";
import { toArabicDigits, toLatinDigits } from "@/lib/format";

/** The first field changes by category: a medicine name vs a free reason. */
const DESCRIPTION_FIELD: Partial<
  Record<ExpenseCategory, { label: string; placeholder: string }>
> = {
  medicine: { label: "اسم العلاج", placeholder: "مثال: مضاد حيوي" },
  other: { label: "التفاصيل", placeholder: "سبب المصروف" },
};

/**
 * The single-amount expense form (أدوية · أخرى): a description + a price, saved to
 * the `expense` table. The description label follows the category (اسم العلاج for
 * medicine, التفاصيل for other). Self-contained — its own state, its own save;
 * calls `onDone` after a successful save so the sheet can close + refresh.
 * (Feed and utilities have their own richer forms.)
 */
export function SimpleExpenseForm({
  category,
  onDone,
}: {
  category: ExpenseCategory;
  onDone: () => void;
}) {
  const descField = DESCRIPTION_FIELD[category] ?? DESCRIPTION_FIELD.other!;
  const toast = useToast();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    setError(null);
    if (amount <= 0) return setError("اكتب قيمة المصروف الأول.");

    setSubmitting(true);
    const res = await addExpense({ category, description, amount });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("تم تسجيل المصروف");
    onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      <InputField
        id="expense-description"
        label={descField.label}
        placeholder={descField.placeholder}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <InputField
        id="expense-amount"
        label="السعر"
        placeholder="٠"
        inputMode="numeric"
        suffix="جنية"
        error={error}
        value={amount > 0 ? toArabicDigits(amount) : ""}
        onChange={(e) => {
          const d = toLatinDigits(e.target.value);
          setAmount(d === "" ? 0 : Number(d));
        }}
      />

      <Button onClick={save} isLoading={submitting}>
        حفظ
      </Button>
    </div>
  );
}
