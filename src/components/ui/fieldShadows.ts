/**
 * Field state glows, straight from the Figma effect styles. These are one-off
 * input effects (focus + error), shared by the field components — kept here on
 * the components, not as global palette tokens. Each pairs with a transparent
 * border so the ring shows without shifting layout.
 */

// Green glow while a field is focused (#AEC77E — Surface/action-hover).
export const FIELD_ACTIVE_SHADOW =
  "border-transparent shadow-[0px_0px_4px_0px_rgba(174,199,126,0.2),0px_0px_0px_1px_rgba(174,199,126,0.6),0px_0px_1px_1px_rgba(174,199,126,0.5),0px_0px_0px_4px_rgba(174,199,126,0.2)]";

// Same glow as a `:focus-within` variant, for containers whose real input lives
// inside them (e.g. InputField) rather than tracked via a `isFocused` state.
export const FIELD_ACTIVE_SHADOW_WITHIN =
  "focus-within:border-transparent focus-within:shadow-[0px_0px_4px_0px_rgba(174,199,126,0.2),0px_0px_0px_1px_rgba(174,199,126,0.6),0px_0px_1px_1px_rgba(174,199,126,0.5),0px_0px_0px_4px_rgba(174,199,126,0.2)]";

// Red glow when a field is in error (#F87171 — Icons/error).
export const FIELD_ERROR_SHADOW =
  "border-transparent shadow-[0px_4px_4px_0px_rgba(248,113,113,0.08),0px_0px_0px_4px_rgba(248,113,113,0.08),0px_0px_1px_1px_rgba(248,113,113,0.15),0px_0px_0px_1px_rgba(248,113,113,0.4),0px_0px_4px_0px_rgba(248,113,113,0.1)]";
