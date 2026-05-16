"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { X } from "lucide-react";

import {
  DEFAULT_EDITOR_TEMPLATES,
  EDITOR_FORMAT_DIMENSIONS
} from "@/lib/canvas-templates";
import {
  exportCanvasAsPng,
  generateThumbnail,
  renderTemplateLayers
} from "@/lib/canvas-renderer";
import type { CanvasTemplate, ClientProfile, EditorLayer } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AIAssistant } from "./ai-assistant";
import { CanvasStage } from "./canvas-stage";
import { LayersPanel } from "./layers-panel";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";

interface EditorState {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  history: EditorLayer[][];
  historyIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  templateName: string;
  templateFormat: CanvasTemplate["format"];
  templateCategory: CanvasTemplate["category"];
  isSaving: boolean;
  isGenerating: boolean;
  loadedTemplateId: string | null;
}

type EditorAction =
  | { type: "SET_LAYERS"; layers: EditorLayer[] }
  | { type: "ADD_LAYER"; layer: EditorLayer }
  | { type: "UPDATE_LAYER"; id: string; patch: Partial<EditorLayer>; commit?: boolean }
  | { type: "REPLACE_LAYER"; id: string; layer: EditorLayer; commit?: boolean }
  | { type: "DELETE_LAYER"; id: string }
  | { type: "REORDER_LAYERS"; fromId: string; toId: string }
  | { type: "SELECT_LAYER"; id: string | null }
  | { type: "PUSH_HISTORY" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | {
      type: "SET_FORMAT";
      format: CanvasTemplate["format"];
      width: number;
      height: number;
      layers: EditorLayer[];
    }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_CATEGORY"; category: CanvasTemplate["category"] }
  | { type: "SET_SAVING"; value: boolean }
  | { type: "SET_GENERATING"; value: boolean }
  | { type: "LOAD_TEMPLATE"; template: CanvasTemplate }
  | { type: "RENAME_LAYER"; id: string; nextId: string };

function cloneLayers(layers: EditorLayer[]) {
  return JSON.parse(JSON.stringify(layers)) as EditorLayer[];
}

function pushSnapshot(state: EditorState, nextLayers: EditorLayer[]) {
  const historyHead = state.history.slice(0, state.historyIndex + 1);
  const snapshot = cloneLayers(nextLayers);
  const last = historyHead[historyHead.length - 1];

  if (last && JSON.stringify(last) === JSON.stringify(snapshot)) {
    return {
      ...state,
      layers: nextLayers
    };
  }

  const nextHistory = [...historyHead, snapshot].slice(-50);

  return {
    ...state,
    layers: nextLayers,
    history: nextHistory,
    historyIndex: nextHistory.length - 1
  };
}

function applyPatch(layer: EditorLayer, patch: Partial<EditorLayer>) {
  return {
    ...layer,
    ...patch
  } as EditorLayer;
}

function withSequentialZIndex(layers: EditorLayer[]) {
  return layers.map((layer, index) => ({
    ...layer,
    zIndex: index
  }));
}

function makeUniqueLayerId(baseId: string, layers: EditorLayer[], ignoreId?: string) {
  const normalized = baseId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "layer";
  const ids = new Set(layers.filter((layer) => layer.id !== ignoreId).map((layer) => layer.id));

  if (!ids.has(normalized)) {
    return normalized;
  }

  let counter = 2;
  while (ids.has(`${normalized}-${counter}`)) {
    counter += 1;
  }

  return `${normalized}-${counter}`;
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_LAYERS":
      return {
        ...state,
        layers: action.layers
      };
    case "ADD_LAYER": {
      const nextLayers = withSequentialZIndex([...state.layers, action.layer]);
      return pushSnapshot(state, nextLayers);
    }
    case "UPDATE_LAYER": {
      const nextLayers = state.layers.map((layer) =>
        layer.id === action.id ? applyPatch(layer, action.patch) : layer
      );
      return action.commit ? pushSnapshot(state, nextLayers) : { ...state, layers: nextLayers };
    }
    case "REPLACE_LAYER": {
      const nextLayers = state.layers.map((layer) =>
        layer.id === action.id ? action.layer : layer
      );
      return action.commit ? pushSnapshot(state, nextLayers) : { ...state, layers: nextLayers };
    }
    case "DELETE_LAYER": {
      const nextLayers = withSequentialZIndex(
        state.layers.filter((layer) => layer.id !== action.id)
      );
      return {
        ...pushSnapshot(state, nextLayers),
        selectedLayerId:
          state.selectedLayerId === action.id ? null : state.selectedLayerId
      };
    }
    case "REORDER_LAYERS": {
      const fromIndex = state.layers.findIndex((layer) => layer.id === action.fromId);
      const toIndex = state.layers.findIndex((layer) => layer.id === action.toId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return state;
      }

      const nextLayers = [...state.layers];
      const [moved] = nextLayers.splice(fromIndex, 1);
      nextLayers.splice(toIndex, 0, moved);

      return pushSnapshot(state, withSequentialZIndex(nextLayers));
    }
    case "SELECT_LAYER":
      return {
        ...state,
        selectedLayerId: action.id
      };
    case "PUSH_HISTORY":
      return pushSnapshot(state, state.layers);
    case "UNDO": {
      if (state.historyIndex <= 0) {
        return state;
      }

      const nextIndex = state.historyIndex - 1;
      return {
        ...state,
        layers: cloneLayers(state.history[nextIndex]),
        historyIndex: nextIndex
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }

      const nextIndex = state.historyIndex + 1;
      return {
        ...state,
        layers: cloneLayers(state.history[nextIndex]),
        historyIndex: nextIndex
      };
    }
    case "SET_FORMAT":
      return pushSnapshot(
        {
          ...state,
          templateFormat: action.format,
          canvasWidth: action.width,
          canvasHeight: action.height
        },
        action.layers
      );
    case "SET_NAME":
      return {
        ...state,
        templateName: action.name
      };
    case "SET_CATEGORY":
      return {
        ...state,
        templateCategory: action.category
      };
    case "SET_SAVING":
      return {
        ...state,
        isSaving: action.value
      };
    case "SET_GENERATING":
      return {
        ...state,
        isGenerating: action.value
      };
    case "LOAD_TEMPLATE": {
      const snapshot = cloneLayers(action.template.layers);
      return {
        ...state,
        layers: snapshot,
        selectedLayerId: null,
        history: [snapshot],
        historyIndex: 0,
        canvasWidth: action.template.canvasWidth,
        canvasHeight: action.template.canvasHeight,
        templateName: action.template.name,
        templateFormat: action.template.format,
        templateCategory: action.template.category,
        loadedTemplateId: action.template.id
      };
    }
    case "RENAME_LAYER": {
      const nextId = makeUniqueLayerId(action.nextId, state.layers, action.id);
      const nextLayers = state.layers.map((layer) =>
        layer.id === action.id
          ? {
              ...layer,
              id: nextId
            }
          : layer
      );

      return {
        ...pushSnapshot(state, nextLayers),
        selectedLayerId: state.selectedLayerId === action.id ? nextId : state.selectedLayerId
      };
    }
    default:
      return state;
  }
}

function buildInitialState() {
  const template = DEFAULT_EDITOR_TEMPLATES[0];
  const snapshot = cloneLayers(template.layers);

  return {
    layers: snapshot,
    selectedLayerId: null,
    history: [snapshot],
    historyIndex: 0,
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    templateName: template.name,
    templateFormat: template.format,
    templateCategory: template.category,
    isSaving: false,
    isGenerating: false,
    loadedTemplateId: template.id
  } satisfies EditorState;
}

function createLayer(
  kind: "text" | "shape" | "image" | "logo",
  layers: EditorLayer[]
): EditorLayer {
  const maxZ = Math.max(-1, ...layers.map((layer) => layer.zIndex));
  const common = {
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: maxZ + 1
  };

  if (kind === "text") {
    return {
      id: makeUniqueLayerId("texto", layers),
      type: "text" as const,
      x: 120,
      y: 120,
      width: 460,
      height: 110,
      content: "{{brand_name}}",
      fontFamily: "Syne",
      fontSize: 56,
      fontWeight: 700,
      color: "white",
      textAlign: "left",
      lineHeight: 1.1,
      letterSpacing: 0,
      uppercase: false,
      ...common
    };
  }

  if (kind === "shape") {
    return {
      id: makeUniqueLayerId("forma", layers),
      type: "shape" as const,
      x: 160,
      y: 160,
      width: 280,
      height: 280,
      shape: "rect" as const,
      fill: "accent",
      borderRadius: 40,
      stroke: undefined,
      ...common
    };
  }

  if (kind === "image") {
    return {
      id: makeUniqueLayerId("imagem", layers),
      type: "image" as const,
      x: 180,
      y: 180,
      width: 420,
      height: 320,
      src: "",
      fit: "cover" as const,
      ...common
    };
  }

  return {
    id: makeUniqueLayerId("logo", layers),
    type: "logo" as const,
    x: 96,
    y: 96,
    width: 200,
    height: 72,
    fit: "contain" as const,
    ...common
  };
}

function scaleLayersBetweenFormats(
  layers: EditorLayer[],
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number
) {
  const scaleX = toWidth / fromWidth;
  const scaleY = toHeight / fromHeight;

  return layers.map((layer) => {
    const scaled: EditorLayer = {
      ...layer,
      x: Math.round(layer.x * scaleX),
      y: Math.round(layer.y * scaleY),
      width: Math.max(1, Math.round(layer.width * scaleX)),
      height: Math.max(1, Math.round(layer.height * scaleY))
    };

    if (scaled.type === "text") {
      return {
        ...scaled,
        fontSize: Math.max(10, Math.round(scaled.fontSize * scaleX)),
        letterSpacing: scaled.letterSpacing * scaleX
      };
    }

    if (scaled.type === "shape" && scaled.stroke) {
      return {
        ...scaled,
        borderRadius: Math.round(scaled.borderRadius * Math.min(scaleX, scaleY)),
        stroke: {
          color: scaled.stroke.color,
          width: Math.max(1, Math.round(scaled.stroke.width * Math.min(scaleX, scaleY)))
        }
      };
    }

    if (scaled.type === "shape") {
      return {
        ...scaled,
        borderRadius: Math.round(scaled.borderRadius * Math.min(scaleX, scaleY))
      };
    }

    return scaled;
  });
}

function mergeBackgroundImage(layers: EditorLayer[], imageUrl: string) {
  const backgroundIndex = layers.findIndex((layer) => layer.id === "ai-bg");
  const nextImageLayer: EditorLayer = {
    id: "ai-bg",
    type: "image",
    x: 0,
    y: 0,
    width: Math.max(...layers.map((layer) => layer.width), 1080),
    height: Math.max(...layers.map((layer) => layer.height), 1080),
    rotation: 0,
    opacity: 0.92,
    locked: false,
    visible: true,
    zIndex: 1,
    src: imageUrl,
    fit: "cover"
  };

  const nextLayers = [...layers];

  if (backgroundIndex >= 0) {
    nextLayers[backgroundIndex] = nextImageLayer;
  } else {
    nextLayers.push(nextImageLayer);
  }

  return withSequentialZIndex(nextLayers.sort((a, b) => a.zIndex - b.zIndex));
}

function filterTemplatesForClient(
  templates: CanvasTemplate[],
  client: ClientProfile,
  format: CanvasTemplate["format"] | "all",
  category: CanvasTemplate["category"] | "all"
) {
  return templates.filter((template) => {
    const clientMatch = !template.client_id || template.client_id === client.id;
    const formatMatch = format === "all" || template.format === format;
    const categoryMatch = category === "all" || template.category === category;
    return clientMatch && formatMatch && categoryMatch;
  });
}

export function TemplateEditor({
  client,
  isVisible,
  initialAiImageUrl,
  initialUserInstruction
}: {
  client: ClientProfile;
  isVisible: boolean;
  initialAiImageUrl?: string;
  initialUserInstruction?: string;
}) {
  const [state, dispatch] = useReducer(editorReducer, undefined, buildInitialState);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [templates, setTemplates] = useState<CanvasTemplate[]>(DEFAULT_EDITOR_TEMPLATES);
  const [galleryFormat, setGalleryFormat] = useState<CanvasTemplate["format"] | "all">("all");
  const [galleryCategory, setGalleryCategory] = useState<
    CanvasTemplate["category"] | "all"
  >("all");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantFeedback, setAssistantFeedback] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [analysisModal, setAnalysisModal] = useState<string | null>(null);
  const [showLayersDrawer, setShowLayersDrawer] = useState(false);
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(false);
  const [lastAiImageUrl, setLastAiImageUrl] = useState(initialAiImageUrl || "");

  const selectedLayer = useMemo(
    () => state.layers.find((layer) => layer.id === state.selectedLayerId) || null,
    [state.layers, state.selectedLayerId]
  );

  const galleryTemplates = useMemo(
    () =>
      filterTemplatesForClient(templates, client, galleryFormat, galleryCategory),
    [client, galleryCategory, galleryFormat, templates]
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/canvas-templates");
        const payload = await response.json();

        if (!response.ok || cancelled) {
          return;
        }

        setTemplates(Array.isArray(payload.templates) ? payload.templates : DEFAULT_EDITOR_TEMPLATES);
      } catch {
        if (!cancelled) {
          setTemplates(DEFAULT_EDITOR_TEMPLATES);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client.id, isVisible]);

  useEffect(() => {
    setLastAiImageUrl(initialAiImageUrl || "");
  }, [initialAiImageUrl]);

  useEffect(() => {
    if (!state.selectedLayerId) {
      return;
    }

    if (!state.layers.some((layer) => layer.id === state.selectedLayerId)) {
      dispatch({ type: "SELECT_LAYER", id: null });
    }
  }, [state.layers, state.selectedLayerId]);

  useEffect(() => {
    if (initialUserInstruction) {
      setIsAssistantOpen(true);
    }
  }, [initialUserInstruction]);

  if (!isVisible) {
    return null;
  }

  async function refreshTemplates() {
    try {
      const response = await fetch("/api/canvas-templates");
      const payload = await response.json();

      if (response.ok && Array.isArray(payload.templates)) {
        setTemplates(payload.templates);
      }
    } catch {
      // Mantemos o estado atual se a atualizacao falhar.
    }
  }

  function updateLayer(id: string, patch: Partial<EditorLayer>, commit = false) {
    dispatch({ type: "UPDATE_LAYER", id, patch, commit });
  }

  function replaceLayer(id: string, layer: EditorLayer, commit = false) {
    dispatch({ type: "REPLACE_LAYER", id, layer, commit });
  }

  function loadTemplate(template: CanvasTemplate) {
    dispatch({ type: "LOAD_TEMPLATE", template });
    setAiRationale(null);
    setAssistantFeedback(null);
  }

  async function handleSave() {
    dispatch({ type: "SET_SAVING", value: true });
    setAssistantFeedback(null);

    try {
      const thumbWidth = state.templateFormat === "story" ? 300 : 300;
      const thumbHeight = state.templateFormat === "story" ? 533 : 300;
      const thumbnail = await generateThumbnail(
        state.layers,
        client,
        thumbWidth,
        thumbHeight
      );

      const response = await fetch("/api/canvas-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: state.templateName,
          format: state.templateFormat,
          category: state.templateCategory,
          layers: state.layers,
          canvasWidth: state.canvasWidth,
          canvasHeight: state.canvasHeight,
          thumbnail,
          client_id: client.id
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel salvar o template.");
      }

      setAssistantFeedback("Template salvo com sucesso.");
      await refreshTemplates();
      if (payload.template?.id) {
        dispatch({
          type: "LOAD_TEMPLATE",
          template: payload.template as CanvasTemplate
        });
      }
    } catch (error) {
      setAssistantFeedback(
        error instanceof Error ? error.message : "Erro ao salvar template."
      );
    } finally {
      dispatch({ type: "SET_SAVING", value: false });
    }
  }

  async function handleDownloadPng() {
    const canvas = document.createElement("canvas");
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    await renderTemplateLayers(canvas, state.layers, client);
    const blob = await exportCanvasAsPng(canvas);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.templateName.toLowerCase().replace(/\s+/g, "-")}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleAnalyze() {
    setAnalysisModal("Analisando o template com IA...");

    try {
      const response = await fetch("/api/ai-template/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: client.id,
          layers: state.layers
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel analisar o template.");
      }

      setAnalysisModal(payload.analysis || "A IA nao retornou observacoes desta vez.");
    } catch (error) {
      setAnalysisModal(
        error instanceof Error ? error.message : "Erro ao analisar template."
      );
    }
  }

  async function handleGenerateTemplate(
    instruction: string,
    category: CanvasTemplate["category"]
  ) {
    if (
      state.layers.length > 0 &&
      !window.confirm("Substituir o template atual pelo layout gerado pela IA?")
    ) {
      return;
    }

    dispatch({ type: "SET_GENERATING", value: true });
    setAssistantFeedback(null);
    setAiRationale(null);

    try {
      const response = await fetch("/api/ai-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: client.id,
          format: state.templateFormat,
          category,
          userInstruction: instruction
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel gerar o template.");
      }

      const generated = payload.template as {
        name: string;
        rationale: string;
        layers: EditorLayer[];
      };

      const nextTemplate: CanvasTemplate = {
        id: `ai-${Date.now()}`,
        name: generated.name,
        format: state.templateFormat,
        category,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: generated.layers,
        created_at: new Date().toISOString(),
        is_default: false,
        client_id: client.id,
        user_id: client.user_id
      };

      dispatch({ type: "LOAD_TEMPLATE", template: nextTemplate });
      dispatch({ type: "SET_CATEGORY", category });
      setAiRationale(generated.rationale);
      setAssistantFeedback("Template criado com IA e carregado no editor.");
    } catch (error) {
      setAssistantFeedback(
        error instanceof Error ? error.message : "Erro ao gerar template."
      );
    } finally {
      dispatch({ type: "SET_GENERATING", value: false });
    }
  }

  function handleGenerateBackground(url: string) {
    setLastAiImageUrl(url);
    dispatch({
      type: "SET_LAYERS",
      layers: mergeBackgroundImage(state.layers, url)
    });
    dispatch({ type: "PUSH_HISTORY" });
    setAssistantFeedback("Imagem de fundo adicionada ao editor.");
  }

  async function handleSuggestTexts(instruction: string) {
    dispatch({ type: "SET_GENERATING", value: true });
    setAssistantFeedback(null);

    try {
      const response = await fetch("/api/ai-template/suggest-texts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: client.id,
          layers: state.layers,
          userInstruction: instruction
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel sugerir os textos.");
      }

      const suggestions = payload.suggestions as Record<string, string>;
      const nextLayers = state.layers.map((layer) =>
        layer.type === "text" && suggestions[layer.id]
          ? { ...layer, content: suggestions[layer.id] }
          : layer
      );

      dispatch({ type: "SET_LAYERS", layers: nextLayers });
      dispatch({ type: "PUSH_HISTORY" });
      setAssistantFeedback("Textos aplicados nas layers editaveis.");
    } catch (error) {
      setAssistantFeedback(
        error instanceof Error ? error.message : "Erro ao sugerir textos."
      );
    } finally {
      dispatch({ type: "SET_GENERATING", value: false });
    }
  }

  function handleDeleteTemplate(template: CanvasTemplate) {
    if (
      template.is_default ||
      !window.confirm(`Excluir o template "${template.name}"?`)
    ) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/canvas-templates/${template.id}`, {
          method: "DELETE"
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Nao foi possivel excluir o template.");
        }

        setAssistantFeedback("Template removido com sucesso.");
        await refreshTemplates();
      } catch (error) {
        setAssistantFeedback(
          error instanceof Error ? error.message : "Erro ao excluir template."
        );
      }
    })();
  }

  function handleFormatChange(nextFormat: CanvasTemplate["format"]) {
    if (nextFormat === state.templateFormat) {
      return;
    }

    const dims = EDITOR_FORMAT_DIMENSIONS[nextFormat];
    const shouldScale = window.confirm(
      "Deseja redimensionar proporcionalmente as layers para o novo formato?"
    );
    const nextLayers = shouldScale
      ? scaleLayersBetweenFormats(
          state.layers,
          state.canvasWidth,
          state.canvasHeight,
          dims.width,
          dims.height
        )
      : state.layers;

    dispatch({
      type: "SET_FORMAT",
      format: nextFormat,
      width: dims.width,
      height: dims.height,
      layers: nextLayers
    });
  }

  function renderSidePanel(
    content: ReactNode,
    side: "left" | "right",
    open: boolean,
    onClose: () => void
  ) {
    return (
      <div
        className={cn(
          "fixed inset-y-0 z-40 w-[88vw] max-w-sm bg-[var(--color-bg)] p-4 transition lg:hidden",
          side === "left"
            ? "left-0 border-r border-[var(--color-border)]"
            : "right-0 border-l border-[var(--color-border)]",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--color-text-1)]">
            {side === "left" ? "Layers e galeria" : "Propriedades"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--color-border)] bg-white p-2 text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto">{content}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar
        templateName={state.templateName}
        templateFormat={state.templateFormat}
        zoom={zoom}
        isSaving={state.isSaving}
        isGenerating={state.isGenerating}
        onTemplateNameChange={(value) => dispatch({ type: "SET_NAME", name: value })}
        onTemplateFormatChange={handleFormatChange}
        onZoomChange={setZoom}
        onSave={handleSave}
        onDownload={handleDownloadPng}
        onAnalyze={handleAnalyze}
        onOpenAssistant={() => setIsAssistantOpen((current) => !current)}
        onOpenLayersDrawer={() => setShowLayersDrawer(true)}
        onOpenPropertiesDrawer={() => setShowPropertiesDrawer(true)}
      />

      <div className="grid gap-5 xl:grid-cols-[280px,minmax(0,1fr),320px]">
        <div className="hidden xl:block">
          <LayersPanel
            layers={state.layers}
            selectedLayerId={state.selectedLayerId}
            templates={galleryTemplates}
            galleryFormat={galleryFormat}
            galleryCategory={galleryCategory}
            selectedTemplateId={state.loadedTemplateId}
            onSelectLayer={(id) => dispatch({ type: "SELECT_LAYER", id })}
            onRenameLayer={(id, nextId) => dispatch({ type: "RENAME_LAYER", id, nextId })}
            onToggleVisible={(id) => {
              const layer = state.layers.find((item) => item.id === id);
              if (layer) {
                updateLayer(id, { visible: !layer.visible }, true);
              }
            }}
            onToggleLocked={(id) => {
              const layer = state.layers.find((item) => item.id === id);
              if (layer) {
                updateLayer(id, { locked: !layer.locked }, true);
              }
            }}
            onDeleteLayer={(id) => dispatch({ type: "DELETE_LAYER", id })}
            onAddLayer={(kind) => dispatch({ type: "ADD_LAYER", layer: createLayer(kind, state.layers) })}
            onReorderLayers={(fromId, toId) => dispatch({ type: "REORDER_LAYERS", fromId, toId })}
            onGalleryFormatChange={setGalleryFormat}
            onGalleryCategoryChange={setGalleryCategory}
            onLoadTemplate={loadTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </div>

        <div className="min-w-0">
          <CanvasStage
            layers={state.layers}
            selectedLayerId={state.selectedLayerId}
            canvasWidth={state.canvasWidth}
            canvasHeight={state.canvasHeight}
            client={client}
            zoom={zoom}
            onLayerSelect={(id) => dispatch({ type: "SELECT_LAYER", id })}
            onLayerPatch={updateLayer}
            onLayerReplace={replaceLayer}
            onDeleteSelected={() => {
              if (state.selectedLayerId) {
                dispatch({ type: "DELETE_LAYER", id: state.selectedLayerId });
              }
            }}
            onUndo={() => dispatch({ type: "UNDO" })}
            onRedo={() => dispatch({ type: "REDO" })}
            onCommitHistory={() => dispatch({ type: "PUSH_HISTORY" })}
          />
        </div>

        <div className="hidden xl:block">
          <PropertiesPanel
            layer={selectedLayer}
            onPatchLayer={(patch, commit) => {
              if (selectedLayer) {
                updateLayer(selectedLayer.id, patch, commit);
              }
            }}
            onReplaceLayer={(layer, commit) => {
              if (selectedLayer) {
                replaceLayer(selectedLayer.id, layer, commit);
              }
            }}
          />
        </div>
      </div>

      <AIAssistant
        open={isAssistantOpen}
        initialInstruction={initialUserInstruction}
        client={client}
        format={state.templateFormat}
        currentCategory={state.templateCategory}
        isGenerating={state.isGenerating}
        rationale={aiRationale}
        feedback={assistantFeedback}
        onToggle={() => setIsAssistantOpen((current) => !current)}
        onGenerateTemplate={handleGenerateTemplate}
        onGenerateBackground={handleGenerateBackground}
        onSuggestTexts={handleSuggestTexts}
      />

      {renderSidePanel(
        <LayersPanel
          layers={state.layers}
          selectedLayerId={state.selectedLayerId}
          templates={galleryTemplates}
          galleryFormat={galleryFormat}
          galleryCategory={galleryCategory}
          selectedTemplateId={state.loadedTemplateId}
          onSelectLayer={(id) => dispatch({ type: "SELECT_LAYER", id })}
          onRenameLayer={(id, nextId) => dispatch({ type: "RENAME_LAYER", id, nextId })}
          onToggleVisible={(id) => {
            const layer = state.layers.find((item) => item.id === id);
            if (layer) {
              updateLayer(id, { visible: !layer.visible }, true);
            }
          }}
          onToggleLocked={(id) => {
            const layer = state.layers.find((item) => item.id === id);
            if (layer) {
              updateLayer(id, { locked: !layer.locked }, true);
            }
          }}
          onDeleteLayer={(id) => dispatch({ type: "DELETE_LAYER", id })}
          onAddLayer={(kind) => dispatch({ type: "ADD_LAYER", layer: createLayer(kind, state.layers) })}
          onReorderLayers={(fromId, toId) => dispatch({ type: "REORDER_LAYERS", fromId, toId })}
          onGalleryFormatChange={setGalleryFormat}
          onGalleryCategoryChange={setGalleryCategory}
          onLoadTemplate={(template) => {
            loadTemplate(template);
            setShowLayersDrawer(false);
          }}
          onDeleteTemplate={handleDeleteTemplate}
        />,
        "left",
        showLayersDrawer,
        () => setShowLayersDrawer(false)
      )}

      {renderSidePanel(
        <PropertiesPanel
          layer={selectedLayer}
          onPatchLayer={(patch, commit) => {
            if (selectedLayer) {
              updateLayer(selectedLayer.id, patch, commit);
            }
          }}
          onReplaceLayer={(layer, commit) => {
            if (selectedLayer) {
              replaceLayer(selectedLayer.id, layer, commit);
            }
          }}
        />,
        "right",
        showPropertiesDrawer,
        () => setShowPropertiesDrawer(false)
      )}

      {analysisModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,26,46,0.38)] px-4">
          <div className="card max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-[var(--color-text-1)]">Analise com IA</div>
                <div className="mt-1 text-sm text-[var(--color-text-2)]">
                  Critica de hierarquia, alinhamento e forca visual do template.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisModal(null)}
                className="rounded-full border border-[var(--color-border)] bg-white p-2 text-[var(--color-text-2)] transition duration-150 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="whitespace-pre-wrap text-sm text-[var(--color-text-2)]">
              {analysisModal}
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
