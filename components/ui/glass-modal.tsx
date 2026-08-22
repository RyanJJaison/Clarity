"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Dialog, restyled with the glass surface treatment. Built on top of the
 * existing shadcn/Radix Dialog rather than a new modal implementation —
 * Radix's Presence already drives accessible, GPU-friendly open/close
 * transitions via tw-animate-css; this only overrides the surface classes.
 * Keeps focus-trap, ESC-to-close, and overlay-click-to-close behavior.
 */
export const GlassModal = Dialog;
export const GlassModalTrigger = DialogTrigger;
export const GlassModalHeader = DialogHeader;
export const GlassModalTitle = DialogTitle;
export const GlassModalDescription = DialogDescription;
export const GlassModalFooter = DialogFooter;
export const GlassModalClose = DialogClose;

export function GlassModalContent({ className, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "border ring-0 border-[var(--glass-border)] bg-surface-glass shadow-glass backdrop-blur-[var(--glass-blur)]",
        className
      )}
      {...props}
    />
  );
}
