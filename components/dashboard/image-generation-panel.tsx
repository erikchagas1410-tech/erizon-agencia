"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Sparkles, Wand2 } from "lucide-react";

import {
  compositeLogoOnImage,
  type LogoPosition
} from "@/lib/logo-composer";
import {
  buildPollinationsUrl,
  getFormatLabel,
  IMAGE_FORMATS,
  type ImageFormat
} from "@/lib/pollinations";
import type { ClientProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ImageState {
  format: ImageFormat;
  url: string | null;
  loading: boolean;
  error: boolean;
}

function buildInitialState(formats: ImageFormat[]): ImageState[] {
  return formats.map((format) => ({
    format,
    url: null,
    loading: false,
    error: false
  }));
}

function removeCompositedFormat(
  current: Record<string, string>,
  format: ImageFormat
): Record<string, string> {
  if (!current[format]) {
    return current;
  }

  const next = { ...current };
  delete next[format];
  return next;
}

export function ImageGenerationPanel({
  artDirectorOutput,
  client,
  isVisible,
  onImageGenerated,
  singleFormat
}: {
  artDirectorOutput: string;
  client: ClientProfile;
  isVisible: boolean;
  onImageGenerated?: (url: string) => void;
  singleFormat?: ImageFormat;
}) {
  const formatsToUse = useMemo(
    () => (singleFormat ? [singleFormat] : IMAGE_FORMATS),
    [singleFormat]
  );
  const isReferenceMode = Boolean(singleFormat);
  const [images, setImages] = useState<ImageState[]>(() => buildInitialState(formatsToUse));
  const [round, setRound] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(client.logo_url ?? null);
  const [logoPosition, setLogoPosition] =
    useState<LogoPosition>("bottom-right");
  const [composited, setComposited] = useState<Record<string, string>>({});
  const [isApplyingLogo, setIsApplyingLogo] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<string | null>(null);

  useEffect(() => {
    setImages(buildInitialState(formatsToUse));
    setRound(0);
    setHasGenerated(false);
    setLogoUrl(client.logo_url ?? null);
    setLogoPosition("bottom-right");
    setComposited({});
    setLogoFeedback(null);
  }, [artDirectorOutput, client.id, client.logo_url, formatsToUse]);

  const hasReadyImages = useMemo(
    () => images.some((img) => !!img.url && !img.loading),
    [images]
  );

  if (!isVisible) {
    return null;
  }

  function updateImage(format: ImageFormat, patch: Partial<ImageState>) {
    setImages((current) =>
      current.map((img) => (img.format === format ? { ...img, ...patch } : img))
    );
  }

  async function applyLogo(format: ImageFormat, baseUrl: string) {
    if (!logoUrl) {
      return;
    }

    const result = await compositeLogoOnImage(baseUrl, logoUrl, logoPosition);
    setComposited((current) => ({
      ...current,
      [format]: result
    }));
  }

  async function applyLogoToLoadedImages() {
    if (!logoUrl) {
      setLogoFeedback("Adicione uma logo para compor nas pecas.");
      return;
    }

    const readyImages = images.filter((img) => !!img.url && !img.loading);

    if (readyImages.length === 0) {
      setLogoFeedback("Gere ao menos uma peca antes de aplicar a logo.");
      return;
    }

    setIsApplyingLogo(true);
    setLogoFeedback(null);

    const results = await Promise.allSettled(
      readyImages.map((img) => applyLogo(img.format, img.url as string))
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    if (successCount === readyImages.length) {
      setLogoFeedback("Logo aplicada nas pecas carregadas.");
    } else if (successCount > 0) {
      setLogoFeedback("Logo aplicada parcialmente. Revise as pecas antes de baixar.");
    } else {
      setLogoFeedback(
        "Nao foi possivel aplicar a logo. Tente PNG ou WEBP com fundo transparente."
      );
    }

    setIsApplyingLogo(false);
  }

  async function generateSingle(
    format: ImageFormat,
    index: number,
    currentRound: number
  ) {
    setComposited((current) => removeCompositedFormat(current, format));
    updateImage(format, { loading: true, error: false, url: null });

    const url = buildPollinationsUrl({
      artDirectorBrief: artDirectorOutput,
      clientName: client.name,
      visualAesthetic: client.visual_aesthetic,
      brandColors: client.brand_colors ?? "",
      personality: client.personality,
      format,
      index,
      round: currentRound
    });

    const img = new Image();
    img.onload = () => {
      updateImage(format, { url, loading: false });
      onImageGenerated?.(url);
    };
    img.onerror = () => updateImage(format, { loading: false, error: true });
    img.src = url;
  }

  async function generateAll() {
    const nextRound = round + 1;
    setRound(nextRound);
    setHasGenerated(true);
    setLogoFeedback(null);
    setComposited({});

    formatsToUse.forEach((format, index) => {
      generateSingle(format, index, nextRound);
    });
  }

  async function regenerateSingle(format: ImageFormat) {
    const index = formatsToUse.indexOf(format);
    const singleRound = round + index + 10;
    setLogoFeedback(null);
    setComposited((current) => removeCompositedFormat(current, format));
    generateSingle(format, index, singleRound);
  }

  const isAnyLoading = images.some((img) => img.loading);

  return (
    <div className={cn("glass-panel rounded-[2rem] p-6 space-y-6", isReferenceMode && "p-5")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Referencia Visual
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold">
            Background gerado pela IA
          </h2>
          <p className="mt-2 text-sm text-white/56">
            Gera imagens de fundo atmosfericas baseadas na direcao do Art Director.
            Use como asset no Editor de Canvas para montar a peca final com
            tipografia, logo e copy reais.
            {hasGenerated && !isReferenceMode ? (
              <span className="ml-1 text-white/36">
                Gere novamente para explorar outras interpretacoes do mood visual.
              </span>
            ) : null}
          </p>
        </div>

        <button
          type="button"
          onClick={generateAll}
          disabled={isAnyLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Wand2 className="h-4 w-4" />
          {isAnyLoading
            ? "Gerando..."
            : hasGenerated
              ? isReferenceMode
                ? "Gerar nova referencia"
                : "Gerar novo background"
              : isReferenceMode
                ? "Gerar referencia"
                : "Gerar backgrounds"}
        </button>
      </div>

      {hasReadyImages && !isReferenceMode ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Compor logo da marca</h3>
              <p className="mt-1 text-xs text-white/50">
                A logo e aplicada no navegador, por cima da imagem pronta, sem
                depender do Pollinations inserir assets.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="cursor-pointer rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10">
                {logoUrl ? "Trocar logo" : "Adicionar logo"}
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      setLogoUrl(reader.result as string);
                      setComposited({});
                      setLogoFeedback("Logo pronta. Clique em aplicar logo.");
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              {logoUrl ? (
                <>
                  <select
                    value={logoPosition}
                    onChange={(event) => {
                      setLogoPosition(event.target.value as LogoPosition);
                      setComposited({});
                      setLogoFeedback("Posicao atualizada. Clique em aplicar logo.");
                    }}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/70"
                  >
                    <option value="bottom-right">Inferior direito</option>
                    <option value="bottom-left">Inferior esquerdo</option>
                    <option value="bottom-center">Inferior centro</option>
                    <option value="top-right">Superior direito</option>
                    <option value="top-left">Superior esquerdo</option>
                  </select>

                  <button
                    type="button"
                    onClick={applyLogoToLoadedImages}
                    disabled={isApplyingLogo || isAnyLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {isApplyingLogo ? "Aplicando..." : "Aplicar logo"}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {logoFeedback ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/70">
              {logoFeedback}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("grid gap-5", isReferenceMode ? "grid-cols-1" : "sm:grid-cols-3")}>
        {images.map((img) => {
          const displayUrl = composited[img.format] ?? img.url;

          return (
            <div key={img.format} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  {getFormatLabel(img.format)}
                </span>
                {img.error ? (
                  <button
                    type="button"
                    onClick={() => regenerateSingle(img.format)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] text-white/60 transition hover:bg-white/10"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Tentar novamente
                  </button>
                ) : null}
              </div>

              <div
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${
                  img.format === "story" ? "aspect-[9/16]" : "aspect-square"
                }`}
              >
                {!img.loading && !img.url && !img.error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="rounded-full border border-dashed border-white/10 p-3">
                      <Wand2 className="h-5 w-5 text-white/20" />
                    </div>
                    <span className="text-xs text-white/30">
                      {isReferenceMode ? "Clique em gerar referencia" : "Clique em gerar pecas"}
                    </span>
                  </div>
                ) : null}

                {img.loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                    <span className="text-xs text-white/40">Gerando imagem...</span>
                    <span className="text-[10px] text-white/24">
                      pode levar ate 30s
                    </span>
                  </div>
                ) : null}

                {displayUrl && !img.loading ? (
                  <img
                    src={displayUrl}
                    alt={getFormatLabel(img.format)}
                    className="h-full w-full object-cover transition-opacity duration-500"
                  />
                ) : null}

                {img.error && !img.loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <span className="text-xs text-red-300/60">
                      Falha ao gerar. Tente novamente.
                    </span>
                  </div>
                ) : null}
              </div>

              {displayUrl && !img.loading ? (
                <a
                  href={displayUrl}
                  download={`${client.name}-${img.format}-r${round}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  {composited[img.format] ? "Baixar com logo" : "Baixar background"}
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
