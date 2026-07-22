/**
 * Admin home placeholder. The real dashboard (A-10→A-22) is built in Phase 5;
 * this exists so the admin has a valid landing page after entering the PIN.
 */
export default function AdminHomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-h4 font-extrabold text-heading">لوحة صاحب المزرعة</h1>
      <p className="text-muted">الصفحة تحت الإنشاء…</p>
    </main>
  );
}
