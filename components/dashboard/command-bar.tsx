"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { BrandTheme, ClientProfile } from "@/lib/types";
import { getInitials } from "@/lib/utils";

export function CommandBar({
  clients,
  selectedClient,
  selectedClientId,
  requestText,
  isRunning,
  theme,
  onClientChange,
  onRequestChange,
  onGenerate
}: {
  clients: ClientProfile[];
  selectedClient: ClientProfile | null;
  selectedClientId: string;
  requestText: string;
  isRunning: boolean;
  theme: BrandTheme | null;
  onClientChange: (clientId: string) => void;
  onRequestChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="card sticky top-4 z-30 rounded-[1.9rem] p-4 sm:p-5">
      <div
        className="rounded-[1.6rem] border p-4 sm:p-5"
        style={
          {
            borderColor: theme ? `${theme.accent}24` : "var(--color-border)",
            background: theme
              ? `linear-gradient(135deg, ${theme.primary}12, rgba(255,255,255,0.96) 45%, ${theme.secondary}10)`
              : "rgba(255,255,255,0.96)"
          } as CSSProperties
        }
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3 rounded-[1.4rem] border border-[var(--color-border)] bg-white px-3 py-3 sm:px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-sidebar)] text-sm font-semibold text-white">
              {getInitials(selectedClient?.name || "IA")}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--color-text-1)]">
                {selectedClient?.name || "Selecione um cliente"}
              </div>
              <div className="truncate text-xs text-[var(--color-text-2)]">
                {theme?.mood || "Cliente selecionado"}
                {selectedClient ? " Â· briefing ativo" : ""}
              </div>
            </div>
            <Link
              href="/clientes"
              className="ml-auto whitespace-nowrap text-xs font-semibold text-[var(--color-primary)] transition hover:opacity-80"
            >
              Trocar â†’
            </Link>
          </div>

          <div className="grid flex-1 gap-3 md:grid-cols-[220px,minmax(0,1fr),210px]">
            <select
              value={selectedClientId}
              onChange={(event) => onClientChange(event.target.value)}
              className="input-shell px-4 py-3 text-sm"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <textarea
              value={requestText}
              onChange={(event) => onRequestChange(event.target.value)}
              rows={2}
              placeholder="O que voce quer criar hoje? Ex: post de antes/depois para Instagram..."
              className="input-shell min-h-[54px] resize-none px-4 py-3 text-sm"
            />

            <button
              type="button"
              onClick={onGenerate}
              disabled={isRunning}
              className="inline-flex h-full min-h-[54px] items-center justify-center gap-2 rounded-[1.1rem] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {isRunning ? "Acionando..." : "Acionar Squad"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.3rem] border border-emerald-200 bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[#065F46]">
          <ArrowRight className="h-4 w-4 text-[var(--color-success)]" />
          Cliente sempre visivel no topo. Pedido e acao principal ficam no mesmo lugar.
        </div>
      </div>
    </section>
  );
}

