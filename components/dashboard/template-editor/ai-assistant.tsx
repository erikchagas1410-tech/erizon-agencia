"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Sparkles, Type } from "lucide-react";

import { buildPollinationsUrl } from "@/lib/pollinations";
import type { CanvasTemplate, ClientProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_CHIPS: CanvasTemplate["category"][] = [
  "institucional",
  "produto",
  "promocional",
  "depoimento",
  "conteudo"
];

const CATEGORY_LABELS: Record<CanvasTemplate["category"], string> = {
  institucional: "Institucional",
  produto: "Produto",
  promocional: "Promocional",
  depoimento: "Depoimento",
  conteudo: "Conteudo"
};

export function AIAssistant({
  open,
  initialInstruction,
  client,
  format,
  currentCategory,
  isGenerating,
  rationale,
  feedback,
  onToggle,
  onGenerateTemplate,
  onGenerateBackground,
  onSuggestTexts
}: {
  open: boolean;
  initialInstruction?: string;
  client: ClientProfile;
  format: CanvasTemplate["format"];
  currentCategory: CanvasTemplate["category"];
  isGenerating: boolean;
  rationale?: string | null;
  feedback?: string | null;
  onToggle: () => void;
  onGenerateTemplate: (instruction: string, category: CanvasTemplate["category"]) => void;
  onGenerateBackground: (url: string) => void;
  onSuggestTexts: (instruction: string) => void;
}) {
  const [instruction, setInstruction] = useState(initialInstruction || "");
  const [category, setCategory] = useState<CanvasTemplate["category"]>(currentCategory);

  useEffect(() => {
    if (initialInstruction) {
      setInstruction(initialInstruction);
    }
  }, [initialInstruction]);

  useEffect(() => {
    setCategory(currentCategory);
  }, [currentCategory]);

  const statusMessage = useMemo(() => {
    if (!isGenerating) {
      return null;
    }

    const messages = [
      "Lendo a identidade da marca...",
      "Compondo hierarquia visual...",
      "Ajustando contraste e proporcoes...",
      "Organizando tipografia e areas de destaque..."
    ];

    return messages[Math.floor(Date.now() / 1000) % messages.length];
  }, [isGenerating]);

  function handleGenerateBackground() {
    const seedBase = Math.floor(Date.now() % 1000);
    const url = buildPollinationsUrl({
      artDirectorBrief:
        instruction ||
        `${client.value_proposition}. Categoria ${CATEGORY_LABELS[category]}.`,
      clientName: client.name,
      visualAesthetic: client.visual_aesthetic,
      brandColors: client.brand_colors,
      personality: client.personality,
      format,
      index: 0,
      round: seedBase
    });

    onGenerateBackground(url);
  }

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-white">Criar com IA</div>
          <div className="mt-1 text-xs text-white/44">
            Gere layouts, fundos visuais e sugestoes de texto a partir da marca.
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-white/54" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/54" />
        )}
      </button>

      {open ? (
        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Descreva o que voce quer
            </span>
            <textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              rows={4}
              placeholder="Ex.: template minimalista com foco em texto; layout com imagem da IA ao fundo e logo no canto superior."
              className="input-shell resize-none px-4 py-4 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setCategory(chip)}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-semibold transition",
                  category === chip
                    ? "border-white/22 bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {CATEGORY_LABELS[chip]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onGenerateTemplate(instruction, category)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Gerar template
            </button>

            <button
              type="button"
              onClick={handleGenerateBackground}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <ImagePlus className="h-4 w-4" />
              Gerar imagem de fundo
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onSuggestTexts(instruction)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Type className="h-4 w-4" />
              Sugerir textos
            </button>
          </div>

          {statusMessage ? (
            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72">
              {statusMessage}
            </div>
          ) : null}

          {feedback ? (
            <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72">
              {feedback}
            </div>
          ) : null}

          {rationale ? (
            <div className="rounded-[1.2rem] border border-emerald-400/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/84">
              <strong className="text-emerald-50">Rationale da IA:</strong> {rationale}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
