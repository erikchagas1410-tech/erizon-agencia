import type { ClientProfile, OutputLanguage } from "@/lib/types";

const PT_KEYWORDS = [
  "acolhedor",
  "leve",
  "lançamento",
  "carrossel",
  "proximidade",
  "conteúdo",
  "conteudo",
  "dicas",
  "estratégia",
  "estrategia",
  "marca"
];

const EN_KEYWORDS = [
  "brand",
  "voice",
  "friendly",
  "technical",
  "confident",
  "launch",
  "storytelling",
  "audience",
  "conversion",
  "awareness",
  "content"
];

const ES_KEYWORDS = [
  "cercanía",
  "cercania",
  "estrategia",
  "contenido",
  "lanzamiento",
  "confiable",
  "marca",
  "objetivo",
  "carrusel",
  "audiencia"
];

function scoreLanguage(sample: string, dictionary: string[]) {
  return dictionary.reduce((score, keyword) => {
    return sample.includes(keyword) ? score + 1 : score;
  }, 0);
}

export function detectClientLanguage(client: ClientProfile): OutputLanguage {
  const sample = [
    client.voice_tone,
    client.personality,
    client.core_values,
    client.main_objective,
    client.content_style,
    client.brand_character
  ]
    .join(" ")
    .toLowerCase();

  const englishScore = scoreLanguage(sample, EN_KEYWORDS);
  const spanishScore = scoreLanguage(sample, ES_KEYWORDS);
  const portugueseScore = scoreLanguage(sample, PT_KEYWORDS);

  if (englishScore > portugueseScore && englishScore > spanishScore) {
    return "en-US";
  }

  if (spanishScore > portugueseScore && spanishScore > englishScore) {
    return "es-ES";
  }

  return "pt-BR";
}

export function getLanguageInstruction(language: OutputLanguage) {
  if (language === "en-US") {
    return "Reply fully in English.";
  }

  if (language === "es-ES") {
    return "Responde completamente en español.";
  }

  return "Responda integralmente em português do Brasil.";
}
