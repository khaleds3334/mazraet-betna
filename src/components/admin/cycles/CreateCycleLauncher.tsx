"use client";

import { useState } from "react";
import { AddButton, Button } from "@/components/ui";
import { CreateCycleSheet } from "./CreateCycleSheet";
import type { CycleEstimateBasis } from "@/lib/calculations/cycle";

/**
 * The lime button that opens the create-cycle sheet, plus the sheet itself. A
 * small client island so a hosting server component (the home CTA, the cycles
 * area) can trigger the sheet in place without navigating. `label` sets the
 * button text ("ابدأ سجل اول دورة" on the home, "إنشاء دورة جديدة" on cycles);
 * `basis` is the last cycle's real costs, read on the server and handed through
 * so the sheet's forecast doesn't need a round trip when it opens.
 *
 * Two shapes, because the design gives the action two homes: the full-width lime
 * button that closes an otherwise empty screen (A-10, A-40), and the small green
 * pill in the toolbar above a list that already has content (`compact`, A-42).
 */
export function CreateCycleLauncher({
  label = "إنشاء دورة جديدة",
  basis,
  compact = false,
}: {
  label?: string;
  basis?: CycleEstimateBasis;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {compact ? (
        <AddButton
          label={label}
          icon="addCycle"
          onClick={() => setOpen(true)}
        />
      ) : (
        <Button onClick={() => setOpen(true)}>{label}</Button>
      )}
      <CreateCycleSheet
        open={open}
        onClose={() => setOpen(false)}
        basis={basis}
      />
    </>
  );
}
