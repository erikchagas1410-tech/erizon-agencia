import "server-only";

import { readFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { Fragment, createElement } from "react";
import type { ReactNode } from "react";

import satori from "satori";

import { CreativeTemplateView } from "@/components/creative-engine/creative-template-view";
import {
  CREATIVE_FORMAT_DIMENSIONS,
  type CreativeJson
} from "@/lib/creative/schema";

let cachedFontData: Buffer | null = null;
const moduleRequire = createRequire(import.meta.url);

function expandRenderableNode(node: ReactNode): ReactNode[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => expandRenderableNode(child));
  }

  if (
    node === null ||
    node === undefined ||
    typeof node === "boolean"
  ) {
    return [];
  }

  if (typeof node === "string" || typeof node === "number") {
    return [node];
  }

  const element = node as any;

  if (typeof element.type === "function") {
    return expandRenderableNode(element.type(element.props));
  }

  if (element.type === Fragment) {
    return expandRenderableNode(element.props?.children);
  }

  return [element];
}

function assertSatoriCompatibleTree(node: ReactNode, trail: string[] = []) {
  const expandedNodes = expandRenderableNode(node);

  expandedNodes.forEach((expandedNode, expandedIndex) => {
    if (
      expandedNode === null ||
      expandedNode === undefined ||
      typeof expandedNode === "boolean" ||
      typeof expandedNode === "string" ||
      typeof expandedNode === "number"
    ) {
      return;
    }

    const element = expandedNode as any;
    const elementName =
      typeof element.type === "string" ? element.type : String(element.type);
    const children = expandRenderableNode(element.props?.children);

    const hasPlainTextOnly =
      children.length === 1 && typeof children[0] === "string";

    if (elementName === "div" && children.length > 0 && !hasPlainTextOnly) {
      const display = element.props?.style?.display;

      if (!display) {
        const childSummary = children
          .map((child) => {
            if (typeof child === "string") {
              return "text";
            }

            if (typeof child === "number") {
              return "number";
            }

            if (child && typeof child === "object") {
              const childElement = child as any;
              return typeof childElement.type === "string"
                ? childElement.type
                : String(childElement.type);
            }

            return typeof child;
          })
          .join(", ");

        throw new Error(
          `Preflight Satori: <div> sem display explicito em ${[...trail, `${elementName}[${expandedIndex}]`].join(" > ")}; style=${JSON.stringify(element.props?.style || {})}; children=${childSummary}`
        );
      }
    }

    children.forEach((child, index) => {
      assertSatoriCompatibleTree(child, [...trail, `${elementName}[${expandedIndex}]`, `${elementName}:${index}`]);
    });
  });
}

function normalizeSatoriChildren(children: ReactNode): ReactNode[] {
  return expandRenderableNode(children).flatMap((child) => {
    const normalized = normalizeSatoriNode(child);

    if (Array.isArray(normalized)) {
      return normalized;
    }

    if (
      normalized === null ||
      normalized === undefined ||
      typeof normalized === "boolean"
    ) {
      return [];
    }

    return [normalized];
  });
}

function normalizeSatoriStyle(
  elementType: string,
  style: Record<string, unknown> | undefined,
  requiresExplicitDisplay: boolean
) {
  if (!style && !(elementType === "div" && requiresExplicitDisplay)) {
    return undefined;
  }

  const nextStyle = { ...(style || {}) };

  if (nextStyle.display === "inline-flex") {
    nextStyle.display = "flex";
  }

  if (nextStyle.transform === undefined) {
    delete nextStyle.transform;
  }

  if (!nextStyle.transform) {
    delete nextStyle.transformOrigin;
  }

  if (elementType === "div" && requiresExplicitDisplay && !nextStyle.display) {
    nextStyle.display = "flex";
  }

  return nextStyle;
}

function normalizeSatoriNode(node: ReactNode): ReactNode {
  if (Array.isArray(node)) {
    return node.flatMap((child) => normalizeSatoriChildren(child));
  }

  if (
    node === null ||
    node === undefined ||
    typeof node === "boolean" ||
    typeof node === "string" ||
    typeof node === "number"
  ) {
    return node;
  }

  const element = node as any;

  if (typeof element.type === "function") {
    return normalizeSatoriNode(element.type(element.props));
  }

  if (element.type === Fragment) {
    return normalizeSatoriChildren(element.props?.children);
  }

  const normalizedChildren = normalizeSatoriChildren(element.props?.children);
  const nextProps: Record<string, unknown> = { ...(element.props || {}) };

  if (normalizedChildren.length === 0) {
    delete nextProps.children;
  } else if (normalizedChildren.length === 1) {
    nextProps.children = normalizedChildren[0];
  } else {
    nextProps.children = normalizedChildren;
  }

  const hasPlainTextOnly =
    normalizedChildren.length === 1 && typeof normalizedChildren[0] === "string";

  const normalizedStyle = normalizeSatoriStyle(
    typeof element.type === "string" ? element.type : String(element.type),
    element.props?.style,
    normalizedChildren.length > 0 && !hasPlainTextOnly
  );

  if (normalizedStyle) {
    nextProps.style = normalizedStyle;
  }

  return createElement(element.type, nextProps);
}

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
    nextPackageJson = moduleRequire.resolve(["next", "package.json"].join("/"));
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
  const view = normalizeSatoriNode(
    <CreativeTemplateView creative={normalizedCreative} />
  );

  if (process.env.NODE_ENV !== "production") {
    assertSatoriCompatibleTree(view);
  }

  const svg = await satori(view, {
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
