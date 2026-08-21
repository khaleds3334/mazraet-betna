import { BackButton } from "./BackButton";
import { cn } from "@/lib/utils";

/**
 * The top of a screen that is walked into rather than tabbed to: the title
 * centred across the whole width with the back button sitting at the start of
 * the row (Figma 3322:17105, A-70). Both apps use it — the customer's inner
 * screens are the same shape.
 *
 * The title is centred against the *screen*, not against the space left over
 * beside the button, which is what the design draws and what stops the heading
 * shifting between a screen that has a back button and one that does not. It is
 * laid over the row rather than placed in it, so it needs `pointer-events-none`
 * — otherwise the invisible half of a short title covers the button and eats the
 * tap. Its padding keeps a long title from running under the button; it wraps
 * instead.
 */
export function PageHeader({
  title,
  backHref,
  className,
}: {
  title: string;
  /** Omit on a screen with nowhere to go back to — the title still centres. */
  backHref?: string;
  className?: string;
}) {
  return (
    <header className={cn("relative flex min-h-12 items-center", className)}>
      {backHref && <BackButton href={backHref} />}

      <h1 className="pointer-events-none absolute inset-x-0 px-14 text-center text-h6 font-bold text-primary-foreground">
        {title}
      </h1>
    </header>
  );
}
