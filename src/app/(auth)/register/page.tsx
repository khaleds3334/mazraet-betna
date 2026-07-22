import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui";
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
        عشان دي أول مرة تطلب مننا من خلال التطبيق، يا ريت نتعرف بيك عشان نسجل اسمك
        عندنا ونعرفك في الطلبات اللي جاية.
      </p>

      <div className="mt-8 flex items-center justify-between font-bold text-primary-foreground">
        <span className="text-base">رقم التليفون</span>
        <span className="text-h6" dir="ltr">
          {phone}
        </span>
      </div>

      <div className="mt-6">
        <RegisterForm phone={phone} />
      </div>
    </div>
  );
}
