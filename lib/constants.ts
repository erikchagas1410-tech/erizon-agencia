import type { AgentDefinition, AgentKey, ClientFormValues } from "@/lib/types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AI Agency OS";

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    key: "strategist",
    label: "Strategist",
    badge: "Estratégia",
    accent: "#38BDF8",
    description: "Transforma o pedido em uma linha editorial executável."
  },
  {
    key: "copywriter",
    label: "Copywriter",
    badge: "Copy",
    accent: "#F472B6",
    description: "Escreve legendas, CTA e hashtags no tom da marca."
  },
  {
    key: "artDirector",
    label: "Art Director",
    badge: "Visual",
    accent: "#FACC15",
    description: "Cria conceito visual, direção estética e prompts para Canva."
  },
  {
    key: "trafficManager",
    label: "Traffic Manager",
    badge: "Mídia Paga",
    accent: "#4ADE80",
    description: "Traduz a peça para campanha e segmentação quando fizer sentido."
  },
  {
    key: "analyst",
    label: "Analyst",
    badge: "Métricas",
    accent: "#A78BFA",
    description: "Define métricas, benchmarks e testes para melhoria contínua."
  }
];

export const AGENT_KEYS = AGENT_DEFINITIONS.map((agent) => agent.key);

export const REQUEST_SUGGESTIONS = [
  "Crie um carrossel de dicas para topo de funil",
  "Produza um story de lançamento com CTA forte",
  "Monte um post aspiracional para fortalecer autoridade",
  "Escreva um anúncio para Meta Ads com foco em conversão",
  "Planeje um reel curto com gancho e promessa clara"
];

export const DEFAULT_CLIENT_FORM_VALUES: ClientFormValues = {
  name: "",
  voice_tone: "",
  personality: "",
  core_values: "",
  main_objective: "",
  post_sign_off: "",
  value_proposition: "",
  content_style: "",
  visual_aesthetic: "",
  reason_to_exist: "",
  content_pillars: "",
  brand_character: "",
  brand_colors: "",
  logo_url: ""
};

export const AGENT_LABEL_BY_KEY = AGENT_DEFINITIONS.reduce<
  Record<AgentKey, AgentDefinition>
>((accumulator, agent) => {
  accumulator[agent.key] = agent;
  return accumulator;
}, {} as Record<AgentKey, AgentDefinition>);
