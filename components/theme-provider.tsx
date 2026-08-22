"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wires the .dark class in app/globals.css to an actual light/dark/system
 * toggle. attribute="class" + suppressHydrationWarning on <html> (in
 * layout.tsx) is the standard next-themes + SSR pairing.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemeProvider>
  );
}
