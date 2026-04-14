"use client";

import * as React from "react";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

type AppShellProps = {
  user: { name: string | null; email: string | null };
  children: React.ReactNode;
};

function AppShell({ user, children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div data-slot="app-shell" className="flex min-h-screen bg-muted/40">
      <AppSidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          user={user}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
        />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export { AppShell };
