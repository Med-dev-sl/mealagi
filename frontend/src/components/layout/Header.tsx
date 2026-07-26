"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeSwitch } from "./ThemeSwitch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";
import { Bell, Menu, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/store/ui";

export function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUIStore();
  const initials = user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase() || "U";

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
        AI MEAL
      </Link>
      <div className="flex-1" />
      <ThemeSwitch />
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar || ""} alt={user?.firstName || "User"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
