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
    <section className="glass-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6">
          <History className="h-4 w-4 text-white/72" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold">Histórico por cliente</h2>
          <p className="text-sm text-white/56">
            Reabra campanhas anteriores e reutilize a solicitação com um clique.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-4 py-8 text-center text-sm text-white/50">
            Ainda não existem campanhas para este cliente.
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
                  ? "border-white/18 bg-white/10"
                  : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/42">
                  {formatDateTime(campaign.created_at)}
                </span>
                {active ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                    Aberta
                  </span>
                ) : null}
              </div>
              <div className="line-clamp-2 text-sm text-white/82">{campaign.request}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
