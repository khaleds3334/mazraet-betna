"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Button,
  FarmSaleCard,
  InlineError,
  PickerField,
  Stepper,
  WeightBadge,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { ChangeLoginPhoneFields } from "./ChangeLoginPhoneFields";
import { ChangePinFields } from "./ChangePinFields";
import { ContactPhoneField } from "./ContactPhoneField";
import { saveSettings, setSaleOpen } from "@/lib/actions/settings";
import { formatArabicDate } from "@/lib/format";
import type { CurrentFarm } from "@/lib/queries/admin";
import type { FarmSettings } from "@/lib/queries/settings";
import type { SaleControlState } from "@/lib/queries/settings";
import { OFFERED_WEIGHTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The body of A-70. Everything except the sale switch is edited freely and
 * committed by «حفظ الاعدادات»; the switch writes the moment it is tapped,
 * because closing the sale is visible to every customer and must not sit
 * unsaved on a screen the admin has walked away from.
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
  farm: Pick<
    CurrentFarm,
    "contactPhone" | "usesOwnerPhone" | "loginPhone"
  >;
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

  function save() {
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
      } catch {
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  const dateLabel = sale.editingSaleEnd ? "تاريخ انتهاء البيع" : "تاريخ بدء البيع";

  return (
    <div className={cn("flex flex-1 flex-col gap-6 pb-4", className)}>
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

      <div className="flex flex-col gap-2">
        <p className="text-right text-base text-heading">الاوزان المتوفرة</p>

        {/* The row scrolls on its own. Eight 70px badges are wider than a phone,
            and left in the page flow they made the whole screen scroll sideways
            — every other section drifting with them. `-mx-screen` + matching
            padding lets it run edge to edge while the rest of the page keeps its
            margin, and `overscroll-x-contain` stops a swipe that runs out of
            badges from turning into a back-navigation. */}
        <div
          role="group"
          className="-mx-screen flex items-center gap-3 overflow-x-auto overscroll-x-contain px-screen pb-1"
        >
          {OFFERED_WEIGHTS.map((weight) => (
            <WeightBadge
              key={weight}
              weight={weight}
              selected={weights.includes(weight)}
              onSelect={() => toggleWeight(weight)}
            />
          ))}
        </div>
      </div>

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

      <ChangeLoginPhoneFields current={farm.loginPhone} />

      <ChangePinFields />

      {error && <InlineError message={error} />}

      <div className="pt-2">{logout}</div>

      {/* «حفظ الاعدادات» takes the tab bar's place (the bar is hidden on this
          route) so it sits where the thumb already rests, instead of at the end
          of a list the admin has to scroll to reach. Same geometry as the bar:
          the shell's column width, lifted clear of the gesture strip. <main>
          already reserves the height, so nothing hides underneath it. */}
      <div
        className="fixed inset-x-0 z-40 mx-auto max-w-[430px] bg-background px-screen py-4"
        style={{ bottom: "env(safe-area-inset-bottom)" }}
      >
        <Button onClick={save} isLoading={isSaving}>
          حفظ الاعدادات
        </Button>
      </div>
    </div>
  );
}
