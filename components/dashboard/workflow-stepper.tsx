"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkflowStepKey =
  | "briefing"
  | "strategy"
  | "visuals"
  | "editor"
  | "publish";

export const WORKFLOW_STEPS: Array<{
  key: WorkflowStepKey;
  label: string;
  description: string;
}> = [
  { key: "briefing", label: "Briefing", description: "Cliente + pedido" },
  { key: "strategy", label: "Estrategia", description: "Agentes rodaram" },
  { key: "visuals", label: "Visuals", description: "Gerar imagens" },
  { key: "editor", label: "Editor", description: "Montar peca" },
  { key: "publish", label: "Publicar", description: "Exportar + revisar" }
];

export function WorkflowStepper({
  activeStep,
  getStatus,
  onStepClick
}: {
  activeStep: WorkflowStepKey;
  getStatus: (step: WorkflowStepKey) => "complete" | "active" | "pending";
  onStepClick: (step: WorkflowStepKey) => void;
}) {
  return (
    <section className="card rounded-[1.8rem] p-5">
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-3)]">
          Fluxo de steps
        </div>
        <h2 className="mt-2 font-heading text-2xl font-semibold text-[var(--color-text-1)]">
          Do briefing ate a publicacao
        </h2>
      </div>

      <div className="grid gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[#fbfaff] p-2 md:grid-cols-5">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStatus(step.key);

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onStepClick(step.key)}
              className={cn(
                "rounded-[1.2rem] border px-4 py-4 text-left transition",
                status === "active"
                  ? "border-[#c9c2ff] bg-[var(--color-primary-light)] shadow-[var(--shadow-hover)]"
                  : status === "complete"
                    ? "border-emerald-200 bg-[var(--color-success-bg)]"
                    : "border-[var(--color-border)] bg-white hover:bg-[#faf9ff]"
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                    status === "active"
                      ? "bg-[var(--color-primary)] text-white"
                      : status === "complete"
                        ? "bg-[var(--color-success)] text-white"
                        : "bg-[#f3f4f6] text-[var(--color-text-2)]"
                  )}
                >
                  {status === "complete" ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.18em]",
                    status === "active"
                      ? "text-[var(--color-primary)]"
                      : status === "complete"
                        ? "text-[#047857]"
                        : "text-[var(--color-text-3)]"
                  )}
                >
                  {status}
                </span>
              </div>
              <div className="text-sm font-semibold text-[var(--color-text-1)]">{step.label}</div>
              <div className="mt-1 text-xs text-[var(--color-text-2)]">{step.description}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

