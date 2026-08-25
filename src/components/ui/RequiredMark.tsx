/**
 * The red star beside a question that has not been answered (Khaled,
 * 2026-08-25).
 *
 * It appears when the customer tries to send the order without answering, not
 * before: a star that is always there marks every question equally and so marks
 * none of them, and this form is two questions long. Shown only on the one he
 * skipped, it points.
 *
 * `aria-hidden` because it is the toast that carries the sentence — a screen
 * reader announcing «نجمة» in the middle of a heading says nothing useful.
 */
export function RequiredMark() {
  return (
    <span aria-hidden className="text-h3 leading-none text-error-soft">
      *
    </span>
  );
}
