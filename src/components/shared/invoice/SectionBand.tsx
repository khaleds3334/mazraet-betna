/**
 * The full-bleed lime strip that names a section of the invoice — «الفاتورة»,
 * «الاوزان». It runs edge to edge while everything under it keeps the screen's
 * gutter, which is what separates one part of the paper from the next.
 */
export function SectionBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center justify-center bg-surface py-[5px]">
      <h3 className="text-h5 font-bold text-primary-foreground">{children}</h3>
    </div>
  );
}
