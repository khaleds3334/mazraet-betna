"use client";

import { Checkbox, InputField, Toggle } from "@/components/ui";
import type { CustomerOption } from "@/lib/queries/customers";
import { CustomerPicker } from "./CustomerPicker";

/** Who an order is for — the only part of A-56 with rules between its fields. */
export interface Recipient {
  customer: CustomerOption | null;
  /** No customer at all — the admin books it and links it later (FR-13). */
  orphan: boolean;
  /** The family's own birds: not a sale, so it belongs to nobody (FR-36). */
  isHouse: boolean;
  forSomeoneElse: boolean;
  onBehalfOf: string;
}

export const EMPTY_RECIPIENT: Recipient = {
  customer: null,
  orphan: false,
  isHouse: false,
  forSomeoneElse: false,
  onBehalfOf: "",
};

/**
 * The "who is this order for" half of the add-order sheet (A-56).
 *
 * Split out because it is the only part of the form whose fields answer to each
 * other: a house order belongs to nobody, so everything about a customer
 * disappears; an orphan order clears the picker and locks it, so the two can
 * never disagree. Keeping those rules in one place is what stops the sheet from
 * turning into a page of tangled setState calls.
 */
export function OrderRecipient({
  value,
  onChange,
  customers,
  autoFocus = false,
}: {
  value: Recipient;
  onChange: (recipient: Recipient) => void;
  customers: CustomerOption[];
  /** True while the sheet is open — puts the cursor in the customer search. */
  autoFocus?: boolean;
}) {
  const set = (patch: Partial<Recipient>) => onChange({ ...value, ...patch });

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {/* First, because it changes what the rest of the form means. */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-base text-heading">الطلب ده للبيت</span>
          <Toggle
            checked={value.isHouse}
            onChange={(isHouse) =>
              set(
                isHouse
                  ? { ...EMPTY_RECIPIENT, isHouse: true }
                  : { isHouse: false },
              )
            }
            label="الطلب ده للبيت"
          />
        </div>

        {value.isHouse ? (
          <p className="text-sm text-muted">
            الفراخ دي هتتشال من المتاح زي أي طلب، بس مش هتتحسب في ايراد الدورة
            ولا هتعمل آجل على حد.
          </p>
        ) : (
          <div className="flex flex-col">
            <CustomerPicker
              customers={customers}
              selected={value.customer}
              onSelect={(customer) => set({ customer })}
              disabled={value.orphan}
              autoFocus={autoFocus}
            />

            <div className="flex items-center justify-around gap-2">
              <Checkbox
                label="لحد تبع العميل؟"
                checked={value.forSomeoneElse}
                onChange={(forSomeoneElse) => set({ forSomeoneElse })}
              />
              <Checkbox
                label="طلب يتيم"
                checked={value.orphan}
                onChange={(orphan) =>
                  set(orphan ? { orphan, customer: null } : { orphan })
                }
              />
            </div>
          </div>
        )}
      </div>

      {value.forSomeoneElse && (
        <InputField
          id="on-behalf-of"
          label="الطلب باسم مين؟"
          value={value.onBehalfOf}
          onChange={(event) => set({ onBehalfOf: event.target.value })}
          placeholder="اسم اللي الفراخ ليه"
        />
      )}
    </>
  );
}
