import type { AgentDefinition, AgentKey, ClientFormValues } from "@/lib/types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AI Agency OS";

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    key: "strategist",
    label: "Strategist",
    badge: "Estrategia",
    accent: "#8B5CF6",
    description: "Transforma o pedido em uma linha editorial clara e executavel."
  },
  {
    key: "copywriter",
    label: "Copywriter",
    badge: "Copy",
    accent: "#22C55E",
    description: "Escreve legendas, CTA e ganchos no tom real da marca."
  },
  {
    key: "artDirector",
    label: "Art Director",
    badge: "Visual",
    accent: "#F59E0B",
    description: "Consolida conceito visual, composicao e direcao estetica."
  },
  {
    key: "trafficManager",
    label: "Traffic Manager",
    badge: "Midia Paga",
    accent: "#38BDF8",
    description: "Traduz a peca para distribuicao, segmentacao e acao."
  },
  {
    key: "analyst",
    label: "Analyst",
    badge: "Metricas",
    accent: "#0EA5E9",
    description: "Define metricas, benchmarks e testes para melhorar o desempenho."
  }
];

export const AGENT_COLORS: Record<
  AgentKey,
  {
    accent: string;
    soft: string;
    border: string;
    icon: "compass" | "pen" | "palette" | "megaphone" | "chart";
  }
> = {
  strategist: {
    accent: "#8B5CF6",
    soft: "rgba(139, 92, 246, 0.14)",
    border: "rgba(139, 92, 246, 0.26)",
    icon: "compass"
  },
  copywriter: {
    accent: "#22C55E",
    soft: "rgba(34, 197, 94, 0.14)",
    border: "rgba(34, 197, 94, 0.26)",
    icon: "pen"
  },
  artDirector: {
    accent: "#F59E0B",
    soft: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.26)",
    icon: "palette"
  },
  trafficManager: {
    accent: "#38BDF8",
    soft: "rgba(56, 189, 248, 0.14)",
    border: "rgba(56, 189, 248, 0.26)",
    icon: "megaphone"
  },
  analyst: {
    accent: "#0EA5E9",
    soft: "rgba(14, 165, 233, 0.14)",
    border: "rgba(14, 165, 233, 0.26)",
    icon: "chart"
  }
};

export const AGENT_KEYS = AGENT_DEFINITIONS.map((agent) => agent.key);

export const REQUEST_SUGGESTIONS = [
  "Crie um carrossel de dicas para topo de funil",
  "Produza um story de lancamento com CTA forte",
  "Monte um post aspiracional para fortalecer autoridade",
  "Escreva um anuncio para Meta Ads com foco em conversao",
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
