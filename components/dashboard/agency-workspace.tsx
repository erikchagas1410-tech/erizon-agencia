"use client";

import type { CSSProperties } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FolderKanban,
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
import { cn, downloadTextFile, formatDateTime, getInitials } from "@/lib/utils";

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

const WORKSPACE_VIEWS = [
  {
    key: "results",
    label: "Resultados",
    description: "Leia estrategia, copy, visual, midia e metricas em uma ordem clara.",
    icon: LayoutPanelTop
  },
  {
    key: "images",
    label: "Criar peça",
    description: "Gere com IA ou crie manualmente no editor de canvas.",
    icon: ImageIcon
  },
  {
    key: "editor",
    label: "Editor",
    description: "Ajuste manualmente o template, refine layout e salve variacoes.",
    icon: PenLine
  },
  {
    key: "brand",
    label: "Brand Lab",
    description: "Aprofunde posicionamento, identidade e analise de branding.",
    icon: MessageSquareText
  }
] as const;

type WorkspaceView = (typeof WORKSPACE_VIEWS)[number]["key"];

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
  const [activeWorkspaceView, setActiveWorkspaceView] =
    useState<WorkspaceView>("results");
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState("");
  const [editorInstruction, setEditorInstruction] = useState("");
  const [showFullArtBrief, setShowFullArtBrief] = useState(false);

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

  const activeTheme = useMemo(
    () => (selectedClient ? inferBrandTheme(selectedClient) : null),
    [selectedClient]
  );

  const activeViewMeta = useMemo(() => {
    return WORKSPACE_VIEWS.find((view) => view.key === activeWorkspaceView) || WORKSPACE_VIEWS[0];
  }, [activeWorkspaceView]);

  const completedAgentsCount = useMemo(() => {
    if (!activeCampaign) {
      return 0;
    }

    return AGENT_DEFINITIONS.filter((agent) =>
      Boolean(activeCampaign.results[agent.key]?.trim())
    ).length;
  }, [activeCampaign]);

  const artDirectorBrief = activeCampaign?.results.artDirector?.trim() || "";
  const hasArtDirectorBrief = artDirectorBrief.length > 0;
  const artDirectorPreview = useMemo(() => {
    if (!hasArtDirectorBrief) {
      return "";
    }

    return artDirectorBrief.length > 400
      ? `${artDirectorBrief.slice(0, 400).trimEnd()}...`
      : artDirectorBrief;
  }, [artDirectorBrief, hasArtDirectorBrief]);

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
    setShowFullArtBrief(false);
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

  function openEditorWithInstruction(instruction?: string) {
    setEditorInstruction(instruction ?? "");
    setActiveWorkspaceView("editor");
  }

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
      <section className="grid gap-6 2xl:grid-cols-[1.18fr,0.82fr]">
        <div className="glass-panel neon-border overflow-hidden rounded-[2rem] p-6 sm:p-7">
          <div className="space-y-5">
            <span className="section-kicker">
              <WandSparkles className="h-3.5 w-3.5" />
              Centro de Operacao
            </span>

            <div>
              <h1 className="max-w-3xl font-heading text-3xl font-semibold leading-tight sm:text-[2.7rem]">
                Uma estrutura mais clara para planejar, gerar, revisar e transformar
                cada campanha em pecas prontas.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
                A operacao agora fica dividida por etapas visuais: briefing, execucao,
                historico e workspace criativo.
              </p>
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/80">
                {feedback}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Clientes ativos",
                  value: String(initialClients.length),
                  hint: "briefings cadastrados"
                },
                {
                  label: "Historico atual",
                  value: String(clientCampaigns.length),
                  hint: "campanhas do cliente"
                },
                {
                  label: "Agentes prontos",
                  value: `${completedAgentsCount}/5`,
                  hint: activeCampaign ? "na campanha aberta" : "sem campanha aberta"
                },
                {
                  label: "Modo atual",
                  value: activeViewMeta.label,
                  hint: "workspace selecionado"
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                    {item.label}
                  </div>
                  <div className="mt-3 font-heading text-2xl font-semibold text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-white/52">{item.hint}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/38">
                Leitura rapida do fluxo
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {[
                  "Escolha a marca e escreva o pedido no painel esquerdo.",
                  "Abra a campanha mais recente no historico para retomar o contexto.",
                  "Use as abas do workspace para sair do texto e ir para visual, editor ou branding."
                ].map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[1.35rem] border border-white/8 bg-black/18 px-4 py-4"
                  >
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                      Etapa {index + 1}
                    </div>
                    <div className="text-sm leading-6 text-white/74">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel-strong rounded-[2rem] p-5 sm:p-6">
          <div
            className="rounded-[1.7rem] border p-5"
            style={{
              borderColor: activeTheme ? `${activeTheme.accent}33` : "rgba(255,255,255,0.08)",
              background: activeTheme
                ? `linear-gradient(145deg, ${activeTheme.primary}20, ${activeTheme.secondary}12 58%, ${activeTheme.accent}16)`
                : "rgba(255,255,255,0.04)"
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-white/54">Cliente ativo</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold text-white">
                    {getInitials(selectedClient?.name || "MK")}
                  </div>
                  <div>
                    <div className="font-heading text-2xl font-semibold text-white">
                      {selectedClient?.name}
                    </div>
                    <div className="text-sm text-white/58">
                      {activeTheme?.mood || "Tema inferido automaticamente"}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/clientes"
                className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/14"
              >
                Gerenciar
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-white/10 bg-black/16 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Tom de voz
                </div>
                <div className="mt-2 text-sm leading-6 text-white/82">
                  {selectedClient?.voice_tone}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/16 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Objetivo principal
                </div>
                <div className="mt-2 text-sm leading-6 text-white/82">
                  {selectedClient?.main_objective}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/16 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                Pilares prioritarios
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedClient?.content_pillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>

            {activeTheme ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {activeTheme.palette.map((color, index) => (
                  <div key={`${color}-${index}`} className="space-y-2">
                    <div
                      className="h-11 w-11 rounded-2xl border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/42">
                      {color.replace("#", "")}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                  Etapa 1
                </div>
                <h2 className="mt-2 font-heading text-2xl font-semibold">
                  Disparar campanha
                </h2>
                <p className="mt-2 text-sm text-white/58">
                  Cliente, pedido e acao principal ficam agrupados em um unico painel.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <Rocket className="h-4 w-4 text-white/74" />
              </div>
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
                  rows={7}
                  placeholder="Ex.: crie um carrossel de dicas para Michelle"
                  className="input-shell resize-none px-4 py-4 text-sm"
                />
              </label>

              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/38">
                  Sugestoes prontas
                </div>
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
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isRunning}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning ? "Time trabalhando..." : "Rodar time de 5 agentes"}
                  <Sparkles className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!activeCampaign || isRunning}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                    Etapa 2
                  </div>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">
                    Workspace criativo
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-white/58">
                    {activeViewMeta.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                      Campanha aberta
                    </div>
                    <div className="mt-2 text-sm text-white/82">
                      {activeCampaign
                        ? formatDateTime(activeCampaign.created_at)
                        : "Nenhuma selecionada"}
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                      Status
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-white/82">
                      {isRunning ? (
                        <>
                          <Clock3 className="h-4 w-4 text-white/64" />
                          Processando
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          Pronto para uso
                        </>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                      Cliente
                    </div>
                    <div className="mt-2 text-sm text-white/82">
                      {selectedClient?.name || "Selecione uma marca"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-2">
                {WORKSPACE_VIEWS.map((view) => {
                  const Icon = view.icon;

                  return (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => setActiveWorkspaceView(view.key)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                        activeWorkspaceView === view.key
                          ? "bg-white text-black"
                          : "bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {view.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {!activeCampaign && activeWorkspaceView === "results" ? (
            <div className="glass-panel rounded-[1.75rem] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <FolderKanban className="h-5 w-5 text-white/72" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-semibold">
                    Nenhuma campanha aberta ainda
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                    Comece pelo painel esquerdo: escolha o cliente, escreva uma
                    solicitacao e rode a squad para preencher este workspace.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {[
                      "Escolha a marca certa",
                      "Defina o pedido",
                      "Abra resultados e refine o visual"
                    ].map((item) => (
                      <div
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/76"
                      >
                        <ArrowRight className="h-4 w-4" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeWorkspaceView === "results" && activeCampaign ? (
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
                        ? () => openEditorWithInstruction(activeCampaign?.results.artDirector)
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}

          {activeWorkspaceView === "images" && selectedClient && hasArtDirectorBrief ? (
            <div className="glass-panel rounded-[1.75rem] p-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                      Direcao criativa pronta
                    </div>
                    <h3 className="mt-2 font-heading text-2xl font-semibold">
                      Crie a peça no Editor
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                      O Pollinations funciona melhor como referência de fundo. Para
                      tipografia legível, hierarquia de copy e identidade real da marca,
                      use o Editor com o brief do Art Director.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditorWithInstruction(activeCampaign.results.artDirector)}
                    className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:translate-y-[-1px]"
                  >
                    Criar peça no Editor
                    <PenLine className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/38">
                        Brief do Art Director
                      </div>
                      <div className="mt-1 text-sm text-white/54">
                        Base criativa usada para montar a peça no editor.
                      </div>
                    </div>
                  </div>

                  <div className="agent-copy text-sm">
                    {showFullArtBrief ? artDirectorBrief : artDirectorPreview}
                  </div>

                  {artDirectorBrief.length > 400 ? (
                    <button
                      type="button"
                      onClick={() => setShowFullArtBrief((current) => !current)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/76 transition hover:bg-white/10"
                    >
                      {showFullArtBrief ? "Ver menos" : "Ver mais"}
                    </button>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-heading text-lg font-semibold">Referência visual</h4>
                    <p className="mt-2 text-sm text-white/54">
                      Gere uma imagem de referência de fundo para usar como asset no editor.
                    </p>
                  </div>

                  <ImageGenerationPanel
                    artDirectorOutput={activeCampaign.results.artDirector}
                    client={selectedClient}
                    isVisible={true}
                    singleFormat="feed"
                    onImageGenerated={setLastGeneratedImageUrl}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {activeWorkspaceView === "images" && selectedClient && !hasArtDirectorBrief ? (
            <div className="glass-panel rounded-[1.75rem] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <PenLine className="h-5 w-5 text-white/72" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-semibold">Crie sua peça no Editor</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                    Rode a squad primeiro para obter a direção do Art Director, ou vá
                    direto ao Editor para criar livremente.
                  </p>

                  <button
                    type="button"
                    onClick={() => openEditorWithInstruction("")}
                    className="mt-5 inline-flex items-center gap-2 rounded-[1.2rem] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px]"
                  >
                    Abrir Editor
                    <PenLine className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
