import { Skeleton, SkeletonScreen } from "@/components/ui";

/**
 * Loading face of admin settings (A-70). Its own file rather than inheriting the
 * home's: without it, tapping the gear would flash a cycle-dashboard skeleton on
 * the way to a screen that looks nothing like one.
 */
export default function AdminSettingsLoading() {
  return (
    <SkeletonScreen className="items-center justify-center gap-2 px-screen">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </SkeletonScreen>
  );
}
