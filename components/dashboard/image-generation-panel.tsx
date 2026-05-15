"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, Sparkles, Wand2 } from "lucide-react";

import {
  buildPollinationsUrl,
  getFormatLabel,
  IMAGE_FORMATS,
  type ImageFormat
} from "@/lib/pollinations";
import type { ClientProfile } from "@/lib/types";

interface ImageState {
  format: ImageFormat;
  url: string | null;
  loading: boolean;
  error: boolean;
}

function buildInitialState(): ImageState[] {
  return IMAGE_FORMATS.map((format) => ({
    format,
    url: null,
    loading: false,
    error: false
  }));
}

export function ImageGenerationPanel({
  artDirectorOutput,
  client,
  isVisible
}: {
  artDirectorOutput: string;
  client: ClientProfile;
  isVisible: boolean;
}) {
  const [images, setImages] = useState<ImageState[]>(buildInitialState);
  const [round, setRound] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    setImages(buildInitialState());
    setRound(0);
    setHasGenerated(false);
  }, [artDirectorOutput, client.id]);

  if (!isVisible) {
    return null;
  }

  function updateImage(format: ImageFormat, patch: Partial<ImageState>) {
    setImages((current) =>
      current.map((img) => (img.format === format ? { ...img, ...patch } : img))
    );
  }

  async function generateSingle(
    format: ImageFormat,
    index: number,
    currentRound: number
  ) {
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
    img.onload = () => updateImage(format, { url, loading: false });
    img.onerror = () => updateImage(format, { loading: false, error: true });
    img.src = url;
  }

  async function generateAll() {
    const nextRound = round + 1;
    setRound(nextRound);
    setHasGenerated(true);

    IMAGE_FORMATS.forEach((format, index) => {
      generateSingle(format, index, nextRound);
    });
  }

  async function regenerateSingle(format: ImageFormat) {
    const index = IMAGE_FORMATS.indexOf(format);
    const singleRound = round + index + 10;
    generateSingle(format, index, singleRound);
  }

  const isAnyLoading = images.some((img) => img.loading);

  return (
    <div className="glass-panel rounded-[2rem] p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Pecas Visuais
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold">
            Imagens geradas pela IA
          </h2>
          <p className="mt-2 text-sm text-white/56">
            Baseadas no brief do Art Director. Cada formato usa um estilo visual
            diferente.
            {hasGenerated ? (
              <span className="ml-1 text-white/36">
                Gere novamente para variar os estilos.
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
              ? "Gerar novamente"
              : "Gerar pecas"}
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {images.map((img) => (
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
                    Clique em gerar pecas
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

              {img.url && !img.loading ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={getFormatLabel(img.format)}
                    // Pollinations entrega a imagem final por URL publica; aqui usamos img
                    // simples para detectar carregamento direto no cliente sem proxy.
                    className="h-full w-full object-cover transition-opacity duration-500"
                  />
                </>
              ) : null}

              {img.error && !img.loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <span className="text-xs text-red-300/60">
                    Falha ao gerar. Tente novamente.
                  </span>
                </div>
              ) : null}
            </div>

            {img.url && !img.loading ? (
              <a
                href={img.url}
                download={`${client.name}-${img.format}-r${round}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
