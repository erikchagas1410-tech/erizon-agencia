import { getGroqClient, GROQ_TEXT_MODEL, readGroqText } from "@/lib/groq-client";
import { creativeQaSchema, type CreativeQaResult } from "./creativeQaSchema";

async function callGroqJson({ system, user, maxTokens }: { system: string; user: string; maxTokens: number }) {
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.25,
      top_p: 1,
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const text = readGroqText(completion.choices[0]?.message?.content);
    if (!text) throw new Error("Groq nao retornou texto");
    return JSON.parse(text);
  } catch (err) {
    throw err;
  }
}

export async function runGroqCreativeQa(creative: unknown, context: unknown): Promise<CreativeQaResult> {
  const system = [
    "Voce e um avaliador criativo de performance. Avalie o Creative JSON seguindo estritamente o schema fornecido.",
    "Retorne apenas JSON valido no formato do Creative QA Schema."
  ].join(" ");

  const user = JSON.stringify({ creative, context }, null, 2);

  try {
    const raw = await callGroqJson({ system, user, maxTokens: 600 });
    return creativeQaSchema.parse(raw);
  } catch (err) {
    throw new Error("Groq QA falhou: " + (err instanceof Error ? err.message : String(err)));
  }
}
