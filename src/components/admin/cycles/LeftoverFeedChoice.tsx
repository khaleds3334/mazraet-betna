"use client";

import type { LeftoverFeedAnswer } from "@/lib/actions/cycles";
import { pluralizeBags } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The question «انتهاء فترة البيع» asks when feed is still sitting in the store
 * (FR-22, D-62).
 *
 * Bags left over are not a mistake in themselves — the admin buys a little over,
 * or the flock eats less than the forecast allowed for. But they mean one of
 * exactly two things and only he knows which, and both are invisible the moment
 * the cycle closes: either they were opened and he forgot to log them, or they
 * were never taken for this flock and its expenses are carrying feed it never
 * ate.
 *
 * Each answer says what it will do, in the line under it. This closes a cycle
 * and there is no undo, so neither option is allowed to be a guess.
 *
 * Rows rather than a dropdown or a pair of buttons: the same bordered,
 * one-of-several shape the cycle picker uses, at the size a thumb finds while
 * the other hand is busy.
 */
export function LeftoverFeedChoice({
  bags,
  value,
  onChange,
}: {
  /** Bags bought and never opened. */
  bags: number;
  value: LeftoverFeedAnswer | null;
  onChange: (answer: LeftoverFeedAnswer) => void;
}) {
  const options: {
    answer: LeftoverFeedAnswer;
    label: string;
    outcome: string;
  }[] = [
    {
      answer: "withdrawn",
      label: "اتسحبت فعلا وانا نسيت اسجّلها",
      outcome: "هنسجّلها مسحوبة النهاردة، ومصاريف الدورة زي ما هي",
    },
    {
      answer: "not-taken",
      label: "مااتاخدتش للدورة دي",
      outcome: "هنشيل تمنها من مصاريف الدورة",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-right text-base text-heading">
        لسه فيه <span className="font-bold">{pluralizeBags(bags)}</span> علف في
        المخزن. اتعمل فيها ايه؟
      </p>

      <div role="radiogroup" aria-label="العلف المتبقي" className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = value === option.answer;
          return (
            <button
              key={option.answer}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.answer)}
              className={cn(
                "flex min-h-14 flex-col items-start gap-1 rounded-xl border-2 px-3 py-2 text-right",
                selected
                  ? "border-primary-hover bg-primary-soft"
                  : "border-border bg-surface-page",
              )}
            >
              <span className="text-base font-bold text-heading">
                {option.label}
              </span>
              <span className="text-xs text-muted">{option.outcome}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
