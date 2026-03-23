import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleRequest, createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(req: NextRequest) {
  // Allow service-role calls from n8n (to fetch dynamic sources)
  const isServiceRole = isServiceRoleRequest(req);
  const supabase = isServiceRole ? createServiceRoleClient() : await createClient();

  const activeOnly = req.nextUrl.searchParams.get("active") === "true";

  let query = supabase
    .from("news_sources")
    .select("*")
    .order("created_at", { ascending: false });

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

  const { name, type, url } = await req.json();

  const { data, error } = await supabase
    .from("news_sources")
    .insert({ name, type, url })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, type, url, is_active } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing source id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("news_sources")
    .update({ name, type, url, is_active })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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
    return NextResponse.json({ error: "Missing source id" }, { status: 400 });
  }

  const { error } = await supabase.from("news_sources").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
