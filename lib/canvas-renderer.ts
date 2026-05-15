import { inferBrandTheme } from "@/lib/brand-theme";
import type {
  BackgroundLayer,
  CanvasTemplate,
  ClientProfile,
  ColorSlot,
  EditorLayer,
  ImageLayer,
  LogoLayer,
  ShapeLayer,
  TextLayer
} from "@/lib/types";

const FONT_CACHE = new Map<string, Promise<void>>();
const BUILT_IN_FONT_FAMILIES = new Set([
  "Syne",
  "DM Sans",
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Poppins"
]);

const TOKEN_MAP: Record<string, keyof ClientProfile> = {
  brand_name: "name",
  value_proposition: "value_proposition",
  post_sign_off: "post_sign_off",
  personality: "personality"
};

type ThemePalette = ReturnType<typeof inferBrandTheme>;

export async function renderTemplateLayers(
  canvas: HTMLCanvasElement,
  layers: EditorLayer[],
  client: ClientProfile
): Promise<void> {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Nao foi possivel obter o contexto 2D do canvas.");
  }

  const theme = inferBrandTheme(client);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const orderedLayers = [...layers]
    .filter((layer) => layer.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of orderedLayers) {
    ctx.save();
    ctx.globalAlpha = clamp(layer.opacity, 0, 1);
    applyLayerTransform(ctx, layer);

    if (layer.type === "background") {
      drawBackgroundLayer(ctx, layer, theme);
    }

    if (layer.type === "shape") {
      drawShapeLayer(ctx, layer, theme);
    }

    if (layer.type === "text") {
      await drawTextLayer(ctx, layer, client, theme);
    }

    if (layer.type === "image") {
      await drawImageLayer(ctx, layer);
    }

    if (layer.type === "logo") {
      await drawLogoLayer(ctx, layer, client);
    }

    ctx.restore();
  }
}

export function exportCanvasAsPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Nao foi possivel exportar o canvas em PNG."));
        return;
      }

      resolve(blob);
    }, "image/png", 1);
  });
}

export async function generateThumbnail(
  layers: EditorLayer[],
  client: ClientProfile,
  width: number,
  height: number
): Promise<string> {
  const source = inferCanvasSizeFromLayers(layers);
  const scaleX = width / source.width;
  const scaleY = height / source.height;
  const scaledLayers = layers.map((layer) => scaleLayer(layer, scaleX, scaleY));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  await renderTemplateLayers(canvas, scaledLayers, client);

  return canvas.toDataURL("image/png");
}

export function hitTestLayer(layer: EditorLayer, pointX: number, pointY: number) {
  if (layer.visible === false) {
    return false;
  }

  const localPoint = toLocalLayerPoint(layer, pointX, pointY);

  if (layer.type === "shape" && layer.shape === "circle") {
    const rx = layer.width / 2;
    const ry = layer.height / 2;
    const value = (localPoint.x * localPoint.x) / (rx * rx) +
      (localPoint.y * localPoint.y) / (ry * ry);
    return value <= 1;
  }

  return (
    localPoint.x >= -layer.width / 2 &&
    localPoint.x <= layer.width / 2 &&
    localPoint.y >= -layer.height / 2 &&
    localPoint.y <= layer.height / 2
  );
}

export function getLayerCornerPoints(layer: EditorLayer) {
  const halfWidth = layer.width / 2;
  const halfHeight = layer.height / 2;
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight }
  ];

  return corners.map((corner) => {
    const rotated = rotatePoint(corner.x, corner.y, degreesToRadians(layer.rotation));

    return {
      x: layer.x + halfWidth + rotated.x,
      y: layer.y + halfHeight + rotated.y
    };
  });
}

export function resolveCanvasColor(
  value: ColorSlot | string,
  client: ClientProfile
) {
  const theme = inferBrandTheme(client);
  return resolvePaint(value, theme);
}

export function inferCanvasSizeFromLayers(layers: EditorLayer[]) {
  const background = layers.find((layer) => layer.type === "background");

  if (background) {
    return {
      width: Math.max(1, Math.round(background.width)),
      height: Math.max(1, Math.round(background.height))
    };
  }

  const maxX = Math.max(...layers.map((layer) => layer.x + layer.width), 1080);
  const maxY = Math.max(...layers.map((layer) => layer.y + layer.height), 1080);

  return {
    width: Math.max(1, Math.round(maxX)),
    height: Math.max(1, Math.round(maxY))
  };
}

function scaleLayer(layer: EditorLayer, scaleX: number, scaleY: number): EditorLayer {
  if (layer.type === "text") {
    return {
      ...layer,
      x: Math.round(layer.x * scaleX),
      y: Math.round(layer.y * scaleY),
      width: Math.round(layer.width * scaleX),
      height: Math.round(layer.height * scaleY),
      fontSize: Math.max(12, Math.round(layer.fontSize * scaleX)),
      letterSpacing: layer.letterSpacing * scaleX
    };
  }

  if (layer.type === "shape") {
    return {
      ...layer,
      x: Math.round(layer.x * scaleX),
      y: Math.round(layer.y * scaleY),
      width: Math.round(layer.width * scaleX),
      height: Math.round(layer.height * scaleY),
      borderRadius: Math.round(layer.borderRadius * Math.min(scaleX, scaleY)),
      stroke: layer.stroke
        ? {
            color: layer.stroke.color,
            width: Math.max(1, Math.round(layer.stroke.width * Math.min(scaleX, scaleY)))
          }
        : undefined
    };
  }

  return {
    ...layer,
    x: Math.round(layer.x * scaleX),
    y: Math.round(layer.y * scaleY),
    width: Math.round(layer.width * scaleX),
    height: Math.round(layer.height * scaleY)
  };
}

function applyLayerTransform(ctx: CanvasRenderingContext2D, layer: EditorLayer) {
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate(degreesToRadians(layer.rotation));
}

function resolvePaint(value: ColorSlot | string, theme: ThemePalette) {
  switch (value) {
    case "primary":
      return theme.primary;
    case "secondary":
      return theme.secondary;
    case "accent":
      return theme.accent;
    case "white":
      return "#FFFFFF";
    case "black":
      return "#050505";
    case "transparent":
      return "transparent";
    default:
      return value;
  }
}

function drawBackgroundLayer(
  ctx: CanvasRenderingContext2D,
  layer: BackgroundLayer,
  theme: ThemePalette
) {
  const rect = getCenteredRect(layer);

  if (layer.gradient) {
    const gradient = createGradient(ctx, layer.width, layer.height, layer.gradient.angle);
    gradient.addColorStop(0, resolvePaint(layer.gradient.from, theme));
    gradient.addColorStop(1, resolvePaint(layer.gradient.to, theme));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = resolvePaint(layer.fill, theme);
  }

  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function drawShapeLayer(
  ctx: CanvasRenderingContext2D,
  layer: ShapeLayer,
  theme: ThemePalette
) {
  const rect = getCenteredRect(layer);
  ctx.fillStyle = resolvePaint(layer.fill, theme);
  ctx.strokeStyle = layer.stroke?.color || "transparent";
  ctx.lineWidth = layer.stroke?.width || 0;

  if (layer.shape === "rect") {
    drawRoundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, layer.borderRadius);
    fillAndStroke(ctx, !!layer.stroke);
    return;
  }

  if (layer.shape === "circle") {
    ctx.beginPath();
    ctx.ellipse(0, 0, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
    fillAndStroke(ctx, !!layer.stroke);
    return;
  }

  if (layer.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -layer.height / 2);
    ctx.lineTo(layer.width / 2, layer.height / 2);
    ctx.lineTo(-layer.width / 2, layer.height / 2);
    ctx.closePath();
    fillAndStroke(ctx, !!layer.stroke);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(-layer.width / 2, 0);
  ctx.lineTo(layer.width / 2, 0);
  ctx.strokeStyle = resolvePaint(layer.fill, theme);
  ctx.lineWidth = layer.stroke?.width || Math.max(2, layer.height || 4);
  ctx.stroke();
}

async function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  client: ClientProfile,
  theme: ThemePalette
) {
  const resolvedText = resolveTokenText(layer.content, client);
  const text = layer.uppercase ? resolvedText.toUpperCase() : resolvedText;
  const family = BUILT_IN_FONT_FAMILIES.has(layer.fontFamily)
    ? layer.fontFamily
    : "DM Sans";

  await ensureGoogleFont(family, layer.fontWeight);

  ctx.fillStyle = resolvePaint(layer.color, theme);
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px "${family}"`;
  ctx.textBaseline = "top";

  const rect = getCenteredRect(layer);
  const lines = wrapText(ctx, text, layer.width, layer.letterSpacing);
  const lineHeightPx = layer.fontSize * layer.lineHeight;
  const maxLines = Math.max(1, Math.floor(layer.height / lineHeightPx));

  lines.slice(0, maxLines).forEach((line, index) => {
    const lineWidth = measureTextWithLetterSpacing(ctx, line, layer.letterSpacing);
    const drawX =
      layer.textAlign === "left"
        ? rect.x
        : layer.textAlign === "center"
          ? -lineWidth / 2
          : rect.x + rect.width - lineWidth;
    const drawY = rect.y + index * lineHeightPx;
    drawTextWithLetterSpacing(ctx, line, drawX, drawY, layer.letterSpacing);
  });
}

async function drawImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer) {
  if (!layer.src) {
    return;
  }

  const image = await loadImageSafe(layer.src);

  if (!image) {
    return;
  }

  drawImageFit(ctx, layer, image);
}

async function drawLogoLayer(
  ctx: CanvasRenderingContext2D,
  layer: LogoLayer,
  client: ClientProfile
) {
  if (!client.logo_url) {
    return;
  }

  const image = await loadImageSafe(client.logo_url);

  if (!image) {
    return;
  }

  drawImageFit(ctx, layer, image);
}

function drawImageFit(
  ctx: CanvasRenderingContext2D,
  layer: Pick<ImageLayer | LogoLayer, "width" | "height" | "fit">,
  image: HTMLImageElement
) {
  const rect = {
    x: -layer.width / 2,
    y: -layer.height / 2,
    width: layer.width,
    height: layer.height
  };

  if (layer.fit === "fill") {
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    return;
  }

  const imageRatio = image.width / image.height;
  const rectRatio = rect.width / rect.height;
  let drawWidth = rect.width;
  let drawHeight = rect.height;
  let offsetX = rect.x;
  let offsetY = rect.y;

  if (layer.fit === "cover") {
    if (imageRatio > rectRatio) {
      drawHeight = rect.height;
      drawWidth = drawHeight * imageRatio;
      offsetX = rect.x - (drawWidth - rect.width) / 2;
    } else {
      drawWidth = rect.width;
      drawHeight = drawWidth / imageRatio;
      offsetY = rect.y - (drawHeight - rect.height) / 2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
    return;
  }

  if (imageRatio > rectRatio) {
    drawWidth = rect.width;
    drawHeight = drawWidth / imageRatio;
    offsetY = rect.y + (rect.height - drawHeight) / 2;
  } else {
    drawHeight = rect.height;
    drawWidth = drawHeight * imageRatio;
    offsetX = rect.x + (rect.width - drawWidth) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function resolveTokenText(content: string, client: ClientProfile) {
  return content.replace(
    /\{\{(brand_name|value_proposition|post_sign_off|personality)\}\}/g,
    (_match, token) => {
      const key = TOKEN_MAP[token];
      const value = client[key];
      return typeof value === "string" ? value : "";
    }
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (
      currentLine &&
      measureTextWithLetterSpacing(ctx, candidate, letterSpacing) > maxWidth
    ) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }

    currentLine = candidate;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function measureTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
) {
  if (!text) {
    return 0;
  }

  const baseWidth = ctx.measureText(text).width;
  return baseWidth + Math.max(0, text.length - 1) * letterSpacing;
}

function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
) {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }

  let cursor = x;

  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + letterSpacing;
  }
}

function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angle: number
) {
  const radians = degreesToRadians(angle);
  const half = Math.max(width, height) / 2;
  const dx = Math.cos(radians) * half;
  const dy = Math.sin(radians) * half;

  return ctx.createLinearGradient(-dx, -dy, dx, dy);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = clamp(radius, 0, Math.min(width, height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function fillAndStroke(ctx: CanvasRenderingContext2D, shouldStroke: boolean) {
  ctx.fill();
  if (shouldStroke) {
    ctx.stroke();
  }
}

function getCenteredRect(layer: EditorLayer) {
  return {
    x: -layer.width / 2,
    y: -layer.height / 2,
    width: layer.width,
    height: layer.height
  };
}

function toLocalLayerPoint(layer: EditorLayer, pointX: number, pointY: number) {
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  const translatedX = pointX - centerX;
  const translatedY = pointY - centerY;

  return rotatePoint(translatedX, translatedY, -degreesToRadians(layer.rotation));
}

function rotatePoint(x: number, y: number, radians: number) {
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians)
  };
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

async function loadImageSafe(src: string) {
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Falha ao carregar imagem."));
      image.src = src;
    });
  } catch {
    return null;
  }
}

async function ensureGoogleFont(family: string, weight: number) {
  if (typeof window === "undefined" || !("fonts" in document)) {
    return;
  }

  const cacheKey = `${family}:${weight}`;

  if (document.fonts.check(`${weight} 16px "${family}"`)) {
    return;
  }

  if (!FONT_CACHE.has(cacheKey)) {
    FONT_CACHE.set(
      cacheKey,
      (async () => {
        const familyQuery = family.replace(/\s+/g, "+");
        const cssResponse = await fetch(
          `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@${weight}&display=swap`
        );

        if (!cssResponse.ok) {
          return;
        }

        const cssText = await cssResponse.text();
        const matches = [...cssText.matchAll(/url\((https:[^)]+)\)\s*format\('woff2'\)/g)];

        await Promise.all(
          matches.map(async (match) => {
            const url = match[1];
            const font = new FontFace(family, `url(${url})`, {
              style: "normal",
              weight: String(weight)
            });

            await font.load();
            document.fonts.add(font);
          })
        );
      })()
    );
  }

  await FONT_CACHE.get(cacheKey);
}
