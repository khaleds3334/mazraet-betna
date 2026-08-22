import type { Metadata } from "next";
import { Toaster } from "@/components/ui";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { BackGuard } from "@/components/layout/BackGuard";

/**
 * The admin half of the site advertises the **second** manifest, so "install"
 * from any admin screen adds «لوحة التحكم» to the home screen rather than a
 * second copy of the customer app. iOS ignores manifests entirely and reads the
 * page's own title and touch icon, which is why both are restated here.
 */
export const metadata: Metadata = {
  title: "لوحة التحكم",
  applicationName: "لوحة التحكم",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "لوحة التحكم",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/admin-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/admin-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/admin-apple-touch-icon.png",
  },
};

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
    // Fixed to the viewport (h-svh + overflow-hidden): the page body itself never
    // scrolls — only <main> scrolls internally. This stops the browser from
    // treating the document as scrollable and drawing the Android system-nav-bar
    // scrim, which otherwise seams against our bottom nav on taller screens.
    //
    // `svh`, never `dvh`: `dvh` is the viewport *right now*, so the shell grows
    // by ~60px the moment the browser retracts its address bar, and everything
    // sitting under the tab bar jumps into view mid-swipe as if the page had
    // scrolled a second time. `svh` is the height with the browser's UI showing
    // — a number that never changes — so the shell holds still.
    <div
      className="mx-auto flex h-svh w-full max-w-[430px] flex-col overflow-hidden bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Toaster />
      <BackGuard home="/admin" />
      {/* Bottom padding clears the fixed AdminBottomNav (its height + safe area).
          `overscroll-contain` keeps a swipe past the last row from reaching the
          document, which is what invites the browser to retract its address bar. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[calc(76px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <AdminBottomNav />
    </div>
  );
}
