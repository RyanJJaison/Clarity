"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

/**
 * Fixed bottom navigation for phones (below md — the GlassNavbar handles
 * everything at md and up). Respects iOS/Android safe areas and keeps
 * touch targets at a comfortable ≥44px.
 */
export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const mobileItems = items.filter((i) => i.mobile);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] md:hidden border-t border-[var(--glass-border)] bg-surface-glass backdrop-blur-[var(--glass-blur)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {mobileItems.map((item) => {
          const active = pathname === item.href.split("#")[0];
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-11 text-[0.6875rem] font-medium"
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-active-pill"
                    className="absolute inset-x-3 top-0.5 h-0.5 rounded-full bg-primary"
                    transition={spring.gentle}
                  />
                )}
                <item.icon
                  className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                <span className={active ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
