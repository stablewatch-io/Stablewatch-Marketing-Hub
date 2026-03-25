"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Chip } from "@heroui/react";
import { useInstructions } from "@/hooks/use-instructions";
import { useNewsSources } from "@/hooks/use-news-sources";
import { MdEditor } from "@/components/shared/md-editor";
import { VersionHistory } from "@/components/shared/version-history";
import { KnowledgeBasePanel } from "@/components/shared/knowledge-base-panel";
import { SourceCard } from "@/components/news/source-card";
import { toast } from "sonner";

export function NewsFilterLogic({ onBack }: { onBack?: () => void }) {
  const { instructions, activeInstruction, createVersion, setActive } =
    useInstructions("news", "news_filter");
  const { sources, isLoading: sourcesLoading, addSource, updateSource, removeSource } =
    useNewsSources();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"rss" | "api">("rss");
  const [formUrl, setFormUrl] = useState("");
  const [applying, setApplying] = useState(false);

  async function handleSave(content: string) {
    try {
      await createVersion(content, "Updated filter rules");
      toast.success("New version created");
    } catch {
      toast.error("Failed to save");
    }
  }

  async function handleActivate(id: string) {
    try {
      await setActive(id);
      toast.success("Version activated");
    } catch {
      toast.error("Failed to activate");
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormName("");
    setFormType("rss");
    setFormUrl("");
    setShowAddForm(true);
  }

  function openEditForm(id: string) {
    const source = sources.find((s) => s.id === id);
    if (!source) return;
    setEditingId(id);
    setFormName(source.name);
    setFormType(source.type);
    setFormUrl(source.url);
    setShowAddForm(true);
  }

  async function handleFormSubmit() {
    if (!formName.trim() || !formUrl.trim()) {
      toast.error("Name and URL are required");
      return;
    }
    try {
      if (editingId) {
        await updateSource(editingId, { name: formName, type: formType, url: formUrl });
        toast.success("Source updated");
      } else {
        await addSource(formName, formType, formUrl);
        toast.success("Source added");
      }
      setShowAddForm(false);
      setEditingId(null);
    } catch {
      toast.error(editingId ? "Failed to update source" : "Failed to add source");
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeSource(id);
      toast.success("Source removed");
    } catch {
      toast.error("Failed to delete source");
    }
  }

  async function handleApplyChanges() {
    setApplying(true);
    try {
      const res = await fetch("/api/news/aggregate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to trigger aggregation");
      toast.success("Re-processing triggered — check the News Feed for results");
    } catch {
      toast.error("Failed to apply changes");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col items-stretch">
      {/* Back Arrow */}
      <div className="max-w-4xl w-full flex flex-col gap-10 py-4 self-center">
        {/* Section Header */}
        <div className="border-b border-[var(--sw-border)]/20 pb-8">
          <div>
            <div className="flex items-center mb-2">
              {onBack && (
                <div className="-ml-15 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={onBack}
                    aria-label="Back"
                  >
                    <ArrowLeft className="size-7 text-(--sw-primary)" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-3 ml-0">
                <h2 className="text-3xl font-bold text-[var(--sw-text)] text-left">
                  News Filter Logic
                </h2>
              </div>
            </div>
            <p className="text-[var(--sw-text-secondary)] text-sm text-left">
              Configure the AI rules and knowledge base that govern how incoming
              news is prioritized and filtered.
            </p>
          </div>
          {activeInstruction && (
            <div className="flex flex-col items-end gap-1">
              <Chip
                size="sm"
                className="px-3 py-1 rounded-full bg-[var(--sw-primary-light)]/50 text-[#416463] text-[10px] font-extrabold uppercase tracking-widest"
              >
                v{activeInstruction.version}
              </Chip>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Logic Editor */}
          <div className="md:col-span-2 space-y-10">
            {/* Filter Rules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-[var(--sw-text-muted)] uppercase tracking-widest">
                  Filter Logic Definition (.MD)
                </label>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--sw-primary)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--sw-primary)]" />
                  ACTIVE
                </div>
              </div>
              {activeInstruction && (
                <MdEditor
                  filename={`${activeInstruction.slug ?? "news_filter"}_v${activeInstruction.version}.md`}
                  content={activeInstruction.content}
                  version={activeInstruction.version}
                  isLive
                  onSave={handleSave}
                />
              )}
            </div>

            <KnowledgeBasePanel channel="news" />

            {/* Manage Sources */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-[var(--sw-text-muted)] uppercase tracking-widest">
                  Manage Sources
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={openAddForm}
                  className="flex items-center gap-2 text-[var(--sw-primary)] hover:text-[var(--sw-primary-hover)] transition-colors group"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">
                    add_circle
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Add New Source
                  </span>
                </Button>
              </div>

              {/* Add/Edit Source Form */}
              {showAddForm && (
                <div className="bg-white border border-[var(--sw-primary)]/20 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-[var(--sw-text)]">
                    {editingId ? "Edit Source" : "Add New Source"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="Source name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="px-3 py-2 border border-[var(--sw-border)]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sw-primary)]/30"
                    />
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as "rss" | "api")}
                      className="px-3 py-2 border border-[var(--sw-border)]/30 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sw-primary)]/30"
                      aria-label="Source type"
                    >
                      <option value="rss">RSS Feed</option>
                      <option value="api">API Endpoint</option>
                    </select>
                  </div>
                  <Input
                    type="text"
                    placeholder="Feed URL or API endpoint"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--sw-border)]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sw-primary)]/30"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={handleFormSubmit}
                      className="px-4 py-2 bg-[var(--sw-primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--sw-primary-hover)] transition-colors uppercase tracking-wider"
                    >
                      {editingId ? "Update" : "Add Source"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => { setShowAddForm(false); setEditingId(null); }}
                      className="px-4 py-2 text-[var(--sw-text-muted)] text-xs font-bold rounded-lg hover:bg-[var(--sw-bg-card)] transition-colors uppercase tracking-wider"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {sourcesLoading ? (
                  <p className="text-sm text-[var(--sw-text-muted)]">Loading sources...</p>
                ) : sources.length === 0 ? (
                  <p className="text-sm text-[var(--sw-text-muted)]">No sources configured. Add one above.</p>
                ) : (
                  sources.map((source) => (
                    <SourceCard
                      key={source.id}
                      id={source.id}
                      name={source.name}
                      url={source.url}
                      type={source.type}
                      onEdit={openEditForm}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Stats + Actions */}
          <div className="space-y-8">
            <div className="bg-[var(--sw-primary)]/5 rounded-2xl p-6 border border-[var(--sw-primary)]/10">
              <h4 className="text-xs font-bold text-[var(--sw-primary)] uppercase tracking-widest mb-6">
                Execution Analytics
              </h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--sw-text)]">
                    Active Sources
                  </span>
                  <span className="text-sm font-bold text-[var(--sw-primary)]">
                    {sources.filter((s) => s.is_active).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--sw-text)]">
                    Total Sources
                  </span>
                  <span className="text-sm font-bold text-[var(--sw-primary)]">
                    {sources.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[var(--sw-bg-card)] rounded-2xl space-y-4">
              <span className="text-[10px] font-bold text-[var(--sw-text-muted)] uppercase tracking-widest">
                System Note
              </span>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed">
                Updating the filter logic or adding new sources will trigger a
                re-processing of all unapproved news in the current 24h window.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <Button
                variant="primary"
                size="lg"
                onPress={handleApplyChanges}
                isDisabled={applying}
                className="w-full py-5 bg-[var(--sw-primary)] text-white font-bold rounded-2xl shadow-xl shadow-[var(--sw-primary)]/20 hover:bg-[var(--sw-primary-hover)] active:translate-y-0 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                <span className="material-symbols-outlined text-2xl">
                  {applying ? "sync" : "check_circle"}
                </span>
                {applying ? "Applying..." : "Apply Changes"}
              </Button>
            </div>

            <VersionHistory
              instructions={instructions}
              onActivate={handleActivate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
