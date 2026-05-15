import type { BrandTheme, ClientProfile } from "@/lib/types";
import { parseBrandColors } from "@/lib/utils";

const PRESETS: Array<BrandTheme & { matchers: string[] }> = [
  {
    primary: "#E8D2B5",
    secondary: "#B7945C",
    accent: "#F59E0B",
    bg: "#050505",
    surface: "#121212",
    palette: ["#E8D2B5", "#B7945C", "#FFF6E8", "#1B1B1B"],
    typography: {
      heading: "Syne",
      body: "DM Sans"
    },
    mood: "elegante, sofisticado e editorial",
    keywords: ["bege", "dourado", "luxo", "elegante"],
    matchers: ["elegante", "premium", "luxo", "sofisticado", "minimalista"]
  },
  {
    primary: "#8B5CF6",
    secondary: "#1F1147",
    accent: "#F472B6",
    bg: "#050505",
    surface: "#151026",
    palette: ["#8B5CF6", "#F472B6", "#1F1147", "#F8E8FF"],
    typography: {
      heading: "Syne",
      body: "DM Sans"
    },
    mood: "criativo, ousado e pop",
    keywords: ["violeta", "rosa", "vibrante", "impactante"],
    matchers: ["colorido", "vibrante", "descolada", "criativa", "fashion"]
  },
  {
    primary: "#22D3EE",
    secondary: "#0F3B52",
    accent: "#38BDF8",
    bg: "#050505",
    surface: "#0A1822",
    palette: ["#22D3EE", "#38BDF8", "#0F3B52", "#E0FBFF"],
    typography: {
      heading: "Syne",
      body: "DM Sans"
    },
    mood: "tecnológico, preciso e moderno",
    keywords: ["azul", "clean", "tech", "digital"],
    matchers: ["técnico", "tecnico", "clean", "moderno", "tecnológico", "tecnologico"]
  },
  {
    primary: "#FB7185",
    secondary: "#7F1D1D",
    accent: "#FDBA74",
    bg: "#050505",
    surface: "#211012",
    palette: ["#FB7185", "#FDBA74", "#7F1D1D", "#FFF1F2"],
    typography: {
      heading: "Syne",
      body: "DM Sans"
    },
    mood: "acolhedor, humano e próximo",
    keywords: ["rosa", "pêssego", "soft", "quente"],
    matchers: ["acolhedor", "humano", "delicado", "suave", "leve"]
  }
];

const FALLBACK_THEME: BrandTheme = {
  primary: "#7C3AED",
  secondary: "#14B8A6",
  accent: "#F97316",
  bg: "#050505",
  surface: "#121212",
  palette: ["#7C3AED", "#14B8A6", "#F97316", "#F5F5F5"],
  typography: {
    heading: "Syne",
    body: "DM Sans"
  },
  mood: "contemporâneo, estratégico e confiante",
  keywords: ["roxo", "teal", "laranja", "contraste"]
};

export function inferBrandTheme(client: ClientProfile): BrandTheme {
  const sample = [
    client.visual_aesthetic,
    client.personality,
    client.voice_tone,
    client.value_proposition
  ]
    .join(" ")
    .toLowerCase();

  let bestTheme: (BrandTheme & { matchers: string[] }) | null = null;
  let bestScore = 0;

  for (const preset of PRESETS) {
    const score = preset.matchers.reduce((current, matcher) => {
      return sample.includes(matcher) ? current + 1 : current;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestTheme = preset;
    }
  }

  const baseTheme = bestTheme
    ? {
        primary: bestTheme.primary,
        secondary: bestTheme.secondary,
        accent: bestTheme.accent,
        bg: bestTheme.bg,
        surface: bestTheme.surface,
        palette: bestTheme.palette,
        typography: bestTheme.typography,
        mood: bestTheme.mood,
        keywords: bestTheme.keywords
      }
    : FALLBACK_THEME;

  const customPalette = parseBrandColors(client.brand_colors);

  if (customPalette.length === 0) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    primary: customPalette[0] || baseTheme.primary,
    secondary: customPalette[1] || baseTheme.secondary,
    accent: customPalette[2] || customPalette[0] || baseTheme.accent,
    palette: customPalette
  };
}

export function buildCanvaSearchUrl(
  client: ClientProfile,
  format: "feed" | "story" | "carousel"
) {
  const theme = inferBrandTheme(client);
  const query = [
    format,
    client.visual_aesthetic,
    client.personality,
    theme.keywords.join(" ")
  ]
    .join(" ")
    .trim();

  return `https://www.canva.com/search/templates?q=${encodeURIComponent(query)}`;
}
