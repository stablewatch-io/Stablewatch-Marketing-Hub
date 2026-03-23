"use client";

import { useState } from "react";
import { Button, Input, TextArea, Card } from "@heroui/react";
import { useInstructions } from "@/hooks/use-instructions";
import { useGlobalAiSettings } from "@/hooks/use-global-ai-settings";
import { KnowledgeBasePanel } from "@/components/shared/knowledge-base-panel";
import { InstructionCard } from "@/components/twitter/instruction-card";
import { toast } from "sonner";

const DEFAULT_ICONS = [
  "reorder",
  "ads_click",
  "analytics",
  "format_list_bulleted",
  "campaign",
  "lightbulb",
  "forum",
  "trending_up",
];

export function EditorLogicView() {
  const { settings, updateSettings, isSaving } =
    useGlobalAiSettings("twitter");
  const {
    instructions,
    isLoading,
    mutate: mutateInstructions,
    deleteInstruction,
  } = useInstructions("twitter");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Group by slug, show only active (latest) per slug
  const activeBySlug = instructions.reduce(
    (acc, inst) => {
      if (inst.is_active && !acc[inst.slug]) {
        acc[inst.slug] = inst;
      }
      return acc;
    },
    {} as Record<string, (typeof instructions)[number]>
  );
  const tweetTypes = Object.values(activeBySlug);

  async function handleSave() {
    try {
      await updateSettings(settings.tone_of_voice, settings.icp);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  }

  async function handleAddType() {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const slug = newName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      const res = await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "twitter",
          slug,
          name: newName.trim(),
          content: newDescription.trim() || newName.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create tweet type");
      toast.success(`"${newName}" tweet type added`);
      setNewName("");
      setNewDescription("");
      setShowAddForm(false);
      mutateInstructions();
    } catch {
      toast.error("Failed to add tweet type");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteInstruction(id);
      toast.success(`"${name}" removed`);
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="flex-1 flex justify-center overflow-y-auto bg-[var(--sw-bg)]">
      <section className="w-full max-w-4xl flex flex-col px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[var(--sw-text)] leading-tight">
              Editor Logic
            </h3>
            <p className="text-[var(--sw-text-secondary)] text-sm mt-1">
              Configure the AI personas and tweet type frameworks.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onPress={handleSave}
            isDisabled={isSaving}
            className="px-6 py-2.5 bg-[var(--sw-primary)] text-white text-xs font-bold rounded-lg shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-8 pb-20">
          {/* Global AI Settings */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[var(--sw-primary)]">
                psychology
              </span>
              <h4 className="text-lg font-bold text-[var(--sw-text)]">
                Global AI Settings
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--sw-text-muted)] uppercase tracking-wider mb-2">
                    Tone of Voice
                  </label>
                  <TextArea
                    value={settings.tone_of_voice}
                    onChange={(e) =>
                      updateSettings(e.target.value, settings.icp)
                    }
                    placeholder="Describe the brand voice..."
                    rows={4}
                    className="w-full bg-[var(--sw-bg-card)] border-none rounded-xl text-sm p-4 focus:ring-2 focus:ring-[var(--sw-primary)]/20 min-h-[100px] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--sw-text-muted)] uppercase tracking-wider mb-2">
                    ICP (Ideal Customer Profile)
                  </label>
                  <TextArea
                    value={settings.icp}
                    onChange={(e) =>
                      updateSettings(settings.tone_of_voice, e.target.value)
                    }
                    placeholder="Describe the target audience..."
                    rows={4}
                    className="w-full bg-[var(--sw-bg-card)] border-none rounded-xl text-sm p-4 focus:ring-2 focus:ring-[var(--sw-primary)]/20 min-h-[100px] resize-none"
                  />
                </div>
              </div>
              <KnowledgeBasePanel channel="twitter" />
            </div>
          </Card>

          {/* Tweet Types Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--sw-primary)]">
                  extension
                </span>
                <h4 className="text-lg font-bold text-[var(--sw-text)]">
                  Tweet Types
                </h4>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-[var(--sw-text-muted)] font-bold uppercase tracking-widest">
                  Active Types: {tweetTypes.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowAddForm(true)}
                  className="text-[var(--sw-primary)] font-bold text-xs"
                >
                  <span className="material-symbols-outlined text-lg">
                    add_circle
                  </span>
                  ADD NEW TYPE
                </Button>
              </div>
            </div>

            {/* Add New Type Form */}
            {showAddForm && (
              <Card className="p-6 border border-[var(--sw-primary)]/20 mb-6">
                <h5 className="font-bold text-[var(--sw-text)] mb-4">
                  Add New Tweet Type
                </h5>
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Type name (e.g. Educational Thread)"
                    className="w-full bg-[var(--sw-bg-card)] border-none rounded-xl text-sm p-3 focus:ring-2 focus:ring-[var(--sw-primary)]/20"
                  />
                  <TextArea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description / instructions for this tweet type..."
                    rows={3}
                    className="w-full bg-[var(--sw-bg-card)] border-none rounded-xl text-sm p-3 focus:ring-2 focus:ring-[var(--sw-primary)]/20 min-h-[80px] resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        setShowAddForm(false);
                        setNewName("");
                        setNewDescription("");
                      }}
                      className="text-xs font-bold text-[var(--sw-text-muted)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={handleAddType}
                      isDisabled={!newName.trim() || isCreating}
                      className="px-5 py-2 bg-[var(--sw-primary)] text-white text-xs font-bold rounded-lg"
                    >
                      {isCreating ? "Adding..." : "Add Type"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-[var(--sw-border)]/10 animate-pulse h-48"
                  />
                ))}
              </div>
            ) : tweetTypes.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-[var(--sw-border)]/10 text-center">
                <span className="material-symbols-outlined text-4xl text-[var(--sw-border)] mb-3 block">
                  post_add
                </span>
                <p className="text-sm text-[var(--sw-text-muted)]">
                  No tweet types yet. Add your first type to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tweetTypes.map((inst, idx) => (
                  <InstructionCard
                    key={inst.id}
                    name={inst.name}
                    icon={DEFAULT_ICONS[idx % DEFAULT_ICONS.length]}
                    description={inst.content}
                    filename={`${inst.slug}.md`}
                    version={inst.version}
                    onDelete={() => handleDelete(inst.id, inst.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
