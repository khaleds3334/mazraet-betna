"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  Checkbox,
  Chip,
  CloseButton,
  InlineError,
  Modal,
  PickerField,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addFeedWithdrawal } from "@/lib/actions/expenses";
import { nextWithdrawalPhase } from "@/lib/calculations/feed";
import {
  FEED_PHASE_LABEL,
  NO_FEED_IN_STORE,
  onlyHalfBagLeft,
  outOfPhaseFeed,
  type FeedPhase,
} from "@/lib/constants";
import { ExpenseSheet } from "./expenses/ExpenseSheet";
import type { CycleDashboard } from "@/lib/queries/cycles";
import { formatArabicDate, formatArabicTime } from "@/lib/format";

/** Today as `yyyy-mm-dd` / now as `HH:mm`, so the admin can just tap حفظ. */
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowHHMM = () => new Date().toTimeString().slice(0, 5);

/**
 * "سحب شكارة" (A-13): the dashboard pill plus its "امتي فتحت الشكارة؟" popup — a
 * day picker, a time picker, and two questions about the bag itself, then حفظ.
 * Saving records the opening on the chosen day, which lights that day's square on
 * the consumption grid and lowers العلف المتوفر. Recording isn't a critical action,
 * so success/failure use a toast and the figures refresh on their own. Per D-17
 * the record is day-based; the time is captured in the form but the grid keys off
 * the day.
 *
 * **The two questions answer themselves.** Not in the Figma design — added on
 * Khaled's word (2026-08-21) — and they follow the rule the day and time already
 * set: arrive already filled in, so the admin standing over the store taps حفظ.
 *
 *   • **نصف شكارة** — off, unless that feed is down to its last half bag, in
 *     which case it arrives ticked. Being told «مفيش علف بادي» while half a bag
 *     sits in the store is both wrong and unhelpful; ticking the box he was going
 *     to tick anyway is the whole answer (Khaled, 2026-08-21).
 *   • **بادي / نامي** — whichever the quota says comes next
 *     (`nextWithdrawalPhase`): بادي until the cycle's بادي has been opened, then
 *     نامي. He can say otherwise, and then his answer is what is stored.
 *
 * **The shortage.** بادي and نامي are counted apart, so the store having bags is
 * not the same as the store having *these* bags: with ٢ بادي bought and ٣ needed,
 * the third opening has nothing to come out of. The popup says so and offers the
 * other feed — the real situation being that he hasn't bought the bag yet, and the
 * answer is either to buy it or to admit he is opening نامي instead.
 *
 * **A bag comes out of the store, so there has to be one in it.** With the store
 * at zero, حفظ is not dimmed — it is **replaced by «تسجيل مصاريف»**, which is the
 * thing he actually has to do next. A disabled button explains nothing; this one
 * closes the popup and opens the purchase sheet, and he comes back with feed. The
 * action checks again on the server; the count this was rendered with can be
 * minutes old.
 */
export function RecordFeedWithdrawalButton({
  feed,
  className,
}: {
  /** The cycle's feed standing — what each phase needs, holds, and has used. */
  feed: CycleDashboard["feed"];
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const suggested = nextWithdrawalPhase({
    withdrawnBadi: feed.withdrawnBadi,
    requiredBadi: feed.requiredBadi,
  });

  // What is left of each feed on its own — the pile this opening comes out of.
  const inStore: Record<FeedPhase, number> = {
    badi: feed.availableBadi,
    nami: feed.availableNami,
  };
  /** Ticked when that feed is down to its last half bag — nothing else is possible. */
  const halfByDefault = (p: FeedPhase) => inStore[p] > 0 && inStore[p] < 1;

  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState(false);
  const [day, setDay] = useState(todayISO);
  const [time, setTime] = useState(nowHHMM);
  const [half, setHalf] = useState(false);
  const [phase, setPhase] = useState<FeedPhase>(suggested);
  const [submitting, setSubmitting] = useState(false);

  const bags = half ? 0.5 : 1;
  /** Nothing at all in the store — a different situation from "not this feed". */
  const storeEmpty = feed.available <= 0;
  const short = !storeEmpty && inStore[phase] < bags;

  /** Every opening starts from what the store says today. */
  function openPopup() {
    setDay(todayISO());
    setTime(nowHHMM());
    setPhase(suggested);
    setHalf(halfByDefault(suggested));
    setOpen(true);
  }

  /** Switching feed re-asks the half question — each pile has its own answer. */
  function choosePhase(next: FeedPhase) {
    setPhase(next);
    setHalf(halfByDefault(next));
  }

  function close() {
    setOpen(false);
  }

  async function save() {
    if (storeEmpty || short) return;
    if (!day) {
      toast.error("اختار يوم فتح الشكارة الأول");
      return;
    }
    setSubmitting(true);
    const res = await addFeedWithdrawal({
      withdrawnOn: day,
      withdrawnAt: time,
      bags,
      phase,
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("تم تسجيل سحب الشكارة");
    close();
    router.refresh();
  }

  return (
    <>
      <ActionButton
        variant="outline"
        icon="add"
        onClick={openPopup}
        className={className}
      >
        سحب شكارة
      </ActionButton>

      <Modal
        open={open}
        onClose={close}
        label="امتي فتحت الشكارة؟"
        header={
          /* Title on the right, close on the left (app convention). */
          <div className="flex items-center justify-between">
            <p className="text-accent-brown">امتي فتحت الشكارة؟</p>
            <CloseButton onClick={close} size="sm" />
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-5">
          {/* Day on the right, time on the left — matches the design. */}
          <div className="grid grid-cols-2 gap-3">
            <PickerField
              id="withdrawal-day"
              label="اختار اليوم"
              placeholder="اختار التاريخ"
              icon="dateTime"
              type="date"
              value={day}
              display={day ? formatArabicDate(day) : ""}
              onChange={setDay}
            />
            <PickerField
              id="withdrawal-time"
              label="اختار الوقت"
              placeholder="اختر موعد"
              icon="arrowDown"
              type="time"
              value={time}
              display={time ? formatArabicTime(time, { period: "long" }) : ""}
              onChange={setTime}
            />
          </div>

          {/* Both questions on one row: what came out, and how much of it. The
              chips are pre-answered, so this reads as a confirmation more often
              than a choice — and switching them is the way out of the shortage
              below. No «نوع الشكارة» label above them; two words of feed and a
              checkbox say it themselves (Khaled, 2026-08-21). */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <Checkbox checked={half} onChange={setHalf} label="نصف شكارة" />

            <div className="flex gap-2">
              {(["badi", "nami"] as const).map((option) => (
                <Chip
                  key={option}
                  label={FEED_PHASE_LABEL[option]}
                  selected={phase === option}
                  onClick={() => choosePhase(option)}
                  className="min-h-11"
                />
              ))}
            </div>
          </div>

          {storeEmpty ? (
            <InlineError message={NO_FEED_IN_STORE} />
          ) : (
            short && (
              <InlineError
                message={
                  inStore[phase] > 0
                    ? onlyHalfBagLeft(phase)
                    : outOfPhaseFeed(phase)
                }
              />
            )
          )}

          {storeEmpty ? (
            // The popup gets out of the way of the thing he has to do first. It
            // closes before the sheet opens rather than stacking one over the
            // other: a sheet sits below a dialog on the layer ladder (T-40).
            <ActionButton
              variant="outline"
              icon="expenseEdit"
              onClick={() => {
                close();
                setExpenses(true);
              }}
              className="min-w-[152px] self-center px-8"
            >
              إضافة علف للمصاريف
            </ActionButton>
          ) : (
            <ActionButton
              variant="primary"
              onClick={save}
              disabled={short}
              isLoading={submitting}
              className="min-w-[152px] self-end px-8"
            >
              حفظ
            </ActionButton>
          )}
        </div>
      </Modal>

      <ExpenseSheet
        open={expenses}
        onClose={() => setExpenses(false)}
        feed={feed}
      />
    </>
  );
}
