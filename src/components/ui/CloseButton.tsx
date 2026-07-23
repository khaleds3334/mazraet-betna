import { Icon } from "./Icon";

/**
 * The round red close button used on sheets/modals (Figma: a #c65a5a circle with
 * a white cancel-02 glyph). Shared so every overlay closes with the same control.
 */
export function CloseButton({
  onClick,
  label = "إغلاق",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full bg-error text-white"
    >
      <Icon name="cancel" size={32} />
    </button>
  );
}
