"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { ContactSheet } from "./ContactSheet";
import { cn } from "@/lib/utils";

/**
 * The floating «تواصل معنا» pill (the orange chat-bubble button from the
 * design). It opens the contact popup — 4146:4683 — which is the only thing it
 * has ever been meant to do; it sat presentational until the farm had a number
 * to put in it (Khaled, 2026-08-25).
 *
 * The pill holds the open state itself rather than taking it from the screen it
 * floats on. There is one of these per screen, its dialog belongs to it, and a
 * page that had to hold a flag for a button it merely places would be the wrong
 * shape — the sidebar's «تواصل معنا» row opens the same dialog and keeps its own.
 *
 * `phone` comes down from the server rather than being read here: this is a
 * client component, and one read on the server beats every screen's pill opening
 * its own request. Pass `className` to place it (e.g. `self-end` on the home).
 */
export function ContactButton({
  phone,
  className,
}: {
  /** The farm's contact number, or null if the row could not be read. */
  phone: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 rounded-full border border-accent-tan bg-accent-orange px-3.5 py-2.5 text-base font-bold text-primary-foreground shadow-card",
          className,
        )}
      >
        <Icon name="contact" size={24} />
        <span>تواصل معنا</span>
      </button>

      <ContactSheet open={open} onClose={() => setOpen(false)} phone={phone} />
    </>
  );
}
