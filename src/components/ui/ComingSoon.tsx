/**
 * Placeholder for a screen that isn't built yet. Renders the section title and a
 * short "coming soon" line, centered — so a nav tab or button link resolves to a
 * real page instead of a 404 (which would show English to users who read none).
 * Replaced by the actual screen when its phase lands.
 */
export function ComingSoon({
  title,
  message = "الصفحة قيد الإنشاء…",
}: {
  title: string;
  message?: string;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-screen text-center">
      <h1 className="text-h5 font-bold text-heading">{title}</h1>
      <p className="text-muted">{message}</p>
    </main>
  );
}
