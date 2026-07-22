import Image from "next/image";
import { LoginForm } from "./LoginForm";

/**
 * Login (C-01→C-03 / A-01→A-03). One shared phone screen for both apps; the
 * number decides where the user goes next (admin → PIN, customer → app,
 * unknown → register). Interactive parts live in the LoginForm island.
 */
export default function LoginPage() {
  return (
    <div className="flex w-full max-w-[345px] flex-col items-center gap-10">
      <Image
        src="/images/logo-primary.png"
        alt="مزرعة بيتنا"
        width={129}
        height={135}
        priority
      />

      <div className="flex w-full flex-col items-center gap-[42px]">
        <h1 className="text-center text-h6 font-bold leading-[22px] text-primary-foreground">
          اكتب رقم موبايلك عشان نقدر نتواصل معاك و تسجيل طلبك
        </h1>

        <LoginForm />
      </div>
    </div>
  );
}
