import { PageHeader } from "@/components/ui";

/**
 * The top of «طلباتك السابقة» — the title with its back button, and the line
 * under it (C-50 → C-52).
 *
 * One component because both halves of the screen open with it: the empty state
 * and the list. Written twice, the caption's measure would be nudged on one and
 * not the other.
 */
export function HistoryHeading() {
  return (
    <>
      <PageHeader
        title="طلباتك السابقة"
        backHref="/"
        className="px-screen pt-4"
      />

      {/* Held to a narrow measure so it breaks over two lines the way the design
          draws it — at full width it would sit on one. No `px-screen`: the
          padding would eat into the 180px and push it onto a third line, and
          the measure is already far narrower than the narrowest phone. */}
      <p className="mx-auto max-w-[180px] pt-2 text-center text-base text-foreground">
        هنا تقدر تشوف كل طلباتك، وحالات الدفع
      </p>
    </>
  );
}
