/**
 * Shared layout for the auth screens (login · register · pin).
 * Provides the page background, safe-area padding, and one narrow centered
 * column. Vertical placement is left to each page: login centers its content
 * with `my-auto`, register sits from the top. The Toaster is not mounted here —
 * auth feedback is inline under the field, not a toast.
 *
 * The gutter is `px-screen` like every other screen, not a raw 24 — it was the
 * last place in the app still holding one (Khaled, 2026-08-25). Identical at
 * 390px and up; below that the column stops being squeezed by a gutter drawn
 * for a wider phone, which on a 320px screen is 16px of field back.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="flex min-h-svh flex-col bg-background px-screen"
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
