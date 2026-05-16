"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ImageIcon,
  MessageSquareText,
  PenLine
} from "lucide-react";

import { AgentMarkdown } from "@/components/dashboard/agent-markdown";

export function ArtDirectorBriefPanel({
  brief,
  isRunning,
  onOpenVisuals,
  onOpenEditor,
  onOpenBrandLab
}: {
  brief: string;
  isRunning?: boolean;
  onOpenVisuals: () => void;
  onOpenEditor: () => void;
  onOpenBrandLab: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasBrief = brief.trim().length > 0;
  const isLong = brief.length > 700;

  async function handleCopy() {
    if (!hasBrief) {
      return;
    }

    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="card overflow-hidden rounded-[1.75rem]">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D97706]">
              Art Director
            </div>
            <h3 className="mt-2 font-heading text-xl font-semibold text-[var(--color-text-1)]">
              Brief visual em destaque
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-2)]">
              Direcao criativa consolidada com acoes rapidas para seguir o fluxo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasBrief}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff] disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenVisuals}
            disabled={!hasBrief}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-[var(--color-warning-bg)] px-4 py-2 text-xs font-semibold text-[#92400E] transition hover:opacity-90 disabled:opacity-40"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Gerar imagem
          </button>
          <button
            type="button"
            onClick={onOpenEditor}
            disabled={!hasBrief}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--color-text-2)] transition hover:bg-[#faf9ff] disabled:opacity-40"
          >
            <PenLine className="h-3.5 w-3.5" />
            Abrir editor
          </button>
          <button
            type="button"
            onClick={onOpenBrandLab}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--color-text-2)] transition hover:bg-[#faf9ff]"
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Brand Lab
          </button>
        </div>

        <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[#fbfaff] p-4">
          {isRunning && !hasBrief ? (
            <div className="space-y-3">
              <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--color-primary-light)]" />
              <div className="h-3.5 w-full animate-pulse rounded-full bg-[#efecff]" />
              <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-[#efecff]" />
              <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[#efecff]" />
            </div>
          ) : hasBrief ? (
            <div className="relative">
              <div className={expanded ? "" : "max-h-[380px] overflow-hidden"}>
                <AgentMarkdown content={brief} />
              </div>
              {!expanded && isLong ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fbfaff] via-[#fbfaff]/92 to-transparent" />
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-7 text-[var(--color-text-2)]">
              Rode a squad para preencher o brief do Art Director e liberar as acoes de
              visuals, editor e refinamento.
            </p>
          )}
        </div>

        {hasBrief && isLong ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-text-2)] transition hover:bg-[#faf9ff]"
          >
            {expanded ? (
              <>
                Ver menos
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Ver mais
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        ) : null}
      </div>
    </section>
  );
}

