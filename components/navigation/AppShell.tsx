"use client";

import type { ReactNode } from "react";
import { AppNavbar } from "./AppNavbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { buildNavItems, type CourseSummary } from "./nav-config";
import { CommandPalette, openCommandPalette } from "./CommandPalette";

interface AppShellProps {
  children: ReactNode;
  user: { email: string };
  courses: CourseSummary[];
}

export function AppShell({ children, user, courses }: AppShellProps) {
  const items = buildNavItems(courses);

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <AppNavbar variant="app" items={items} user={user} onOpenCommandPalette={openCommandPalette} />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">{children}</div>
      <MobileBottomNav items={items} user={user} />
      <CommandPalette courses={courses} />
    </div>
  );
}
