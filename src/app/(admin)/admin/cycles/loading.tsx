import { Skeleton, SkeletonScreen } from "@/components/ui";

/**
 * Loading face of the admin cycles screen (A-40). Both faces of that screen —
 * the "no cycles yet" empty state and the list — put a centred block above a
 * full-width button at the bottom, so the skeleton draws that: the ring where
 * the illustration lands, two lines of text, and the CTA.
 */
export default function AdminCyclesLoading() {
  return (
    <SkeletonScreen className="px-screen pt-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <Skeleton className="size-47 rounded-full" />
        <div className="flex flex-col items-center gap-2.5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <Skeleton className="mb-4 h-13 w-full" />
    </SkeletonScreen>
  );
}
