import { ActionButton } from "./ActionButton";
import { Icon } from "./Icon";

/**
 * The pair of buttons at the foot of a confirm dialog: the action on the
 * inline-start and «الغاء» on the inline-end, sharing the row equally. The
 * design gives them fixed widths that add up to more than a 320px screen holds,
 * so they split it instead.
 *
 * Shared because both dialogs that turn a cycle's page (A-23 «بدء مرحلة البيع»
 * and the end-of-cycle confirm) draw the same pair, down to the red disc on the
 * cancel side. `disabled` blocks the action while leaving the way out open —
 * a dialog must always be answerable.
 */
export function ConfirmActions({
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  disabled = false,
}: {
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-stretch gap-3">
      <ActionButton
        variant="primary"
        onClick={onConfirm}
        isLoading={isLoading}
        disabled={disabled}
        className="flex-1"
      >
        {confirmLabel}
      </ActionButton>

      <ActionButton
        variant="danger"
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1"
      >
        {/* Decorative badge from the design — a filled red disc with a white ✕,
            sitting to the right of the label in RTL. Not a control; the whole
            pill is the control. */}
        <span
          aria-hidden
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-error text-white"
        >
          <Icon name="cancel" size={13} />
        </span>
        الغاء
      </ActionButton>
    </div>
  );
}
