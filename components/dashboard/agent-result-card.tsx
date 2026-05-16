"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  ExternalLink,
  LoaderCircle,
  Megaphone,
  Palette,
  PenLine
} from "lucide-react";

import { AgentMarkdown } from "@/components/dashboard/agent-markdown";
import { buildCanvaSearchUrl } from "@/lib/brand-theme";
import { AGENT_COLORS } from "@/lib/constants";
import type { AgentDefinition, ClientProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const AGENT_ICONS = {
  compass: Compass,
  pen: PenLine,
  palette: Palette,
  megaphone: Megaphone,
  chart: BarChart3
} as const;

export function AgentResultCard({
  agent,
  content,
  loading,
  client,
  onOpenEditor
}: {
  agent: AgentDefinition;
  content?: string;
  loading?: boolean;
  client?: ClientProfile | null;
  onOpenEditor?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ui = AGENT_COLORS[agent.key];
  const Icon = AGENT_ICONS[ui.icon];
  const isLongContent = (content?.length || 0) > 1100;

  async function handleCopy() {
    if (!content) {
      return;
    }

    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article
      className="group relative overflow-hidden rounded-[1.75rem] border bg-white p-5"
      style={
        {
          borderColor: ui.border,
          boxShadow: `var(--shadow-card), inset 0 0 0 1px ${ui.border}`
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1" style={{ background: ui.accent }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={
          {
            background: `radial-gradient(circle at top right, ${ui.soft}, transparent 42%)`
          } as CSSProperties
        }
      />

      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={
                {
                  borderColor: ui.border,
                  backgroundColor: ui.soft,
                  color: ui.accent
                } as CSSProperties
              }
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={
                    {
                      color: ui.accent,
                      borderColor: ui.border,
                      backgroundColor: ui.soft
                    } as CSSProperties
                  }
                >
                  {agent.badge}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    loading ? "badge-warning" : "badge-success"
                  )}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                      Processando
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Pronto
                    </>
                  )}
                </span>
              </div>

              <h3 className="font-heading text-xl font-semibold text-[var(--color-text-1)]">
                {agent.label}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-2)]">{agent.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!content || loading}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--color-primary-light)]" />
            <div className="h-3.5 w-full animate-pulse rounded-full bg-[#efecff]" />
            <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-[#efecff]" />
            <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[#efecff]" />
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-[#f7f5ff]" />
          </div>
        ) : (
          <div className="relative rounded-[1.45rem] border border-[var(--color-border)] bg-[#fbfaff] p-4">
            <div className={expanded ? "" : "max-h-[300px] overflow-hidden"}>
              <AgentMarkdown content={content || "Sem conteudo disponivel."} />
            </div>

            {!expanded && isLongContent ? (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 h-20 bg-gradient-to-t from-[#fbfaff] via-[#fbfaff]/92 to-transparent" />
            ) : null}
          </div>
        )}

        {isLongContent && !loading ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff]"
          >
            {expanded ? (
              <>
                Recolher
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Ler completo
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        ) : null}

        {agent.key === "artDirector" && client ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenEditor}
              disabled={!onOpenEditor}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Abrir no Editor
            </button>
            {[
              { label: "Feed", format: "feed" as const },
              { label: "Story", format: "story" as const },
              { label: "Carrossel", format: "carousel" as const }
            ].map((item) => (
              <a
                key={item.format}
                href={buildCanvaSearchUrl(client, item.format)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff]"
              >
                Buscar {item.label} no Canva
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
