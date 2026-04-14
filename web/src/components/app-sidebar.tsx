"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Send } from "lucide-react";

import { cn } from "@/lib/cn";

type SidebarItem = {
  href: string;
  label: string;
  icon: typeof House;
  disabled?: boolean;
};

const items: SidebarItem[] = [
  { href: "/processes-list", label: "Comunicações", icon: House },
  { href: "#", label: "Em breve", icon: Send, disabled: true },
];

function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      data-slot="app-sidebar"
      data-collapsed={collapsed}
      className={cn(
        "hidden border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex md:flex-col",
        collapsed ? "w-0 overflow-hidden" : "w-14",
      )}
      aria-hidden={collapsed}
    >
      <nav className="flex flex-col items-center gap-1 py-4">
        {items.map(({ href, label, icon: Icon, disabled }) => {
          const active = !disabled && pathname === href;
          const className = cn(
            "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            active && "bg-accent text-foreground",
            disabled && "pointer-events-none opacity-50",
          );

          if (disabled) {
            return (
              <span key={label} aria-label={label} className={className}>
                <Icon className="size-4" />
              </span>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={className}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { AppSidebar };
