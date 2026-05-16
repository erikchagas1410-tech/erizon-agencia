"use client";

import { History } from "lucide-react";

import type { CampaignRecord } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function CampaignHistory({
  campaigns,
  activeCampaignId,
  onSelect
}: {
  campaigns: CampaignRecord[];
  activeCampaignId: string | null;
  onSelect: (campaign: CampaignRecord) => void;
}) {
  return (
    <section className="card rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="icon-box icon-box-violet h-10 w-10">
          <History className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--color-text-1)]">
            Historico por cliente
          </h2>
          <p className="text-sm text-[var(--color-text-2)]">
            Reabra campanhas anteriores sem alongar a pagina toda.
          </p>
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {campaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[#fbfaff] px-4 py-8 text-center text-sm text-[var(--color-text-2)]">
            Ainda nao existem campanhas para este cliente.
          </div>
        ) : null}

        {campaigns.map((campaign) => {
          const active = activeCampaignId === campaign.id;

          return (
            <button
              key={campaign.id}
              type="button"
              onClick={() => onSelect(campaign)}
              className={cn(
                "w-full rounded-3xl border px-4 py-4 text-left transition",
                active
                  ? "border-[#c9c2ff] bg-[var(--color-primary-light)]"
                  : "border-[var(--color-border)] bg-white hover:bg-[#faf9ff]"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-3)]">
                  {formatDateTime(campaign.created_at)}
                </span>
                {active ? <span className="badge-info">Aberta</span> : null}
              </div>
              <div className="line-clamp-2 text-sm text-[var(--color-text-1)]">
                {campaign.request}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

