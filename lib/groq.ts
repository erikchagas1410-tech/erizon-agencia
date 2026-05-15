import "server-only";

import Groq from "groq-sdk";

import { AGENT_DEFINITIONS } from "@/lib/constants";
import { detectClientLanguage } from "@/lib/language";
import { createSystemPrompt } from "@/lib/prompts";
import { serverEnv } from "@/lib/env";

import type { CampaignResults, ClientProfile } from "@/lib/types";

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 1024;

function getGroqClient() {
  return new Groq({
    apiKey: serverEnv.groqApiKey
  });
}

export async function runAgencyAgents(
  client: ClientProfile,
  request: string
): Promise<CampaignResults> {
  const groq = getGroqClient();
  const language = detectClientLanguage(client);

  const entries = await Promise.all(
    AGENT_DEFINITIONS.map(async (agent) => {
      const completion = await groq.chat.completions.create({
        model: MODEL,
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
        completion.choices[0]?.message?.content?.trim() ||
          "O agente não retornou conteúdo desta vez."
      ] as const;
    })
  );

  return Object.fromEntries(entries) as CampaignResults;
}
