import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_VERSION = "2023-06-01";

const SYSTEM_PROMPT = `Você é um especialista em branding e identidade visual.
Sua função é analisar uma imagem enviada pelo usuário (logo, identidade visual, referência ou material da marca) e extrair ou inferir informações de branding para preencher um cadastro de cliente em uma plataforma de agência digital.

Retorne APENAS um JSON válido com exatamente estas chaves:
{
  "name": "Nome da marca ou empresa identificado na imagem",
  "voice_tone": "Tom de voz inferido com base na identidade visual (ex: sofisticado e direto, leve e acolhedor)",
  "personality": "Personalidade da marca como arquétipo (ex: mentor experiente, marca descolada e jovem)",
  "core_values": "Valores centrais inferidos da identidade visual (ex: confiança, inovação, proximidade)",
  "main_objective": "Objetivo principal inferido (ex: posicionar-se como referência premium no segmento)",
  "post_sign_off": "Sugestão de assinatura de post com base no tom identificado",
  "value_proposition": "Proposta de valor diferenciada inferida da marca",
  "content_style": "Estilo de conteúdo adequado ao perfil visual (ex: reels curtos, carrossel técnico)",
  "visual_aesthetic": "Descrição da estética visual identificada (ex: minimalista, clean, premium)",
  "reason_to_exist": "Propósito ou razão de existir inferido da marca",
  "content_pillars": "3 a 5 pilares de conteúdo separados por quebra de linha",
  "brand_character": "Descrição da marca como personagem em 2 a 3 linhas",
  "brand_colors": "Cores identificadas em formato hex separadas por vírgula (ex: #1A1A2E, #E94560)"
}

Regras obrigatórias:
- Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem explicações.
- Se não conseguir identificar o nome da marca na imagem, use uma sugestão criativa com base no estilo visual.
- Todos os campos devem ser preenchidos. Nunca retorne null ou campo vazio.
- brand_colors: extraia as cores dominantes da imagem em hex. Retorne no mínimo 2 e no máximo 4 cores.
- Os textos devem estar em português do Brasil.
- Seja específico e estratégico. Evite respostas genéricas.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dataUrl, mimeType } = body as { dataUrl?: string; mimeType?: string };

    if (!dataUrl || !mimeType) {
      return NextResponse.json(
        { error: "Imagem não fornecida." },
        { status: 400 }
      );
    }

    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "O arquivo enviado não é uma imagem válida." },
        { status: 400 }
      );
    }

    const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

    if (!base64Data) {
      return NextResponse.json(
        { error: "Não foi possível processar a imagem." },
        { status: 400 }
      );
    }

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": serverEnv.anthropicApiKey,
        "anthropic-version": ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Data
                }
              },
              {
                type: "text",
                text: "Analise esta imagem e extraia todas as informações de branding para preencher o cadastro da marca. Retorne apenas o JSON conforme instruído."
              }
            ]
          }
        ]
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      const errorMessage =
        payload?.error?.message ||
        payload?.message ||
        "Falha ao analisar a imagem com a IA.";
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const blocks = Array.isArray(payload?.content) ? payload.content : [];
    const text = blocks
      .map((block: { text?: unknown }) =>
        typeof block?.text === "string" ? block.text : ""
      )
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "A IA não retornou conteúdo desta vez." },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "A IA retornou um formato inesperado. Tente novamente." },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({ fields: parsed });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao analisar a imagem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
