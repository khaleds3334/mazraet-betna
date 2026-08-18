import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * A labelled multi-line note box (the "اي ملاحظات" field). Separate from
 * `InputField` because it carries no inset glow and no suffix — it is a plain
 * white card the admin types a sentence into.
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
          "w-full resize-none rounded-xl border-2 border-border bg-white p-3.5 text-right text-sm text-primary-foreground outline-none",
          "placeholder:text-disabled",
          className,
        )}
        {...props}
      />
    </div>
  );
}
