import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const channel = req.nextUrl.searchParams.get("channel");

  let query = supabase
    .from("knowledge_base_files")
    .select("*")
    .order("created_at", { ascending: false });

  if (channel) query = query.eq("channel", channel);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const channel = formData.get("channel") as string;

  if (!file || !channel) {
    return NextResponse.json(
      { error: "file and channel required" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const fileName = `${channel}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("knowledge-base")
    .upload(fileName, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("knowledge-base").getPublicUrl(fileName);

  // Extract file extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fileType = ["pdf", "csv", "md", "docx"].includes(ext) ? ext : null;

  // Save metadata
  const { data, error } = await supabase
    .from("knowledge_base_files")
    .insert({
      channel,
      filename: file.name,
      file_url: publicUrl,
      file_size: file.size,
      file_type: fileType,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Get file record to find storage path
  const { data: fileRecord } = await supabase
    .from("knowledge_base_files")
    .select("file_url")
    .eq("id", id)
    .single();

  // Delete from database
  const { error } = await supabase
    .from("knowledge_base_files")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Try to delete from storage (best effort)
  if (fileRecord?.file_url) {
    const path = fileRecord.file_url.split("/knowledge-base/").pop();
    if (path) {
      await supabase.storage.from("knowledge-base").remove([path]);
    }
  }

  return NextResponse.json({ success: true });
}
