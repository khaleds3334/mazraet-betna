"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { CreateCycleSheet } from "./CreateCycleSheet";

/**
 * The lime button that opens the create-cycle sheet, plus the sheet itself. A
 * small client island so a hosting server component (the home CTA, the cycles
 * area) can trigger the sheet in place without navigating. `label` sets the
 * button text ("ابدأ سجل اول دورة" on the home, "إنشاء دورة جديدة" on cycles).
 */
export function CreateCycleLauncher({
  label = "إنشاء دورة جديدة",
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <CreateCycleSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
