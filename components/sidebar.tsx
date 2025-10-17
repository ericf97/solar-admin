"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Swords,
  Zap,
  Bot,
  MapPin,
  Users,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Portals",
    href: "/portals",
    icon: MapPin,
  },
  {
    title: "AI",
    href: "/ai",
    icon: Bot,
  },
  {
    title: "Monsters",
    href: "/monsters",
    icon: Swords,
  },
  {
    title: "Skills",
    href: "/skills",
    icon: Zap,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = useUIStore(state => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      <div className="flex-1 space-y-4">
        <div className="px-2">
          <div className="space-y-1">
            {sidebarNavItems.map(item => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn("w-full text-foreground h-10 justify-start px-3")}
                asChild
              >
                <Link href={item.href} className="flex items-center">
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-2 whitespace-nowrap">{item.title}</span>
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-2">
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-10 w-10"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
