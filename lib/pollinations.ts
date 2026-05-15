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
  const brief = artDirectorBrief.trim().slice(0, 600);

  const colorInstruction = brandColors?.trim()
    ? `Exact brand color palette: ${brandColors}.`
    : `Visual aesthetic and color mood: ${visualAesthetic}.`;

  const prompt = [
    `Professional ${formatContext} for the brand "${clientName}".`,
    `Creative direction from art director: ${brief}.`,
    `Brand personality: ${personality}.`,
    colorInstruction,
    `Visual aesthetic: ${visualAesthetic}.`,
    "No text. No logos. No watermarks. Ultra high quality. Ready for publication.",
    "Photorealistic or high-end digital illustration. Sharp details. Premium finish."
  ].join(" ");

  const seed = (round * 1000 + index * 137 + 42) % 99999;
  const encoded = encodeURIComponent(prompt);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}&enhance=true`;
}

export function getFormatLabel(format: ImageFormat): string {
  return FORMAT_DIMENSIONS[format].label;
}

export const IMAGE_FORMATS: ImageFormat[] = ["feed", "story", "carousel_cover"];
