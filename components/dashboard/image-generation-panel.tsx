"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  ImageOff,
  Layers,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
  X
} from "lucide-react";

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
  elapsed: number;
}

function buildInitialState(formats: ImageFormat[]): ImageState[] {
  return formats.map((format) => ({
    format,
    url: null,
    loading: false,
    error: false,
    elapsed: 0
  }));
}

function removeCompositedFormat(
  current: Record<string, string>,
  format: ImageFormat
): Record<string, string> {
  if (!current[format]) return current;
  const next = { ...current };
  delete next[format];
  return next;
}

const FORMAT_META: Record<ImageFormat, { aspect: string; icon: string; description: string }> = {
  feed: {
    aspect: "aspect-square",
    icon: "⬜",
    description: "Feed Instagram 1:1"
  },
  story: {
    aspect: "aspect-[9/16]",
    icon: "📱",
    description: "Story / Reels 9:16"
  },
  carousel_cover: {
    aspect: "aspect-square",
    icon: "🎠",
    description: "Carrossel Cover 1:1"
  }
};

function LoadingOrb() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full">
      <div className="relative">
        {/* outer ring */}
        <div className="h-14 w-14 rounded-full border border-white/10 animate-ping absolute inset-0 opacity-30" />
        {/* spinning gradient ring */}
        <div
          className="h-14 w-14 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 60%, rgba(124,58,237,0.8), rgba(20,184,166,0.6), transparent 100%)"
          }}
        />
        {/* inner dot */}
        <div className="absolute inset-2 rounded-full bg-[#0a0a0a] flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white/60" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Gerando imagem
        </p>
        <p className="text-[10px] text-white/24">até 30 segundos</p>
      </div>
    </div>
  );
}

function ElapsedTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <span className="font-mono text-[10px] text-white/30 tabular-nums">
      {seconds}s
    </span>
  );
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

  const [images, setImages] = useState<ImageState[]>(() =>
    buildInitialState(formatsToUse)
  );
  const [round, setRound] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(client.logo_url ?? null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [composited, setComposited] = useState<Record<string, string>>({});
  const [isApplyingLogo, setIsApplyingLogo] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<string | null>(null);
  const [showLogoPanel, setShowLogoPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(buildInitialState(formatsToUse));
    setRound(0);
    setHasGenerated(false);
    setLogoUrl(client.logo_url ?? null);
    setLogoPosition("bottom-right");
    setComposited({});
    setLogoFeedback(null);
    setShowLogoPanel(false);
  }, [artDirectorOutput, client.id, client.logo_url, formatsToUse]);

  const hasReadyImages = useMemo(
    () => images.some((img) => !!img.url && !img.loading),
    [images]
  );

  const isAnyLoading = images.some((img) => img.loading);
  const completedCount = images.filter((img) => !!img.url && !img.loading).length;

  if (!isVisible) return null;

  function updateImage(format: ImageFormat, patch: Partial<ImageState>) {
    setImages((current) =>
      current.map((img) =>
        img.format === format ? { ...img, ...patch } : img
      )
    );
  }

  async function applyLogo(format: ImageFormat, baseUrl: string) {
    if (!logoUrl) return;
    const result = await compositeLogoOnImage(baseUrl, logoUrl, logoPosition);
    setComposited((current) => ({ ...current, [format]: result }));
  }

  async function applyLogoToLoadedImages() {
    if (!logoUrl) {
      setLogoFeedback("Adicione uma logo primeiro.");
      return;
    }
    const readyImages = images.filter((img) => !!img.url && !img.loading);
    if (readyImages.length === 0) {
      setLogoFeedback("Gere ao menos uma peça antes de aplicar a logo.");
      return;
    }
    setIsApplyingLogo(true);
    setLogoFeedback(null);
    const results = await Promise.allSettled(
      readyImages.map((img) => applyLogo(img.format, img.url as string))
    );
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    if (successCount === readyImages.length) {
      setLogoFeedback("✓ Logo aplicada com sucesso.");
    } else if (successCount > 0) {
      setLogoFeedback("Logo aplicada parcialmente. Revise antes de baixar.");
    } else {
      setLogoFeedback("Não foi possível aplicar. Tente PNG ou WEBP com fundo transparente.");
    }
    setIsApplyingLogo(false);
  }

  async function generateSingle(
    format: ImageFormat,
    index: number,
    currentRound: number
  ) {
    setComposited((current) => removeCompositedFormat(current, format));
    updateImage(format, { loading: true, error: false, url: null, elapsed: 0 });

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      setComposited({});
      setLogoFeedback('Logo pronta. Clique em "Aplicar logo" para compor.');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      {/* ── Header + CTA ─────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.28), rgba(20,184,166,0.18))",
              border: "1px solid rgba(124,58,237,0.3)"
            }}
          >
            <Sparkles className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">
              {isReferenceMode ? "Referência Visual" : "Geração de Backgrounds"}
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {isReferenceMode
                ? "Fundo atmosférico para usar no editor"
                : "3 formatos gerados pela IA a partir do brief"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasReadyImages && !isReferenceMode && (
            <button
              type="button"
              onClick={() => setShowLogoPanel((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                showLogoPanel
                  ? "bg-white/10 text-white border border-white/20"
                  : "border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/8 hover:text-white/80"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Logo
            </button>
          )}

          <button
            type="button"
            onClick={generateAll}
            disabled={isAnyLoading}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition hover:-translate-y-px hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {isAnyLoading
              ? "Gerando..."
              : hasGenerated
              ? isReferenceMode
                ? "Nova referência"
                : "Gerar novamente"
              : isReferenceMode
              ? "Gerar referência"
              : "Gerar backgrounds"}
          </button>
        </div>
      </div>

      {/* ── Progress bar when loading ─────────────────── */}
      {isAnyLoading && !isReferenceMode && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / formatsToUse.length) * 100}%`,
                background:
                  "linear-gradient(90deg, rgba(124,58,237,0.9), rgba(20,184,166,0.7))"
              }}
            />
          </div>
          <span className="text-[11px] text-white/40 shrink-0 tabular-nums font-mono">
            {completedCount}/{formatsToUse.length} prontos
          </span>
        </div>
      )}

      {/* ── Logo panel ────────────────────────────────── */}
      {showLogoPanel && hasReadyImages && !isReferenceMode && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Compor logo da marca</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                Aplicada no navegador, por cima da imagem, sem depender do gerador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoPanel(false)}
              className="text-white/30 hover:text-white/60 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <Upload className="h-3.5 w-3.5" />
              {logoUrl ? "Trocar logo" : "Adicionar logo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Position selector */}
            {logoUrl && (
              <select
                value={logoPosition}
                onChange={(e) => {
                  setLogoPosition(e.target.value as LogoPosition);
                  setComposited({});
                  setLogoFeedback("Posição atualizada. Clique em aplicar.");
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 outline-none focus:border-violet-500/50"
              >
                <option value="bottom-right">Inferior direito</option>
                <option value="bottom-left">Inferior esquerdo</option>
                <option value="bottom-center">Inferior centro</option>
                <option value="top-right">Superior direito</option>
                <option value="top-left">Superior esquerdo</option>
              </select>
            )}

            {/* Apply button */}
            {logoUrl && (
              <button
                type="button"
                onClick={applyLogoToLoadedImages}
                disabled={isApplyingLogo || isAnyLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {isApplyingLogo ? "Aplicando..." : "Aplicar logo"}
              </button>
            )}
          </div>

          {logoFeedback && (
            <div
              className={cn(
                "rounded-xl border px-3 py-2 text-xs",
                logoFeedback.startsWith("✓")
                  ? "border-teal-500/20 bg-teal-500/8 text-teal-300"
                  : "border-white/10 bg-white/4 text-white/60"
              )}
            >
              {logoFeedback}
            </div>
          )}
        </div>
      )}

      {/* ── Image grid ────────────────────────────────── */}
      <div
        className={cn(
          "grid gap-4",
          isReferenceMode ? "grid-cols-1 max-w-sm" : "grid-cols-1 sm:grid-cols-3"
        )}
      >
        {images.map((img) => {
          const displayUrl = composited[img.format] ?? img.url;
          const meta = FORMAT_META[img.format];
          const hasLogo = !!composited[img.format];

          return (
            <div key={img.format} className="group relative">
              {/* Format label */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">{meta.icon}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/38">
                    {getFormatLabel(img.format)}
                  </span>
                  {hasLogo && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/20 bg-teal-500/8 px-1.5 py-0.5 text-[9px] font-semibold text-teal-400">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Logo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <ElapsedTimer active={img.loading} />
                  {img.url && !img.loading && (
                    <button
                      type="button"
                      onClick={() => regenerateSingle(img.format)}
                      className="opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50 hover:text-white/80 hover:bg-white/10"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Regerar
                    </button>
                  )}
                  {img.error && (
                    <button
                      type="button"
                      onClick={() => regenerateSingle(img.format)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-400/8 px-2.5 py-1 text-[10px] text-red-400 hover:bg-red-400/15"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Tentar novamente
                    </button>
                  )}
                </div>
              </div>

              {/* Image container */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-white/8",
                  meta.aspect,
                  displayUrl ? "bg-black" : "bg-white/[0.025]"
                )}
              >
                {/* Empty state */}
                {!img.loading && !img.url && !img.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(20,184,166,0.08))",
                        border: "1px dashed rgba(255,255,255,0.1)"
                      }}
                    >
                      <Wand2 className="h-5 w-5 text-white/20" />
                    </div>
                    <p className="text-[11px] text-white/24 text-center px-6 leading-relaxed">
                      {isReferenceMode
                        ? "Clique em gerar referência"
                        : `Clique em "Gerar backgrounds"`}
                    </p>
                  </div>
                )}

                {/* Loading state */}
                {img.loading && <LoadingOrb />}

                {/* Error state */}
                {img.error && !img.loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/8">
                      <ImageOff className="h-4 w-4 text-red-400/60" />
                    </div>
                    <p className="text-[11px] text-red-300/50">
                      Falha ao gerar
                    </p>
                  </div>
                )}

                {/* Generated image */}
                {displayUrl && !img.loading && (
                  <img
                    src={displayUrl}
                    alt={getFormatLabel(img.format)}
                    className="h-full w-full object-cover transition-opacity duration-700"
                  />
                )}

                {/* Hover overlay with download */}
                {displayUrl && !img.loading && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/60 via-transparent">
                    <a
                      href={displayUrl}
                      download={`${client.name}-${img.format}-r${round}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold text-black hover:bg-white transition backdrop-blur-sm"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      {hasLogo ? "Baixar com logo" : "Baixar"}
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="mt-1.5 text-[10px] text-white/24 text-center">
                {meta.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Bottom hint ──────────────────────────────── */}
      {hasReadyImages && (
        <p className="text-center text-[11px] text-white/28 leading-relaxed">
          Passe o mouse sobre a imagem para baixar · Clique em{" "}
          <span className="text-white/44">Regerar</span> para explorar variações
        </p>
      )}
    </div>
  );
}