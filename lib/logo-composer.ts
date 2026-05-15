export type LogoPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

export async function compositeLogoOnImage(
  imageUrl: string,
  logoUrl: string,
  position: LogoPosition = "bottom-right",
  logoSizePct = 0.18
): Promise<string> {
  const base = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas nao suportado no navegador atual.");
  }

  ctx.drawImage(base, 0, 0);

  const logo = await loadImage(logoUrl);
  const logoW = Math.round(base.width * logoSizePct);
  const logoH = Math.round((logo.height / logo.width) * logoW);
  const margin = Math.round(base.width * 0.04);
  const { x, y } = resolvePosition(
    position,
    base.width,
    base.height,
    logoW,
    logoH,
    margin
  );

  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 12;
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.shadowBlur = 0;

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    img.src = src;
  });
}

function resolvePosition(
  position: LogoPosition,
  iw: number,
  ih: number,
  lw: number,
  lh: number,
  margin: number
): { x: number; y: number } {
  switch (position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: iw - lw - margin, y: margin };
    case "bottom-left":
      return { x: margin, y: ih - lh - margin };
    case "bottom-center":
      return { x: Math.round((iw - lw) / 2), y: ih - lh - margin };
    case "bottom-right":
    default:
      return { x: iw - lw - margin, y: ih - lh - margin };
  }
}
