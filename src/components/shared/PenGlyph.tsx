/**
 * The slim diagonal pen from the design (`solar:pen-linear`), marking an
 * editable note — the cancel reason on a cancelled order card.
 *
 * A bespoke design SVG rather than an icon name (T-19): Hugeicons' `PencilIcon`
 * is a different glyph entirely and `PencilEdit01Icon` carries a square behind
 * the nib, so neither matches. Traced from the Figma export and mirrored the way
 * the design places it, with the nib pointing down and to the right.
 */
export function PenGlyph({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={className}
      style={{ transform: "scaleX(-1)" }}
    >
      <path
        d="M3.49833 18.0642L6.2325 17.1525C6.87833 16.9375 7.20083 16.83 7.50417 16.6858C7.86208 16.5148 8.20044 16.3055 8.51333 16.0617C8.77833 15.855 9.01917 15.6142 9.5 15.1333L16.6008 8.03333L17.3733 7.26083C17.9879 6.6463 18.3331 5.81282 18.3331 4.94375C18.3331 4.07468 17.9879 3.2412 17.3733 2.62667C16.7588 2.01214 15.9253 1.6669 15.0563 1.6669C14.1872 1.6669 13.3537 2.01214 12.7392 2.62667L11.9667 3.39917L4.865 10.4992C4.38417 10.9808 4.14333 11.2217 3.93667 11.4867C3.69283 11.7996 3.48355 12.1379 3.3125 12.4958C3.16833 12.7992 3.06083 13.1225 2.84583 13.7675L1.93417 16.5017M16.6008 8.03333C16.6008 8.03333 14.96 7.93667 13.5117 6.48833C12.0633 5.04083 11.9675 3.39917 11.9675 3.39917M3.49833 18.0642L2.83 18.2875C2.67421 18.3397 2.50694 18.3475 2.34699 18.3099C2.18704 18.2723 2.04075 18.1908 1.92456 18.0746C1.80837 17.9584 1.72689 17.8121 1.68929 17.6522C1.65168 17.4922 1.65943 17.325 1.71167 17.1692L1.935 16.5008L3.49833 18.0642Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
