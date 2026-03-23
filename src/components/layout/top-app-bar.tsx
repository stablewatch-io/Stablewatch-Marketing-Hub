"use client";

import { Button } from "@heroui/react";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface TopAppBarProps {
  title: string;
  children?: React.ReactNode;
}

export function TopAppBar({ title, children }: TopAppBarProps) {
  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--sw-border)]/20 bg-[var(--sw-bg)] px-6 h-16">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={toggleSidebar}
          >
            <Menu className="size-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold text-[var(--sw-text)]">
          {title}
        </h1>
      </div>

      {children}
    </header>
  );
}
