import { AGENT_DEFINITIONS } from "@/lib/constants";
import type { CampaignRecord, ClientProfile } from "@/lib/types";

export function buildCampaignMarkdown(
  client: ClientProfile,
  campaign: CampaignRecord
) {
  const sections = AGENT_DEFINITIONS.map((agent) => {
    return `## ${agent.label}\n\n${campaign.results[agent.key] || "Sem conteúdo gerado."}`;
  }).join("\n\n");

  return `# ${client.name} - AI Agency OS

## Solicitação

${campaign.request}

## Identidade da Marca

- Tom de voz: ${client.voice_tone}
- Personalidade: ${client.personality}
- Valores centrais: ${client.core_values}
- Objetivo principal: ${client.main_objective}
- Assinatura padrão: ${client.post_sign_off}
- Diferencial real: ${client.value_proposition}
- Estilo de conteúdo: ${client.content_style}
- Estética visual: ${client.visual_aesthetic}
- Motivo de existir: ${client.reason_to_exist}
- Pilares: ${client.content_pillars.join(", ")}
- Personagem: ${client.brand_character}

## Entregáveis

${sections}
`;
}
