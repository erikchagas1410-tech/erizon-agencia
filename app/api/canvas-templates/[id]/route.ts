import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return NextResponse.json({ error: "Template invalido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data: templateRow, error: findError } = await supabase
    .from("canvas_templates")
    .select("id, user_id, is_default")
    .eq("id", params.id)
    .single();

  if (findError || !templateRow) {
    return NextResponse.json({ error: "Template nao encontrado." }, { status: 404 });
  }

  if (templateRow.user_id !== user.id || templateRow.is_default) {
    return NextResponse.json(
      { error: "Voce nao pode excluir este template." },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("canvas_templates").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
