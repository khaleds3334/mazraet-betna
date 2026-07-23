import { Toaster } from "@/components/ui";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";

/**
 * Shell for the admin app (lives under /admin): a centered mobile column with
 * the shared bottom nav and the toast host. Route protection (only the admin
 * reaches here) is handled in the middleware; this layout supplies the frame.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Fixed to the viewport (h-dvh + overflow-hidden): the page body itself never
    // scrolls — only <main> scrolls internally. This stops the browser from
    // treating the document as scrollable and drawing the Android system-nav-bar
    // scrim, which otherwise seams against our bottom nav on taller screens.
    <div
      className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Toaster />
      {/* Bottom padding clears the fixed AdminBottomNav (its height + safe area). */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(76px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <AdminBottomNav />
    </div>
  );
}
