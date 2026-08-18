"use client";

import { useState } from "react";
import { Button, InputField } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addUtilitiesExpense } from "@/lib/actions/expenses";
import { toArabicDigits, toLatinDigits } from "@/lib/format";

/** A whole-number field (Arabic-Indic display, either digit set accepted). */
function NumericField({
  id,
  label,
  suffix,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  suffix: string;
  value: number;
  onChange: (n: number) => void;
  error?: string | null;
}) {
  return (
    <InputField
      id={id}
      label={label}
      placeholder="٠"
      inputMode="numeric"
      suffix={suffix}
      error={error}
      value={value > 0 ? toArabicDigits(value) : ""}
      onChange={(e) => {
        const d = toLatinDigits(e.target.value);
        onChange(d === "" ? 0 : Number(d));
      }}
    />
  );
}

/**
 * The utilities expense form (مياه وكهرباء, A-17): two bills. الكهرباء takes the
 * meter's start/end reading (optional, كيلو وات) plus the bill price; المياه takes
 * its bill price. Each non-empty bill is saved as its own `expense` row. Records
 * on success via a toast; validation (at least one bill) is inline.
 */
export function UtilitiesExpenseForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [elecStart, setElecStart] = useState(0);
  const [elecEnd, setElecEnd] = useState(0);
  const [elecBill, setElecBill] = useState(0);
  const [waterBill, setWaterBill] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    setError(null);
    if (elecBill <= 0 && waterBill <= 0) {
      return setError("اكتب قيمة فاتورة واحدة على الأقل.");
    }
    setSubmitting(true);
    const res = await addUtilitiesExpense({
      elecStart,
      elecEnd,
      elecBill,
      waterBill,
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
    <div className="flex flex-col gap-8">
      {/* الكهرباء — meter start/end (كيلو وات) + bill price. */}
      <div className="flex flex-col gap-4">
        <p className="text-right text-h6 font-bold text-foreground">الكهرباء</p>
        <div className="grid grid-cols-2 gap-3">
          <NumericField
            id="elec-start"
            label="البداية"
            suffix="كيلو وات"
            value={elecStart}
            onChange={setElecStart}
          />
          <NumericField
            id="elec-end"
            label="النهاية"
            suffix="كيلو وات"
            value={elecEnd}
            onChange={setElecEnd}
          />
        </div>
        <NumericField
          id="elec-bill"
          label="سعر الفاتورة"
          suffix="جنية"
          value={elecBill}
          onChange={setElecBill}
        />
      </div>

      {/* المياه — bill price only. */}
      <div className="flex flex-col gap-4">
        <p className="text-right text-h6 font-bold text-foreground">المياه</p>
        <NumericField
          id="water-bill"
          label="سعر الفاتورة"
          suffix="جنية"
          value={waterBill}
          onChange={setWaterBill}
          error={error}
        />
      </div>

      <Button onClick={save} isLoading={submitting}>
        حفظ
      </Button>
    </div>
  );
}
