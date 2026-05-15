export type ImageFormat = "feed" | "story" | "carousel_cover";

const FORMAT_DIMENSIONS: Record<
  ImageFormat,
  { width: number; height: number; label: string }
> = {
  feed: { width: 1024, height: 1024, label: "Feed 1:1" },
  story: { width: 576, height: 1024, label: "Story 9:16" },
  carousel_cover: { width: 1024, height: 1024, label: "Carrossel Cover" }
};

const STYLE_ROTATIONS = [
  "clean minimalist layout, generous white space, bold modern typography, premium social media graphic",
  "editorial magazine style, asymmetric grid composition, strong contrast, high-end design",
  "layered depth with subtle texture overlays, sophisticated premium feel, polished finish",
  "geometric shapes as design elements, contemporary graphic design, striking visual hierarchy",
  "lifestyle composition, soft natural lighting, aspirational mood, professional photography style",
  "typographic-led design, expressive font hierarchy, minimal imagery, designer poster aesthetic"
];

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
  const styleIndex = (round * 3 + index) % STYLE_ROTATIONS.length;
  const style = STYLE_ROTATIONS[styleIndex];
  const dims = FORMAT_DIMENSIONS[format];

  const colorInstruction = brandColors?.trim()
    ? `Brand color palette: ${brandColors}.`
    : `Visual aesthetic: ${visualAesthetic}.`;

  const prompt = [
    `Professional social media graphic for ${clientName}.`,
    `Art direction: ${artDirectorBrief.slice(0, 400)}.`,
    `Brand personality: ${personality}.`,
    colorInstruction,
    `Design style: ${style}.`,
    "No text overlays. No logos. Ultra high quality. Ready for publication.",
    "Digital illustration or photorealistic. Sharp details."
  ].join(" ");

  const seed = (round * 100 + index + 1) * 7;
  const encoded = encodeURIComponent(prompt);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}`;
}

export function getFormatLabel(format: ImageFormat): string {
  return FORMAT_DIMENSIONS[format].label;
}

export const IMAGE_FORMATS: ImageFormat[] = ["feed", "story", "carousel_cover"];
