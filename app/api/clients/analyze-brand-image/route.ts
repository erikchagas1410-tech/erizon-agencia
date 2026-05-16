import { NextResponse } from "next/server";

import {
  getGroqClient,
  GROQ_VISION_MODEL,
  readGroqText
} from "@/lib/groq-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TOKENS = 1800;

const SYSTEM_PROMPT = `Voce e um especialista em branding e identidade visual.
Sua funcao e analisar uma imagem enviada pelo usuario (logo, identidade visual, referencia ou material da marca) e extrair ou inferir informacoes de branding para preencher um cadastro de cliente em uma plataforma de agencia digital.

Retorne APENAS um JSON valido com exatamente estas chaves:
{
  "name": "Nome da marca ou empresa identificado na imagem",
  "voice_tone": "Tom de voz inferido com base na identidade visual (ex: sofisticado e direto, leve e acolhedor)",
  "personality": "Personalidade da marca como arquetipo (ex: mentor experiente, marca descolada e jovem)",
  "core_values": "Valores centrais inferidos da identidade visual (ex: confianca, inovacao, proximidade)",
  "main_objective": "Objetivo principal inferido (ex: posicionar-se como referencia premium no segmento)",
  "post_sign_off": "Sugestao de assinatura de post com base no tom identificado",
  "value_proposition": "Proposta de valor diferenciada inferida da marca",
  "content_style": "Estilo de conteudo adequado ao perfil visual (ex: reels curtos, carrossel tecnico)",
  "visual_aesthetic": "Descricao da estetica visual identificada (ex: minimalista, clean, premium)",
  "reason_to_exist": "Proposito ou razao de existir inferido da marca",
  "content_pillars": "3 a 5 pilares de conteudo separados por quebra de linha",
  "brand_character": "Descricao da marca como personagem em 2 a 3 linhas",
  "brand_colors": "Cores identificadas em formato hex separadas por virgula (ex: #1A1A2E, #E94560)"
}

Regras obrigatorias:
- Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem explicacoes.
- Se nao conseguir identificar o nome da marca na imagem, use uma sugestao criativa com base no estilo visual.
- Todos os campos devem ser preenchidos. Nunca retorne null ou campo vazio.
- brand_colors: extraia as cores dominantes da imagem em hex. Retorne no minimo 2 e no maximo 4 cores.
- Os textos devem estar em portugues do Brasil.
- Seja especifico e estrategico. Evite respostas genericas.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dataUrl, mimeType } = body as { dataUrl?: string; mimeType?: string };

    if (!dataUrl || !mimeType) {
      return NextResponse.json({ error: "Imagem nao fornecida." }, { status: 400 });
    }

    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "O arquivo enviado nao e uma imagem valida." },
        { status: 400 }
      );
    }

    const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

    if (!base64Data) {
      return NextResponse.json(
        { error: "Nao foi possivel processar a imagem." },
        { status: 400 }
      );
    }

    const imageUrl = dataUrl.startsWith("data:")
      ? dataUrl
      : `data:${mimeType};base64,${base64Data}`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      temperature: 0.3,
      max_completion_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem e extraia todas as informacoes de branding para preencher o cadastro da marca. Retorne apenas o JSON conforme instruido."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    });

    const text = readGroqText(completion.choices[0]?.message?.content);

    if (!text) {
      return NextResponse.json(
        { error: "A IA nao retornou conteudo desta vez." },
        { status: 502 }
      );
    }

    return NextResponse.json({ fields: parseJsonFromText(text) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao analisar a imagem.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseJsonFromText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("A IA retornou um formato inesperado. Tente novamente.");
    }

    return JSON.parse(match[0]);
  }
}
