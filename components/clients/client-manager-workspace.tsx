"use client";

import type { FormEvent } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Users } from "lucide-react";

import { inferBrandTheme } from "@/lib/brand-theme";
import { DEFAULT_CLIENT_FORM_VALUES } from "@/lib/constants";
import type { ClientFormValues, ClientProfile } from "@/lib/types";
import { buildPillarsInput, parsePillarsInput, toClientPayload } from "@/lib/utils";

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
    brand_character: client.brand_character
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

    return inferBrandTheme({
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
      brand_character: formValues.brand_character
    });
  }, [formValues, selectedClient]);

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
    <div className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
      <section className="space-y-6">
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

            <div className="mb-4 flex flex-wrap gap-3">
              {previewTheme.palette.map((color) => (
                <div key={color} className="space-y-2">
                  <div
                    className="h-12 w-12 rounded-2xl border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/36">
                    {color}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-white/74">
              <strong className="text-white">Atmosfera:</strong> {previewTheme.mood}
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
  );
}
