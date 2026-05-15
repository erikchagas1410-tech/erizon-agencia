"use client";

import type { CSSProperties } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  ImageIcon,
  LayoutPanelTop,
  MessageSquareText,
  PenLine,
  Rocket,
  Sparkles,
  WandSparkles
} from "lucide-react";

import { inferBrandTheme } from "@/lib/brand-theme";
import { AGENT_DEFINITIONS, REQUEST_SUGGESTIONS } from "@/lib/constants";
import { buildCampaignMarkdown } from "@/lib/markdown";
import type { CampaignRecord, ClientProfile } from "@/lib/types";
import { cn, downloadTextFile, formatDateTime } from "@/lib/utils";

import { AgentResultCard } from "./agent-result-card";
import { BrandLabPanel } from "./brand-lab-panel";
import { CampaignHistory } from "./campaign-history";
import { ImageGenerationPanel } from "./image-generation-panel";
import { TemplateEditor } from "./template-editor";

function buildThemeStyle(client: ClientProfile | null) {
  if (!client) {
    return undefined;
  }

  const theme = inferBrandTheme(client);

  return {
    "--brand-primary": theme.primary,
    "--brand-secondary": theme.secondary,
    "--brand-accent": theme.accent,
    "--brand-bg": theme.bg,
    "--brand-surface": theme.surface
  } as CSSProperties;
}

export function AgencyWorkspace({
  initialClients,
  initialCampaigns
}: {
  initialClients: ClientProfile[];
  initialCampaigns: CampaignRecord[];
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id || "");
  const [requestText, setRequestText] = useState("");
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<
    "results" | "images" | "editor" | "brand"
  >("results");
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState("");
  const [editorInstruction, setEditorInstruction] = useState("");

  const selectedClient = useMemo(
    () => initialClients.find((client) => client.id === selectedClientId) || null,
    [initialClients, selectedClientId]
  );

  const clientCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.client_id === selectedClientId);
  }, [campaigns, selectedClientId]);

  const activeCampaign = useMemo(() => {
    return (
      clientCampaigns.find((campaign) => campaign.id === activeCampaignId) ||
      clientCampaigns[0] ||
      null
    );
  }, [activeCampaignId, clientCampaigns]);

  useEffect(() => {
    if (!clientCampaigns.length) {
      setActiveCampaignId(null);
      return;
    }

    if (!activeCampaignId || !clientCampaigns.some((item) => item.id === activeCampaignId)) {
      setActiveCampaignId(clientCampaigns[0].id);
    }
  }, [activeCampaignId, clientCampaigns]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    setLastGeneratedImageUrl("");
    setEditorInstruction("");
  }, [activeCampaign?.id, selectedClientId]);

  async function handleGenerate() {
    if (!selectedClientId || !requestText.trim()) {
      setFeedback("Selecione um cliente e escreva a solicitacao.");
      return;
    }

    setIsRunning(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/agency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          request: requestText.trim()
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Falha ao acionar a squad.");
      }

      startTransition(() => {
        setCampaigns((current) => [payload.campaign, ...current]);
        setActiveCampaignId(payload.campaign.id);
      });

      setActiveWorkspaceView("results");
      setFeedback("Squad concluida e campanha salva no historico.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setIsRunning(false);
    }
  }

  function handleHistorySelect(campaign: CampaignRecord) {
    setActiveCampaignId(campaign.id);
    setRequestText(campaign.request);
    setActiveWorkspaceView("results");
  }

  function handleExport() {
    if (!selectedClient || !activeCampaign) {
      return;
    }

    downloadTextFile(
      `${selectedClient.name.toLowerCase().replace(/\s+/g, "-")}-${activeCampaign.id}.md`,
      buildCampaignMarkdown(selectedClient, activeCampaign)
    );
  }

  const theme = selectedClient ? inferBrandTheme(selectedClient) : null;

  if (initialClients.length === 0) {
    return (
      <section className="glass-panel neon-border rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">
          <Sparkles className="h-3.5 w-3.5" />
          Primeiro passo
        </span>
        <div className="mt-6 space-y-4">
          <h1 className="font-heading text-3xl font-semibold">
            Cadastre seu primeiro cliente para comecar a operar.
          </h1>
          <p className="max-w-2xl text-white/68">
            O AI Agency OS precisa da identidade de marca completa para disparar os 5
            especialistas com contexto total e zero briefing manual.
          </p>
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px]"
          >
            Ir para gestao de clientes
            <Rocket className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6" style={buildThemeStyle(selectedClient)}>
      <section className="glass-panel neon-border overflow-hidden rounded-[2rem] p-6 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.22fr,0.78fr]">
          <div className="space-y-4">
            <span className="section-kicker">
              <WandSparkles className="h-3.5 w-3.5" />
              Producao Assistida por Multiagentes
            </span>

            <div>
              <h1 className="max-w-3xl font-heading text-3xl font-semibold leading-tight sm:text-[2.6rem]">
                Digite um pedido simples e deixe a squad montar estrategia, copy,
                direcao visual, trafego e metricas com contexto total da marca.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
                O dashboard foi reorganizado para manter o foco em uma etapa por vez e
                reduzir a rolagem excessiva.
              </p>
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/80">
                {feedback}
              </div>
            ) : null}
          </div>

          <div className="glass-panel-strong rounded-[1.75rem] p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-white/54">Cliente ativo</div>
                <div className="mt-1 font-heading text-2xl font-semibold">
                  {selectedClient?.name}
                </div>
              </div>
              <Link
                href="/clientes"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/10"
              >
                Gerenciar
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Tom de voz
                </div>
                <div className="mt-2 line-clamp-3 text-sm text-white/82">
                  {selectedClient?.voice_tone}
                </div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Objetivo principal
                </div>
                <div className="mt-2 line-clamp-3 text-sm text-white/82">
                  {selectedClient?.main_objective}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                Pilares de conteudo
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedClient?.content_pillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/76"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>

            {theme ? (
              <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
                {theme.palette.map((color) => (
                  <div key={color} className="space-y-1">
                    <div
                      className="h-10 w-10 rounded-2xl border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/36">
                      {color.replace("#", "")}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.84fr,1.16fr]">
        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="mb-5">
              <h2 className="font-heading text-2xl font-semibold">Disparar a squad</h2>
              <p className="mt-2 text-sm text-white/58">
                Selecione o cliente, escreva um pedido curto e deixe o restante com os
                agentes.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/82">Cliente</span>
                <select
                  value={selectedClientId}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                  className="input-shell px-4 py-4 text-sm"
                >
                  {initialClients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-neutral-950">
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/82">
                  Solicitacao criativa
                </span>
                <textarea
                  value={requestText}
                  onChange={(event) => setRequestText(event.target.value)}
                  rows={6}
                  placeholder="Ex.: crie um carrossel de dicas para Michelle"
                  className="input-shell resize-none px-4 py-4 text-sm"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {REQUEST_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setRequestText(suggestion)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72 transition hover:bg-white/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning ? "Time trabalhando..." : "Rodar time de 5 agentes"}
                  <Sparkles className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!activeCampaign || isRunning}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Exportar .md
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <CampaignHistory
            campaigns={clientCampaigns}
            activeCampaignId={activeCampaign?.id || null}
            onSelect={handleHistorySelect}
          />
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-semibold">Workspace criativo</h2>
                  <p className="mt-2 text-sm text-white/56">
                    {activeCampaign
                      ? `Ultima execucao em ${formatDateTime(activeCampaign.created_at)}.`
                      : "Troque entre resultados, pecas visuais, editor e Brand Lab sem empilhar tudo de uma vez."}
                  </p>
                </div>
                {activeCampaign ? (
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/52">
                    {selectedClient?.name}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-2">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView("results")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                    activeWorkspaceView === "results"
                      ? "bg-white text-black"
                      : "bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <LayoutPanelTop className="h-4 w-4" />
                  Resultados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView("images")}
                  disabled={!activeCampaign?.results.artDirector}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                    activeWorkspaceView === "images"
                      ? "bg-white text-black"
                      : "bg-transparent text-white/70 hover:bg-white/8 hover:text-white",
                    !activeCampaign?.results.artDirector && "cursor-not-allowed opacity-40"
                  )}
                >
                  <ImageIcon className="h-4 w-4" />
                  Pecas visuais
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView("editor")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                    activeWorkspaceView === "editor"
                      ? "bg-white text-black"
                      : "bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <PenLine className="h-4 w-4" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView("brand")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                    activeWorkspaceView === "brand"
                      ? "bg-white text-black"
                      : "bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <MessageSquareText className="h-4 w-4" />
                  Brand Lab
                </button>
              </div>
            </div>
          </div>

          {activeWorkspaceView === "results" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {AGENT_DEFINITIONS.map((agent) => (
                <div
                  key={agent.key}
                  className={agent.key === "artDirector" ? "xl:col-span-2" : ""}
                >
                  <AgentResultCard
                    agent={agent}
                    loading={isRunning}
                    client={selectedClient}
                    content={activeCampaign?.results[agent.key]}
                    onOpenEditor={
                      agent.key === "artDirector"
                        ? () => {
                            setEditorInstruction(activeCampaign?.results.artDirector ?? "");
                            setActiveWorkspaceView("editor");
                          }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}

          {selectedClient && activeCampaign?.results.artDirector ? (
            <div className={cn(activeWorkspaceView === "images" ? "block" : "hidden")}>
              <ImageGenerationPanel
                artDirectorOutput={activeCampaign.results.artDirector}
                client={selectedClient}
                isVisible={true}
                onImageGenerated={setLastGeneratedImageUrl}
              />
            </div>
          ) : null}

          {activeWorkspaceView === "editor" && selectedClient ? (
            <TemplateEditor
              client={selectedClient}
              initialAiImageUrl={lastGeneratedImageUrl}
              initialUserInstruction={editorInstruction}
              isVisible={true}
            />
          ) : null}

          {activeWorkspaceView === "brand" && selectedClient ? (
            <BrandLabPanel key={selectedClient.id} client={selectedClient} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
