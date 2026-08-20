"use client";

import { useState } from "react";
import { Button, InputField, NumberStepper } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addExpense } from "@/lib/actions/expenses";
import type { ExpenseCategory } from "@/lib/constants";
import { formatCurrency, toArabicDigits, toLatinDigits } from "@/lib/format";

/** The first field changes by category: a medicine name vs a free reason. */
const DESCRIPTION_FIELD: Partial<
  Record<ExpenseCategory, { label: string; placeholder: string }>
> = {
  medicine: { label: "اسم العلاج", placeholder: "مثال: مضاد حيوي" },
  other: { label: "التفاصيل", placeholder: "سبب المصروف" },
};

/**
 * The single-amount expense form (أدوية · أخرى): a description, how many, and the
 * price of one — saved to the `expense` table. The description label follows the
 * category (اسم العلاج for medicine, التفاصيل for other).
 *
 * The count starts at one, where the price field simply *is* the amount and the
 * form reads exactly as it always did. Raise it and the field relabels itself to
 * «سعر الوحدة» and the total appears underneath, because three bottles at ٨٠ is a
 * thing he buys and «١ × ٢٤٠» was the app making the arithmetic his problem. The
 * breakdown is what fills the العدد and السعر columns of the itemised table (A-47).
 *
 * Self-contained — its own state, its own save; calls `onDone` after a successful
 * save so the sheet can close + refresh. (Feed and utilities have richer forms.)
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
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const many = quantity > 1;

  async function save() {
    setError(null);
    if (unitPrice <= 0) return setError("اكتب قيمة المصروف الأول.");
    if (quantity <= 0) return setError("العدد لازم يكون واحد على الأقل.");

    setSubmitting(true);
    const res = await addExpense({
      category,
      description,
      quantity,
      unitPrice,
    });
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
      <NumberStepper label="العدد" value={quantity} onChange={setQuantity} />

      <div className="flex flex-col gap-2">
        <InputField
          id="expense-amount"
          label={many ? "سعر الوحدة" : "السعر"}
          placeholder="٠"
          inputMode="numeric"
          suffix="جنيه"
          error={error}
          value={unitPrice > 0 ? toArabicDigits(unitPrice) : ""}
          onChange={(e) => {
            const d = toLatinDigits(e.target.value);
            setUnitPrice(d === "" ? 0 : Number(d));
          }}
        />
        {/* Only worth saying once there is arithmetic to show. */}
        {many && unitPrice > 0 && (
          <p className="text-right text-sm text-muted">
            الاجمالي : {formatCurrency(quantity * unitPrice)}
          </p>
        )}
      </div>

      <Button onClick={save} isLoading={submitting}>
        حفظ
      </Button>
    </div>
  );
}
