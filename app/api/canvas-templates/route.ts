import { NextResponse } from "next/server";

import {
  DEFAULT_EDITOR_TEMPLATES,
  createTemplateFallbackThumbnail
} from "@/lib/canvas-templates";
import { serializeCanvasTemplate } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";
import { canvasTemplateSaveSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("canvas_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    templates: [...DEFAULT_EDITOR_TEMPLATES, ...(data || []).map(serializeCanvasTemplate)]
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = canvasTemplateSaveSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados invalidos para salvar template." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("canvas_templates")
    .insert({
      user_id: user.id,
      client_id: parsed.data.client_id ?? null,
      name: parsed.data.name,
      format: parsed.data.format,
      category: parsed.data.category,
      canvas_width: parsed.data.canvasWidth,
      canvas_height: parsed.data.canvasHeight,
      layers: parsed.data.layers,
      thumbnail:
        parsed.data.thumbnail ||
        createTemplateFallbackThumbnail(parsed.data.name, parsed.data.format),
      is_default: false
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Nao foi possivel salvar o template." },
      { status: 400 }
    );
  }

  return NextResponse.json({ template: serializeCanvasTemplate(data) }, { status: 201 });
}
