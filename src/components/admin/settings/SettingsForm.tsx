"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  ActionButton,
  Button,
  CloseButton,
  FarmSaleCard,
  InlineError,
  Modal,
  PickerField,
  Stepper,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { ChangeLoginPhoneFields } from "./ChangeLoginPhoneFields";
import { ChangePinFields } from "./ChangePinFields";
import { ContactPhoneField } from "./ContactPhoneField";
import { WeightsRow } from "./WeightsRow";
import { saveSettings, setSaleOpen } from "@/lib/actions/settings";
import { formatArabicDate } from "@/lib/format";
import { setLeaveGuard } from "@/lib/leaveGuard";
import type { CurrentFarm } from "@/lib/queries/admin";
import type { FarmSettings } from "@/lib/queries/settings";
import type { SaleControlState } from "@/lib/queries/settings";
import { cn } from "@/lib/utils";

/** The same weights, whatever order they happened to be tapped in. */
function sameWeights(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((weight, i) => weight === right[i]);
}

/**
 * The body of A-70. Everything except the sale switch is edited freely and
 * committed by «حفظ الاعدادات»; the switch writes the moment it is tapped,
 * because closing the sale is visible to every customer and must not sit
 * unsaved on a screen the admin has walked away from.
 *
 * Because everything else *is* held, two things follow. «حفظ الاعدادات» is
 * blurred and inert until something on the screen differs from what the farm
 * has — a live save button on an unchanged screen invites a tap that does
 * nothing and teaches him the button means nothing. And leaving with work on
 * the screen asks first: walking away is how that work gets thrown out, and
 * nothing on the next screen would tell him it had been (Khaled, 2026-08-22).
 *
 * Failures are inline, not toasts: settings decide what customers are charged
 * and whether they can order at all, so a missed auto-dismissed message would
 * leave the admin believing a price he never saved (rule 11 / T-09). The
 * successes are toasts — nothing is lost by missing one.
 */
export function SettingsForm({
  settings,
  sale,
  farm,
  logout,
  className,
}: {
  settings: FarmSettings;
  sale: SaleControlState;
  /** Only what this screen edits — the number customers ring. */
  farm: Pick<CurrentFarm, "contactPhone" | "usesOwnerPhone" | "loginPhone">;
  /** The sign-out row, rendered by the page so this stays a pure form. */
  logout: ReactNode;
  className?: string;
}) {
  const toast = useToast();

  const [salePrice, setSalePrice] = useState(settings.salePrice);
  const [cleaningPrice, setCleaningPrice] = useState(settings.cleaningPrice);
  const [weights, setWeights] = useState<number[]>(settings.availableWeights);
  const [date, setDate] = useState(sale.date);
  const [contactPhone, setContactPhone] = useState(
    farm.usesOwnerPhone ? "" : farm.contactPhone,
  );

  const [saleOpen, setSaleOpenState] = useState(sale.open);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isToggling, startToggling] = useTransition();

  // The difference between what is on the screen and what the farm actually has.
  // It clears itself after a save: the action revalidates, the page hands these
  // values back down as props, and the comparison stops finding anything.
  const dirty =
    salePrice !== settings.salePrice ||
    cleaningPrice !== settings.cleaningPrice ||
    date !== sale.date ||
    contactPhone !== (farm.usesOwnerPhone ? "" : farm.contactPhone) ||
    !sameWeights(weights, settings.availableWeights);

  // Read from inside the leave guard, which is registered once and would
  // otherwise close over whatever `dirty` was on the first render.
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  /** Where the admin was heading when we stopped him. */
  const leaveTo = useRef<(() => void) | null>(null);
  const [asking, setAsking] = useState(false);

  // Anything that takes him off this screen — the back arrow, the phone's back
  // gesture — asks here first, and only gets an answer while there is something
  // to lose.
  useEffect(() => {
    setLeaveGuard((proceed) => {
      if (!dirtyRef.current) return false;
      leaveTo.current = proceed;
      setAsking(true);
      return true;
    });
    return () => setLeaveGuard(null);
  }, []);

  function toggleWeight(weight: number) {
    setWeights((current) =>
      current.includes(weight)
        ? current.filter((w) => w !== weight)
        : [...current, weight],
    );
  }

  function toggleSale(next: boolean) {
    setError(null);
    // Moved straight away so the switch answers the tap; put back if the write
    // is refused, rather than leaving it showing a state the farm is not in.
    setSaleOpenState(next);

    startToggling(async () => {
      try {
        const result = await setSaleOpen(next);
        if (!result.ok) {
          setSaleOpenState(!next);
          setError(result.error);
          return;
        }
        toast.success(next ? "البيع اتفتح" : "البيع اتقفل");
      } catch {
        setSaleOpenState(!next);
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  /** `then` runs only on a clean save — it is how «احفظ واخرج» gets to leave. */
  function save(then?: () => void) {
    setError(null);

    startSaving(async () => {
      try {
        const result = await saveSettings({
          salePrice,
          cleaningPrice,
          availableWeights: weights,
          saleDate: date,
          editingSaleEnd: sale.editingSaleEnd,
          contactPhone,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("الاعدادات اتحفظت");
        then?.();
      } catch {
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  /** Take the pending destination, so a refused save cannot leave twice. */
  function claimDestination(): (() => void) | null {
    const go = leaveTo.current;
    leaveTo.current = null;
    setAsking(false);
    return go;
  }

  const dateLabel = sale.editingSaleEnd
    ? "تاريخ انتهاء البيع"
    : "تاريخ بدء البيع";

  return (
    <div className={cn("flex flex-1 flex-col gap-6 pb-6", className)}>
      <FarmSaleCard
        open={saleOpen}
        hint={sale.hint}
        disabled={!sale.canToggle || isToggling}
        onChange={toggleSale}
      />

      {/* `Stepper` uses its label for the screen reader only, so the visible
          one is written here — the design puts it above each number. */}
      <div className="flex flex-col gap-2">
        <p className="text-right text-base text-heading">سعر كيلو الفراخ؟</p>
        <Stepper
          value={salePrice}
          onChange={setSalePrice}
          label="سعر كيلو الفراخ"
          min={1}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-right text-base text-heading">سعر التنظيف؟</p>
        <Stepper
          value={cleaningPrice}
          onChange={setCleaningPrice}
          label="سعر التنظيف"
        />
      </div>

      <WeightsRow selected={weights} onToggle={toggleWeight} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-right text-heading">
          <p className="text-base">
            {sale.editingSaleEnd ? "فترة البيع تنتهي في" : "فترة البيع تبدء في"}
          </p>
          <p className="text-xs">
            {sale.editingSaleEnd
              ? "البيع شغال — حدد اخر يوم للطلبات"
              : sale.minDate
                ? `الفراخ هتجهز يوم ${formatArabicDate(sale.minDate)} — مينفعش تحدد قبل كده`
                : "لا توجد دورة نشطة حاليا - حدد متي يبدء البيع"}
          </p>
        </div>

        <PickerField
          id="sale-date"
          label={dateLabel}
          placeholder="اختار التاريخ"
          icon="dateTime"
          type="date"
          value={date}
          display={date ? formatArabicDate(date) : ""}
          min={sale.minDate || undefined}
          onChange={setDate}
        />
      </div>

      <ContactPhoneField
        value={contactPhone}
        onChange={(phone) => {
          setContactPhone(phone);
          if (error) setError(null);
        }}
        ownerPhone={farm.contactPhone}
        usesOwnerPhone={farm.usesOwnerPhone}
      />

      {/* The two credentials keep company: they are the only controls here that
          open something instead of editing it, and they save on their own. Their
          own space above, matching the gap under them to the sign-out row, so
          the pair reads as its own block and not as the tail of the form. */}
      <div className="flex flex-col gap-4 pt-4">
        <ChangeLoginPhoneFields current={farm.loginPhone} />
        <ChangePinFields />
      </div>

      {error && <InlineError message={error} />}

      <div className="pt-2">{logout}</div>

      {/* «حفظ الاعدادات» takes the tab bar's place (the bar is hidden on this
          route) so it sits where the thumb already rests, instead of at the end
          of a list the admin has to scroll to reach. Same geometry as the bar:
          the shell's column width, lifted clear of the gesture strip. <main>
          already reserves the height, so nothing hides underneath it. */}
      <div
        className="fixed inset-x-0 z-40 mx-auto max-w-[430px] bg-background border-t-2 border-border px-screen py-4"
        style={{ bottom: "env(safe-area-inset-bottom)" }}
      >
        <Button onClick={() => save()} isLoading={isSaving} locked={!dirty}>
          حفظ الاعدادات
        </Button>
      </div>

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        label="فيه تعديلات مش متحفوظة"
        header={
          <div className="flex items-center justify-between gap-2">
            <p className="text-h6 font-bold text-heading">
              فيه تعديلات مش متحفوظة
            </p>
            {/* Dismissing is the third answer, and the safest one: he stays on
                the screen with everything he changed still on it. */}
            <CloseButton onClick={() => setAsking(false)} size="sm" />
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-4">
          <p className="text-right text-base text-heading">
            غيّرت حاجات في الاعدادات ولسه محفظتهاش. لو خرجت دلوقتي هتضيع.
          </p>

          {/* Stacked rather than side by side: «اخرج من غير حفظ» is too long to
              share a 320px row with anything, and this is a question worth
              reading one line at a time. */}
          <div className="flex flex-col gap-3">
            <ActionButton
              variant="primary"
              isLoading={isSaving}
              onClick={() => {
                const go = claimDestination();
                save(() => go?.());
              }}
              className="w-full"
            >
              احفظ واخرج
            </ActionButton>

            <ActionButton
              variant="danger"
              disabled={isSaving}
              onClick={() => claimDestination()?.()}
              className="w-full"
            >
              اخرج من غير حفظ
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
