import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { FIELD_ACTIVE_SHADOW_FOCUS } from "./fieldShadows";

/**
 * A labelled multi-line note box (the "اي ملاحظات" field). Separate from
 * `InputField` because it carries no suffix — it is a plain white card the
 * admin types a sentence into. It does share the focus glow, so a tapped note
 * field lights up the same way every other field in the app does.
 */
type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
};

export function TextareaField({
  id,
  label,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <label
        htmlFor={id}
        className="text-right text-lg text-primary-foreground"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={cn(
          "w-full resize-none rounded-xl border-2 border-border bg-white p-3.5 text-right text-sm text-primary-foreground outline-none transition-shadow",
          "placeholder:text-disabled",
          FIELD_ACTIVE_SHADOW_FOCUS,
          className,
        )}
        {...props}
      />
    </div>
  );
}
