"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getLayerCornerPoints,
  hitTestLayer,
  renderTemplateLayers
} from "@/lib/canvas-renderer";
import type { EditorLayer, TextLayer, ClientProfile } from "@/lib/types";

type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "rotate";

type InteractionState =
  | {
      mode: "move";
      layerId: string;
      pointerId: number;
      originX: number;
      originY: number;
      originalLayer: EditorLayer;
    }
  | {
      mode: "resize";
      layerId: string;
      pointerId: number;
      handle: Exclude<ResizeHandle, "rotate">;
      originX: number;
      originY: number;
      originalLayer: EditorLayer;
      keepAspect: boolean;
    }
  | {
      mode: "rotate";
      layerId: string;
      pointerId: number;
      originAngle: number;
      originalLayer: EditorLayer;
    }
  | null;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function rotatePoint(x: number, y: number, radians: number) {
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians)
  };
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCursorForHandle(handle: ResizeHandle) {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    case "rotate":
      return "grab";
    default:
      return "default";
  }
}

function getLayerCenter(layer: EditorLayer) {
  return {
    x: layer.x + layer.width / 2,
    y: layer.y + layer.height / 2
  };
}

function toCanvasCoordinates(
  event: React.PointerEvent | PointerEvent | React.MouseEvent | React.TouchEvent,
  container: HTMLDivElement,
  scale: number
) {
  const rect = container.getBoundingClientRect();
  let clientX = 0;
  let clientY = 0;

  if ("clientX" in event && typeof event.clientX === "number") {
    clientX = event.clientX;
    clientY = event.clientY;
  } else if ("touches" in event && event.touches[0]) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  }

  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale
  };
}

function toLocalPoint(layer: EditorLayer, pointX: number, pointY: number) {
  const center = getLayerCenter(layer);
  const localX = pointX - center.x;
  const localY = pointY - center.y;

  return rotatePoint(localX, localY, -degreesToRadians(layer.rotation));
}

function resizeLayer(
  layer: EditorLayer,
  handle: Exclude<ResizeHandle, "rotate">,
  currentPoint: { x: number; y: number },
  keepAspect: boolean
) {
  const center = getLayerCenter(layer);
  const local = rotatePoint(
    currentPoint.x - center.x,
    currentPoint.y - center.y,
    -degreesToRadians(layer.rotation)
  );

  let left = -layer.width / 2;
  let right = layer.width / 2;
  let top = -layer.height / 2;
  let bottom = layer.height / 2;
  const aspect = layer.width / Math.max(1, layer.height);

  if (handle.includes("w")) {
    left = Math.min(local.x, right - 24);
  }

  if (handle.includes("e")) {
    right = Math.max(local.x, left + 24);
  }

  if (handle.includes("n")) {
    top = Math.min(local.y, bottom - 24);
  }

  if (handle.includes("s")) {
    bottom = Math.max(local.y, top + 24);
  }

  let width = Math.max(24, right - left);
  let height = Math.max(24, bottom - top);

  if (keepAspect && (handle.length === 2 || handle === "n" || handle === "s" || handle === "e" || handle === "w")) {
    if (handle === "n" || handle === "s") {
      width = height * aspect;
      left = -width / 2;
      right = width / 2;
    } else if (handle === "e" || handle === "w") {
      height = width / aspect;
      top = -height / 2;
      bottom = height / 2;
    } else {
      if (width / height > aspect) {
        height = width / aspect;
      } else {
        width = height * aspect;
      }

      if (handle.includes("w")) {
        left = right - width;
      } else {
        right = left + width;
      }

      if (handle.includes("n")) {
        top = bottom - height;
      } else {
        bottom = top + height;
      }
    }
  }

  const localCenter = {
    x: (left + right) / 2,
    y: (top + bottom) / 2
  };
  const rotatedCenterOffset = rotatePoint(
    localCenter.x,
    localCenter.y,
    degreesToRadians(layer.rotation)
  );
  const nextCenter = {
    x: center.x + rotatedCenterOffset.x,
    y: center.y + rotatedCenterOffset.y
  };

  return {
    x: Math.round(nextCenter.x - width / 2),
    y: Math.round(nextCenter.y - height / 2),
    width: Math.round(width),
    height: Math.round(height)
  };
}

function getSelectionHandles(layer: EditorLayer) {
  const [nw, ne, se, sw] = getLayerCornerPoints(layer);
  const n = midpoint(nw, ne);
  const e = midpoint(ne, se);
  const s = midpoint(sw, se);
  const w = midpoint(nw, sw);
  const center = getLayerCenter(layer);
  const offset = rotatePoint(0, -36, degreesToRadians(layer.rotation));
  const rotateHandle = {
    x: n.x + (n.x - center.x) / Math.max(1, layer.height / 36) + offset.x,
    y: n.y + (n.y - center.y) / Math.max(1, layer.height / 36) + offset.y
  };

  return {
    polygon: [nw, ne, se, sw],
    points: { nw, n, ne, e, se, s, sw, w, rotate: rotateHandle }
  };
}

export function CanvasStage({
  layers,
  selectedLayerId,
  canvasWidth,
  canvasHeight,
  client,
  zoom,
  onLayerSelect,
  onLayerPatch,
  onLayerReplace,
  onDeleteSelected,
  onUndo,
  onRedo,
  onCommitHistory
}: {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  client: ClientProfile;
  zoom: number | "fit";
  onLayerSelect: (id: string | null) => void;
  onLayerPatch: (id: string, patch: Partial<EditorLayer>, commit?: boolean) => void;
  onLayerReplace: (id: string, layer: EditorLayer, commit?: boolean) => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCommitHistory: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState>(null);
  const [fitScale, setFitScale] = useState(1);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  const scale = zoom === "fit" ? fitScale : zoom;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let raf = 0;
    raf = window.requestAnimationFrame(() => {
      void renderTemplateLayers(canvas, layers, client);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [canvasHeight, canvasWidth, client, layers]);

  useEffect(() => {
    function computeFitScale() {
      if (!wrapperRef.current) {
        return;
      }

      const availableWidth = wrapperRef.current.clientWidth - 32;
      const availableHeight = Math.max(window.innerHeight * 0.64, 420);
      const next = Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight, 1);
      setFitScale(Number.isFinite(next) ? next : 1);
    }

    computeFitScale();
    window.addEventListener("resize", computeFitScale);
    return () => window.removeEventListener("resize", computeFitScale);
  }, [canvasHeight, canvasWidth]);

  useEffect(() => {
    if (!selectedLayer || selectedLayer.type !== "text" || editingTextId !== selectedLayer.id) {
      return;
    }

    setEditingTextValue(selectedLayer.content);
  }, [editingTextId, selectedLayer]);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (!interactionRef.current || !wrapperRef.current) {
        return;
      }

      const interaction = interactionRef.current;
      const point = toCanvasCoordinates(event, wrapperRef.current, scale);

      if (interaction.mode === "move") {
        const nextX = Math.round(
          interaction.originalLayer.x + (point.x - interaction.originX)
        );
        const nextY = Math.round(
          interaction.originalLayer.y + (point.y - interaction.originY)
        );
        onLayerPatch(interaction.layerId, { x: nextX, y: nextY }, false);
        return;
      }

      if (interaction.mode === "resize") {
        const patch = resizeLayer(
          interaction.originalLayer,
          interaction.handle,
          point,
          interaction.keepAspect
        );
        onLayerPatch(interaction.layerId, patch, false);
        return;
      }

      if (interaction.mode === "rotate") {
        const center = getLayerCenter(interaction.originalLayer);
        const currentAngle =
          (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
        const nextRotation = interaction.originalLayer.rotation + (currentAngle - interaction.originAngle);
        onLayerPatch(
          interaction.layerId,
          { rotation: Math.round((nextRotation + 360) % 360) },
          false
        );
      }
    }

    function endInteraction(pointerId?: number) {
      if (!interactionRef.current) {
        return;
      }

      if (pointerId && interactionRef.current.pointerId !== pointerId) {
        return;
      }

      interactionRef.current = null;
      onCommitHistory();
    }

    function handlePointerUp(event: PointerEvent) {
      endInteraction(event.pointerId);
    }

    function handlePointerCancel(event: PointerEvent) {
      endInteraction(event.pointerId);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [onCommitHistory, onLayerPatch, scale]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if ((event.key === "Delete" || event.key === "Backspace") && selectedLayer && !selectedLayer.locked) {
      event.preventDefault();
      onDeleteSelected();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      onRedo();
      return;
    }

    if (!selectedLayer || selectedLayer.locked) {
      return;
    }

    const step = event.shiftKey ? 10 : 1;
    const patch: Partial<EditorLayer> = {};

    if (event.key === "ArrowLeft") {
      patch.x = selectedLayer.x - step;
    }
    if (event.key === "ArrowRight") {
      patch.x = selectedLayer.x + step;
    }
    if (event.key === "ArrowUp") {
      patch.y = selectedLayer.y - step;
    }
    if (event.key === "ArrowDown") {
      patch.y = selectedLayer.y + step;
    }

    if (patch.x !== undefined || patch.y !== undefined) {
      event.preventDefault();
      onLayerPatch(selectedLayer.id, patch, true);
    }
  }

  function handleStagePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!wrapperRef.current) {
      return;
    }

    if ((event.target as HTMLElement).dataset.handle) {
      return;
    }

    const point = toCanvasCoordinates(event, wrapperRef.current, scale);
    const ordered = [...layers]
      .filter((layer) => layer.visible !== false)
      .sort((a, b) => b.zIndex - a.zIndex);
    const hitLayer = ordered.find((layer) => hitTestLayer(layer, point.x, point.y)) || null;

    if (!hitLayer) {
      onLayerSelect(null);
      return;
    }

    onLayerSelect(hitLayer.id);

    if (hitLayer.locked) {
      return;
    }

    interactionRef.current = {
      mode: "move",
      layerId: hitLayer.id,
      pointerId: event.pointerId,
      originX: point.x,
      originY: point.y,
      originalLayer: { ...hitLayer }
    };
  }

  function handleHandlePointerDown(
    event: React.PointerEvent<SVGCircleElement>,
    handle: ResizeHandle
  ) {
    if (!selectedLayer || !wrapperRef.current) {
      return;
    }

    event.stopPropagation();
    const point = toCanvasCoordinates(event, wrapperRef.current, scale);

    if (handle === "rotate") {
      const center = getLayerCenter(selectedLayer);
      interactionRef.current = {
        mode: "rotate",
        layerId: selectedLayer.id,
        pointerId: event.pointerId,
        originAngle:
          (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI,
        originalLayer: { ...selectedLayer }
      };
      return;
    }

    interactionRef.current = {
      mode: "resize",
      layerId: selectedLayer.id,
      pointerId: event.pointerId,
      handle,
      originX: point.x,
      originY: point.y,
      originalLayer: { ...selectedLayer },
      keepAspect: event.shiftKey
    };
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!wrapperRef.current) {
      return;
    }

    const point = toCanvasCoordinates(event, wrapperRef.current, scale);
    const ordered = [...layers]
      .filter((layer): layer is TextLayer => layer.type === "text" && layer.visible !== false)
      .sort((a, b) => b.zIndex - a.zIndex);
    const hitTextLayer = ordered.find((layer) => hitTestLayer(layer, point.x, point.y));

    if (!hitTextLayer) {
      return;
    }

    onLayerSelect(hitTextLayer.id);
    setEditingTextId(hitTextLayer.id);
    setEditingTextValue(hitTextLayer.content);
  }

  function commitInlineText() {
    if (!editingTextId) {
      return;
    }

    onLayerPatch(editingTextId, { content: editingTextValue }, true);
    setEditingTextId(null);
  }

  const selection = selectedLayer ? getSelectionHandles(selectedLayer) : null;
  const displayWidth = canvasWidth * scale;
  const displayHeight = canvasHeight * scale;
  const editingLayer =
    editingTextId && selectedLayer?.id === editingTextId && selectedLayer.type === "text"
      ? selectedLayer
      : null;

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative flex h-full min-h-[520px] items-center justify-center overflow-auto rounded-[1.75rem] border border-[var(--color-border)] bg-[#f3f0ff] p-4 outline-none"
    >
      <div
        className="relative shrink-0"
        style={{ width: displayWidth, height: displayHeight, touchAction: "none" }}
        onPointerDown={handleStagePointerDown}
        onDoubleClick={handleDoubleClick}
        onTouchStart={() => undefined}
        onTouchMove={() => undefined}
        onTouchEnd={() => undefined}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full rounded-[1.25rem] bg-white shadow-[0_18px_48px_rgba(108,99,255,0.14)]"
          style={{ width: displayWidth, height: displayHeight }}
        />

        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {selection ? (
            <>
              <polygon
                points={selection.polygon
                  .map((point) => `${point.x * scale},${point.y * scale}`)
                  .join(" ")}
                fill="transparent"
                stroke="rgba(108,99,255,0.8)"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />

              {(
                Object.entries(selection.points) as Array<[ResizeHandle, { x: number; y: number }]>
              ).map(([handle, point]) => (
                <circle
                  key={handle}
                  cx={point.x * scale}
                  cy={point.y * scale}
                  r={handle === "rotate" ? 8 : 6}
                  fill={handle === "rotate" ? "#6c63ff" : "#ffffff"}
                  stroke="#6c63ff"
                  strokeWidth="1.5"
                  className="pointer-events-auto"
                  data-handle={handle}
                  style={{ cursor: getCursorForHandle(handle) }}
                  onPointerDown={(event) => handleHandlePointerDown(event, handle)}
                />
              ))}
            </>
          ) : null}
        </svg>

        {editingLayer ? (
          <textarea
            autoFocus
            value={editingTextValue}
            onChange={(event) => setEditingTextValue(event.target.value)}
            onBlur={commitInlineText}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                commitInlineText();
              }
            }}
            className="absolute resize-none rounded-[1rem] border border-[var(--color-primary)] bg-white px-3 py-3 text-sm text-[var(--color-text-1)] outline-none shadow-[0_10px_30px_rgba(108,99,255,0.14)]"
            style={{
              left: editingLayer.x * scale,
              top: editingLayer.y * scale,
              width: editingLayer.width * scale,
              height: editingLayer.height * scale
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
