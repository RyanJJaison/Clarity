"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LogOutIcon } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { NavItem } from "./nav-config";

function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

/**
 * Fixed bottom navigation for phones (below md — the GlassNavbar handles
 * everything at md and up). Respects iOS/Android safe areas and keeps
 * touch targets at a comfortable ≥44px. Home/Learn/AI/Progress are real
 * routes; Profile is a menu (same content as the desktop dropdown) rather
 * than a dead link, since there's no dedicated /profile page.
 */
export function MobileBottomNav({ items, user }: { items: NavItem[]; user: { email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const mobileItems = items.filter((i) => i.mobile);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
        <li className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex flex-col items-center justify-center gap-0.5 py-2 min-h-11 text-[0.6875rem] font-medium text-muted-foreground"
              >
                <Avatar className="size-5">
                  <AvatarFallback className="text-[0.5rem]">{initials(user.email)}</AvatarFallback>
                </Avatar>
                <span>Profile</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOutIcon className="size-4" aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
}
