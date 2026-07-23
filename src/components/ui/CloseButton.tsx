import { Icon } from "./Icon";

/**
 * The round red close button used on sheets/modals (Figma: a #c65a5a circle with
 * a white cancel-02 glyph). Shared so every overlay closes with the same control.
 * `size` follows the design's two treatments: the bottom sheet uses the larger
 * `md` control; the centered popups (Modal) use the smaller `sm` one.
 */
export function CloseButton({
  onClick,
  label = "إغلاق",
  size = "md",
}: {
  onClick: () => void;
  label?: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-6" : "size-10";
  const glyph = size === "sm" ? 18 : 32;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex ${box} items-center justify-center rounded-full bg-error text-white`}
    >
      <Icon name="cancel" size={glyph} />
    </button>
  );
}
