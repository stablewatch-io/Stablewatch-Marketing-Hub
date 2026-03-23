import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isServiceRoleRequest, createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(req: NextRequest) {
  // Allow service-role calls from n8n (to fetch active filter prompts)
  const isServiceRole = isServiceRoleRequest(req);
  const supabase = isServiceRole ? createServiceRoleClient() : await createClient();
  const channel = req.nextUrl.searchParams.get("channel");
  const slug = req.nextUrl.searchParams.get("slug");
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";

  let query = supabase
    .from("modular_instructions")
    .select("*")
    .order("version", { ascending: false });

  if (channel) query = query.eq("channel", channel);
  if (slug) query = query.eq("slug", slug);
  if (activeOnly) query = query.eq("is_active", true);

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

  const body = await req.json();
  const { channel, slug, name, content, notes } = body;

  // Get the latest version number for this channel+slug
  const { data: latest } = await supabase
    .from("modular_instructions")
    .select("version")
    .eq("channel", channel)
    .eq("slug", slug)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version || 0) + 1;
  const isFirst = nextVersion === 1;

  const { data, error } = await supabase
    .from("modular_instructions")
    .insert({
      channel,
      slug,
      name,
      content,
      version: nextVersion,
      is_active: isFirst,
      notes: notes || null,
      created_by: user.id,
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
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("modular_instructions")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// Set active version
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { instructionId, channel, slug } = body;

  // Deactivate all for this channel+slug
  await supabase
    .from("modular_instructions")
    .update({ is_active: false })
    .eq("channel", channel)
    .eq("slug", slug);

  // Activate the selected one
  const { data, error } = await supabase
    .from("modular_instructions")
    .update({ is_active: true })
    .eq("id", instructionId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
