"use client";

import { Button, Card, Chip } from "@heroui/react";

interface InstructionCardProps {
  name: string;
  icon: string;
  description: string;
  filename: string;
  version?: number;
  onDelete?: () => void;
}

export function InstructionCard({
  name,
  icon,
  description,
  filename,
  version,
  onDelete,
}: InstructionCardProps) {
  return (
    <Card className="p-6 hover:border-[var(--sw-primary)]/30 transition-all hover:shadow-lg hover:shadow-[var(--sw-primary)]/5 group cursor-pointer relative">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--sw-primary-hover)]/10 flex items-center justify-center text-[var(--sw-primary)]">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="flex items-center gap-2">
          {version && (
            <span className="text-[10px] font-mono text-[var(--sw-text-muted)]">
              v{version}
            </span>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 min-w-0 rounded-md hover:bg-red-50 text-[var(--sw-text-muted)] hover:text-red-600"
            >
              <span className="material-symbols-outlined text-[16px]">
                delete
              </span>
            </Button>
          )}
        </div>
      </div>
      <h5 className="font-bold text-[var(--sw-text)] mb-1">{name}</h5>
      <p className="text-xs text-[var(--sw-text-secondary)] mb-6 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <Chip
          size="sm"
          variant="soft"
          className="bg-[var(--sw-bg-card)] text-[10px] font-medium text-[var(--sw-text-secondary)]"
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[var(--sw-text-muted)]">
              data_object
            </span>
            {filename}
          </span>
        </Chip>
        <span className="material-symbols-outlined text-[var(--sw-primary)] group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </div>
    </Card>
  );
}
