"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buildNavItems, type CourseSummary } from "./nav-config";

export const OPEN_COMMAND_PALETTE_EVENT = "clarity:open-command-palette";

/** Any other component can open the palette without prop-drilling. */
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandPalette({ courses }: { courses: CourseSummary[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const navCommands = buildNavItems(courses).map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      icon: item.icon,
      run: () => router.push(item.href),
    }));

    const mostRecent = courses[0];
    // Only real, reachable actions — no "Open Notes"/"Open Settings": neither
    // feature exists in the app yet, and Rule 6 is not to fake functionality.
    const actionCommands: Command[] = [
      {
        id: "review-due",
        label: "Review due cards",
        description: "Spaced-repetition queue, across every course",
        icon: navCommands.find((c) => c.id === "progress")!.icon,
        run: () => router.push("/review"),
      },
      {
        id: "new-course",
        label: "Start a new course",
        description: "Paste text or upload a PDF",
        icon: navCommands.find((c) => c.id === "learn")!.icon,
        run: () => router.push("/courses/new"),
      },
    ];
    if (mostRecent) {
      actionCommands.unshift({
        id: "start-quiz",
        label: `Start a quiz — ${mostRecent.title}`,
        icon: navCommands.find((c) => c.id === "progress")!.icon,
        run: () => router.push(`/courses/${mostRecent.id}`),
      });
    }

    return [...navCommands, ...actionCommands];
  }, [courses, router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Derived, not stored+reset-via-effect: whichever command is highlighted
  // by id, falling back to the first result whenever the filtered list no
  // longer contains it (e.g. the query just changed).
  const highlightedIndex = useMemo(() => {
    const idx = filtered.findIndex((c) => c.id === highlightedId);
    return idx === -1 ? 0 : idx;
  }, [filtered, highlightedId]);

  useEffect(() => {
    // Reset happens in the handlers that cause `open` to become true (below),
    // not here — this effect only handles the DOM focus side effect, which
    // has to run after Radix has mounted the dialog.
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    function openPalette() {
      setQuery("");
      setHighlightedId(null);
      setOpen(true);
    }
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          openPalette();
        }
      }
    }
    window.addEventListener("keydown", onKeydown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    };
    // Re-subscribes on `open` change so the keydown toggle always reads the
    // current value instead of needing a functional setState update (which
    // would otherwise need to nest setQuery/setHighlightedId inside it).
  }, [open]);

  function runHighlighted() {
    const command = filtered[highlightedIndex];
    if (!command) return;
    setOpen(false);
    command.run();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] translate-y-0 sm:max-w-lg border ring-0 border-[var(--glass-border)] bg-surface-glass shadow-glass backdrop-blur-[var(--glass-blur)] p-0 gap-0 overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = filtered[Math.min(highlightedIndex + 1, filtered.length - 1)];
            if (next) setHighlightedId(next.id);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = filtered[Math.max(highlightedIndex - 1, 0)];
            if (prev) setHighlightedId(prev.id);
          } else if (e.key === "Enter") {
            e.preventDefault();
            runHighlighted();
          }
        }}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-3">
          <SearchIcon className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, or ask Clarity to do something…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={filtered[highlightedIndex] ? `command-${filtered[highlightedIndex].id}` : undefined}
          />
          <kbd className="hidden sm:inline text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <ul id="command-palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matching commands.</li>
          )}
          {filtered.map((command, i) => (
            <li key={command.id} id={`command-${command.id}`} role="option" aria-selected={i === highlightedIndex}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  command.run();
                }}
                onMouseEnter={() => setHighlightedId(command.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  i === highlightedIndex ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                )}
              >
                <command.icon className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="flex flex-col min-w-0">
                  <span className="truncate">{command.label}</span>
                  {command.description && (
                    <span className="text-xs text-muted-foreground truncate">{command.description}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
