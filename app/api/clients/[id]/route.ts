import { NextResponse } from "next/server";

import { serializeClient } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";
import { clientPayloadSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function invalidIdResponse() {
  return NextResponse.json({ error: "ID de cliente inválido." }, { status: 400 });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return invalidIdResponse();
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ client: serializeClient(data) });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return invalidIdResponse();
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = clientPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("clients")
    .update({
      ...parsed.data,
      brand_colors: parsed.data.brand_colors,
      ...(parsed.data.logo_url !== undefined
        ? {
            logo_url: parsed.data.logo_url?.trim()
              ? parsed.data.logo_url.trim()
              : null
          }
        : {})
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ client: serializeClient(data) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return invalidIdResponse();
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { error } = await supabase.from("clients").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
