/**
 * The frame both faces of the orders screen share (A-50): a header pinned to the
 * top of `<main>` with the list moving underneath it, and the list itself.
 *
 * One scroll container, not two. The screen used to put a scrollable list inside
 * the already-scrollable `<main>`, and nesting two of them is what made the header
 * drift: a swipe can move either box, and whichever the browser picks, the other
 * still has slack left to give (T-35).
 */
export function OrdersShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="sticky top-0 z-10 flex flex-col gap-4 bg-background pt-3 pb-3">
        {header}
      </div>

      {/* The last card clears the tab bar through <main>'s bottom padding. */}
      <div className="px-screen pb-4">{children}</div>
    </>
  );
}
