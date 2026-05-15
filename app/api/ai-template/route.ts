import { NextResponse } from "next/server";

import { generateAITemplate } from "@/lib/ai-template-service";
import { serializeClient } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";
import { aiTemplateRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = aiTemplateRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Pedido invalido para a IA." },
      { status: 400 }
    );
  }

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", parsed.data.clientId)
    .single();

  if (clientError || !clientRow) {
    return NextResponse.json(
      { error: "Cliente nao encontrado para esta conta." },
      { status: 404 }
    );
  }

  try {
    const template = await generateAITemplate(
      serializeClient(clientRow),
      parsed.data.format,
      parsed.data.category,
      parsed.data.userInstruction
    );

    return NextResponse.json({ template });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel gerar o template com IA.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
