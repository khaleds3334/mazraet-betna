/**
 * A titled block on a cycle dashboard — a bold heading with its tiles beneath.
 * Used for the three sections of A-20 (الفراخ / المالية / الطلبات) and the feed
 * tracker on A-11, so every section heading looks the same.
 */
export function StatSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h6 font-bold text-heading">{title}</h2>
      {children}
    </section>
  );
}
