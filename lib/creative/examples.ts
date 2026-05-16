import type { CreativeJson } from "@/lib/creative/schema";
import { PRESET_BRANDS } from "@/lib/creative/visual";

export const painPointExample: CreativeJson = {
  template: "pain_point",
  format: "feed_portrait",
  headline: "Você ainda analisa campanha no olho?",
  subheadline: "A Erizon mostra o que pausar, escalar ou ajustar com IA.",
  cta: "Teste grátis por 7 dias",
  brand: {
    name: "Erizon",
    colors: PRESET_BRANDS.erizonDark,
    fontFamily: "Inter"
  },
  visual: {
    backgroundStyle: "grid",
    mood: "tech",
    density: "medium"
  },
  compliance: {
    avoidPeople: true,
    avoidFakeUI: true,
    avoidTooMuchText: true
  }
};

export const benefitExample: CreativeJson = {
  template: "benefit",
  format: "feed_square",
  headline: "Menos relatório. Mais decisão.",
  subheadline: "Centralize análise, benchmark e recomendações de campanha em um só lugar.",
  cta: "Conheça a Erizon",
  brand: {
    name: "Erizon",
    colors: PRESET_BRANDS.cleanBlue,
    fontFamily: "Inter"
  },
  visual: {
    backgroundStyle: "mesh",
    mood: "clean",
    density: "low"
  },
  compliance: {
    avoidPeople: true,
    avoidFakeUI: true,
    avoidTooMuchText: true
  }
};

export const offerExample: CreativeJson = {
  template: "offer",
  format: "story",
  headline: "Teste a Erizon com seus dados reais",
  subheadline: "Conecte suas contas Meta Ads e veja recomendações práticas em minutos.",
  cta: "Começar teste grátis",
  brand: {
    name: "Erizon",
    colors: PRESET_BRANDS.premiumPurple,
    fontFamily: "Inter"
  },
  visual: {
    backgroundStyle: "abstract",
    mood: "premium",
    density: "medium"
  },
  compliance: {
    avoidPeople: true,
    avoidFakeUI: true,
    avoidTooMuchText: true
  }
};

export const EXAMPLES: Record<string, CreativeJson> = {
  pain_point: painPointExample,
  benefit: benefitExample,
  offer: offerExample
};
