"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from "lucide-react";

import { buildCanvaSearchUrl } from "@/lib/brand-theme";
import type { AgentDefinition, ClientProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const isLongContent = (content?.length || 0) > 900;

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
      className="glass-panel group relative overflow-hidden rounded-[1.75rem] p-5"
      style={
        {
          boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 30px 90px rgba(0,0,0,0.35), 0 0 48px ${agent.accent}20`
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={
          {
            background: `radial-gradient(circle at top right, ${agent.accent}33, transparent 38%)`
          } as CSSProperties
        }
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div
              className="mb-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={
                {
                  color: agent.accent,
                  borderColor: `${agent.accent}55`,
                  backgroundColor: `${agent.accent}14`
                } as CSSProperties
              }
            >
              {agent.badge}
            </div>
            <h3 className="font-heading text-2xl font-semibold">{agent.label}</h3>
            <p className="mt-2 text-sm text-white/58">{agent.description}</p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!content || loading}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/76 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/12" />
            <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/8" />
            <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
          </div>
        ) : (
          <div className="relative">
            <div
              className={cn(
                "agent-copy overflow-hidden text-sm transition-[max-height] duration-300",
                expanded ? "max-h-none" : "max-h-[320px]"
              )}
            >
              {content || "Sem conteudo disponivel."}
            </div>

            {!expanded && isLongContent ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#121212] via-[#121212]/92 to-transparent" />
            ) : null}
          </div>
        )}

        {isLongContent && !loading ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/76 transition hover:bg-white/10"
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
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/82 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/82 transition hover:bg-white/10"
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
