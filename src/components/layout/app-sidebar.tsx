"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Megaphone,
  Send,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "News Generator", href: "/news", icon: Newspaper },
  { title: "Twitter Post Creator", href: "/twitter", icon: Megaphone },
  { title: "Telegram Formatter", href: "/telegram", icon: Send },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({
          name: meta?.display_name || data.user.email?.split("@")[0] || "User",
          email: data.user.email || "",
        });
      } else {
        setUser({ name: "Stablewatch", email: "AI Hub" });
      }
    });
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SW";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Avatar size="md">
            <AvatarImage src="/logo.png" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-[var(--sw-text)]">
              {user?.name || "Loading..."}
            </p>
            <p className="text-xs text-[var(--sw-text-muted)]">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--sw-primary-light)] text-[var(--sw-primary)] font-semibold"
                    : "text-[var(--sw-text)] hover:bg-[var(--sw-bg-card)]"
                )}
              >
                <item.icon className="size-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--sw-text)] hover:bg-[var(--sw-bg-card)] transition-colors w-full"
        >
          <LogOut className="size-5" />
          <span>Log out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
