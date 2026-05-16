import { NextResponse } from "next/server";

import {
  buildBrandingUserMessage,
  createBrandingMasterSystemPrompt
} from "@/lib/branding-prompts";
import {
  getGroqClient,
  GROQ_VISION_MODEL,
  readGroqText
} from "@/lib/groq-client";
import { serializeClient } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";
import { brandChatRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BRANDING_TOKENS = 1800;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = brandChatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados invalidos para o Brand Lab." },
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

  const client = serializeClient(clientRow);
  const groq = getGroqClient();

  const historyMessages = parsed.data.history.map((item) => {
    if (item.role === "assistant") {
      return {
        role: "assistant" as const,
        content: item.content
      };
    }

    if (item.attachments.length === 0) {
      return {
        role: "user" as const,
        content: item.content
      };
    }

    return {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: buildBrandingUserMessage({
            message: item.content,
            attachments: item.attachments
          })
        },
        ...item.attachments.map((attachment) => ({
          type: "image_url" as const,
          image_url: {
            url: attachment.dataUrl
          }
        }))
      ]
    };
  });

  const currentUserMessage =
    parsed.data.attachments.length === 0
      ? {
          role: "user" as const,
          content: buildBrandingUserMessage({
            message: parsed.data.message,
            attachments: parsed.data.attachments
          })
        }
      : {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: buildBrandingUserMessage({
                message: parsed.data.message,
                attachments: parsed.data.attachments
              })
            },
            ...parsed.data.attachments.map((attachment) => ({
              type: "image_url" as const,
              image_url: {
                url: attachment.dataUrl
              }
            }))
          ]
        };

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "system",
          content: createBrandingMasterSystemPrompt(client)
        },
        ...historyMessages,
        currentUserMessage
      ],
      temperature: 0.8,
      top_p: 1,
      max_completion_tokens: MAX_BRANDING_TOKENS
    });

    const content =
      readGroqText(completion.choices[0]?.message?.content) ||
      "Nao consegui concluir a analise desta vez. Tente reformular o pedido.";

    return NextResponse.json({ message: content });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao consultar o Brand Lab.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
