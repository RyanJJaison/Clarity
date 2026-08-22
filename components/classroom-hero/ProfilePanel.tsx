"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
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
import { createClient } from "@/lib/supabase/client";

function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

export function ProfilePanel({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <GlassPanel className="flex items-center gap-3 p-2.5">
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

      <Button variant="ghost" size="icon" aria-label="Settings" asChild>
        <Link href="/settings">
          <SettingsIcon />
        </Link>
      </Button>

      <div className="h-6 w-px bg-border" aria-hidden="true" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
            <Avatar className="size-9 border-[1.5px] border-white">
              <AvatarFallback className="text-xs">{initials(email)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOutIcon className="size-4" aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </GlassPanel>
  );
}
