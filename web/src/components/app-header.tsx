"use client";

import Image from "next/image";
import { LogOut, PanelLeft } from "lucide-react";

import { cn } from "@/lib/cn";
import { logout } from "@/actions/auth/logout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

type AppHeaderProps = {
  user: { name: string | null; email: string | null };
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

function AppHeader({ user, sidebarCollapsed, onToggleSidebar }: AppHeaderProps) {
  const initials = getInitials(user.name);

  return (
    <header
      data-slot="app-header"
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Abrir menu" : "Recolher menu"}
          aria-pressed={!sidebarCollapsed}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <PanelLeft className="size-4" />
        </button>
        <Image
          src="/logo-responsive.svg"
          alt="JusCash"
          width={120}
          height={28}
          priority
          className="h-7 w-auto"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Menu do usuário"
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background pr-2 pl-1 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          )}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {initials}
          </span>
          <span className="hidden sm:inline">{user.name ?? user.email ?? "Usuário"}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[12rem]">
          <DropdownMenuItem
            onClick={() => {
              void logout();
            }}
            className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { AppHeader };
