"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LogOutIcon, MoreHorizontalIcon, SearchIcon, BellIcon } from "lucide-react";
import { GlassNavbar } from "@/components/ui/glass-navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScrolled } from "@/components/motion/useScrolled";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_NAV_ITEMS, type NavItem } from "./nav-config";

interface AppNavbarProps {
  variant: "app" | "public";
  /**
   * For variant="app", pass the resolved item list (built client-side from
   * real course data — see AppShell). For variant="public" this can be
   * omitted: nav items embed Lucide icon *components*, which aren't
   * RSC-serializable as props from a Server Component, so the public
   * landing/about pages (Server Components) render <AppNavbar variant="public" />
   * without passing items, and this component sources PUBLIC_NAV_ITEMS
   * itself instead.
   */
  items?: NavItem[];
  user?: { email: string } | null;
  /** Only needed (and only rendered) for variant="app". */
  onOpenCommandPalette?: () => void;
}

function initials(email: string) {
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-full bg-primary/10"
          transition={spring.gentle}
        />
      )}
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export function AppNavbar({ variant, items, user, onOpenCommandPalette }: AppNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useScrolled(24);
  const resolvedItems = items ?? PUBLIC_NAV_ITEMS;

  const primaryItems = resolvedItems.filter((i) => i.primary);
  const moreItems = resolvedItems.filter((i) => !i.primary);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <GlassNavbar
      className={cn(
        "px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled ? "shadow-glass border-b-[var(--glass-border)]" : "shadow-none border-b-transparent bg-surface-glass/40"
      )}
      style={{ height: "var(--nav-height)" }}
    >
      <div className="flex items-center gap-6 min-w-0">
        <Link href={variant === "app" ? "/dashboard" : "/"} className="font-heading font-semibold shrink-0">
          Clarity
        </Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {primaryItems.map((item) => (
            <NavLink key={item.id} item={item} active={pathname === item.href.split("#")[0]} />
          ))}
          {moreItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  More <MoreHorizontalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link href={item.href}>
                      <item.icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {variant === "app" && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search — open command palette (Ctrl+K)"
            onClick={onOpenCommandPalette}
          >
            <SearchIcon />
          </Button>
        )}

        {variant === "app" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <BellIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                No notifications yet — you&apos;re all caught up.
              </p>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <ThemeToggle />

        {variant === "app" && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{initials(user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOutIcon className="size-4" aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : variant === "public" ? (
          <div className="flex items-center gap-2 ml-1">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </GlassNavbar>
  );
}
