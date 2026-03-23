import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch text contents of knowledge base files for given channels.
 * Only reads text-based files (.md, .csv, .txt). Skips binary files like PDFs.
 */
export async function getKnowledgeBaseContents(
  supabase: SupabaseClient,
  channels: string[]
): Promise<string[]> {
  const { data: files } = await supabase
    .from("knowledge_base_files")
    .select("filename, file_url, file_type")
    .in("channel", channels);

  if (!files || files.length === 0) return [];

  const textTypes = ["md", "csv", "txt"];
  const textFiles = files.filter((f) =>
    textTypes.includes(f.file_type ?? "")
  );

  const contents: string[] = [];

  for (const file of textFiles) {
    try {
      const res = await fetch(file.file_url);
      if (res.ok) {
        const text = await res.text();
        contents.push(`--- ${file.filename} ---\n${text}`);
      }
    } catch {
      // Skip files we can't download
    }
  }

  return contents;
}
