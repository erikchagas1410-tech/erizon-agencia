import "server-only";

import { readFile } from "fs/promises";
import path from "path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import { CreativeTemplateView } from "@/components/creative-engine/creative-template-view";
import {
  CREATIVE_FORMAT_DIMENSIONS,
  type CreativeJson
} from "@/lib/creative/schema";

let cachedFontData: Buffer | null = null;

async function getRendererFonts() {
  if (!cachedFontData) {
    const fontPath = path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "compiled",
      "@vercel",
      "og",
      "noto-sans-v27-latin-regular.ttf"
    );

    cachedFontData = await readFile(fontPath);
  }

  return [
    {
      name: "Inter",
      data: cachedFontData,
      weight: 400 as const,
      style: "normal" as const
    },
    {
      name: "Inter",
      data: cachedFontData,
      weight: 700 as const,
      style: "normal" as const
    }
  ];
}

export async function renderCreativePng(creative: CreativeJson) {
  const dimensions = CREATIVE_FORMAT_DIMENSIONS[creative.format];
  const fonts = await getRendererFonts();
  const svg = await satori(<CreativeTemplateView creative={creative} />, {
    width: dimensions.width,
    height: dimensions.height,
    fonts
  });
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: dimensions.width
    }
  });

  return resvg.render().asPng();
}
