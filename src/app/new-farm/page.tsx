import { notFound } from "next/navigation";
import { NewFarmForm } from "./NewFarmForm";

/**
 * ⚠️ DEV-ONLY — a scratch page for spinning up test farms (Khaled, 2026-08-22).
 * Delete this folder and `create_farm` (migration 022) when it has served its
 * purpose.
 *
 * Reached by typing /new-farm; it is linked from nowhere on purpose. Creating a
 * farm hands out an admin login, so in a production build the route does not
 * exist at all: `notFound()` runs before anything else on the page, and Next
 * renders the 404 rather than the form. That is a build-time fact, not a check
 * that could be bypassed — nothing here is reachable from a deployed app.
 */
export default function NewFarmPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center gap-6 px-6 py-10">
      <div className="rounded-2xl bg-warning-surface px-4 py-3 text-right text-sm text-heading">
        صفحة تجريبية للتطوير بس — مش موجودة في النسخة النهائية. بتعمل مزرعة جديدة
        بحساب دخول خاص بيها.
      </div>

      <NewFarmForm />
    </main>
  );
}
