"use client";

import { Button, Chip } from "@heroui/react";

export interface FormattingHistoryItem {
  id: string;
  input_source_type: string | null;
  output_text: string;
  created_by: string | null;
  created_at: string;
}

interface ActivityLogProps {
  history: FormattingHistoryItem[];
  onRestore?: (outputText: string) => void;
}

export function ActivityLog({ history, onRestore }: ActivityLogProps) {
  return (
    <section className="px-8 pb-12 max-w-7xl mx-auto w-full">
      <h3 className=" text-lg font-bold mb-4 text-[var(--sw-text)]">
        Team Activity Log
      </h3>
      <div className="bg-white rounded-xl overflow-hidden border border-[var(--sw-border)]/10 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[var(--sw-bg-card)]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-[var(--sw-text-secondary)]">
                User
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-[var(--sw-text-secondary)]">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-[var(--sw-text-secondary)]">
                Source Type
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-[var(--sw-text-secondary)]">
                Snippet
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-[var(--sw-text-secondary)] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sw-border)]/10">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-[var(--sw-text-muted)]"
                >
                  No formatting history yet.
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[var(--sw-bg-card)]/30 transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-medium">
                    {item.created_by ?? "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Chip size="sm" className="bg-[var(--sw-primary-light)] text-[#476b69] text-[10px] font-medium">
                      {item.input_source_type ?? "text"}
                    </Chip>
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--sw-text-secondary)] truncate max-w-[400px]">
                    {item.output_text.slice(0, 80)}...
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      onPress={() => onRestore?.(item.output_text)}
                      variant="ghost"
                      size="sm"
                      className="text-[var(--sw-primary)] text-xs font-bold"
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
