"use client";

import { useState } from "react";
import { Button, NumberStepper, StatItem } from "@/components/ui";
import { FeedPhasePair } from "../FeedPhasePair";
import { FEED_PHASE_TEXT } from "@/lib/feedColors";
import { useToast } from "@/hooks/useToast";
import { addFeedPurchase } from "@/lib/actions/expenses";
import { remainingFeedBags } from "@/lib/calculations/feed";
import { ASSUMED_FEED_BAG_PRICE } from "@/lib/constants";
import type { CycleDashboard } from "@/lib/queries/cycles";

/** One phase's inputs: bag count (right) + per-bag price (left), matching the design. */
function PhaseRow({
  title,
  bags,
  onBags,
  price,
  onPrice,
}: {
  title: string;
  bags: number;
  onBags: (n: number) => void;
  price: number;
  onPrice: (n: number) => void;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <p className="w-full text-right text-h6 font-bold text-foreground">{title}</p>
      {/* Wraps rather than squeezes: at 320px the count and the price no longer
          fit on one line, and a stepper narrow enough to fit is a stepper whose
          "+" the admin misses while weighing. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-5">
        {/* Half a bag is a real purchase, so the "+" moves in halves. */}
        <NumberStepper
          label={`عدد شكاير ${title}`}
          value={bags}
          onChange={onBags}
          step={0.5}
        />
        {/* By the pound, not by fifty: the field opens on what he paid last time,
            so what he does here is nudge it — and a ٥٠-جنيه step can't reach
            ١٤٧٠ from ١٤٥٠ at all (Khaled, 2026-08-21). Holding it gets there fast. */}
        <NumberStepper
          label={`سعر شكارة ${title}`}
          value={price}
          onChange={onPrice}
          suffix="جنية"
        />
      </div>
    </div>
  );
}

/**
 * The feed-purchase form (العلف): the live feed figures, then starter (بادي) and
 * grower (نامي) bag counts + per-bag prices, saved to the `feed` table. Bag
 * counts pre-fill with what the cycle still needs — the requirement minus what he
 * has already bought of that same phase; the price pre-fills with what
 * he paid for the last bag, since a price he already entered is a better guess
 * than a constant and usually needs no touching at all. Only the very first
 * purchase — nothing paid yet — falls back to `ASSUMED_FEED_BAG_PRICE`.
 * Calls `onDone` after a successful save.
 */
export function FeedExpenseForm({
  feed,
  onDone,
}: {
  feed: CycleDashboard["feed"];
  onDone: () => void;
}) {
  const toast = useToast();
  const lastPrice = feed.lastBagPrice ?? ASSUMED_FEED_BAG_PRICE;
  const remaining = remainingFeedBags({
    requiredBadi: feed.requiredBadi,
    requiredNami: feed.requiredNami,
    purchasedBadi: feed.purchasedBadi,
    purchasedNami: feed.purchasedNami,
  });
  // The tile above may read `-١` (a bag more than the estimate); a field that
  // opens on "buy minus one bag" would not.
  const [badiBags, setBadiBags] = useState(Math.max(0, remaining.badi));
  const [badiPrice, setBadiPrice] = useState(lastPrice);
  const [namiBags, setNamiBags] = useState(Math.max(0, remaining.nami));
  const [namiPrice, setNamiPrice] = useState(lastPrice);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (badiBags <= 0 && namiBags <= 0) {
      toast.error("اكتب عدد الشكاير الأول");
      return;
    }
    setSubmitting(true);
    const res = await addFeedPurchase({ badiBags, badiPrice, namiBags, namiPrice });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("تم تسجيل العلف");
    onDone();
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="grid grid-cols-3 gap-3">
        <StatItem
          label={"العلف\nالمطلوب"}
          value={
            <FeedPhasePair
              badi={remaining.badi}
              nami={remaining.nami}
              badiAlert={feed.availableBadi <= 0 && remaining.badi > 0}
              namiAlert={feed.availableNami <= 0 && remaining.nami > 0}
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
              badiAlert={feed.availableBadi <= 0}
              namiAlert={feed.availableNami <= 0}
            />
          }
        />
      </div>

      <PhaseRow
        title="إضافة شكارة علف بادي"
        bags={badiBags}
        onBags={setBadiBags}
        price={badiPrice}
        onPrice={setBadiPrice}
      />
      <PhaseRow
        title="إضافة شكارة علف نامي"
        bags={namiBags}
        onBags={setNamiBags}
        price={namiPrice}
        onPrice={setNamiPrice}
      />

      <Button onClick={save} isLoading={submitting}>
        حفظ
      </Button>
    </div>
  );
}
