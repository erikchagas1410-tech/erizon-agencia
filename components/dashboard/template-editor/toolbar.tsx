"use client";

import {
  Download,
  PenLine,
  Save,
  SearchCheck,
  Sparkles,
  SlidersHorizontal,
  SidebarClose,
  SidebarOpen
} from "lucide-react";

import { EDITOR_FORMAT_DIMENSIONS } from "@/lib/canvas-templates";
import type { CanvasTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

const ZOOM_OPTIONS = [
  { label: "50%", value: "0.5" },
  { label: "75%", value: "0.75" },
  { label: "100%", value: "1" },
  { label: "Ajustar", value: "fit" }
] as const;

export function Toolbar({
  templateName,
  templateFormat,
  zoom,
  isSaving,
  isGenerating,
  onTemplateNameChange,
  onTemplateFormatChange,
  onZoomChange,
  onSave,
  onDownload,
  onAnalyze,
  onOpenAssistant,
  onOpenLayersDrawer,
  onOpenPropertiesDrawer
}: {
  templateName: string;
  templateFormat: CanvasTemplate["format"];
  zoom: number | "fit";
  isSaving: boolean;
  isGenerating: boolean;
  onTemplateNameChange: (value: string) => void;
  onTemplateFormatChange: (value: CanvasTemplate["format"]) => void;
  onZoomChange: (value: number | "fit") => void;
  onSave: () => void;
  onDownload: () => void;
  onAnalyze: () => void;
  onOpenAssistant: () => void;
  onOpenLayersDrawer: () => void;
  onOpenPropertiesDrawer: () => void;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={onOpenLayersDrawer}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/74 transition hover:bg-white/10"
            >
              <SidebarOpen className="h-3.5 w-3.5" />
              Layers
            </button>
            <button
              type="button"
              onClick={onOpenPropertiesDrawer}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/74 transition hover:bg-white/10"
            >
              <SidebarClose className="h-3.5 w-3.5" />
              Propriedades
            </button>
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
              Formato
            </span>
            <select
              value={templateFormat}
              onChange={(event) =>
                onTemplateFormatChange(event.target.value as CanvasTemplate["format"])
              }
              className="input-shell min-w-[220px] px-4 py-3 text-sm"
            >
              {Object.entries(EDITOR_FORMAT_DIMENSIONS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
              Zoom
            </span>
            <select
              value={zoom === "fit" ? "fit" : String(zoom)}
              onChange={(event) =>
                onZoomChange(event.target.value === "fit" ? "fit" : Number(event.target.value))
              }
              className="input-shell min-w-[140px] px-4 py-3 text-sm"
            >
              {ZOOM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-w-0 flex-1 px-0 xl:px-6">
          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
              Nome do template
            </span>
            <div className="relative">
              <PenLine className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
              <input
                value={templateName}
                onChange={(event) => onTemplateNameChange(event.target.value)}
                className="input-shell w-full px-11 py-3 text-sm"
                placeholder="Nome do template"
              />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap justify-start gap-3 xl:justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar template"}
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            Baixar PNG
          </button>

          <button
            type="button"
            onClick={onAnalyze}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <SearchCheck className="h-4 w-4" />
            Analisar com IA
          </button>

          <button
            type="button"
            onClick={onOpenAssistant}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px]"
          >
            {isGenerating ? (
              <SlidersHorizontal className="h-4 w-4 animate-pulse" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar com IA
          </button>
        </div>
      </div>
    </div>
  );
}
