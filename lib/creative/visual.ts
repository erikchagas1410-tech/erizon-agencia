import { CREATIVE_FORMAT_DIMENSIONS } from "@/lib/creative/schema";

export const FORMATS = CREATIVE_FORMAT_DIMENSIONS;

export const TOKENS = {
  borderRadius: 24,
  spacing: 18,
  safeArea: {
    story: 96,
    feed_portrait: 76,
    feed_square: 64
  },
  headlineBase: {
    story: 116,
    feed_portrait: 92,
    feed_square: 84
  },
  subheadline: {
    story: 32,
    feed_portrait: 28,
    feed_square: 25
  },
  cta: {
    story: 24,
    default: 20
  }
};

export function getDimensions(format: keyof typeof CREATIVE_FORMAT_DIMENSIONS) {
  return CREATIVE_FORMAT_DIMENSIONS[format];
}

export function getSafeArea(format: keyof typeof CREATIVE_FORMAT_DIMENSIONS) {
  return TOKENS.safeArea[format] ?? 64;
}

export function getHeadlineSize(format: keyof typeof CREATIVE_FORMAT_DIMENSIONS, length: number) {
  const base = TOKENS.headlineBase[format] ?? TOKENS.headlineBase.feed_square;

  if (length > 58) return base - 28;
  if (length > 44) return base - 16;
  if (length > 32) return base - 8;
  return base;
}

export function getSubheadlineSize(format: keyof typeof CREATIVE_FORMAT_DIMENSIONS) {
  return TOKENS.subheadline[format] ?? TOKENS.subheadline.feed_square;
}

export function getCtaSize(format: keyof typeof CREATIVE_FORMAT_DIMENSIONS) {
  return format === "story" ? TOKENS.cta.story : TOKENS.cta.default;
}

export function truncateText(value: string, max: number) {
  const sanitized = value.replace(/\s+/g, " ").trim();
  return sanitized.length <= max ? sanitized : `${sanitized.slice(0, max - 1).trim()}…`;
}

function relativeLuminance(hex: string) {
  const n = hex.replace("#", "");
  const [r, g, b] = n.match(/.{1,2}/g)!.map((c) => parseInt(c, 16) / 255);
  const srgb = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function readableTextColor(bgHex: string) {
  try {
    const luminance = relativeLuminance(bgHex.replace(/[^0-9A-Fa-f#]/g, ""));
    // contrast vs white: (Lwhite + .05)/(Lbg + .05)
    const contrastWhite = (1.0 + 0.05) / (luminance + 0.05);
    return contrastWhite >= 4.5 ? "#FFFFFF" : "#0B1220";
  } catch {
    return "#FFFFFF";
  }
}

export const PRESET_BRANDS = {
  erizonDark: {
    primary: "#0B1220",
    secondary: "#111827",
    accent: "#38BDF8",
    background: "#020617"
  },
  cleanBlue: {
    primary: "#0F172A",
    secondary: "#E2E8F0",
    accent: "#2563EB",
    background: "#F8FAFC"
  },
  premiumPurple: {
    primary: "#181026",
    secondary: "#312E81",
    accent: "#A78BFA",
    background: "#09090B"
  }
};
