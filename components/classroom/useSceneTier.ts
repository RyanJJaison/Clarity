"use client";

import { useSyncExternalStore } from "react";
import { breakpoint } from "@/lib/design-system/tokens";

export type SceneTier = "mobile" | "tablet" | "desktop";

function getTier(): SceneTier {
  if (typeof window === "undefined") return "mobile";
  if (window.innerWidth >= breakpoint.lg) return "desktop";
  if (window.innerWidth >= breakpoint.md) return "tablet";
  return "mobile";
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

/**
 * Which classroom tier to render. Defaults to "mobile" (the cheapest tier)
 * on the server and before hydration — mobile-first, and it means a phone
 * never even constructs the heavier desktop/tablet DOM tree only to have
 * it CSS-hidden; it just isn't rendered.
 */
export function useSceneTier(): SceneTier {
  return useSyncExternalStore(subscribe, getTier, () => "mobile");
}
