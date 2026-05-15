import { AGENT_LABEL_BY_KEY } from "@/lib/constants";
import { getLanguageInstruction } from "@/lib/language";
import { inferBrandTheme } from "@/lib/brand-theme";
import { inferPaidMediaIntent } from "@/lib/utils";

import type { AgentKey, ClientProfile, OutputLanguage } from "@/lib/types";

function buildBrandContext(client: ClientProfile, language: OutputLanguage) {
  const theme = inferBrandTheme(client);

  return `
Identidade completa da marca:
- Nome da marca: ${client.name}
- Idioma de saída obrigatório: ${language}
- Tom de voz: ${client.voice_tone}
- Personalidade da marca: ${client.personality}
- Valores centrais: ${client.core_values}
- Objetivo principal / métricas de sucesso: ${client.main_objective}
- Assinatura obrigatória no fim da legenda: ${client.post_sign_off}
- Proposta de valor / diferencial real: ${client.value_proposition}
- Estilo de conteúdo: ${client.content_style}
- Tom visual e estético: ${client.visual_aesthetic}
- Motivo de existir: ${client.reason_to_exist}
- Pilares de conteúdo: ${client.content_pillars.join(", ")}
- Personagem da marca: ${client.brand_character}

Direção visual sugerida para manter consistência:
- Paleta hex recomendada: ${theme.palette.join(", ")}
- Tipografia sugerida: títulos em ${theme.typography.heading} e apoio em ${theme.typography.body}
- Atmosfera visual: ${theme.mood}
`.trim();
}

function buildAgentInstruction(agent: AgentKey, client: ClientProfile, request: string) {
  const signOff = client.post_sign_off.trim();
  const isPaidMedia = inferPaidMediaIntent(request);

  switch (agent) {
    case "strategist":
      return `
Você é o agente Strategist de uma agência criativa senior.

Entregue uma resposta em markdown com estes blocos:
1. Objetivo estratégico do conteúdo
2. Grande ideia / ângulo criativo
3. Gancho principal
4. Estrutura sugerida da peça
5. Como conectar com os pilares da marca
6. Próximo passo recomendado

Seja específico, acionável e alinhado aos objetivos de negócio da marca.
`.trim();
    case "copywriter":
      return `
Você é o agente Copywriter.

Entregue em markdown com:
1. Legenda curta
2. Legenda média
3. Legenda longa
4. CTA recomendado
5. Hashtags

Regras obrigatórias:
- Todas as versões devem respeitar o tom de voz da marca.
- Todas as legendas devem terminar exatamente com: ${signOff}
- Inclua CTA coerente com o objetivo principal.
- As hashtags devem ser relevantes e naturais.
`.trim();
    case "artDirector":
      return `
Você é o agente Art Director.

Entregue em markdown com:
1. Conceito visual central
2. Direção de composição, contraste e enquadramento
3. Aplicação da paleta hex
4. Tipografia sugerida
5. Prompt Canva para Feed
6. Prompt Canva para Story
7. Prompt Canva para Carousel

Os prompts para Canva devem ser ricos em detalhe visual e prontos para busca/execução.
`.trim();
    case "trafficManager":
      return `
Você é o agente Traffic Manager.

Entregue em markdown com:
1. Diagnóstico do potencial de mídia paga
2. Público / segmentação
3. Estrutura de campanha
4. Variações de copy para Meta e Google
5. Orçamento ou intensidade sugerida

Se o pedido não for claramente de mídia paga, não responda "não aplicável" de forma seca.
Traduza o conteúdo para uma hipótese de impulsionamento inteligente e explique quando valeria patrocinar.
Contexto do pedido indica mídia paga: ${isPaidMedia ? "sim" : "não"}.
`.trim();
    case "analyst":
      return `
Você é o agente Analyst.

Entregue em markdown com:
1. KPIs principais
2. Benchmarks ou faixas de referência
3. Frequência de publicação recomendada
4. Sugestões de teste A/B
5. Sinais para iterar ou escalar

Seja pragmático e focado em decisões.
`.trim();
    default:
      return "";
  }
}

export function createSystemPrompt(
  agent: AgentKey,
  client: ClientProfile,
  request: string,
  language: OutputLanguage
) {
  const agentMeta = AGENT_LABEL_BY_KEY[agent];

  return `
Você é ${agentMeta.label}, um especialista senior dentro do AI Agency OS.
${getLanguageInstruction(language)}

${buildBrandContext(client, language)}

Pedido do usuário:
${request}

${buildAgentInstruction(agent, client, request)}

Nunca diga que faltam informações. Você já recebeu o briefing completo da marca.
Mantenha a resposta objetiva, premium e pronta para execução.
`.trim();
}
