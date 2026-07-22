import { Toaster } from "@/components/ui";

/**
 * Shell for the admin app (lives under /admin). Minimal for now — the full admin
 * dashboard is Phase 5. Mounts the toast host so admin screens have feedback.
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
      {children}
    </div>
  );
}
