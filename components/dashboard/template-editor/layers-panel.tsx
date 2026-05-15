"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Lock,
  LockOpen,
  Plus,
  Type,
  Shapes,
  Trash2
} from "lucide-react";

import type { CanvasTemplate, EditorLayer } from "@/lib/types";
import { cn } from "@/lib/utils";

import { TemplateGallery } from "./template-gallery";

type AddLayerKind = "text" | "shape" | "image" | "logo";

function getLayerIcon(layer: EditorLayer) {
  if (layer.type === "text") {
    return Type;
  }

  if (layer.type === "image" || layer.type === "logo") {
    return ImageIcon;
  }

  return Shapes;
}

export function LayersPanel({
  layers,
  selectedLayerId,
  templates,
  galleryFormat,
  galleryCategory,
  selectedTemplateId,
  onSelectLayer,
  onRenameLayer,
  onToggleVisible,
  onToggleLocked,
  onDeleteLayer,
  onAddLayer,
  onReorderLayers,
  onGalleryFormatChange,
  onGalleryCategoryChange,
  onLoadTemplate,
  onDeleteTemplate
}: {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  templates: CanvasTemplate[];
  galleryFormat: CanvasTemplate["format"] | "all";
  galleryCategory: CanvasTemplate["category"] | "all";
  selectedTemplateId: string | null;
  onSelectLayer: (id: string) => void;
  onRenameLayer: (id: string, nextId: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onAddLayer: (kind: AddLayerKind) => void;
  onReorderLayers: (fromId: string, toId: string) => void;
  onGalleryFormatChange: (value: CanvasTemplate["format"] | "all") => void;
  onGalleryCategoryChange: (value: CanvasTemplate["category"] | "all") => void;
  onLoadTemplate: (template: CanvasTemplate) => void;
  onDeleteTemplate: (template: CanvasTemplate) => void;
}) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);

  const orderedLayers = useMemo(
    () => [...layers].sort((a, b) => b.zIndex - a.zIndex),
    [layers]
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Layers</div>
            <div className="mt-1 text-xs text-white/44">
              Reordene, oculte ou bloqueie os elementos do canvas.
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-white/76 transition hover:bg-white/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </button>

            {isAddMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-40 rounded-[1rem] border border-white/10 bg-[#121212] p-2 shadow-2xl">
                {([
                  { id: "text", label: "Texto" },
                  { id: "shape", label: "Forma" },
                  { id: "image", label: "Imagem" },
                  { id: "logo", label: "Logo" }
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onAddLayer(item.id);
                      setIsAddMenuOpen(false);
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          {orderedLayers.map((layer) => {
            const Icon = getLayerIcon(layer);
            const isSelected = selectedLayerId === layer.id;

            return (
              <div
                key={layer.id}
                draggable
                onDragStart={() => setDraggingLayerId(layer.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingLayerId && draggingLayerId !== layer.id) {
                    onReorderLayers(draggingLayerId, layer.id);
                  }
                  setDraggingLayerId(null);
                }}
                className={cn(
                  "rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3 transition",
                  isSelected && "ring-1 ring-white/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectLayer(layer.id)}
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10"
                  >
                    <Icon className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      value={layer.id}
                      onChange={(event) => onRenameLayer(layer.id, event.target.value)}
                      onFocus={() => onSelectLayer(layer.id)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white outline-none transition focus:border-white/20"
                    />
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/36">
                      z-index {layer.zIndex}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleVisible(layer.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold text-white/72 transition hover:bg-white/10"
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                    {layer.visible ? "Visivel" : "Oculta"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleLocked(layer.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold text-white/72 transition hover:bg-white/10"
                  >
                    {layer.locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5" />
                    )}
                    {layer.locked ? "Travada" : "Livre"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteLayer(layer.id)}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-100/82 transition hover:bg-red-500/16"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                </div>
              </div>
            );
          })}

          {orderedLayers.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/46">
              Ainda nao existem layers neste template.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center gap-3">
          <Layers3 className="h-4 w-4 text-white/54" />
          <div>
            <div className="text-sm font-semibold text-white">Galeria</div>
            <div className="mt-1 text-xs text-white/44">
              Templates padrao e salvos para este usuario.
            </div>
          </div>
        </div>

        <TemplateGallery
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          activeFormat={galleryFormat}
          activeCategory={galleryCategory}
          onFormatChange={onGalleryFormatChange}
          onCategoryChange={onGalleryCategoryChange}
          onLoadTemplate={onLoadTemplate}
          onDeleteTemplate={onDeleteTemplate}
        />
      </section>
    </div>
  );
}
