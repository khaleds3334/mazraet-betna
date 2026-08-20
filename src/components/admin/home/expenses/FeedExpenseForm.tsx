"use client";

import { useState } from "react";
import { Button, NumberStepper, StatItem } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addFeedPurchase } from "@/lib/actions/expenses";
import { ASSUMED_FEED_BAG_PRICE } from "@/lib/constants";
import type { CycleDashboard } from "@/lib/queries/cycles";
import { formatArabicNumber } from "@/lib/format";

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
    <div className="flex w-full flex-col gap-4">
      <p className="w-full text-right text-h6 font-bold text-foreground">{title}</p>
      <div className="flex items-start justify-between">
        <NumberStepper label={`عدد شكاير ${title}`} value={bags} onChange={onBags} />
        <NumberStepper
          label={`سعر شكارة ${title}`}
          value={price}
          onChange={onPrice}
          suffix="جنية"
          step={50}
        />
      </div>
    </div>
  );
}

/**
 * The feed-purchase form (العلف): the live feed figures, then starter (بادي) and
 * grower (نامي) bag counts + per-bag prices, saved to the `feed` table. Bag
 * counts pre-fill from what the cycle still needs; the price pre-fills with what
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
  const [badiBags, setBadiBags] = useState(Math.round(feed.requiredBadi));
  const [badiPrice, setBadiPrice] = useState(lastPrice);
  const [namiBags, setNamiBags] = useState(Math.round(feed.requiredNami));
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
          value={`${formatArabicNumber(Math.round(feed.requiredBadi))} / ${formatArabicNumber(Math.round(feed.requiredNami))}`}
        />
        <StatItem
          label={"العلف\nالمسحوب"}
          value={formatArabicNumber(feed.withdrawn)}
          valueClassName="text-accent-tan"
        />
        <StatItem label={"العلف\nالمتوفر"} value={formatArabicNumber(feed.available)} />
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
