"use client";

import type { ChangeEvent } from "react";
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

import { compositeLogoOnImage, type LogoPosition } from "@/lib/logo-composer";
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

const FORMAT_META: Record<ImageFormat, { aspect: string; chip: string; description: string }> = {
  feed: {
    aspect: "aspect-square",
    chip: "1:1",
    description: "Feed Instagram"
  },
  story: {
    aspect: "aspect-[9/16]",
    chip: "9:16",
    description: "Story / Reels"
  },
  carousel_cover: {
    aspect: "aspect-square",
    chip: "C",
    description: "Capa de carrossel"
  }
};

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
  if (!current[format]) {
    return current;
  }

  const next = { ...current };
  delete next[format];
  return next;
}

function LoadingOrb() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full border border-[rgba(108,99,255,0.2)] opacity-60" />
        <div
          className="h-14 w-14 animate-spin rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 60%, rgba(108,99,255,0.92), rgba(16,185,129,0.68), transparent 100%)"
          }}
        />
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(108,99,255,0.16)]">
          <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          Gerando imagem
        </p>
        <p className="text-[10px] text-[var(--color-text-3)]">ate 30 segundos</p>
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

    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <span className="font-mono text-[10px] tabular-nums text-[var(--color-text-3)]">
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
    () => images.some((image) => Boolean(image.url) && !image.loading),
    [images]
  );
  const isAnyLoading = images.some((image) => image.loading);
  const completedCount = images.filter((image) => Boolean(image.url) && !image.loading).length;

  if (!isVisible) {
    return null;
  }

  function updateImage(format: ImageFormat, patch: Partial<ImageState>) {
    setImages((current) =>
      current.map((image) => (image.format === format ? { ...image, ...patch } : image))
    );
  }

  async function applyLogo(format: ImageFormat, baseUrl: string) {
    if (!logoUrl) {
      return;
    }

    const result = await compositeLogoOnImage(baseUrl, logoUrl, logoPosition);
    setComposited((current) => ({ ...current, [format]: result }));
  }

  async function applyLogoToLoadedImages() {
    if (!logoUrl) {
      setLogoFeedback("Adicione uma logo primeiro.");
      return;
    }

    const readyImages = images.filter((image) => Boolean(image.url) && !image.loading);

    if (readyImages.length === 0) {
      setLogoFeedback("Gere ao menos uma peca antes de aplicar a logo.");
      return;
    }

    setIsApplyingLogo(true);
    setLogoFeedback(null);

    const results = await Promise.allSettled(
      readyImages.map((image) => applyLogo(image.format, image.url as string))
    );
    const successCount = results.filter((result) => result.status === "fulfilled").length;

    if (successCount === readyImages.length) {
      setLogoFeedback("✓ Logo aplicada com sucesso.");
    } else if (successCount > 0) {
      setLogoFeedback("Logo aplicada parcialmente. Revise antes de baixar.");
    } else {
      setLogoFeedback("Nao foi possivel aplicar. Tente PNG ou WEBP com fundo transparente.");
    }

    setIsApplyingLogo(false);
  }

  function generateSingle(format: ImageFormat, index: number, currentRound: number) {
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

    const image = new Image();
    image.onload = () => {
      updateImage(format, { url, loading: false });
      onImageGenerated?.(url);
    };
    image.onerror = () => updateImage(format, { loading: false, error: true });
    image.src = url;
  }

  function generateAll() {
    const nextRound = round + 1;
    setRound(nextRound);
    setHasGenerated(true);
    setLogoFeedback(null);
    setComposited({});
    formatsToUse.forEach((format, index) => generateSingle(format, index, nextRound));
  }

  function regenerateSingle(format: ImageFormat) {
    const index = formatsToUse.indexOf(format);
    const singleRound = round + index + 10;
    setLogoFeedback(null);
    setComposited((current) => removeCompositedFormat(current, format));
    generateSingle(format, index, singleRound);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-violet flex h-10 w-10 items-center justify-center border border-[var(--color-border)] shadow-[0_6px_20px_rgba(108,99,255,0.1)]">
            <Sparkles className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-sm font-semibold leading-tight text-[var(--color-text-1)]">
              {isReferenceMode ? "Referencia visual" : "Geracao de backgrounds"}
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--color-text-2)]">
              {isReferenceMode
                ? "Fundo atmosferico para usar no editor"
                : "Tres formatos gerados pela IA a partir do brief"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasReadyImages && !isReferenceMode ? (
            <button
              type="button"
              onClick={() => setShowLogoPanel((current) => !current)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-xs font-semibold transition duration-150",
                showLogoPanel
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text-2)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Logo
            </button>
          ) : null}

          <button
            type="button"
            onClick={generateAll}
            disabled={isAnyLoading}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-white transition duration-150 hover:bg-[#5A4FE8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {isAnyLoading
              ? "Gerando..."
              : hasGenerated
                ? isReferenceMode
                  ? "Nova referencia"
                  : "Gerar novamente"
                : isReferenceMode
                  ? "Gerar referencia"
                  : "Gerar backgrounds"}
          </button>
        </div>
      </div>

      {isAnyLoading && !isReferenceMode ? (
        <div className="card flex items-center gap-3 rounded-[16px] px-4 py-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#ece9ff]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / formatsToUse.length) * 100}%`,
                background:
                  "linear-gradient(90deg, rgba(108,99,255,0.95), rgba(16,185,129,0.8))"
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--color-text-2)]">
            {completedCount}/{formatsToUse.length} prontos
          </span>
        </div>
      ) : null}

      {showLogoPanel && hasReadyImages && !isReferenceMode ? (
        <div className="card space-y-4 rounded-[16px] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-1)]">
                Compor logo da marca
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-2)]">
                Aplicada no navegador, por cima da imagem, sem depender do gerador.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoPanel(false)}
              className="text-[var(--color-text-3)] transition duration-150 hover:text-[var(--color-text-1)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
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

            {logoUrl ? (
              <select
                value={logoPosition}
                onChange={(event) => {
                  setLogoPosition(event.target.value as LogoPosition);
                  setComposited({});
                  setLogoFeedback("Posicao atualizada. Clique em aplicar.");
                }}
                className="input-shell min-w-[180px] rounded-[10px] px-3 py-2 text-xs"
              >
                <option value="bottom-right">Inferior direito</option>
                <option value="bottom-left">Inferior esquerdo</option>
                <option value="bottom-center">Inferior centro</option>
                <option value="top-right">Superior direito</option>
                <option value="top-left">Superior esquerdo</option>
              </select>
            ) : null}

            {logoUrl ? (
              <button
                type="button"
                onClick={applyLogoToLoadedImages}
                disabled={isApplyingLogo || isAnyLoading}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(108,99,255,0.2)] bg-[var(--color-primary-light)] px-3.5 py-2 text-xs font-semibold text-[var(--color-primary)] transition duration-150 hover:bg-[#e4ddff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {isApplyingLogo ? "Aplicando..." : "Aplicar logo"}
              </button>
            ) : null}
          </div>

          {logoFeedback ? (
            <div
              className={cn(
                "rounded-xl border px-3 py-2 text-xs",
                logoFeedback.startsWith("✓")
                  ? "border-emerald-200 bg-[var(--color-success-bg)] text-[#065f46]"
                  : "border-[var(--color-border)] bg-[#faf9ff] text-[var(--color-text-2)]"
              )}
            >
              {logoFeedback}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4",
          isReferenceMode ? "max-w-sm grid-cols-1" : "grid-cols-1 sm:grid-cols-3"
        )}
      >
        {images.map((image) => {
          const displayUrl = composited[image.format] ?? image.url;
          const meta = FORMAT_META[image.format];
          const hasLogo = Boolean(composited[image.format]);

          return (
            <div key={image.format} className="group relative">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex min-w-[32px] items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)]">
                    {meta.chip}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-3)]">
                    {getFormatLabel(image.format)}
                  </span>
                  {hasLogo ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-[var(--color-success-bg)] px-1.5 py-0.5 text-[9px] font-semibold text-[#065f46]">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Logo
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  <ElapsedTimer active={image.loading} />
                  {image.url && !image.loading ? (
                    <button
                      type="button"
                      onClick={() => regenerateSingle(image.format)}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-[10px] text-[var(--color-text-2)] opacity-0 transition duration-150 group-hover:opacity-100 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Regerar
                    </button>
                  ) : null}
                  {image.error ? (
                    <button
                      type="button"
                      onClick={() => regenerateSingle(image.format)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-[var(--color-danger-bg)] px-2.5 py-1 text-[10px] text-[#b42318]"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Tentar novamente
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_2px_12px_rgba(108,99,255,0.06)]",
                  meta.aspect,
                  displayUrl ? "bg-[#f1efff]" : "bg-[#fcfbff]"
                )}
              >
                {!image.loading && !image.url && !image.error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="icon-box icon-box-violet flex h-12 w-12 items-center justify-center border border-[var(--color-border)]">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <p className="px-6 text-center text-[11px] leading-relaxed text-[var(--color-text-3)]">
                      {isReferenceMode
                        ? "Clique em gerar referencia"
                        : 'Clique em "Gerar backgrounds"'}
                    </p>
                  </div>
                ) : null}

                {image.loading ? <LoadingOrb /> : null}

                {image.error && !image.loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-[var(--color-danger-bg)]">
                      <ImageOff className="h-4 w-4 text-[var(--color-danger)]" />
                    </div>
                    <p className="text-[11px] text-[#b42318]">Falha ao gerar</p>
                  </div>
                ) : null}

                {displayUrl && !image.loading ? (
                  <img
                    src={displayUrl}
                    alt={getFormatLabel(image.format)}
                    className="h-full w-full object-cover transition-opacity duration-700"
                  />
                ) : null}

                {displayUrl && !image.loading ? (
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[rgba(26,26,46,0.62)] via-transparent pb-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <a
                      href={displayUrl}
                      download={`${client.name}-${image.format}-r${round}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] font-bold text-[var(--color-text-1)] transition duration-150 hover:bg-[#f4f1ff]"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      {hasLogo ? "Baixar com logo" : "Baixar"}
                    </a>
                  </div>
                ) : null}
              </div>

              <p className="mt-1.5 text-center text-[10px] text-[var(--color-text-3)]">
                {meta.description}
              </p>
            </div>
          );
        })}
      </div>

      {hasReadyImages ? (
        <p className="text-center text-[11px] leading-relaxed text-[var(--color-text-2)]">
          Passe o mouse sobre a imagem para baixar. Clique em{" "}
          <span className="font-semibold text-[var(--color-primary)]">Regerar</span> para
          explorar variacoes.
        </p>
      ) : null}
    </div>
  );
}
