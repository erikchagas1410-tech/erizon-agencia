"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import {
  Download,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Clock,
  Layers,
  Code2,
  Eye,
  Image as ImageIcon,
  Plus,
  History,
  X,
  Palette,
  Info
} from "lucide-react";

import { CreativeTemplateView } from "@/components/creative-engine/creative-template-view";
import {
  CREATIVE_FORMAT_DIMENSIONS,
  creativeRenderRequestSchema,
  type CreativeJson,
  type CreativeRenderRequest
} from "@/lib/creative/schema";

// ── Preset palettes ─────────────────────────────────────────────────────────
const PRESET_PALETTES: {
  label: string;
  emoji: string;
  colors: CreativeRenderRequest["brand"]["colors"];
}[] = [
  {
    label: "Erizon Dark",
    emoji: "🌑",
    colors: { primary: "#0B1220", secondary: "#111827", accent: "#38BDF8", background: "#020617" }
  },
  {
    label: "Clean Blue",
    emoji: "💎",
    colors: { primary: "#0F172A", secondary: "#E2E8F0", accent: "#2563EB", background: "#F8FAFC" }
  },
  {
    label: "Premium Purple",
    emoji: "✨",
    colors: { primary: "#181026", secondary: "#312E81", accent: "#A78BFA", background: "#09090B" }
  },
  {
    label: "Sunset Bold",
    emoji: "🔥",
    colors: { primary: "#1A0A00", secondary: "#3B1A00", accent: "#FF6B35", background: "#0D0500" }
  },
  {
    label: "Mint Fresh",
    emoji: "🌿",
    colors: { primary: "#0A1F1A", secondary: "#14532D", accent: "#34D399", background: "#022C22" }
  }
];

// ── Background options with image support ───────────────────────────────────
const BACKGROUND_STYLE_OPTIONS = [
  { value: "solid", label: "Sólido", description: "Fundo liso e limpo" },
  { value: "gradient", label: "Gradiente", description: "Gradiente suave" },
  { value: "mesh", label: "Mesh", description: "Gradiente orgânico" },
  { value: "grid", label: "Grid", description: "Grade técnica" },
  { value: "abstract", label: "Abstrato", description: "Formas abstratas" }
] as const;

// ── Types ────────────────────────────────────────────────────────────────────
type CreativeGenerationResult = {
  success: true;
  creative: CreativeJson;
  imageUrl: string;
  downloadUrl: string;
  generationId: string;
  durationMs: number;
};

type HistoryEntry = CreativeGenerationResult & { timestamp: Date };

const INITIAL_FORM: CreativeRenderRequest = {
  briefing:
    "Criar anuncio para gestores de trafego que perdem tempo analisando campanhas manualmente e montando relatorios para clientes no WhatsApp.",
  niche: "marketing digital / trafego pago",
  objective: "gerar trial gratuito",
  format: "feed_portrait",
  brand: {
    name: "Erizon",
    colors: {
      primary: "#0B1220",
      secondary: "#111827",
      accent: "#38BDF8",
      background: "#020617"
    }
  }
};

// ── Utility ──────────────────────────────────────────────────────────────────
function CharCounter({ value, max }: { value: string; max: number }) {
  const pct = value.length / max;
  const color = pct > 0.9 ? "text-red-500" : pct > 0.7 ? "text-amber-500" : "text-[var(--color-text-3)]";
  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {value.length}/{max}
    </span>
  );
}

function ColorInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label text-xs">{label}</span>
      <div className="input-shell flex items-center gap-2 px-3 py-2">
        <div className="relative flex-shrink-0">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div
            className="h-6 w-6 rounded-md border border-white/20 shadow-inner"
            style={{ backgroundColor: value || "#000000" }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-[var(--color-text-1)] outline-none"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </label>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function CreativeEngineWorkspace() {
  const [form, setForm] = useState<CreativeRenderRequest>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreativeGenerationResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");
  const [previewScale, setPreviewScale] = useState(0.35);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backgroundOverride, setBackgroundOverride] = useState<string>("");

  const formValidation = useMemo(
    () => creativeRenderRequestSchema.safeParse(form),
    [form]
  );

  const previewDimensions = result
    ? CREATIVE_FORMAT_DIMENSIONS[result.creative.format]
    : CREATIVE_FORMAT_DIMENSIONS[form.format];

  const creativeJsonPreview = result
    ? JSON.stringify(result.creative, null, 2)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValidation.success) {
      setError(formValidation.error.issues[0]?.message || "Preencha os campos corretamente.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/creative-render/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValidation.data)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao gerar criativo.");
      const res = payload as CreativeGenerationResult;
      setResult(res);
      setActiveTab("preview");
      setHistory((prev) => [{ ...res, timestamp: new Date() }, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar criativo.");
    } finally {
      setLoading(false);
    }
  }, [formValidation]);

  const updateColor = useCallback((key: keyof CreativeRenderRequest["brand"]["colors"], value: string) => {
    setForm((prev) => ({
      ...prev,
      brand: { ...prev.brand, colors: { ...prev.brand.colors, [key]: value } }
    }));
  }, []);

  const applyPalette = useCallback((palette: typeof PRESET_PALETTES[0]) => {
    setForm((prev) => ({ ...prev, brand: { ...prev.brand, colors: palette.colors } }));
    setShowPalettes(false);
  }, []);

  const copyJson = useCallback(() => {
    if (!creativeJsonPreview) return;
    navigator.clipboard.writeText(creativeJsonPreview);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }, [creativeJsonPreview]);

  const restoreFromHistory = useCallback((entry: HistoryEntry) => {
    setResult(entry);
    setShowHistory(false);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  const formatLabel = CREATIVE_FORMAT_DIMENSIONS[form.format]?.label;
  const scalePercent = Math.round(previewScale * 100);

  return (
    <div className="grid gap-6 xl:grid-cols-[440px,minmax(0,1fr)]">

      {/* ── LEFT PANEL: Form ── */}
      <section className="card rounded-[1.8rem] p-6 space-y-6">

        {/* Header */}
        <div>
          <span className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Creative Render Engine
          </span>
          <h1 className="mt-3 font-heading text-2xl font-semibold text-[var(--color-text-1)] leading-tight">
            Criativo controlado por JSON validado
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-2)]">
            Gera Creative JSON via IA, renderiza com templates estruturados e exporta PNG sem depender de imagem generativa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Briefing */}
          <label className="block space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="label">Briefing</span>
              <CharCounter value={form.briefing} max={4000} />
            </div>
            <textarea
              value={form.briefing}
              onChange={(e) => setForm((prev) => ({ ...prev, briefing: e.target.value }))}
              rows={5}
              maxLength={4000}
              className="input-shell resize-none px-4 py-3 text-sm"
              placeholder="Descreva o público, dor, produto e contexto do anúncio..."
            />
          </label>

          {/* Niche + Objetivo */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="label">Nicho</span>
                <CharCounter value={form.niche} max={180} />
              </div>
              <input
                value={form.niche}
                onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))}
                maxLength={180}
                className="input-shell px-4 py-2.5 text-sm"
                placeholder="Ex: marketing digital"
              />
            </label>
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="label">Objetivo</span>
                <CharCounter value={form.objective} max={180} />
              </div>
              <input
                value={form.objective}
                onChange={(e) => setForm((prev) => ({ ...prev, objective: e.target.value }))}
                maxLength={180}
                className="input-shell px-4 py-2.5 text-sm"
                placeholder="Ex: gerar trial gratuito"
              />
            </label>
          </div>

          {/* Formato + Marca */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="label">Formato</span>
              <select
                value={form.format}
                onChange={(e) => setForm((prev) => ({ ...prev, format: e.target.value as CreativeRenderRequest["format"] }))}
                className="input-shell px-4 py-2.5 text-sm"
              >
                {Object.entries(CREATIVE_FORMAT_DIMENSIONS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="label">Nome da marca</span>
              <input
                value={form.brand.name}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: { ...prev.brand, name: e.target.value } }))}
                maxLength={64}
                className="input-shell px-4 py-2.5 text-sm"
                placeholder="Ex: Erizon"
              />
            </label>
          </div>

          {/* Colors Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="label">Paleta de cores</span>
              <button
                type="button"
                onClick={() => setShowPalettes((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-2)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Palette className="h-3.5 w-3.5" />
                Presets
                {showPalettes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Palette presets */}
            {showPalettes && (
              <div className="grid grid-cols-5 gap-2 rounded-[14px] border border-[var(--color-border)] bg-[#fbfaff] p-3">
                {PRESET_PALETTES.map((palette) => (
                  <button
                    key={palette.label}
                    type="button"
                    onClick={() => applyPalette(palette)}
                    className="group flex flex-col items-center gap-1.5 rounded-[10px] border border-transparent p-2 text-center transition hover:border-[var(--color-primary)] hover:bg-white"
                    title={palette.label}
                  >
                    <div className="flex gap-px">
                      {[palette.colors.primary, palette.colors.accent, palette.colors.background].map((c, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-sm first:rounded-l-md last:rounded-r-md"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] leading-tight text-[var(--color-text-2)]">{palette.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Color pickers */}
            <div className="grid grid-cols-2 gap-2">
              <ColorInput label="Cor primária" value={form.brand.colors.primary} onChange={(v) => updateColor("primary", v)} />
              <ColorInput label="Destaque" value={form.brand.colors.accent || ""} onChange={(v) => updateColor("accent", v)} />
              <ColorInput label="Secundária" value={form.brand.colors.secondary || ""} onChange={(v) => updateColor("secondary", v)} />
              <ColorInput label="Fundo" value={form.brand.colors.background || ""} onChange={(v) => updateColor("background", v)} />
            </div>
          </div>

          {/* Logo URL */}
          <label className="block space-y-1.5">
            <span className="label">Logo URL <span className="text-[var(--color-text-3)] font-normal">(opcional)</span></span>
            <input
              value={form.brand.logoUrl || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: { ...prev.brand, logoUrl: e.target.value || undefined } }))}
              placeholder="https://..."
              className="input-shell px-4 py-2.5 text-sm"
            />
          </label>

          {/* Advanced: Background image override */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-2)] transition hover:text-[var(--color-primary)]"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Opções avançadas
            </button>
            {showAdvanced && (
              <div className="rounded-[14px] border border-[var(--color-border)] bg-[#fbfaff] p-4 space-y-3">
                <label className="block space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-[var(--color-text-2)]" />
                    <span className="label text-xs">Imagem de fundo (URL)</span>
                  </div>
                  <input
                    value={backgroundOverride}
                    onChange={(e) => setBackgroundOverride(e.target.value)}
                    placeholder="https://... (sobrescreve o fundo no preview)"
                    className="input-shell px-4 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-[var(--color-text-3)] flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Apenas no preview HTML. O PNG exportado usa o template renderizado.
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !formValidation.success}
            className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Gerando criativo..." : "Gerar criativo"}
          </button>

          {!formValidation.success && (
            <p className="text-xs text-[var(--color-text-3)] text-center">
              {formValidation.error.issues[0]?.message}
            </p>
          )}
        </form>
      </section>

      {/* ── RIGHT PANEL: Results ── */}
      <div className="space-y-5">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-[16px] border border-red-200 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[#b42318]">
            <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* History bar */}
        {history.length > 0 && (
          <div className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-2)]">
              <History className="h-4 w-4" />
              <span>{history.length} gerado{history.length > 1 ? "s" : ""} nesta sessão</span>
            </div>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              {showHistory ? "Fechar" : "Ver histórico"}
            </button>
          </div>
        )}

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div className="card rounded-[1.8rem] p-5">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-1)]">
              Histórico da sessão
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((entry, i) => {
                const dims = CREATIVE_FORMAT_DIMENSIONS[entry.creative.format];
                return (
                  <button
                    key={entry.generationId}
                    onClick={() => restoreFromHistory(entry)}
                    className="group flex flex-col gap-2 rounded-[16px] border border-[var(--color-border)] bg-[#fbfaff] p-3 text-left transition hover:border-[var(--color-primary)] hover:shadow-sm"
                  >
                    <div className="overflow-hidden rounded-[10px]">
                      <Image
                        src={entry.imageUrl}
                        alt={`Criativo ${i + 1}`}
                        width={dims.width}
                        height={dims.height}
                        unoptimized
                        className="h-auto w-full"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-[var(--color-text-1)] line-clamp-1">
                        {entry.creative.headline}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-3)] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{entry.durationMs}ms
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Preview Card */}
        <section className="card rounded-[1.8rem] p-6">
          {/* Card header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[var(--color-text-1)]">
                Preview e export
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-2)]">
                Preview HTML usa o mesmo Creative JSON que alimenta o export PNG.
              </p>
            </div>
            {result && (
              <div className="flex-shrink-0 rounded-[10px] border border-[var(--color-border)] bg-[#fbfaff] px-3 py-2 text-xs text-[var(--color-text-2)] text-right space-y-0.5">
                <div className="font-medium text-[var(--color-text-1)]">{result.creative.template}</div>
                <div>{formatLabel} · {result.durationMs}ms</div>
              </div>
            )}
          </div>

          {result ? (
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex gap-1 rounded-[12px] border border-[var(--color-border)] bg-[#fbfaff] p-1">
                {[
                  { id: "preview" as const, icon: Eye, label: "Preview HTML" },
                  { id: "json" as const, icon: Code2, label: "Creative JSON" }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] px-4 py-2 text-sm font-medium transition ${
                      activeTab === id
                        ? "bg-white text-[var(--color-primary)] shadow-sm"
                        : "text-[var(--color-text-2)] hover:text-[var(--color-text-1)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "preview" && (
                <div className="space-y-4">
                  {/* Two-column: preview + PNG */}
                  <div className="grid gap-5 lg:grid-cols-2">

                    {/* HTML Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--color-text-1)]">
                          Preview HTML
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewScale((s) => Math.max(0.2, s - 0.05))}
                            className="rounded-md border border-[var(--color-border)] bg-white p-1.5 text-[var(--color-text-2)] transition hover:text-[var(--color-primary)]"
                            title="Reduzir"
                          >
                            <ZoomOut className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[42px] text-center text-xs text-[var(--color-text-2)]">
                            {scalePercent}%
                          </span>
                          <button
                            onClick={() => setPreviewScale((s) => Math.min(0.7, s + 0.05))}
                            className="rounded-md border border-[var(--color-border)] bg-white p-1.5 text-[var(--color-text-2)] transition hover:text-[var(--color-primary)]"
                            title="Ampliar"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewScale(0.35)}
                            className="rounded-md border border-[var(--color-border)] bg-white p-1.5 text-[var(--color-text-2)] transition hover:text-[var(--color-primary)]"
                            title="Resetar zoom"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div
                        className="flex items-start justify-center overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[#f0eeff] p-4"
                        style={{ minHeight: previewDimensions.height * previewScale + 32 }}
                      >
                        <CreativeTemplateView
                          creative={result.creative}
                          scale={previewScale}
                          bordered
                        />
                      </div>
                    </div>

                    {/* PNG Export */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--color-text-1)]">
                          PNG final
                        </span>
                        <span className="text-xs text-[var(--color-text-3)]">
                          {previewDimensions.width} × {previewDimensions.height}px
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[#f0eeff] p-3">
                        <Image
                          src={result.imageUrl}
                          alt="Preview do criativo gerado"
                          width={previewDimensions.width}
                          height={previewDimensions.height}
                          unoptimized
                          className="h-auto w-full rounded-[16px]"
                        />
                      </div>
                      <a
                        href={result.downloadUrl}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text-2)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        <Download className="h-4 w-4" />
                        Baixar PNG
                      </a>
                    </div>
                  </div>

                  {/* Meta strip */}
                  <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Layers className="h-4 w-4 text-[var(--color-text-3)]" />
                      <span className="text-[var(--color-text-2)]">Template:</span>
                      <strong className="text-[var(--color-text-1)]">{result.creative.template}</strong>
                    </div>
                    <div className="h-4 w-px bg-[var(--color-border)]" />
                    <div className="text-sm">
                      <span className="text-[var(--color-text-2)]">Fundo:</span>{" "}
                      <strong className="text-[var(--color-text-1)]">{result.creative.visual.backgroundStyle}</strong>
                    </div>
                    <div className="h-4 w-px bg-[var(--color-border)]" />
                    <div className="text-sm">
                      <span className="text-[var(--color-text-2)]">Mood:</span>{" "}
                      <strong className="text-[var(--color-text-1)]">{result.creative.visual.mood}</strong>
                    </div>
                    <div className="h-4 w-px bg-[var(--color-border)]" />
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5 text-[var(--color-text-3)]" />
                      <strong className="text-[var(--color-text-1)]">{result.durationMs}ms</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "json" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--color-text-1)]">
                      Creative JSON validado
                    </span>
                    <button
                      onClick={copyJson}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-2)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      {copiedJson ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedJson ? "Copiado!" : "Copiar JSON"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-[20px] border border-[var(--color-border)] bg-[#fbfaff] p-5 text-xs leading-6 text-[var(--color-text-2)] max-h-[500px] overflow-y-auto">
                    {creativeJsonPreview}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[var(--color-border)] bg-[#fbfaff] px-5 py-16 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-[var(--color-primary)] opacity-40" />
              <p className="text-sm font-medium text-[var(--color-text-2)]">
                Preencha o briefing e clique em "Gerar criativo"
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-3)]">
                O preview e o arquivo PNG aparecerão aqui
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
