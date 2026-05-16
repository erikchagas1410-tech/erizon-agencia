"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";

import { CreativeTemplateView } from "@/components/creative-engine/creative-template-view";
import {
  CREATIVE_FORMAT_DIMENSIONS,
  creativeRenderRequestSchema,
  type CreativeJson,
  type CreativeRenderRequest
} from "@/lib/creative/schema";

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

type CreativeGenerationResult = {
  success: true;
  creative: CreativeJson;
  imageUrl: string;
  downloadUrl: string;
  generationId: string;
  durationMs: number;
};

export function CreativeEngineWorkspace() {
  const [form, setForm] = useState<CreativeRenderRequest>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreativeGenerationResult | null>(null);

  const formValidation = useMemo(
    () => creativeRenderRequestSchema.safeParse(form),
    [form]
  );

  const previewDimensions = result
    ? CREATIVE_FORMAT_DIMENSIONS[result.creative.format]
    : CREATIVE_FORMAT_DIMENSIONS[form.format];
  const creativeJsonPreview = result
    ? JSON.stringify(result.creative, null, 2)
    : "Nenhum Creative JSON gerado ainda.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formValidation.data)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Falha ao gerar criativo.");
      }

      setResult(payload as CreativeGenerationResult);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Falha ao gerar criativo."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateColor(
    key: keyof CreativeRenderRequest["brand"]["colors"],
    value: string
  ) {
    setForm((current) => ({
      ...current,
      brand: {
        ...current.brand,
        colors: {
          ...current.brand.colors,
          [key]: value
        }
      }
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
      <section className="card rounded-[1.8rem] p-6">
        <div className="mb-6">
          <span className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Creative Render Engine
          </span>
          <h1 className="mt-4 font-heading text-3xl font-semibold text-[var(--color-text-1)]">
            Criativo controlado por JSON validado
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-2)]">
            Este fluxo gera Creative JSON via Groq, renderiza com templates controlados e
            exporta PNG sem depender de imagem generativa livre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="label">Briefing</span>
            <textarea
              value={form.briefing}
              onChange={(event) =>
                setForm((current) => ({ ...current, briefing: event.target.value }))
              }
              rows={6}
              className="input-shell resize-none px-4 py-4 text-sm"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Nicho</span>
              <input
                value={form.niche}
                onChange={(event) =>
                  setForm((current) => ({ ...current, niche: event.target.value }))
                }
                className="input-shell px-4 py-3 text-sm"
              />
            </label>

            <label className="block space-y-2">
              <span className="label">Objetivo</span>
              <input
                value={form.objective}
                onChange={(event) =>
                  setForm((current) => ({ ...current, objective: event.target.value }))
                }
                className="input-shell px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Formato</span>
              <select
                value={form.format}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    format: event.target.value as CreativeRenderRequest["format"]
                  }))
                }
                className="input-shell px-4 py-3 text-sm"
              >
                {Object.entries(CREATIVE_FORMAT_DIMENSIONS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="label">Marca</span>
              <input
                value={form.brand.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    brand: {
                      ...current.brand,
                      name: event.target.value
                    }
                  }))
                }
                className="input-shell px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Cor primaria</span>
              <input
                value={form.brand.colors.primary}
                onChange={(event) => updateColor("primary", event.target.value)}
                className="input-shell px-4 py-3 text-sm"
              />
            </label>

            <label className="block space-y-2">
              <span className="label">Cor de destaque</span>
              <input
                value={form.brand.colors.accent || ""}
                onChange={(event) => updateColor("accent", event.target.value)}
                className="input-shell px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Cor secundaria</span>
              <input
                value={form.brand.colors.secondary || ""}
                onChange={(event) => updateColor("secondary", event.target.value)}
                className="input-shell px-4 py-3 text-sm"
              />
            </label>

            <label className="block space-y-2">
              <span className="label">Fundo</span>
              <input
                value={form.brand.colors.background || ""}
                onChange={(event) => updateColor("background", event.target.value)}
                className="input-shell px-4 py-3 text-sm"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="label">Logo URL opcional</span>
            <input
              value={form.brand.logoUrl || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brand: {
                    ...current.brand,
                    logoUrl: event.target.value || undefined
                  }
                }))
              }
              placeholder="https://..."
              className="input-shell px-4 py-3 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Gerando criativo..." : "Gerar criativo"}
          </button>
        </form>
      </section>

      <div className="space-y-6">
        {error ? (
          <div className="rounded-[16px] border border-red-200 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[#b42318]">
            {error}
          </div>
        ) : null}

        <section className="card rounded-[1.8rem] p-6">
          <div className="mb-5">
            <h2 className="font-heading text-2xl font-semibold text-[var(--color-text-1)]">
              Preview e export
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-2)]">
              O preview HTML usa o mesmo Creative JSON validado que alimenta a exportacao PNG.
            </p>
          </div>

          {result ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,380px),minmax(0,1fr)]">
              <div className="space-y-4">
                <div>
                  <div className="mb-3 text-sm font-semibold text-[var(--color-text-1)]">
                    Preview HTML controlado
                  </div>
                  <CreativeTemplateView creative={result.creative} scale={0.24} bordered />
                </div>

                <div className="rounded-[16px] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3 text-sm text-[var(--color-text-2)]">
                  Template: <strong className="text-[var(--color-text-1)]">{result.creative.template}</strong>
                  {" | "}
                  Formato: <strong className="text-[var(--color-text-1)]">{CREATIVE_FORMAT_DIMENSIONS[result.creative.format].label}</strong>
                  {" | "}
                  Tempo: <strong className="text-[var(--color-text-1)]">{result.durationMs}ms</strong>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-3 text-sm font-semibold text-[var(--color-text-1)]">
                    PNG final
                  </div>
                  <div className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[#fbfaff] p-3">
                    <Image
                      src={result.imageUrl}
                      alt="Preview do criativo gerado"
                      width={previewDimensions.width}
                      height={previewDimensions.height}
                      unoptimized
                      className="h-auto w-full rounded-[16px]"
                    />
                  </div>
                </div>

                <a
                  href={result.downloadUrl}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                >
                  <Download className="h-4 w-4" />
                  Baixar PNG
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--color-border)] bg-[#fbfaff] px-5 py-10 text-center text-sm text-[var(--color-text-2)]">
              Preencha o briefing e gere um criativo para ver o preview e o arquivo final.
            </div>
          )}
        </section>

        <section className="card rounded-[1.8rem] p-6">
          <div className="mb-4">
            <h2 className="font-heading text-2xl font-semibold text-[var(--color-text-1)]">
              Creative JSON
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-2)]">
              Saida validada por schema antes da renderizacao.
            </p>
          </div>

          <pre className="overflow-x-auto rounded-[20px] border border-[var(--color-border)] bg-[#fbfaff] p-4 text-xs leading-6 text-[var(--color-text-2)]">
            {creativeJsonPreview}
          </pre>
        </section>
      </div>
    </div>
  );
}

