"use client";

import { Trash2 } from "lucide-react";

import type { CanvasTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

const FORMAT_LABELS: Record<CanvasTemplate["format"], string> = {
  feed: "Feed",
  story: "Story",
  carousel_cover: "Carrossel"
};

const CATEGORY_LABELS: Record<CanvasTemplate["category"], string> = {
  institucional: "Institucional",
  produto: "Produto",
  promocional: "Promocional",
  depoimento: "Depoimento",
  conteudo: "Conteudo"
};

export function TemplateGallery({
  templates,
  selectedTemplateId,
  activeFormat,
  activeCategory,
  onFormatChange,
  onCategoryChange,
  onLoadTemplate,
  onDeleteTemplate
}: {
  templates: CanvasTemplate[];
  selectedTemplateId?: string | null;
  activeFormat: CanvasTemplate["format"] | "all";
  activeCategory: CanvasTemplate["category"] | "all";
  onFormatChange: (value: CanvasTemplate["format"] | "all") => void;
  onCategoryChange: (value: CanvasTemplate["category"] | "all") => void;
  onLoadTemplate: (template: CanvasTemplate) => void;
  onDeleteTemplate: (template: CanvasTemplate) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "feed", "story", "carousel_cover"] as const).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => onFormatChange(format)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition duration-150",
              activeFormat === format
                ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-text-2)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
            )}
          >
            {format === "all" ? "Todos" : FORMAT_LABELS[format]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          ["all", "institucional", "produto", "promocional", "depoimento", "conteudo"] as const
        ).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition duration-150",
              activeCategory === category
                ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-text-2)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
            )}
          >
            {category === "all" ? "Todos" : CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <article
              key={template.id}
              className={cn(
                "rounded-[1.25rem] border bg-white p-3 transition duration-150",
                isSelected
                  ? "border-[var(--color-primary)] shadow-[0_6px_24px_rgba(108,99,255,0.12)]"
                  : "border-[var(--color-border)] hover:shadow-[0_6px_20px_rgba(108,99,255,0.08)]"
              )}
            >
              <button
                type="button"
                onClick={() => onLoadTemplate(template)}
                className="block w-full text-left"
              >
                <div className="relative overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[#fbfaff]">
                  {template.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className={cn(
                        "w-full object-cover",
                        template.format === "story" ? "aspect-[9/16]" : "aspect-square"
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full bg-[#f5f2ff]",
                        template.format === "story" ? "aspect-[9/16]" : "aspect-square"
                      )}
                    />
                  )}
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-1)]">
                      {template.name}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-3)]">
                      {FORMAT_LABELS[template.format]} · {CATEGORY_LABELS[template.category]}
                    </div>
                  </div>
                  <div className="rounded-full border border-[var(--color-border)] bg-[#faf9ff] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-2)]">
                    {template.is_default ? "Padrao" : template.client_id ? "Cliente" : "Seu"}
                  </div>
                </div>
              </button>

              {!template.is_default ? (
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(template)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-[var(--color-danger-bg)] px-3 py-1.5 text-[11px] font-semibold text-[#b42318] transition duration-150 hover:bg-[#ffd9d9]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              ) : null}
            </article>
          );
        })}

        {templates.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-[var(--color-border)] bg-[#fbfaff] px-4 py-8 text-center text-sm text-[var(--color-text-2)]">
            Nenhum template encontrado para esses filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}
