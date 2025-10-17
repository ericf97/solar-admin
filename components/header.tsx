"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings, LogOut, Sun, Moon, Monitor, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingsModal } from "@/components/settings-modal";
import { useApiStore } from "@/store/api-store";
import { useCopilotStore } from "@/store/copilot-store";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const email = useApiStore.getState().email;
  const store = useApiStore.getState();
  const router = useRouter();

  const isCopilotOpen = useCopilotStore(state => state.isOpen);
  const toggleCopilot = useCopilotStore(state => state.toggleOpen);

  const handleLogout = () => {
    store.setBearerToken(null);
    store.setEmail("");
    router.push("/auth");
  };

  return (
    <header className="h-14 bg-sidebar px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Image
          src="https://hosting.renderforestsites.com/25021059/1223894/media/96327be150780392bd43b496ddddcf7f.png"
          alt="Neoland"
          width={120}
          height={30}
          className="invert dark:invert-0"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCopilot}
          className={isCopilotOpen ? "bg-primary/10" : ""}
        >
          <Sparkles className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{email}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground mb-2">Theme</p>
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-1"
              >
                <ToggleGroupItem value="light" size="sm">
                  <Sun className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" size="sm">
                  <Moon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="system" size="sm">
                  <Monitor className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      </div>
    </header>
  );
}

