"use client";

import { useState } from "react";
import { AddButton } from "@/components/ui";
import { CustomerSheet } from "./CustomerSheet";

/**
 * The «اضافة عميل» button on the customers toolbar, plus the sheet it opens
 * (A-34). A small client island so the screen itself stays a server component —
 * the same pattern as `AddOrderLauncher`.
 */
export function AddCustomerLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddButton
        label="اضافة عميل"
        icon="addCustomer"
        onClick={() => setOpen(true)}
      />
      <CustomerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
