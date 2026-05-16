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
 */
const FORMAT_HEADING_ALIASES: Record<ImageFormat, string[]> = {
  feed: [
    "prompt canva para feed",
    "prompt para feed",
    "feed prompt",
    "prompt feed"
  ],
  story: [
    "prompt canva para story",
    "prompt para story",
    "story prompt",
    "prompt story"
  ],
  carousel_cover: [
    "prompt canva para carousel",
    "prompt para carousel",
    "carousel prompt",
    "prompt carousel",
    "prompt canva para carrossel",
    "prompt para carrossel"
  ]
};

/**
 * Extracts the format-specific visual prompt written by the Art Director
 * from the full markdown block it returns.
 *
 * The Art Director delivers a numbered markdown document with sections like:
 *   "5. Prompt Canva para Feed"
 *   "6. Prompt Canva para Story"
 *   "7. Prompt Canva para Carousel"
 *
 * We find the heading for the requested format and grab everything up to
 * the next heading, stripping markdown noise.  If nothing matches we fall
 * back to the whole text (truncated) so the caller never receives an empty
 * prompt.
 */
export function extractFormatPrompt(
  artDirectorOutput: string,
  format: ImageFormat
): string {
  const aliases = FORMAT_HEADING_ALIASES[format];
  const lines = artDirectorOutput.split("\n");

  let startLine = -1;
  let matchedAlias = "";

  for (let i = 0; i < lines.length; i++) {
    const normalized = lines[i]
      .replace(/^#+\s*/, "")      // strip leading # characters
      .replace(/^\d+\.\s*/, "")   // strip leading "5. "
      .toLowerCase()
      .trim();

    if (aliases.some((alias) => normalized.includes(alias))) {
      startLine = i + 1; // content starts on the next line
      matchedAlias = normalized;
      break;
    }
  }

  // Nothing matched — fall back to the whole brief (truncated)
  if (startLine === -1) {
    return artDirectorOutput.trim().slice(0, 700);
  }

  // Collect lines until the next heading or end of document
  const contentLines: string[] = [];
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    // Stop at next markdown heading or next numbered section
    if (/^#{1,6}\s/.test(line) || /^\d+\.\s/.test(line)) {
      break;
    }
    contentLines.push(line);
  }

  const extracted = contentLines
    .join(" ")
    .replace(/\*\*/g, "")   // strip bold markers
    .replace(/\*/g, "")      // strip italic markers
    .replace(/`/g, "")       // strip code ticks
    .replace(/\s+/g, " ")
    .trim();

  // If section was empty (heading exists but no body), fall back
  if (!extracted) {
    return artDirectorOutput.trim().slice(0, 700);
  }

  // Cap at 700 chars — Pollinations handles longer prompts poorly
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

  // ✅ Extract the prompt that the Art Director wrote *for this specific format*
  // instead of slicing the raw markdown from position 0 (which captures headings,
  // not visual instructions).
  const brief = extractFormatPrompt(artDirectorBrief, format);

  // Pollinations is used exclusively to generate a BACKGROUND / MOOD image.
  // Text, logos, UI, and faces are added later in the Canvas Editor.
  // Explicitly forbidding them here prevents the model from hallucinating
  // distorted typography and random people (the core UX bug).

  const colorInstruction = brandColors?.trim()
    ? `Color palette (hex): ${brandColors}.`
    : `Color mood inspired by: ${visualAesthetic}.`;

  const prompt = [
    // What it IS: a background scene, not a finished ad
    `Abstract background scene for a ${formatContext}.`,
    `Visual mood and creative direction: ${brief}.`,
    colorInstruction,
    `Aesthetic: ${visualAesthetic}.`,

    // Hard constraints — keep these explicit and first-person imperative
    // so the model weights them as instructions, not descriptions
    "BACKGROUND ONLY.",
    "NO text of any kind.",
    "NO letters, words, numbers, or glyphs.",
    "NO human faces or people.",
    "NO logos, icons, or UI elements.",
    "NO watermarks.",

    // Quality
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