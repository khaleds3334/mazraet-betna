/**
 * Register — "نورتنا لأول مرة" (C-04→C-06). Reached when the typed number isn't
 * a known customer or the admin. Placeholder for now; built in a later session.
 * It already receives the phone the user typed, ready to show and save.
 * Phone numbers stay in Latin digits (the FR-3 exception).
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;

  return (
    <div className="flex w-full max-w-[345px] flex-col items-center gap-4 text-center">
      <h1 className="text-h5 font-bold text-primary-foreground">نورتنا لأول مرة</h1>
      <p className="text-lg text-muted">شاشة تسجيل الاسم جاية قريب.</p>
      {phone && (
        <p className="text-lg text-foreground">
          الرقم اللي دخلت بيه: <span dir="ltr">{phone}</span>
        </p>
      )}
    </div>
  );
}
