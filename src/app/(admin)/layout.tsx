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
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Toaster />
      {/* Bottom padding clears the fixed AdminBottomNav (its height + safe area). */}
      <main className="flex flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <AdminBottomNav />
    </div>
  );
}
