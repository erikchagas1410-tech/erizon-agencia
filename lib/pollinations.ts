export type ImageFormat = "feed" | "story" | "carousel_cover";

const FORMAT_DIMENSIONS: Record<
  ImageFormat,
  { width: number; height: number; label: string }
> = {
  feed: { width: 1024, height: 1024, label: "Feed 1:1" },
  story: { width: 576, height: 1024, label: "Story 9:16" },
  carousel_cover: { width: 1024, height: 1024, label: "Carrossel Cover" }
};

const FORMAT_CONTEXT: Record<ImageFormat, string> = {
  feed: "square social media feed post, 1:1 ratio",
  story: "vertical Instagram or TikTok story, 9:16 ratio, full bleed",
  carousel_cover:
    "carousel cover slide, 1:1 ratio, visually leads a sequence of slides"
};

/**
 * Headings the Art Director uses inside its markdown output.
 * We try each alias in order and return the first match.
 * Expanded to catch more real-world variations.
 */
const FORMAT_HEADING_ALIASES: Record<ImageFormat, string[]> = {
  feed: [
    "prompt de background para feed",
    "prompt background para feed",
    "prompt canva para feed",
    "prompt para feed",
    "feed prompt",
    "prompt feed",
    "background feed",
    "feed background",
    "para o feed",
    "para feed"
  ],
  story: [
    "prompt de background para story",
    "prompt background para story",
    "prompt canva para story",
    "prompt para story",
    "story prompt",
    "prompt story",
    "background story",
    "story background",
    "para o story",
    "para story"
  ],
  carousel_cover: [
    "prompt de background para carousel",
    "prompt background para carousel",
    "prompt de background para carrossel",
    "prompt canva para carousel",
    "prompt para carousel",
    "carousel prompt",
    "prompt carousel",
    "prompt canva para carrossel",
    "prompt para carrossel",
    "background carousel",
    "background carrossel",
    "carrossel cover",
    "carousel cover",
    "para o carrossel",
    "para carrossel",
    "para carousel"
  ]
};

/**
 * Normalizes a string for alias matching:
 * - removes leading markdown heading markers (##, ###, etc.)
 * - removes leading numbered list markers (5., 7., etc.)
 * - lowercases and trims
 * - strips accents/diacritics for fuzzy matching
 */
function normalize(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d+[\.\)]\s*/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Extracts the format-specific visual prompt written by the Art Director
 * from the full markdown block it returns.
 *
 * IMPROVED: 
 * - accent-insensitive matching (câmara vs camara)
 * - strips leading numbered/heading markers more aggressively
 * - falls back gracefully with a minimal prompt rather than 700 chars of markdown soup
 */
export function extractFormatPrompt(
  artDirectorOutput: string,
  format: ImageFormat
): string {
  const aliases = FORMAT_HEADING_ALIASES[format];
  const lines = artDirectorOutput.split("\n");

  let startLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const normalized = normalize(lines[i]);
    if (aliases.some((alias) => normalized.includes(normalize(alias)))) {
      startLine = i + 1;
      break;
    }
  }

  // Nothing matched — build a minimal fallback from brand context only
  // (avoid dumping raw markdown headings into the image model)
  if (startLine === -1) {
    const fallbackLines = lines
      .filter((line) => {
        const n = normalize(line);
        // skip headings, numbered section titles, empty lines
        if (!n || /^#{1,6}\s/.test(line) || /^\d+[\.\)]\s/.test(line)) return false;
        // skip lines that look like UI/label text
        if (n.length < 20) return false;
        return true;
      })
      .slice(0, 6)
      .join(" ")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return fallbackLines.slice(0, 500) || "Abstract atmospheric background, cinematic lighting, premium texture, no text, no people, no logos.";
  }

  // Collect lines until the next heading or next numbered section
  const contentLines: string[] = [];
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,6}\s/.test(line) || /^\d+[\.\)]\s/.test(line)) {
      break;
    }
    contentLines.push(line);
  }

  const extracted = contentLines
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // If section was empty (heading exists but no body), use a safe fallback
  if (!extracted || extracted.length < 30) {
    return "Abstract atmospheric background, cinematic lighting, premium texture, no text, no people, no logos.";
  }

  // Cap at 700 chars
  return extracted.slice(0, 700);
}

export function buildPollinationsUrl({
  artDirectorBrief,
  clientName,
  visualAesthetic,
  brandColors,
  personality,
  format,
  index,
  round
}: {
  artDirectorBrief: string;
  clientName: string;
  visualAesthetic: string;
  brandColors: string;
  personality: string;
  format: ImageFormat;
  index: number;
  round: number;
}): string {
  const dims = FORMAT_DIMENSIONS[format];
  const formatContext = FORMAT_CONTEXT[format];

  const brief = extractFormatPrompt(artDirectorBrief, format);

  const colorInstruction = brandColors?.trim()
    ? `Color palette (hex): ${brandColors}.`
    : `Color mood inspired by: ${visualAesthetic}.`;

  const prompt = [
    `Abstract background scene for a ${formatContext}.`,
    `Visual mood and creative direction: ${brief}.`,
    colorInstruction,
    `Aesthetic: ${visualAesthetic}.`,
    "BACKGROUND ONLY.",
    "NO text of any kind.",
    "NO letters, words, numbers, or glyphs.",
    "NO human faces or people.",
    "NO logos, icons, or UI elements.",
    "NO watermarks.",
    "Abstract, atmospheric, premium finish.",
    "Ultra high quality. Cinematic lighting. Sharp details.",
    "Ready to be used as a design background layer."
  ].join(" ");

  const seed = (round * 1000 + index * 137 + 42) % 99999;
  const encoded = encodeURIComponent(prompt);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}&enhance=true`;
}

export function getFormatLabel(format: ImageFormat): string {
  return FORMAT_DIMENSIONS[format].label;
}

export const IMAGE_FORMATS: ImageFormat[] = ["feed", "story", "carousel_cover"];