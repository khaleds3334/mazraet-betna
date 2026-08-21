import { redirect } from "next/navigation";
import { BackButton, EgyptDialCode } from "@/components/ui";
import { RegisterForm } from "./RegisterForm";

/**
 * Register — "نورتنا لأول مرة" (C-04→C-06). Reached only when the typed number is
 * new (login routes here). Shows the phone the user came with so they can catch a
 * typo, then asks for their name. Phone stays Latin (the FR-3 exception).
 */
export default async function RegisterPage({
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
        نورتنا لأول مرة!
      </h1>

      <p className="mt-6 text-right text-base leading-6 text-heading">
        الرقم دا جديد علينا، سجل اسمك علشان نعرفك، و لو مسجل قبل كدا اتأكد من رقم التليفون بتاعك يكون صحيح
      </p>

      {/* Stacked rather than label-and-value on one line: the longer label plus
          the flag and dial code do not fit across 360px. Same shape as the PIN
          screen, which shows the same thing. */}
      <div className="mt-8 flex flex-col gap-3 font-bold text-primary-foreground">
        <span className="text-base">رقم التليفون الي بتسجل بيه</span>

        {/* Dial code then the number — the row follows the page direction, so it
            reads right-to-left. The number itself is pinned LTR: it is a phone
            number, and it keeps Latin digits (the FR-3 exception). */}
        <span className="flex items-center gap-1.5 text-h6">
          <EgyptDialCode />
          <span dir="ltr">{phone}</span>
        </span>
      </div>

      <div className="mt-6">
        <RegisterForm phone={phone} />
      </div>
    </div>
  );
}
