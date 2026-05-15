"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import type {
  BackgroundLayer,
  ColorSlot,
  EditorLayer,
  ShapeLayer,
  TextLayer
} from "@/lib/types";

const COLOR_SLOT_OPTIONS: Array<{ label: string; value: ColorSlot }> = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Accent", value: "accent" },
  { label: "White", value: "white" },
  { label: "Black", value: "black" },
  { label: "Transparent", value: "transparent" }
];

const FONT_OPTIONS = [
  "Syne",
  "DM Sans",
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Poppins"
];

function isColorSlot(value: string): value is ColorSlot {
  return COLOR_SLOT_OPTIONS.some((item) => item.value === value);
}

function getColorSlotValue(value: string) {
  return isColorSlot(value) ? value : "primary";
}

function getCustomColorValue(value: string) {
  return isColorSlot(value) ? "" : value;
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
      className="input-shell px-3 py-2.5 text-sm"
    />
  );
}

export function PropertiesPanel({
  layer,
  onPatchLayer,
  onReplaceLayer
}: {
  layer: EditorLayer | null;
  onPatchLayer: (patch: Partial<EditorLayer>, commit?: boolean) => void;
  onReplaceLayer: (nextLayer: EditorLayer, commit?: boolean) => void;
}) {
  if (!layer) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-white/48">
        Selecione uma layer para editar propriedades.
      </div>
    );
  }

  const fillValue =
    layer.type === "background" || layer.type === "shape" ? layer.fill : null;
  const colorValue = layer.type === "text" ? layer.color : null;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4">
          <div className="text-sm font-semibold text-white">Propriedades</div>
          <div className="mt-1 text-xs text-white/44">
            Ajuste tamanho, posicao, opacidade e comportamento da layer.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Posicao X">
            <NumberInput
              value={layer.x}
              onChange={(value) => onPatchLayer({ x: value }, true)}
            />
          </Field>
          <Field label="Posicao Y">
            <NumberInput
              value={layer.y}
              onChange={(value) => onPatchLayer({ y: value }, true)}
            />
          </Field>
          <Field label="Largura">
            <NumberInput
              value={layer.width}
              min={1}
              onChange={(value) => onPatchLayer({ width: Math.max(1, value) }, true)}
            />
          </Field>
          <Field label="Altura">
            <NumberInput
              value={layer.height}
              min={1}
              onChange={(value) => onPatchLayer({ height: Math.max(1, value) }, true)}
            />
          </Field>
          <Field label="Rotacao">
            <div className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={layer.rotation}
                onChange={(event) =>
                  onPatchLayer({ rotation: Number(event.target.value) }, true)
                }
                className="w-full accent-white"
              />
              <div className="mt-2 text-xs text-white/54">{Math.round(layer.rotation)}°</div>
            </div>
          </Field>
          <Field label="Opacidade">
            <div className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(layer.opacity * 100)}
                onChange={(event) =>
                  onPatchLayer({ opacity: Number(event.target.value) / 100 }, true)
                }
                className="w-full accent-white"
              />
              <div className="mt-2 text-xs text-white/54">
                {Math.round(layer.opacity * 100)}%
              </div>
            </div>
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/74">
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(event) =>
                onPatchLayer({ visible: event.target.checked }, true)
              }
              className="h-4 w-4 rounded border-white/20 bg-transparent"
            />
            Visivel
          </label>

          <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/74">
            <input
              type="checkbox"
              checked={layer.locked}
              onChange={(event) =>
                onPatchLayer({ locked: event.target.checked }, true)
              }
              className="h-4 w-4 rounded border-white/20 bg-transparent"
            />
            Bloqueada
          </label>
        </div>
      </section>

      {layer.type === "background" ? (
        <BackgroundControls layer={layer} onReplaceLayer={onReplaceLayer} />
      ) : null}

      {layer.type === "shape" ? (
        <ShapeControls layer={layer} onReplaceLayer={onReplaceLayer} />
      ) : null}

      {layer.type === "text" ? (
        <TextControls layer={layer} onReplaceLayer={onReplaceLayer} />
      ) : null}

      {layer.type === "image" ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 text-sm font-semibold text-white">Imagem</div>
          <div className="space-y-4">
            <Field label="Arquivo">
              <label className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/10">
                Trocar imagem
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      onReplaceLayer(
                        {
                          ...layer,
                          src: String(reader.result || "")
                        },
                        true
                      );
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </Field>

            <Field label="Fit">
              <select
                value={layer.fit}
                onChange={(event) =>
                  onPatchLayer(
                    {
                      fit: event.target.value as typeof layer.fit
                    },
                    true
                  )
                }
                className="input-shell px-3 py-2.5 text-sm"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </Field>
          </div>
        </section>
      ) : null}

      {layer.type === "logo" ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Logo da marca</div>
          <p className="mt-2 text-sm text-white/58">
            Esta layer usa automaticamente o logo cadastrado no perfil do cliente.
          </p>
          <Link
            href="/clientes"
            className="mt-4 inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/74 transition hover:bg-white/10"
          >
            Editar logo no perfil do cliente
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function BackgroundControls({
  layer,
  onReplaceLayer
}: {
  layer: BackgroundLayer;
  onReplaceLayer: (nextLayer: EditorLayer, commit?: boolean) => void;
}) {
  const gradientEnabled = Boolean(layer.gradient);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 text-sm font-semibold text-white">Background</div>

      <div className="space-y-4">
        <Field label="Cor base">
          <div className="grid gap-3 sm:grid-cols-[1fr,1fr]">
            <select
              value={getColorSlotValue(layer.fill)}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    fill: event.target.value
                  },
                  true
                )
              }
              className="input-shell px-3 py-2.5 text-sm"
            >
              {COLOR_SLOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={getCustomColorValue(layer.fill)}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    fill: event.target.value || getColorSlotValue(layer.fill)
                  },
                  true
                )
              }
              placeholder="#E8D2B5"
              className="input-shell px-3 py-2.5 text-sm"
            />
          </div>
        </Field>

        <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/74">
          <input
            type="checkbox"
            checked={gradientEnabled}
            onChange={(event) =>
              onReplaceLayer(
                {
                  ...layer,
                  gradient: event.target.checked
                    ? layer.gradient || {
                        angle: 45,
                        from: "primary",
                        to: "secondary"
                      }
                    : undefined
                },
                true
              )
            }
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Gradiente
        </label>

        {gradientEnabled ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="De">
              <input
                type="text"
                value={layer.gradient?.from || "primary"}
                onChange={(event) =>
                  onReplaceLayer(
                    {
                      ...layer,
                      gradient: {
                        angle: layer.gradient?.angle || 45,
                        from: event.target.value,
                        to: layer.gradient?.to || "secondary"
                      }
                    },
                    true
                  )
                }
                className="input-shell px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="Para">
              <input
                type="text"
                value={layer.gradient?.to || "secondary"}
                onChange={(event) =>
                  onReplaceLayer(
                    {
                      ...layer,
                      gradient: {
                        angle: layer.gradient?.angle || 45,
                        from: layer.gradient?.from || "primary",
                        to: event.target.value
                      }
                    },
                    true
                  )
                }
                className="input-shell px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="Angulo">
              <NumberInput
                value={layer.gradient?.angle || 45}
                onChange={(value) =>
                  onReplaceLayer(
                    {
                      ...layer,
                      gradient: {
                        angle: value,
                        from: layer.gradient?.from || "primary",
                        to: layer.gradient?.to || "secondary"
                      }
                    },
                    true
                  )
                }
              />
            </Field>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ShapeControls({
  layer,
  onReplaceLayer
}: {
  layer: ShapeLayer;
  onReplaceLayer: (nextLayer: EditorLayer, commit?: boolean) => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 text-sm font-semibold text-white">Forma</div>

      <div className="space-y-4">
        <Field label="Tipo">
          <select
            value={layer.shape}
            onChange={(event) =>
              onReplaceLayer(
                {
                  ...layer,
                  shape: event.target.value as ShapeLayer["shape"]
                },
                true
              )
            }
            className="input-shell px-3 py-2.5 text-sm"
          >
            <option value="rect">Rect</option>
            <option value="circle">Circle</option>
            <option value="triangle">Triangle</option>
            <option value="line">Line</option>
          </select>
        </Field>

        <Field label="Preenchimento">
          <div className="grid gap-3 sm:grid-cols-[1fr,1fr]">
            <select
              value={getColorSlotValue(layer.fill)}
              onChange={(event) =>
                onReplaceLayer({ ...layer, fill: event.target.value }, true)
              }
              className="input-shell px-3 py-2.5 text-sm"
            >
              {COLOR_SLOT_OPTIONS.filter((option) => option.value !== "transparent").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={getCustomColorValue(layer.fill)}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    fill: event.target.value || getColorSlotValue(layer.fill)
                  },
                  true
                )
              }
              placeholder="#FFFFFF"
              className="input-shell px-3 py-2.5 text-sm"
            />
          </div>
        </Field>

        {layer.shape === "rect" ? (
          <Field label="Border Radius">
            <div className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
              <input
                type="range"
                min="0"
                max={Math.max(24, Math.min(layer.width, layer.height) / 2)}
                step="1"
                value={layer.borderRadius}
                onChange={(event) =>
                  onReplaceLayer(
                    {
                      ...layer,
                      borderRadius: Number(event.target.value)
                    },
                    true
                  )
                }
                className="w-full accent-white"
              />
              <div className="mt-2 text-xs text-white/54">
                {Math.round(layer.borderRadius)} px
              </div>
            </div>
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stroke cor">
            <input
              type="text"
              value={layer.stroke?.color || ""}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    stroke: event.target.value
                      ? {
                          color: event.target.value,
                          width: layer.stroke?.width || 2
                        }
                      : undefined
                  },
                  true
                )
              }
              placeholder="#FFFFFF"
              className="input-shell px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Stroke largura">
            <NumberInput
              value={layer.stroke?.width || 0}
              min={0}
              onChange={(value) =>
                onReplaceLayer(
                  {
                    ...layer,
                    stroke:
                      value > 0
                        ? {
                            color: layer.stroke?.color || "#FFFFFF",
                            width: value
                          }
                        : undefined
                  },
                  true
                )
              }
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function TextControls({
  layer,
  onReplaceLayer
}: {
  layer: TextLayer;
  onReplaceLayer: (nextLayer: EditorLayer, commit?: boolean) => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 text-sm font-semibold text-white">Texto</div>

      <div className="space-y-4">
        <Field label="Conteudo">
          <textarea
            value={layer.content}
            onChange={(event) =>
              onReplaceLayer(
                {
                  ...layer,
                  content: event.target.value
                },
                true
              )
            }
            rows={4}
            className="input-shell resize-none px-3 py-3 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fonte">
            <select
              value={layer.fontFamily}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    fontFamily: event.target.value
                  },
                  true
                )
              }
              className="input-shell px-3 py-2.5 text-sm"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Peso">
            <select
              value={layer.fontWeight}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    fontWeight: Number(event.target.value) as TextLayer["fontWeight"]
                  },
                  true
                )
              }
              className="input-shell px-3 py-2.5 text-sm"
            >
              <option value="400">400</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
            </select>
          </Field>

          <Field label="Tamanho">
            <NumberInput
              value={layer.fontSize}
              min={8}
              onChange={(value) =>
                onReplaceLayer(
                  {
                    ...layer,
                    fontSize: Math.max(8, value)
                  },
                  true
                )
              }
            />
          </Field>

          <Field label="Cor">
            <div className="grid gap-3 sm:grid-cols-[1fr,1fr]">
              <select
                value={getColorSlotValue(layer.color)}
                onChange={(event) =>
                  onReplaceLayer(
                    {
                      ...layer,
                      color: event.target.value
                    },
                    true
                  )
                }
                className="input-shell px-3 py-2.5 text-sm"
              >
                {COLOR_SLOT_OPTIONS.filter((option) => option.value !== "transparent").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={getCustomColorValue(layer.color)}
                onChange={(event) =>
                  onReplaceLayer(
                    {
                      ...layer,
                      color: event.target.value || getColorSlotValue(layer.color)
                    },
                    true
                  )
                }
                placeholder="#FFFFFF"
                className="input-shell px-3 py-2.5 text-sm"
              />
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alinhamento">
            <div className="flex flex-wrap gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() =>
                    onReplaceLayer(
                      {
                        ...layer,
                        textAlign: align
                      },
                      true
                    )
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    layer.textAlign === align
                      ? "border-white/22 bg-white text-black"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/74">
            <input
              type="checkbox"
              checked={layer.uppercase}
              onChange={(event) =>
                onReplaceLayer(
                  {
                    ...layer,
                    uppercase: event.target.checked
                  },
                  true
                )
              }
              className="h-4 w-4 rounded border-white/20 bg-transparent"
            />
            Uppercase
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Line Height">
            <NumberInput
              value={layer.lineHeight}
              min={0.8}
              max={2}
              step={0.05}
              onChange={(value) =>
                onReplaceLayer(
                  {
                    ...layer,
                    lineHeight: value
                  },
                  true
                )
              }
            />
          </Field>
          <Field label="Letter Spacing">
            <NumberInput
              value={layer.letterSpacing}
              step={0.2}
              onChange={(value) =>
                onReplaceLayer(
                  {
                    ...layer,
                    letterSpacing: value
                  },
                  true
                )
              }
            />
          </Field>
        </div>
      </div>
    </section>
  );
}
