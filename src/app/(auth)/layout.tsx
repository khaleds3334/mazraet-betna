/**
 * Shared layout for the auth screens (login · register · pin).
 * Provides the page background, safe-area padding, and one narrow centered
 * column. Vertical placement is left to each page: login centers its content
 * with `my-auto`, register sits from the top. The Toaster is not mounted here —
 * auth feedback is inline under the field, not a toast.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="flex min-h-dvh flex-col bg-background px-6"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-[345px] flex-1 flex-col">
        {children}
      </div>
    </main>
  );
}
