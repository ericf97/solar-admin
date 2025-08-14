"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Swords, Zap, Settings, MapPin } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { SettingsModal } from "@/components/settings-modal";
import { useApiStore } from "@/store/apiStore";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Portals",
    href: "/portals",
    icon: MapPin,
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
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const email = useApiStore.getState().email

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="mb-4 px-4">
            <Image
              src="https://hosting.renderforestsites.com/25021059/1223894/media/96327be150780392bd43b496ddddcf7f.png"
              alt="Neoland"
              width={120}
              height={30}
              className="invert dark:invert-0"
            />
          </div>
          <div className="space-y-1">
            {sidebarNavItems.map(item => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start text-foreground"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4 space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </Button>
        <div className="bg-secondary/50 rounded-lg p-2 flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">
              {email}
            </span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      </div>
    </div>
  );
}

