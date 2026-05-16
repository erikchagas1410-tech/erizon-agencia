import "server-only";

import { AGENT_DEFINITIONS } from "@/lib/constants";
import {
  getGroqClient,
  GROQ_TEXT_MODEL,
  readGroqText
} from "@/lib/groq-client";
import { detectClientLanguage } from "@/lib/language";
import { createSystemPrompt } from "@/lib/prompts";

import type { CampaignResults, ClientProfile } from "@/lib/types";

const MAX_TOKENS = 1024;

export async function runAgencyAgents(
  client: ClientProfile,
  request: string
): Promise<CampaignResults> {
  const groq = getGroqClient();
  const language = detectClientLanguage(client);

  const entries = await Promise.all(
    AGENT_DEFINITIONS.map(async (agent) => {
      const completion = await groq.chat.completions.create({
        model: GROQ_TEXT_MODEL,
        messages: [
          {
            role: "system",
            content: createSystemPrompt(agent.key, client, request, language)
          },
          {
            role: "user",
            content: request
          }
        ],
        temperature: 0.7,
        top_p: 1,
        max_completion_tokens: MAX_TOKENS
      });

      return [
        agent.key,
        readGroqText(completion.choices[0]?.message?.content) ||
          "O agente nao retornou conteudo desta vez."
      ] as const;
    })
  );

  return Object.fromEntries(entries) as CampaignResults;
}
