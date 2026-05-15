"use client";
/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Upload, Users, X } from "lucide-react";

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

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;

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

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  useEffect(() => {
    if (selectedClient) {
      setFormValues(toFormValues(selectedClient));
    } else {
      setFormValues(DEFAULT_CLIENT_FORM_VALUES);
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
      setFeedback("A logo precisa ter at\u00e9 2 MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setFormValues((current) => ({
        ...current,
        logo_url: dataUrl
      }));
      setFeedback("Logo carregada. Salve o cliente para usar a marca nas pe\u00e7as.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a logo."
      );
    }
  }

  function handleRemoveLogo() {
    setFormValues((current) => ({
      ...current,
      logo_url: ""
    }));
    setFeedback("Logo removida do formul\u00e1rio. Salve para confirmar a altera\u00e7\u00e3o.");
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
    setFeedback(null);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[1.12fr,0.88fr]">
        <div className="glass-panel neon-border rounded-[2rem] p-6 sm:p-7">
          <span className="section-kicker">
            <Users className="h-3.5 w-3.5" />
            Biblioteca de Marca
          </span>

          <div className="mt-5">
            <h1 className="max-w-3xl font-heading text-3xl font-semibold leading-tight sm:text-[2.7rem]">
              Organize clientes, identidade visual e briefing completo em uma unica
              base facil de consultar.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/66 sm:text-base">
              A pagina foi separada em dois lados claros: biblioteca e preview da
              marca de um lado, formulario e edicao do outro.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                Clientes
              </div>
              <div className="mt-3 font-heading text-2xl font-semibold text-white">
                {clients.length}
              </div>
              <div className="mt-1 text-sm text-white/52">marcas salvas na conta</div>
            </div>
            <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                Em foco
              </div>
              <div className="mt-3 font-heading text-2xl font-semibold text-white">
                {selectedClient ? "Editando" : "Novo"}
              </div>
              <div className="mt-1 text-sm text-white/52">
                {selectedClient ? selectedClient.name : "cadastro em branco"}
              </div>
            </div>
            <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                Visual
              </div>
              <div className="mt-3 font-heading text-2xl font-semibold text-white">
                {previewTheme ? "Ativo" : "Aguardando"}
              </div>
              <div className="mt-1 text-sm text-white/52">
                preview da identidade em tempo real
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
            Leitura rapida
          </div>
          <div className="mt-4 grid gap-3">
            {[
              "Escolha uma marca na biblioteca para revisar ou atualizar o briefing.",
              "Veja as cores e a logo reagirem no preview antes de salvar.",
              "Mantenha a identidade completa para o sistema inteiro trabalhar com menos friccao."
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-4"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                  Etapa {index + 1}
                </div>
                <div className="text-sm leading-6 text-white/72">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <section className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <div className="glass-panel neon-border rounded-[2rem] p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <span className="section-kicker">
                <Users className="h-3.5 w-3.5" />
                Biblioteca de Marca
              </span>
              <h1 className="mt-4 font-heading text-3xl font-semibold">
                Cadastro completo de clientes
              </h1>
              <p className="mt-3 text-sm text-white/64">
                Cadastre uma vez e use a identidade completa em todas as próximas
                produções.
              </p>
            </div>

            <button
              type="button"
              onClick={handleNewClient}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px]"
            >
              <Plus className="h-4 w-4" />
              Novo
            </button>
          </div>

          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/54">
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
                      ? "border-white/18 bg-white/10"
                      : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="font-semibold text-white">{client.name}</div>
                  <div className="mt-2 line-clamp-2 text-sm text-white/62">
                    {client.voice_tone}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {client.content_pillars.slice(0, 3).map((pillar) => (
                      <span
                        key={pillar}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] text-white/68"
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
          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="mb-4">
              <h2 className="font-heading text-xl font-semibold">Preview visual da marca</h2>
              <p className="mt-2 text-sm text-white/56">
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
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.35rem] border backdrop-blur-sm"
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
                  className="rounded-[1.35rem] border p-4 backdrop-blur-sm"
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
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold">
              {selectedClient ? "Editar cliente" : "Novo cliente"}
            </h2>
            <p className="mt-2 text-sm text-white/62">
              Preencha todos os campos para que os 5 agentes trabalhem com briefing
              completo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {selectedClient ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            ) : null}
          </div>
        </div>

        {feedback ? (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/80">
            {feedback}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELD_META.map((field) => {
              const isTextarea = field.type === "textarea";
              const value = formValues[field.key];

              return (
                <label
                  key={field.key}
                  className={`block space-y-2 ${
                    field.key === "core_values" ||
                    field.key === "main_objective" ||
                    field.key === "value_proposition" ||
                    field.key === "reason_to_exist" ||
                    field.key === "content_pillars" ||
                    field.key === "brand_character"
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <span className="text-sm font-medium text-white/84">{field.label}</span>
                  {isTextarea ? (
                    <textarea
                      rows={field.key === "brand_character" ? 5 : 4}
                      value={value}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          [field.key]: event.target.value
                        }))
                      }
                      placeholder={field.placeholder}
                      className="input-shell resize-none px-4 py-4 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          [field.key]: event.target.value
                        }))
                      }
                      placeholder={field.placeholder}
                      className="input-shell px-4 py-4 text-sm"
                    />
                  )}
                </label>
              );
            })}

            <div className="block space-y-3 sm:col-span-2">
              <span className="text-sm font-medium text-white/84">Logo da Marca</span>

              <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04]">
                      {formValues.logo_url ? (
                        <img
                          src={formValues.logo_url}
                          alt={`Logo de ${formValues.name || "cliente"}`}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="text-center text-xs leading-5 text-white/42">
                          Sem
                          <br />
                          logo
                        </div>
                      )}
                    </div>

                    <div className="max-w-md">
                      <div className="text-sm font-medium text-white">
                        Upload direto para a identidade da marca
                      </div>
                      <div className="mt-1 text-sm text-white/58">
                        Envie PNG, JPG, WEBP ou SVG com atÃ© 2 MB. A logo passa a
                        aparecer no preview imediatamente e pode ser usada nas peÃ§as
                        geradas.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px]">
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
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]"
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
              <span className="text-sm font-medium text-white/84">
                Paleta de Cores da Marca
              </span>
              <input
                type="text"
                value={formValues.brand_colors}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    brand_colors: event.target.value
                  }))
                }
                placeholder="Ex.: #E8D2B5, #B7945C, #1B1B1B"
                className="input-shell px-4 py-4 text-sm"
              />

              {brandColorSwatches.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {brandColorSwatches.map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      className="h-10 w-10 rounded-xl border border-white/10 flex-shrink-0"
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
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}
