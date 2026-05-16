"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
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
  const ui = AGENT_COLORS[agent.key];
  const Icon = AGENT_ICONS[ui.icon];

  async function handleCopy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article
      className="overflow-hidden rounded-[1.75rem] border bg-white"
      style={
        {
          borderColor: ui.border,
          boxShadow: `var(--shadow-card), inset 0 0 0 1px ${ui.border}`
        } as CSSProperties
      }
    >
      {/* Accent top bar */}
      <div className="h-1 w-full" style={{ background: ui.accent }} />

      {/* Header */}
      <div
        className="flex items-center justify-between gap-4 border-b px-5 py-4"
        style={{ borderColor: ui.border, backgroundColor: ui.soft }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: ui.border, backgroundColor: "white", color: ui.accent }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: ui.accent, borderColor: ui.border, backgroundColor: "white" }}
              >
                {agent.badge}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
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
            <h3 className="mt-0.5 font-heading text-base font-semibold text-[var(--color-text-1)]">
              {agent.label}
            </h3>
            <p className="text-xs text-[var(--color-text-2)]">{agent.description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!content || loading}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      {/* Content — full height, no truncation */}
      <div className="px-5 py-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--color-primary-light)]" />
            <div className="h-3.5 w-full animate-pulse rounded-full bg-[#efecff]" />
            <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-[#efecff]" />
            <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[#efecff]" />
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-[#f7f5ff]" />
          </div>
        ) : (
          <AgentMarkdown content={content || "Sem conteúdo disponível."} />
        )}

        {agent.key === "artDirector" && client && !loading ? (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
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
                {item.label} no Canva
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
