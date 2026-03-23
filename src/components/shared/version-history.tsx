"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { type Instruction } from "@/hooks/use-instructions";
import { formatDistanceToNow } from "date-fns";

interface VersionHistoryProps {
  instructions: Instruction[];
  onActivate: (id: string) => void;
}

export function VersionHistory({
  instructions,
  onActivate,
}: VersionHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [viewingDiffId, setViewingDiffId] = useState<string | null>(null);

  const activeInstruction = instructions.find((i) => i.is_active);
  const displayedInstructions = showAll ? instructions : instructions.slice(0, 3);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-[var(--sw-text)]">
        Logic History
      </h3>
      <div className="bg-white rounded-xl shadow-sm border border-[var(--sw-border)]/10 overflow-hidden">
        <div className="divide-y divide-[var(--sw-border)]/10">
          {displayedInstructions.map((instruction) => (
            <div key={instruction.id}>
              <div className="p-4 hover:bg-[var(--sw-bg-card)]/20 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-xs font-bold ${instruction.is_active ? "text-[var(--sw-primary)]" : "text-[var(--sw-text)]"}`}
                  >
                    v{instruction.version}
                    {instruction.is_active && " (active)"}
                  </span>
                  <span className="text-[10px] text-[var(--sw-text-muted)]">
                    {formatDistanceToNow(new Date(instruction.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {instruction.notes && (
                  <p className="text-[11px] text-[var(--sw-text)] mb-2">
                    {instruction.notes}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[var(--sw-text-muted)]">
                    {instruction.created_by ? "Manual edit" : "System default"}
                  </span>
                  <div className="flex gap-2">
                    {!instruction.is_active && (
                      <Button
                        onPress={() => onActivate(instruction.id)}
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-[var(--sw-primary)]"
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      onPress={() =>
                        setViewingDiffId(
                          viewingDiffId === instruction.id
                            ? null
                            : instruction.id
                        )
                      }
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-bold text-[var(--sw-primary)]"
                    >
                      {viewingDiffId === instruction.id
                        ? "Hide"
                        : "View Diff"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Diff view */}
              {viewingDiffId === instruction.id && (
                <div className="px-4 pb-4">
                  <div className="bg-[var(--sw-bg-card)] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[var(--sw-text-muted)] uppercase">
                        v{instruction.version} Content
                        {instruction.is_active && " (active)"}
                      </span>
                      {activeInstruction &&
                        activeInstruction.id !== instruction.id && (
                          <span className="text-[10px] text-[var(--sw-text-muted)]">
                            vs active v{activeInstruction.version}
                          </span>
                        )}
                    </div>
                    <pre className="text-xs text-[var(--sw-text-secondary)] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed font-mono bg-white rounded p-3 border border-[var(--sw-border)]/10">
                      {instruction.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {instructions.length > 3 && (
          <Button
            onPress={() => setShowAll(!showAll)}
            variant="ghost"
            size="sm"
            className="w-full py-3 text-xs font-bold text-[var(--sw-text-muted)] rounded-none"
          >
            {showAll
              ? "Show Less"
              : `View Full Version Control (${instructions.length} versions)`}
          </Button>
        )}
      </div>
    </div>
  );
}
