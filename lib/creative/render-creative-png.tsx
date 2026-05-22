import "server-only";

import { readFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";

import satori from "satori";

import { CreativeTemplateView } from "@/components/creative-engine/creative-template-view";
import {
  CREATIVE_FORMAT_DIMENSIONS,
  type CreativeJson
} from "@/lib/creative/schema";

let cachedFontData: Buffer | null = null;
const moduleRequire = createRequire(import.meta.url);

/**
 * Keep @resvg/resvg-js out of Next/Webpack's static dependency graph.
 *
 * The package loads a native .node binary. If it is imported statically,
 * Next can try to parse that binary during SSR compilation and crash with:
 * "Module parse failed: Unexpected character ... resvgjs.*.node".
 */
function loadResvg() {
  const mod = moduleRequire("@resvg/resvg-js") as typeof import("@resvg/resvg-js");
  return mod.Resvg;
}

function resolveBundledOgFontPath() {
  let nextPackageJson: string | undefined;

  try {
    nextPackageJson = moduleRequire.resolve("next/package.json");
  } catch {
    nextPackageJson = undefined;
  }

  return nextPackageJson
    ? path.join(
        path.dirname(nextPackageJson),
        "dist",
        "compiled",
        "@vercel",
        "og",
        "noto-sans-v27-latin-regular.ttf"
      )
    : undefined;
}

function getRendererFontCandidates() {
  return Array.from(
    new Set(
      [
        process.env.CREATIVE_FONT_PATH,
        path.join(process.cwd(), "public", "fonts", "noto-sans-v27-latin-regular.ttf"),
        path.join(process.cwd(), "node_modules", "next", "dist", "compiled", "@vercel", "og", "noto-sans-v27-latin-regular.ttf"),
        resolveBundledOgFontPath()
      ].filter(Boolean) as string[]
    )
  );
}

async function getRendererFonts() {
  if (!cachedFontData) {
    const candidatePaths = getRendererFontCandidates();

    for (const candidate of candidatePaths) {
      try {
        cachedFontData = await readFile(candidate);
        break;
      } catch {
        // continue to next candidate path
      }
    }
  }

  if (!cachedFontData) {
    throw new Error(
      `Fonte de renderizacao nao encontrada. Defina CREATIVE_FONT_PATH apontando para um .ttf valido ou adicione public/fonts/noto-sans-v27-latin-regular.ttf. Caminhos tentados: ${getRendererFontCandidates().join(", ")}`
    );
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
    },
    {
      name: "Inter",
      data: cachedFontData,
      weight: 800 as const,
      style: "normal" as const
    }
  ];
}

function normalizeCreativeForServerRender(creative: CreativeJson): CreativeJson {
  return {
    ...creative,
    brand: {
      ...creative.brand,
      // Satori is strict with font families. The template uses Inter, so keep
      // the render path deterministic even if the brand kit sends another font.
      fontFamily: "Inter",
      logoUrl: normalizeLogoUrl(creative.brand.logoUrl)
    }
  };
}

function normalizeLogoUrl(logoUrl?: string) {
  if (!logoUrl) {
    return undefined;
  }

  if (/^(https?:\/\/|data:image\/)/i.test(logoUrl)) {
    return logoUrl;
  }

  // Defensive fallback. The schema should already reject relative logo URLs,
  // but this avoids Satori's "Invalid URL" if legacy data reaches the renderer.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;

  if (!baseUrl) {
    return undefined;
  }

  try {
    return new URL(logoUrl, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export async function renderCreativePng(creative: CreativeJson) {
  const normalizedCreative = normalizeCreativeForServerRender(creative);
  const dimensions = CREATIVE_FORMAT_DIMENSIONS[normalizedCreative.format];
  const fonts = await getRendererFonts();

  const svg = await satori(<CreativeTemplateView creative={normalizedCreative} />, {
    width: dimensions.width,
    height: dimensions.height,
    fonts
  });

  const Resvg = loadResvg();
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: dimensions.width
    }
  });

  return resvg.render().asPng();
}
