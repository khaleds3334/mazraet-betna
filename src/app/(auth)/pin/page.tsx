/**
 * Admin PIN (A-04→A-06). Reached only when the entered phone is the farm owner.
 * Shows the phone (so the admin can double-check) and asks for the 6-digit PIN.
 * Placeholder for now; the PIN entry + verification is built in a later session.
 * Phone numbers stay in Latin digits (the FR-3 exception).
 */
export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;

  return (
    <div className="flex w-full max-w-[345px] flex-col items-center gap-4 text-center">
      <h1 className="text-h5 font-bold text-primary-foreground">أهلاً يا ريّس</h1>
      <p className="text-lg text-muted">شاشة الرقم السري جاية قريب.</p>
      {phone && (
        <p className="text-lg text-foreground">
          دخلت برقم: <span dir="ltr">{phone}</span>
        </p>
      )}
    </div>
  );
}
