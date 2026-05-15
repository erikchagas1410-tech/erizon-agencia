import { NextResponse } from "next/server";

import { runAgencyAgents } from "@/lib/groq";
import { serializeCampaign, serializeClient } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";
import { agencyRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = agencyRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Pedido inválido." },
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
      { error: "Cliente não encontrado para a sua conta." },
      { status: 404 }
    );
  }

  const client = serializeClient(clientRow);

  try {
    const results = await runAgencyAgents(client, parsed.data.request);

    const { data: campaignRow, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        client_id: client.id,
        user_id: user.id,
        request: parsed.data.request,
        results
      })
      .select("*")
      .single();

    if (insertError || !campaignRow) {
      return NextResponse.json(
        { error: insertError?.message || "Falha ao salvar campanha." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      client,
      campaign: serializeCampaign(campaignRow)
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao acionar o time de IA.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
