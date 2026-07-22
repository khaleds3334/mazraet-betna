/**
 * Shared layout for the auth screens (login · register · pin).
 * Centers a single narrow column and respects the notch safe areas. The Toaster
 * is not mounted here — auth feedback is inline under the field, not a toast.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="flex min-h-dvh w-full items-center justify-center bg-background px-6"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {children}
    </main>
  );
}
