"use client";
/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, ScanSearch, Trash2, Upload, Users, X } from "lucide-react";

import { inferBrandTheme } from "@/lib/brand-theme";
import { DEFAULT_CLIENT_FORM_VALUES } from "@/lib/constants";
import type { ClientFormValues, ClientProfile } from "@/lib/types";
import {
  buildPillarsInput,
  getInitials,
  parseBrandColors,
  parsePillarsInput,
  toClientPayload
} from "@/lib/utils";

const FIELD_META: Array<{
  key: keyof ClientFormValues;
  label: string;
  type?: "text" | "textarea";
  placeholder: string;
}> = [
  {
    key: "name",
    label: "Nome da Marca / Cliente",
    placeholder: "Ex.: Michelle Studio"
  },
  {
    key: "voice_tone",
    label: "Tom de Voz",
    placeholder: "Ex.: leve e acolhedor, técnico e confiante"
  },
  {
    key: "personality",
    label: "Personalidade da Marca",
    placeholder: "Ex.: mentor experiente, marca descolada"
  },
  {
    key: "core_values",
    label: "Valores Centrais",
    type: "textarea",
    placeholder: "Ex.: confiança, inovação, proximidade"
  },
  {
    key: "main_objective",
    label: "Objetivo Principal / Métricas de Sucesso",
    type: "textarea",
    placeholder: "Ex.: gerar leads qualificados e aumentar retenção"
  },
  {
    key: "post_sign_off",
    label: "Final da Legenda Padronizado",
    placeholder: "Ex.: Com carinho, equipe Michelle."
  },
  {
    key: "value_proposition",
    label: "Proposta de Valor / Diferencial Real",
    type: "textarea",
    placeholder: "Explique o diferencial competitivo verdadeiro da marca"
  },
  {
    key: "content_style",
    label: "Estilo de Conteúdo",
    placeholder: "Ex.: reels curtos, carrossel técnico, posts aspiracionais"
  },
  {
    key: "visual_aesthetic",
    label: "Tom Visual e Estético",
    placeholder: "Ex.: minimalista, colorido, elegante"
  },
  {
    key: "reason_to_exist",
    label: "Motivo de Existir",
    type: "textarea",
    placeholder: "Qual transformação essa marca quer provocar?"
  },
  {
    key: "content_pillars",
    label: "Pilares de Conteúdo",
    type: "textarea",
    placeholder: "Digite de 3 a 5 pilares, um por linha"
  },
  {
    key: "brand_character",
    label: "Descrição do Personagem da Marca",
    type: "textarea",
    placeholder: "Descreva a marca como se fosse uma pessoa em 2 ou 3 linhas"
  }
];

const AI_FILLABLE_FIELDS = new Set<keyof ClientFormValues>([
  "name",
  "voice_tone",
  "personality",
  "core_values",
  "main_objective",
  "post_sign_off",
  "value_proposition",
  "content_style",
  "visual_aesthetic",
  "reason_to_exist",
  "content_pillars",
  "brand_character",
  "brand_colors"
]);

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;
const MAX_ANALYZE_FILE_SIZE = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Nao foi possivel ler a logo enviada."));
    };

    reader.onerror = () => {
      reject(new Error("Nao foi possivel ler a logo enviada."));
    };

    reader.readAsDataURL(file);
  });
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((chunk) => `${chunk}${chunk}`)
          .join("")
      : normalized;

  if (expanded.length !== 6) {
    return null;
  }

  const value = Number.parseInt(expanded, 16);

  if (Number.isNaN(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function getPreviewTextColor(colors: string[]) {
  const validColors = colors
    .map(hexToRgb)
    .filter((color): color is NonNullable<ReturnType<typeof hexToRgb>> => Boolean(color));

  if (validColors.length === 0) {
    return "#FFFFFF";
  }

  const average = validColors.reduce(
    (accumulator, color) => ({
      r: accumulator.r + color.r,
      g: accumulator.g + color.g,
      b: accumulator.b + color.b
    }),
    { r: 0, g: 0, b: 0 }
  );

  const count = validColors.length;
  const luminance =
    (0.2126 * (average.r / count) +
      0.7152 * (average.g / count) +
      0.0722 * (average.b / count)) /
    255;

  return luminance > 0.68 ? "#050505" : "#FFFFFF";
}

function toFormValues(client: ClientProfile): ClientFormValues {
  return {
    name: client.name,
    voice_tone: client.voice_tone,
    personality: client.personality,
    core_values: client.core_values,
    main_objective: client.main_objective,
    post_sign_off: client.post_sign_off,
    value_proposition: client.value_proposition,
    content_style: client.content_style,
    visual_aesthetic: client.visual_aesthetic,
    reason_to_exist: client.reason_to_exist,
    content_pillars: buildPillarsInput(client.content_pillars),
    brand_character: client.brand_character,
    brand_colors: client.brand_colors,
    logo_url: client.logo_url ?? ""
  };
}

type AnalyzeState =
  | { status: "idle" }
  | { status: "preview"; dataUrl: string; mimeType: string; fileName: string }
  | { status: "analyzing" }
  | { status: "done"; fields: Partial<ClientFormValues> };

function BrandAnalyzerModal({
  onApply,
  onClose
}: {
  onApply: (fields: Partial<ClientFormValues>) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<AnalyzeState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Envie uma imagem PNG, JPG, WEBP ou SVG.");
      return;
    }

    if (file.size > MAX_ANALYZE_FILE_SIZE) {
      setError("A imagem precisa ter até 5 MB.");
      return;
    }

    setError(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setState({ status: "preview", dataUrl, mimeType: file.type, fileName: file.name });
    } catch {
      setError("Não foi possível carregar a imagem.");
    }
  }

  async function handleAnalyze() {
    if (state.status !== "preview") {
      return;
    }

    const { dataUrl, mimeType } = state;
    setState({ status: "analyzing" });
    setError(null);

    try {
      const response = await fetch("/api/clients/analyze-brand-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, mimeType })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Falha ao analisar a imagem.");
      }

      setState({ status: "done", fields: payload.fields as Partial<ClientFormValues> });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setState({ status: "idle" });
    }
  }

  function handleReset() {
    setState({ status: "idle" });
    setError(null);
  }

  const previewColors =
    state.status === "done" && state.fields.brand_colors
      ? parseBrandColors(state.fields.brand_colors)
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(26,26,46,0.38)]"
        onClick={onClose}
      />

      <div className="card relative w-full max-w-xl overflow-hidden rounded-[24px]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              <ScanSearch className="h-3.5 w-3.5" />
              IA de Branding
            </div>
            <h2 className="mt-1 font-heading text-xl font-semibold">
              Analisar imagem da marca
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--color-border)] bg-white p-2 text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {state.status === "idle" && (
            <div>
              <p className="mb-5 text-sm leading-6 text-[var(--color-text-2)]">
                Envie o logo, uma referência visual ou qualquer material da marca.
                A IA vai analisar e preencher automaticamente os campos do cadastro.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--color-border)] bg-[#fbfaff] py-10 transition duration-150 hover:bg-[var(--color-primary-light)]"
              >
                <div className="icon-box icon-box-violet flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)]">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-sm text-[var(--color-text-1)]">
                  Clique para selecionar uma imagem
                </div>
                <div className="text-xs text-[var(--color-text-3)]">PNG, JPG, WEBP ou SVG ate 5 MB</div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>
          )}

          {state.status === "preview" && (
            <div>
              <div className="mb-5 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[#fbfaff]">
                <img
                  src={state.dataUrl}
                  alt={state.fileName}
                  className="max-h-56 w-full object-contain p-4"
                />
                <div className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-3)]">
                  {state.fileName}
                </div>
              </div>

              <p className="mb-5 text-sm text-[var(--color-text-2)]">
                A IA vai analisar esta imagem e preencher todos os campos de
                identidade da marca automaticamente. Você poderá revisar antes de
                salvar.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                >
                  Trocar imagem
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8]"
                >
                  <ScanSearch className="h-4 w-4" />
                  Analisar com IA
                </button>
              </div>
            </div>
          )}

          {state.status === "analyzing" && (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-2 border-[rgba(108,99,255,0.16)] border-t-[var(--color-primary)]" />
                <ScanSearch className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-[var(--color-primary)]" />
              </div>
              <div>
                <div className="font-heading text-lg font-semibold">Analisando a marca…</div>
                <div className="mt-2 text-sm text-[var(--color-text-2)]">
                  A IA está lendo cores, estética e identidade visual.
                  <br />
                  Isso leva alguns segundos.
                </div>
              </div>
              <div className="mt-2 w-full max-w-xs space-y-2">
                <div className="h-2 w-full animate-pulse rounded-full bg-[#ece9ff]" />
                <div className="h-2 w-4/5 animate-pulse rounded-full bg-[#f0edff]" />
                <div className="h-2 w-3/5 animate-pulse rounded-full bg-[#f4f2ff]" />
              </div>
            </div>
          )}

          {state.status === "done" && (
            <div>
              <div className="mb-5 rounded-[20px] border border-emerald-200 bg-[var(--color-success-bg)] px-4 py-3">
                <div className="text-sm font-semibold text-[#065f46]">
                  Análise concluída
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-2)]">
                  Revise os campos abaixo e clique em{" "}
                  <strong className="text-[var(--color-text-1)]">Aplicar ao formulário</strong> para
                  preencher o cadastro. Você pode editar qualquer campo depois.
                </div>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {(
                  [
                    ["name", "Nome da Marca"],
                    ["voice_tone", "Tom de Voz"],
                    ["personality", "Personalidade"],
                    ["visual_aesthetic", "Estética Visual"],
                    ["value_proposition", "Proposta de Valor"],
                    ["content_pillars", "Pilares de Conteúdo"],
                    ["brand_colors", "Paleta de Cores"]
                  ] as Array<[keyof ClientFormValues, string]>
                ).map(([key, label]) => {
                  const value = state.fields[key];
                  if (!value) {
                    return null;
                  }

                  return (
                    <div key={key} className="rounded-2xl border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-3)]">
                        {label}
                      </div>
                      <div className="text-sm leading-6 text-[var(--color-text-1)]">
                        {String(value)}
                      </div>
                      {key === "brand_colors" && previewColors.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {previewColors.map((color, i) => (
                            <div
                              key={`${color}-${i}`}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="h-7 w-7 rounded-xl border border-[var(--color-border)]"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs text-[var(--color-text-3)]">{color}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                >
                  Nova imagem
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApply(state.fields);
                    onClose();
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8]"
                >
                  Aplicar ao formulário
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClientManagerWorkspace({
  initialClients
}: {
  initialClients: ClientProfile[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id || "");
  const [formValues, setFormValues] = useState<ClientFormValues>(() =>
    initialClients[0] ? toFormValues(initialClients[0]) : DEFAULT_CLIENT_FORM_VALUES
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [aiFilledKeys, setAiFilledKeys] = useState<Set<keyof ClientFormValues>>(new Set());

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  useEffect(() => {
    if (selectedClient) {
      setFormValues(toFormValues(selectedClient));
      setAiFilledKeys(new Set());
    } else {
      setFormValues(DEFAULT_CLIENT_FORM_VALUES);
      setAiFilledKeys(new Set());
    }
  }, [selectedClient]);

  const previewTheme = useMemo(() => {
    if (!formValues.name) {
      return null;
    }

    const theme = inferBrandTheme({
      id: selectedClient?.id || "preview",
      user_id: selectedClient?.user_id || "preview",
      created_at: selectedClient?.created_at || new Date().toISOString(),
      name: formValues.name,
      voice_tone: formValues.voice_tone,
      personality: formValues.personality,
      core_values: formValues.core_values,
      main_objective: formValues.main_objective,
      post_sign_off: formValues.post_sign_off,
      value_proposition: formValues.value_proposition,
      content_style: formValues.content_style,
      visual_aesthetic: formValues.visual_aesthetic,
      reason_to_exist: formValues.reason_to_exist,
      content_pillars: parsePillarsInput(formValues.content_pillars),
      brand_character: formValues.brand_character,
      brand_colors: formValues.brand_colors,
      logo_url: formValues.logo_url || null
    });

    const customPalette = parseBrandColors(formValues.brand_colors);

    if (customPalette.length === 0) {
      return theme;
    }

    return {
      ...theme,
      primary: customPalette[0] || theme.primary,
      secondary: customPalette[1] || theme.secondary,
      accent: customPalette[2] || customPalette[0] || theme.accent,
      palette: customPalette
    };
  }, [formValues, selectedClient]);

  const brandColorSwatches = useMemo(() => {
    return parseBrandColors(formValues.brand_colors);
  }, [formValues.brand_colors]);

  const previewTextColor = useMemo(() => {
    if (!previewTheme) {
      return "#FFFFFF";
    }

    return getPreviewTextColor([
      previewTheme.primary,
      previewTheme.secondary,
      previewTheme.accent
    ]);
  }, [previewTheme]);

  const previewMutedTextColor =
    previewTextColor === "#050505" ? "rgba(5, 5, 5, 0.72)" : "rgba(255, 255, 255, 0.78)";

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Envie uma logo em PNG, JPG, WEBP ou SVG.");
      return;
    }

    if (file.size > MAX_LOGO_FILE_SIZE) {
      setFeedback("A logo precisa ter até 2 MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setFormValues((current) => ({
        ...current,
        logo_url: dataUrl
      }));
      setFeedback("Logo carregada. Salve o cliente para usar a marca nas peças.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao carregar a logo.");
    }
  }

  function handleRemoveLogo() {
    setFormValues((current) => ({
      ...current,
      logo_url: ""
    }));
    setFeedback("Logo removida do formulário. Salve para confirmar a alteração.");
  }

  function handleApplyAiFields(fields: Partial<ClientFormValues>) {
    setFormValues((current) => {
      const next = { ...current };
      const filled = new Set<keyof ClientFormValues>();

      for (const key of AI_FILLABLE_FIELDS) {
        const value = fields[key];
        if (typeof value === "string" && value.trim()) {
          (next as Record<string, unknown>)[key] = value.trim();
          filled.add(key);
        }
      }

      setAiFilledKeys(filled);
      return next;
    });

    setFeedback(
      "Campos preenchidos pela IA. Revise tudo antes de salvar — a IA pode errar detalhes."
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toClientPayload(formValues);

    if (payload.content_pillars.length < 3 || payload.content_pillars.length > 5) {
      setFeedback("Cadastre entre 3 e 5 pilares de conteúdo.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(
        selectedClient ? `/api/clients/${selectedClient.id}` : "/api/clients",
        {
          method: selectedClient ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível salvar o cliente.");
      }

      startTransition(() => {
        setClients((current) => {
          const nextClients = selectedClient
            ? current.map((client) =>
                client.id === result.client.id ? result.client : client
              )
            : [result.client, ...current];

          return nextClients.sort((a, b) =>
            b.created_at.localeCompare(a.created_at)
          );
        });
        setSelectedClientId(result.client.id);
      });

      setAiFilledKeys(new Set());
      setFeedback(
        selectedClient
          ? "Cliente atualizado com sucesso."
          : "Cliente criado com sucesso."
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Erro ao salvar o cliente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedClient) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir ${selectedClient.name}? As campanhas ligadas a esse cliente também serão removidas.`
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível excluir.");
      }

      const remainingClients = clients.filter(
        (client) => client.id !== selectedClient.id
      );

      startTransition(() => {
        setClients(remainingClients);
        setSelectedClientId(remainingClients[0]?.id || "");
      });

      setFeedback("Cliente removido com sucesso.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Erro ao excluir cliente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewClient() {
    setSelectedClientId("");
    setFormValues(DEFAULT_CLIENT_FORM_VALUES);
    setAiFilledKeys(new Set());
    setFeedback(null);
  }

  const WIDE_FIELDS = new Set([
    "core_values",
    "main_objective",
    "value_proposition",
    "reason_to_exist",
    "content_pillars",
    "brand_character"
  ]);

  return (
    <div className="space-y-8">
      {showAnalyzer && (
        <BrandAnalyzerModal
          onApply={handleApplyAiFields}
          onClose={() => setShowAnalyzer(false)}
        />
      )}

      <section className="card rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr,1.4fr]">
          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="section-kicker">
                  <Users className="h-3.5 w-3.5" />
                  Clientes
                </span>
                <h1 className="mt-4 font-heading text-3xl font-semibold">
                  Cadastro completo de clientes
                </h1>
                <p className="mt-3 text-sm text-[var(--color-text-2)]">
                  Cadastre uma vez e use a identidade completa em todas as próximas
                  produções.
                </p>
              </div>

              <button
                type="button"
                onClick={handleNewClient}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8]"
              >
                <Plus className="h-4 w-4" />
                Novo
              </button>
            </div>

            <div className="space-y-3">
              {clients.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[#fbfaff] px-4 py-10 text-center text-sm text-[var(--color-text-2)]">
                  Nenhum cliente cadastrado ainda. Comece preenchendo o formulário ao
                  lado.
                </div>
              ) : null}

              {clients.map((client) => {
                const active = client.id === selectedClientId;

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                        : "border-[var(--color-border)] bg-white hover:bg-[#fbfaff]"
                    }`}
                  >
                    <div className="font-semibold text-[var(--color-text-1)]">{client.name}</div>
                    <div className="mt-2 line-clamp-2 text-sm text-[var(--color-text-2)]">
                      {client.voice_tone}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {client.content_pillars.slice(0, 3).map((pillar) => (
                        <span
                          key={pillar}
                          className="rounded-full border border-[var(--color-border)] bg-[#faf9ff] px-3 py-1 text-[11px] text-[var(--color-text-2)]"
                        >
                          {pillar}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {previewTheme ? (
            <div className="card rounded-[1.75rem] p-5">
              <div className="mb-4">
                <h2 className="font-heading text-xl font-semibold">Preview visual da marca</h2>
                <p className="mt-2 text-sm text-[var(--color-text-2)]">
                  Estimativa do tema que o sistema vai usar como referência para o Art
                  Director.
                </p>
              </div>

              <div
                className="relative overflow-hidden rounded-[1.6rem] border p-5"
                style={{
                  borderColor: `${previewTheme.accent}55`,
                  background: `linear-gradient(135deg, ${previewTheme.primary} 0%, ${previewTheme.secondary} 58%, ${previewTheme.accent} 100%)`
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      previewTextColor === "#050505"
                        ? "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))"
                        : "linear-gradient(180deg, rgba(5,5,5,0.04), rgba(5,5,5,0.28))"
                  }}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="max-w-[18rem]">
                    <div
                      className="text-[10px] uppercase tracking-[0.24em]"
                      style={{ color: previewMutedTextColor }}
                    >
                      identidade ativa
                    </div>
                    <div
                      className="mt-3 text-2xl font-semibold leading-tight"
                      style={{ color: previewTextColor }}
                    >
                      {formValues.name}
                    </div>
                    <div className="mt-3 text-sm leading-6" style={{ color: previewMutedTextColor }}>
                      {formValues.visual_aesthetic || previewTheme.mood}
                    </div>
                  </div>

                  <div
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.35rem] border"
                    style={{
                      borderColor:
                        previewTextColor === "#050505"
                          ? "rgba(5, 5, 5, 0.1)"
                          : "rgba(255, 255, 255, 0.22)",
                      backgroundColor:
                        previewTextColor === "#050505"
                          ? "rgba(255, 255, 255, 0.74)"
                          : "rgba(255, 255, 255, 0.16)"
                    }}
                  >
                    {formValues.logo_url ? (
                      <img
                        src={formValues.logo_url}
                        alt={`Logo de ${formValues.name}`}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <span
                        className="text-2xl font-semibold"
                        style={{ color: previewTextColor }}
                      >
                        {getInitials(formValues.name) || "MK"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative mt-6 grid gap-3 sm:grid-cols-[1.15fr,0.85fr]">
                  <div
                    className="rounded-[1.35rem] border p-4"
                    style={{
                      borderColor:
                        previewTextColor === "#050505"
                          ? "rgba(5, 5, 5, 0.1)"
                          : "rgba(255, 255, 255, 0.16)",
                      backgroundColor:
                        previewTextColor === "#050505"
                          ? "rgba(255, 255, 255, 0.3)"
                          : "rgba(5, 5, 5, 0.2)"
                    }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: previewMutedTextColor }}
                    >
                      atmosfera
                    </div>
                    <div className="mt-3 text-sm leading-6" style={{ color: previewTextColor }}>
                      {previewTheme.mood}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className="h-3 w-16 rounded-full"
                        style={{ backgroundColor: previewTheme.primary }}
                      />
                      <div
                        className="h-3 w-10 rounded-full"
                        style={{ backgroundColor: previewTheme.accent }}
                      />
                      <div
                        className="h-3 w-6 rounded-full"
                        style={{ backgroundColor: previewTheme.secondary }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {previewTheme.palette.map((color, index) => (
                      <div key={`${color}-${index}`} className="space-y-2">
                        <div
                          className="h-12 w-12 rounded-2xl border"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              previewTextColor === "#050505"
                                ? "rgba(5, 5, 5, 0.08)"
                                : "rgba(255, 255, 255, 0.18)"
                          }}
                        />
                        <div
                          className="text-[10px] uppercase tracking-[0.14em]"
                          style={{ color: previewMutedTextColor }}
                        >
                          {color}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold">
              {selectedClient ? "Editar cliente" : "Novo cliente"}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-2)]">
              Preencha todos os campos para que os 5 agentes trabalhem com briefing
              completo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAnalyzer(true)}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(108,99,255,0.18)] bg-[var(--color-primary-light)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition duration-150 hover:bg-[#e4ddff]"
            >
              <ScanSearch className="h-4 w-4" />
              Preencher com imagem
            </button>

            {selectedClient ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-[10px] border border-red-200 bg-[var(--color-danger-bg)] px-4 py-3 text-sm font-semibold text-[#b42318] transition duration-150 hover:bg-[#ffd9d9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            ) : null}
          </div>
        </div>

        {aiFilledKeys.size > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[rgba(108,99,255,0.18)] bg-[var(--color-primary-light)] px-4 py-3">
            <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            <div className="text-sm text-[var(--color-primary)]">
              <strong>{aiFilledKeys.size} campos</strong> foram preenchidos pela IA.
              Os campos destacados em roxo foram gerados automaticamente — revise antes de salvar.
            </div>
          </div>
        )}

        {feedback ? (
          <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3 text-sm text-[var(--color-text-2)]">
            {feedback}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELD_META.map((field) => {
              const isTextarea = field.type === "textarea";
              const value = formValues[field.key];
              const isAiFilled = aiFilledKeys.has(field.key);

              return (
                <label
                  key={field.key}
                  className={`block space-y-2 ${WIDE_FIELDS.has(field.key) ? "sm:col-span-2" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-1)]">{field.label}</span>
                    {isAiFilled && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(108,99,255,0.18)] bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                        <ScanSearch className="h-2.5 w-2.5" />
                        IA
                      </span>
                    )}
                  </div>
                  {isTextarea ? (
                    <textarea
                      rows={field.key === "brand_character" ? 5 : 4}
                      value={value}
                      onChange={(event) => {
                        setFormValues((current) => ({
                          ...current,
                          [field.key]: event.target.value
                        }));
                        if (isAiFilled) {
                          setAiFilledKeys((current) => {
                            const next = new Set(current);
                            next.delete(field.key);
                            return next;
                          });
                        }
                      }}
                      placeholder={field.placeholder}
                      className={`input-shell resize-none px-4 py-4 text-sm ${
                        isAiFilled ? "ring-1 ring-violet-500/40" : ""
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(event) => {
                        setFormValues((current) => ({
                          ...current,
                          [field.key]: event.target.value
                        }));
                        if (isAiFilled) {
                          setAiFilledKeys((current) => {
                            const next = new Set(current);
                            next.delete(field.key);
                            return next;
                          });
                        }
                      }}
                      placeholder={field.placeholder}
                      className={`input-shell px-4 py-4 text-sm ${
                        isAiFilled ? "ring-1 ring-violet-500/40" : ""
                      }`}
                    />
                  )}
                </label>
              );
            })}

            <div className="block space-y-3 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text-1)]">Logo da Marca</span>

              <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[#fbfaff] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[var(--color-border)] bg-white">
                      {formValues.logo_url ? (
                        <img
                          src={formValues.logo_url}
                          alt={`Logo de ${formValues.name || "cliente"}`}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="text-center text-xs leading-5 text-[var(--color-text-3)]">
                          Sem
                          <br />
                          logo
                        </div>
                      )}
                    </div>

                    <div className="max-w-md">
                      <div className="text-sm font-medium text-[var(--color-text-1)]">
                        Upload direto para a identidade da marca
                      </div>
                      <div className="mt-1 text-sm text-[var(--color-text-2)]">
                        Envie PNG, JPG, WEBP ou SVG com até 2 MB. A logo passa a
                        aparecer no preview imediatamente e pode ser usada nas peças
                        geradas.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8]">
                      <Upload className="h-4 w-4" />
                      {formValues.logo_url ? "Trocar logo" : "Enviar logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>

                    {formValues.logo_url ? (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text-2)] transition duration-150 hover:bg-[#fbfaff] hover:text-[var(--color-text-1)]"
                      >
                        <X className="h-4 w-4" />
                        Remover
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <label className="block space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text-1)]">
                  Paleta de Cores da Marca
                </span>
                {aiFilledKeys.has("brand_colors") && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(108,99,255,0.18)] bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    <ScanSearch className="h-2.5 w-2.5" />
                    IA
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formValues.brand_colors}
                onChange={(event) => {
                  setFormValues((current) => ({
                    ...current,
                    brand_colors: event.target.value
                  }));
                  if (aiFilledKeys.has("brand_colors")) {
                    setAiFilledKeys((current) => {
                      const next = new Set(current);
                      next.delete("brand_colors");
                      return next;
                    });
                  }
                }}
                placeholder="Ex.: #E8D2B5, #B7945C, #1B1B1B"
                className={`input-shell px-4 py-4 text-sm ${
                  aiFilledKeys.has("brand_colors") ? "ring-1 ring-violet-500/40" : ""
                }`}
              />

              {brandColorSwatches.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {brandColorSwatches.map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      className="h-10 w-10 flex-shrink-0 rounded-xl border border-[var(--color-border)]"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              ) : null}
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-[#5A4FE8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? "Salvando..."
              : selectedClient
                ? "Salvar alterações"
                : "Criar cliente"}
          </button>
        </form>
      </section>
    </div>
  );
}
