/**
 * The chick glyph from the design (Figma "arcticons:emoji-chicken", A-11 header
 * "عدد الكتاكيت"). A bespoke stroke SVG exported from Figma because the Hugeicons
 * free pack has no live-chick glyph — same rationale as the bottom-nav icons
 * (T-19). Tints with the surrounding text via `currentColor`. `size` is the
 * height; width follows the glyph's own aspect ratio.
 */
export function ChickIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      height={size}
      width={size * (11.3381 / 15.625)}
      viewBox="0 0 11.3381 15.625"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8.00179 4.92797C8.00179 4.92797 9.20827 2.94598 8.65651 2.6726C8.10476 2.39922 7.27814 2.94598 7.27814 2.94598C7.27814 2.94598 7.82949 1.03153 6.72679 1.03153C5.62409 1.03153 5.34801 2.12504 5.34801 2.12504C5.34801 2.12504 4.94625 -0.14279 3.41788 0.484773C2.46274 0.877151 2.10882 2.19741 3.4876 4.93159M2.63625 8.41434C2.63625 8.26933 2.69434 8.13026 2.79774 8.02773C2.90114 7.92519 3.04138 7.86758 3.18761 7.86758C3.33383 7.86758 3.47407 7.92519 3.57747 8.02773C3.68087 8.13026 3.73896 8.26933 3.73896 8.41434M7.59881 8.41434C7.59881 8.26928 7.65692 8.13016 7.76036 8.02758C7.8638 7.92501 8.00409 7.86738 8.15037 7.86738C8.29665 7.86738 8.43694 7.92501 8.54037 8.02758C8.64381 8.13016 8.70192 8.26928 8.70192 8.41434M5.67476 9.50785C5.67476 9.50785 10.6377 9.23447 5.67476 14.4299C5.67476 14.4299 0.711394 9.50785 5.67476 9.50785Z" />
      <path d="M1.53313 7.32042C1.53313 7.32042 2.63583 4.31287 5.66907 4.31287C8.7023 4.31287 9.805 7.32042 9.805 7.32042C13.9409 14.9766 5.66907 15.25 5.66907 15.25C5.66907 15.25 -2.60281 14.9766 1.53313 7.32042Z" />
    </svg>
  );
}
