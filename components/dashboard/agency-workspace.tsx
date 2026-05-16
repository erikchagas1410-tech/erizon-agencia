"use client";

import type { CSSProperties } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Download,
  FolderKanban,
  Rocket,
  Sparkles
} from "lucide-react";

import { inferBrandTheme } from "@/lib/brand-theme";
import { AGENT_DEFINITIONS, REQUEST_SUGGESTIONS } from "@/lib/constants";
import { buildCampaignMarkdown } from "@/lib/markdown";
import type { AgentKey, CampaignRecord, ClientProfile } from "@/lib/types";
import { downloadTextFile, formatDateTime } from "@/lib/utils";

import { AgentResultCard } from "./agent-result-card";
import { ArtDirectorBriefPanel } from "./art-director-brief-panel";
import { BrandLabPanel } from "./brand-lab-panel";
import { CampaignHistory } from "./campaign-history";
import { CommandBar } from "./command-bar";
import { ImageGenerationPanel } from "./image-generation-panel";
import { TemplateEditor } from "./template-editor";
import {
  WORKFLOW_STEPS,
  WorkflowStepper,
  type WorkflowStepKey
} from "./workflow-stepper";

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

const RESULT_AGENT_KEYS: AgentKey[] = [
  "strategist",
  "copywriter",
  "trafficManager",
  "analyst"
];

const STEP_ORDER = WORKFLOW_STEPS.map((step) => step.key);

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
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<WorkflowStepKey>("briefing");
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState("");
  const [editorInstruction, setEditorInstruction] = useState("");

  const selectedClient = useMemo(
    () => initialClients.find((client) => client.id === selectedClientId) || null,
    [initialClients, selectedClientId]
  );

  const clientCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.client_id === selectedClientId),
    [campaigns, selectedClientId]
  );

  const activeCampaign = useMemo(
    () =>
      clientCampaigns.find((campaign) => campaign.id === activeCampaignId) ||
      clientCampaigns[0] ||
      null,
    [activeCampaignId, clientCampaigns]
  );

  const activeTheme = useMemo(
    () => (selectedClient ? inferBrandTheme(selectedClient) : null),
    [selectedClient]
  );

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

  useEffect(() => {
    if (!clientCampaigns.length) {
      setActiveCampaignId(null);
      setActiveWorkflowStep("briefing");
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

      setActiveWorkflowStep("strategy");
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
    setActiveWorkflowStep("strategy");
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
    setActiveWorkflowStep("editor");
  }

  function handleStepChange(step: WorkflowStepKey) {
    if (step === "briefing") {
      setActiveWorkflowStep(step);
      return;
    }

    if (!activeCampaign) {
      setFeedback("Rode a squad primeiro para liberar as proximas etapas.");
      return;
    }

    if ((step === "visuals" || step === "editor") && !hasArtDirectorBrief) {
      setFeedback("O brief do Art Director ainda nao esta disponivel.");
      return;
    }

    setActiveWorkflowStep(step);
  }

  function getWorkflowStatus(step: WorkflowStepKey) {
    const activeIndex = STEP_ORDER.indexOf(activeWorkflowStep);
    const stepIndex = STEP_ORDER.indexOf(step);

    if (step === activeWorkflowStep) {
      return "active" as const;
    }

    if (stepIndex < activeIndex) {
      return "complete" as const;
    }

    if (step === "briefing" && selectedClientId && requestText.trim()) {
      return "complete" as const;
    }

    if (step === "strategy" && activeCampaign) {
      return "complete" as const;
    }

    return "pending" as const;
  }

  function renderCreationZone() {
    if (activeWorkflowStep === "briefing") {
      return (
        <section className="card rounded-[1.8rem] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
                Zona de criacao
              </div>
              <h3 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
                Comece pelo briefing certo
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-2)]">
                Defina o pedido com clareza e depois avance pelo stepper. O objetivo aqui
                e reduzir ruido antes de disparar a squad.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3 text-sm text-[var(--color-text-2)]">
              {selectedClient ? `Cliente ativo: ${selectedClient.name}` : "Selecione uma marca"}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {REQUEST_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setRequestText(suggestion)}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-text-2)] transition hover:bg-[#faf9ff]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (activeWorkflowStep === "strategy") {
      return (
        <section className="card rounded-[1.8rem] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
                Zona de criacao
              </div>
              <h3 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
                Estrategia e leitura dos agentes
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-2)]">
                Os cards ja estao separados por papel. Use o painel do Art Director para
                sair do texto e avancar para visuals, editor ou revisao final.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveWorkflowStep("visuals")}
                disabled={!hasArtDirectorBrief}
                className="rounded-[1.2rem] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text-1)] transition hover:bg-[#faf9ff] disabled:opacity-40"
              >
                Ir para Visuals
              </button>
              <button
                type="button"
                onClick={() => openEditorWithInstruction(activeCampaign?.results.artDirector)}
                disabled={!hasArtDirectorBrief}
                className="rounded-[1.2rem] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text-1)] transition hover:bg-[#faf9ff] disabled:opacity-40"
              >
                Abrir Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowStep("publish")}
                className="rounded-[1.2rem] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text-1)] transition hover:bg-[#faf9ff]"
              >
                Revisar e publicar
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (activeWorkflowStep === "visuals") {
      return selectedClient ? (
        <section className="card rounded-[1.8rem] p-6">
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
              Zona de criacao
            </div>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
              Visuals em foco
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-2)]">
              Gere backgrounds de apoio e variacoes visuais para alimentar o editor com
              mais repertorio.
            </p>
          </div>

          {hasArtDirectorBrief ? (
            <ImageGenerationPanel
              artDirectorOutput={activeCampaign?.results.artDirector || ""}
              client={selectedClient}
              isVisible={true}
              onImageGenerated={setLastGeneratedImageUrl}
            />
          ) : (
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[#fbfaff] p-5 text-sm text-[var(--color-text-2)]">
              O brief do Art Director ainda nao esta disponivel para guiar a geracao.
            </div>
          )}
        </section>
      ) : null;
    }

    if (activeWorkflowStep === "editor") {
      return selectedClient ? (
        <div className="space-y-4">
          <div className="card rounded-[1.8rem] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
              Zona de criacao
            </div>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
              Editor em foco
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-2)]">
              Monte a peca final com copy, hierarquia e identidade real da marca.
            </p>
          </div>

          <TemplateEditor
            client={selectedClient}
            initialAiImageUrl={lastGeneratedImageUrl}
            initialUserInstruction={editorInstruction}
            isVisible={true}
          />
        </div>
      ) : null;
    }

    if (activeWorkflowStep === "publish") {
      return selectedClient ? (
        <div className="space-y-5">
          <section className="card rounded-[1.8rem] p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
                  Zona de criacao
                </div>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
                  Publicar e refinar
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-2)]">
                  Exporte a campanha, refine linguagem no Brand Lab e salve a decisao
                  final com contexto preservado.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={!activeCampaign || isRunning}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[var(--color-primary)] px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                Exportar markdown
                <Download className="h-4 w-4" />
              </button>
            </div>
          </section>

          <BrandLabPanel key={selectedClient.id} client={selectedClient} />
        </div>
      ) : null;
    }

    return null;
  }

  if (initialClients.length === 0) {
    return (
      <section className="card rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">
          <Sparkles className="h-3.5 w-3.5" />
          Primeiro passo
        </span>
        <div className="mt-6 space-y-4">
          <h1 className="font-heading text-3xl font-semibold text-[var(--color-text-1)]">
            Cadastre seu primeiro cliente para comecar a operar.
          </h1>
          <p className="max-w-2xl text-[var(--color-text-2)]">
            O AI Agency OS precisa da identidade de marca completa para disparar os 5
            especialistas com contexto total e zero briefing manual.
          </p>
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
          >
            Ir para gestao de clientes
            <Rocket className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5" style={buildThemeStyle(selectedClient)}>
      <CommandBar
        clients={initialClients}
        selectedClient={selectedClient}
        selectedClientId={selectedClientId}
        requestText={requestText}
        isRunning={isRunning}
        theme={activeTheme}
        onClientChange={setSelectedClientId}
        onRequestChange={setRequestText}
        onGenerate={handleGenerate}
      />

      {feedback ? (
        <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-primary-light)] px-4 py-3 text-sm text-[var(--color-primary)]">
          {feedback}
        </div>
      ) : null}

      <WorkflowStepper
        activeStep={activeWorkflowStep}
        getStatus={getWorkflowStatus}
        onStepClick={handleStepChange}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr),360px]">
        <div className="space-y-5">
          <div className="card rounded-[1.8rem] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
                  Resultados
                </div>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
                  Cards de agentes com leitura rapida
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-2)]">
                  Os agentes operacionais ficam juntos a esquerda; o Art Director ganha
                  um painel proprio para nao se misturar com o resto da UI.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-3)]">
                    Campanha aberta
                  </div>
                  <div className="mt-2 text-sm text-[var(--color-text-1)]">
                    {activeCampaign ? formatDateTime(activeCampaign.created_at) : "Nenhuma selecionada"}
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-3)]">
                    Status
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-1)]">
                    {isRunning ? (
                      <>
                        <Clock3 className="h-4 w-4 text-[var(--color-warning)]" />
                        Processando
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                        Pronto para uso
                      </>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-3)]">
                    Agentes prontos
                  </div>
                  <div className="mt-2 text-sm text-[var(--color-text-1)]">
                    {completedAgentsCount}/5 na campanha atual
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!activeCampaign ? (
            <div className="card rounded-[1.8rem] p-6">
              <div className="flex items-start gap-4">
                <div className="icon-box icon-box-violet h-12 w-12">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-semibold text-[var(--color-text-1)]">
                    Nenhuma campanha aberta ainda
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-2)]">
                    Comece pelo topo: escolha o cliente, escreva um pedido e acione a squad.
                    O stepper organiza o resto do fluxo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {RESULT_AGENT_KEYS.map((agentKey) => {
                const agent = AGENT_DEFINITIONS.find((item) => item.key === agentKey);

                if (!agent) {
                  return null;
                }

                return (
                  <AgentResultCard
                    key={agent.key}
                    agent={agent}
                    loading={isRunning}
                    client={selectedClient}
                    content={activeCampaign.results[agent.key]}
                  />
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <ArtDirectorBriefPanel
            brief={artDirectorBrief}
            isRunning={isRunning}
            onOpenVisuals={() => setActiveWorkflowStep("visuals")}
            onOpenEditor={() => openEditorWithInstruction(activeCampaign?.results.artDirector)}
            onOpenBrandLab={() => setActiveWorkflowStep("publish")}
          />

          <CampaignHistory
            campaigns={clientCampaigns}
            activeCampaignId={activeCampaign?.id || null}
            onSelect={handleHistorySelect}
          />
        </aside>
      </section>

      {renderCreationZone()}
    </div>
  );
}

