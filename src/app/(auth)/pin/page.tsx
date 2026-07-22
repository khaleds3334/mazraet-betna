import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui";
import { PinForm } from "./PinForm";

/**
 * Admin PIN (A-04→A-06). Reached only when the entered phone is the farm owner.
 * Shows the phone (so the admin can double-check) and asks for the 6-digit PIN.
 * Phone numbers stay in Latin digits (the FR-3 exception).
 */
export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;

  // No phone means the user landed here directly — send them to log in first.
  if (!phone) redirect("/login");

  return (
    <div className="flex w-full flex-1 flex-col pt-4">
      <div className="flex justify-start">
        <BackButton href="/login" />
      </div>

      <h1 className="mt-12 text-center text-h5 font-bold text-heading">
        مرحبا بعودتك مرة اخري
      </h1>

      <p className="mt-6 text-right text-base leading-6 text-heading">
        للدخول للوحة التحكم لمزرعة بيتنا يرجي ادخال الرقم السري الخاص بك
      </p>

      <div className="mt-8 flex flex-col gap-3 font-bold text-primary-foreground">
        <span className="text-base">الحساب الخاص برقم التليفون</span>
        <span className="text-h6" dir="rtl">
          {phone}
        </span>
      </div>

      <div className="mt-8">
        <PinForm phone={phone} />
      </div>
    </div>
  );
}
