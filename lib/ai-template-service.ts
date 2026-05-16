import "server-only";

import { inferBrandTheme } from "@/lib/brand-theme";
import { EDITOR_FORMAT_DIMENSIONS } from "@/lib/canvas-templates";
import {
  getGroqClient,
  GROQ_TEXT_MODEL,
  readGroqText
} from "@/lib/groq-client";

import type {
  AITemplateSuggestion,
  CanvasTemplate,
  ClientProfile,
  EditorLayer,
  ImageLayer,
  ShapeLayer,
  TextLayer
} from "@/lib/types";

const GENERATE_SYSTEM_PROMPT = [
  "Voce e um diretor de arte digital especializado em social media premium.",
  "Sua funcao e criar layouts de templates em JSON para um editor de canvas com coordenadas em pixels absolutos.",
  "Retorne APENAS um JSON valido no formato AITemplateSuggestion.",
  "Nunca inclua texto, markdown ou explicacoes fora do JSON.",
  "",
  "REGRAS DE TIPOGRAFIA OBRIGATORIAS:",
  "- Use 'Syne' (fontWeight 700 ou 800) para headlines e titulos principais. Use 'DM Sans' (fontWeight 400 ou 600) para subtitulos, descricoes e sign-offs.",
  "- Feed 1080x1080: headline fontSize entre 64 e 96. Subtitulo entre 28 e 40. Caption entre 20 e 28.",
  "- Story 1080x1920: headline fontSize entre 72 e 120. Subtitulo entre 32 e 48. Caption entre 22 e 32.",
  "- Carousel cover 1080x1350: headline fontSize entre 68 e 100. Subtitulo entre 30 e 42. Caption entre 20 e 30.",
  "- SEMPRE defina lineHeight entre 1.0 e 1.35 para headlines. Entre 1.3 e 1.6 para textos corridos.",
  "- Use letterSpacing positivo (1 a 4) em headlines uppercase. Use 0 em textos corridos.",
  "- Campos obrigatorios em cada text layer: content, fontFamily, fontSize, fontWeight, color, textAlign, lineHeight, letterSpacing, uppercase.",
  "- NUNCA omita fontSize, fontWeight, lineHeight, letterSpacing ou fontFamily em text layers.",
  "",
  "REGRAS DE COMPOSICAO:",
  "- Use sempre colorSlot ('primary','secondary','accent','white','black') nos campos fill e color. NUNCA use hex fixo, exceto em stroke quando necessario.",
  "- Crie profundidade: background + shapes decorativos + area de imagem quando couber + hierarquia tipografica clara (headline > subtitulo > detalhe) + logo.",
  "- Posicione o logo sempre visivel no canto superior esquerdo ou direito com width proporcional ao canvas (18-24% da largura).",
  "- Layouts devem ser modernos, premium, elegantes e com boa leitura."
].join("\n");

export async function generateAITemplate(
  client: ClientProfile,
  format: CanvasTemplate["format"],
  category: string,
  userInstruction?: string
): Promise<AITemplateSuggestion> {
  const dims = EDITOR_FORMAT_DIMENSIONS[format];
  const theme = inferBrandTheme(client);
  const userPrompt = [
    `Crie um template de ${format} (${dims.width}x${dims.height}px) para a marca '${client.name}'.`,
    `Categoria: ${category}.`,
    userInstruction ? `Instrucao extra: ${userInstruction}.` : null,
    "",
    "IDENTIDADE DA MARCA:",
    `- Personalidade: ${client.personality}.`,
    `- Estetica visual: ${client.visual_aesthetic}.`,
    `- Tom de voz: ${client.voice_tone}.`,
    `- Proposta de valor: ${client.value_proposition}.`,
    `- Personagem: ${client.brand_character}.`,
    `- Paleta declarada: ${client.brand_colors || "nao informada"}.`,
    "",
    "TEMA VISUAL INFERIDO (use como referencia de hierarquia de slots):",
    `- primary = ${theme.primary}`,
    `- secondary = ${theme.secondary}`,
    `- accent = ${theme.accent}`,
    `- palette = ${theme.palette.join(", ")}`,
    `- Mood: ${theme.mood}`,
    `- Fontes base: heading=${theme.typography.heading}, body=${theme.typography.body}`,
    "",
    "RETORNE o JSON AITemplateSuggestion com:",
    "- name: nome criativo do template",
    "- rationale: 2 frases explicando por que esse layout funciona para essa marca",
    "- layers: array completo de EditorLayer prontas para renderizacao",
    "",
    `Dimensoes do canvas: width=${dims.width}, height=${dims.height}.`,
    "Posicione todos os elementos com x, y, width, height em pixels absolutos.",
    "OBRIGATORIO: todo text layer deve ter fontFamily, fontSize, fontWeight, lineHeight e letterSpacing preenchidos."
  ]
    .filter(Boolean)
    .join("\n");

  const content = await callGroq({
    system: GENERATE_SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 2600,
    temperature: 0.7,
    jsonMode: true
  });

  const parsed = parseJsonFromText(content);

  return sanitizeTemplateSuggestion(parsed, dims.width, dims.height);
}

export async function analyzeTemplate(
  layers: EditorLayer[],
  client: ClientProfile
): Promise<string> {
  return callGroq({
    system:
      "Voce e um diretor de criacao e UX visual. Analise templates para social media e responda em markdown em portugues do Brasil.",
    user: [
      `Cliente: ${client.name}`,
      `Personalidade: ${client.personality}`,
      `Estetica: ${client.visual_aesthetic}`,
      `Paleta: ${client.brand_colors || "nao informada"}`,
      `Proposta de valor: ${client.value_proposition}`,
      "",
      "Analise este layout e comente:",
      "- Hierarquia visual",
      "- Clareza tipografica",
      "- Alinhamento com a marca",
      "- Oportunidades de melhoria",
      "",
      JSON.stringify(layers, null, 2)
    ].join("\n"),
    maxTokens: 1400,
    temperature: 0.4
  });
}

export async function suggestTemplateTexts(
  layers: EditorLayer[],
  client: ClientProfile,
  userInstruction?: string
): Promise<Record<string, string>> {
  const textLayers = layers.filter((layer): layer is TextLayer => layer.type === "text");

  if (textLayers.length === 0) {
    return {};
  }

  const content = await callGroq({
    system: [
      "Voce e um copywriter premium para templates visuais.",
      "Retorne APENAS JSON valido em portugues do Brasil no formato objeto simples.",
      "Cada chave deve ser o id do text layer e o valor deve ser o novo texto sugerido.",
      "Respeite o tom da marca, a hierarquia do layout e o limite implicito de espaco."
    ].join(" "),
    user: [
      `Marca: ${client.name}`,
      `Tom de voz: ${client.voice_tone}`,
      `Personalidade: ${client.personality}`,
      `Proposta de valor: ${client.value_proposition}`,
      userInstruction ? `Instrucao extra: ${userInstruction}` : null,
      "",
      "Camadas de texto atuais:",
      JSON.stringify(
        textLayers.map((layer) => ({
          id: layer.id,
          content: layer.content,
          fontSize: layer.fontSize,
          width: layer.width,
          height: layer.height,
          uppercase: layer.uppercase
        })),
        null,
        2
      )
    ]
      .filter(Boolean)
      .join("\n"),
    maxTokens: 1200,
    temperature: 0.65,
    jsonMode: true
  });

  const parsed = parseJsonFromText(content);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("A IA nao retornou sugestoes de texto em formato valido.");
  }

  const next: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") {
      next[key] = value;
    }
  }

  return next;
}

async function callGroq({
  system,
  user,
  maxTokens,
  temperature,
  jsonMode = false
}: {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  jsonMode?: boolean;
}) {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: user
      }
    ],
    temperature,
    top_p: 1,
    max_completion_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: "json_object" as const } } : {})
  });

  const text = readGroqText(completion.choices[0]?.message?.content);

  if (!text) {
    throw new Error("A IA nao retornou conteudo desta vez.");
  }

  return text;
}

function parseJsonFromText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Nao foi possivel interpretar o JSON retornado pela IA.");
    }

    return JSON.parse(match[0]);
  }
}

function sanitizeTemplateSuggestion(
  value: unknown,
  canvasWidth: number,
  canvasHeight: number
): AITemplateSuggestion {
  const fallback = buildFallbackSuggestion(canvasWidth, canvasHeight);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const raw = value as Record<string, unknown>;
  const rawLayers = Array.isArray(raw.layers) ? raw.layers : [];

  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : fallback.name,
    rationale:
      typeof raw.rationale === "string" && raw.rationale.trim()
        ? raw.rationale.trim()
        : fallback.rationale,
    layers:
      rawLayers
        .map((layer, index) => sanitizeLayer(layer, index, canvasWidth, canvasHeight))
        .filter(Boolean) as EditorLayer[]
  };
}

function sanitizeLayer(
  value: unknown,
  index: number,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const layer = value as Record<string, unknown>;
  const type = String(layer.type || "");
  const base = {
    id: typeof layer.id === "string" && layer.id.trim() ? layer.id : `layer-${index + 1}`,
    x: numberOr(layer.x, 0),
    y: numberOr(layer.y, 0),
    width: clamp(numberOr(layer.width, canvasWidth * 0.4), 20, canvasWidth),
    height: clamp(numberOr(layer.height, canvasHeight * 0.18), 20, canvasHeight),
    rotation: numberOr(layer.rotation, 0),
    opacity: clamp(numberOr(layer.opacity, 1), 0, 1),
    locked: Boolean(layer.locked ?? false),
    visible: layer.visible === false ? false : true,
    zIndex: numberOr(layer.zIndex, index)
  };

  if (type === "background") {
    return {
      ...base,
      type: "background" as const,
      fill: typeof layer.fill === "string" ? layer.fill : "primary",
      gradient:
        layer.gradient && typeof layer.gradient === "object"
          ? {
              angle: numberOr((layer.gradient as Record<string, unknown>).angle, 0),
              from: String((layer.gradient as Record<string, unknown>).from || "primary"),
              to: String((layer.gradient as Record<string, unknown>).to || "secondary")
            }
          : undefined
    };
  }

  if (type === "shape") {
    return {
      ...base,
      type: "shape" as const,
      shape: isShapeType(layer.shape) ? layer.shape : "rect",
      fill: typeof layer.fill === "string" ? layer.fill : "accent",
      borderRadius: Math.max(0, numberOr(layer.borderRadius, 0)),
      stroke:
        layer.stroke && typeof layer.stroke === "object"
          ? {
              color: String((layer.stroke as Record<string, unknown>).color || "#FFFFFF"),
              width: Math.max(0, numberOr((layer.stroke as Record<string, unknown>).width, 0))
            }
          : undefined
    };
  }

  if (type === "text") {
    return {
      ...base,
      type: "text" as const,
      content: typeof layer.content === "string" ? layer.content : "{{brand_name}}",
      fontFamily: typeof layer.fontFamily === "string" ? layer.fontFamily : "Syne",
      fontSize: clamp(numberOr(layer.fontSize, 72), 12, 180),
      fontWeight: isFontWeight(layer.fontWeight) ? layer.fontWeight : 700,
      color: typeof layer.color === "string" ? layer.color : "white",
      textAlign: isTextAlign(layer.textAlign) ? layer.textAlign : "left",
      lineHeight: clamp(numberOr(layer.lineHeight, 1.2), 0.7, 2),
      letterSpacing: numberOr(layer.letterSpacing, 0),
      uppercase: Boolean(layer.uppercase ?? false)
    };
  }

  if (type === "image") {
    return {
      ...base,
      type: "image" as const,
      src: typeof layer.src === "string" ? layer.src : "",
      fit: isImageFit(layer.fit) ? layer.fit : "cover"
    };
  }

  if (type === "logo") {
    return {
      ...base,
      type: "logo" as const,
      fit: "contain" as const
    };
  }

  return null;
}

function buildFallbackSuggestion(
  canvasWidth: number,
  canvasHeight: number
): AITemplateSuggestion {
  return {
    name: "Estrutura Premium Base",
    rationale:
      "A composicao equilibra impacto e legibilidade com uma faixa tipografica clara. O layout cria contraste suficiente para acomodar imagem, logo e mensagem principal.",
    layers: [
      {
        id: "bg",
        type: "background",
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 0,
        fill: "primary",
        gradient: {
          angle: 28,
          from: "primary",
          to: "secondary"
        }
      },
      {
        id: "shape-accent",
        type: "shape",
        x: 0,
        y: Math.round(canvasHeight * 0.72),
        width: canvasWidth,
        height: Math.round(canvasHeight * 0.28),
        rotation: 0,
        opacity: 0.92,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "accent",
        borderRadius: 0
      },
      {
        id: "headline",
        type: "text",
        x: Math.round(canvasWidth * 0.08),
        y: Math.round(canvasHeight * 0.74),
        width: Math.round(canvasWidth * 0.76),
        height: 120,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 2,
        content: "{{brand_name}}",
        fontFamily: "Syne",
        fontSize: Math.round(canvasWidth * 0.065),
        fontWeight: 800,
        color: "white",
        textAlign: "left",
        lineHeight: 1.02,
        letterSpacing: 1,
        uppercase: true
      },
      {
        id: "subheadline",
        type: "text",
        x: Math.round(canvasWidth * 0.08),
        y: Math.round(canvasHeight * 0.86),
        width: Math.round(canvasWidth * 0.78),
        height: 120,
        rotation: 0,
        opacity: 0.84,
        locked: false,
        visible: true,
        zIndex: 2,
        content: "{{value_proposition}}",
        fontFamily: "DM Sans",
        fontSize: Math.round(canvasWidth * 0.03),
        fontWeight: 400,
        color: "white",
        textAlign: "left",
        lineHeight: 1.26,
        letterSpacing: 0,
        uppercase: false
      },
      {
        id: "logo",
        type: "logo",
        x: Math.round(canvasWidth * 0.08),
        y: Math.round(canvasHeight * 0.06),
        width: Math.round(canvasWidth * 0.22),
        height: Math.round(canvasHeight * 0.08),
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        fit: "contain"
      }
    ]
  };
}

function isShapeType(value: unknown): value is ShapeLayer["shape"] {
  return value === "rect" || value === "circle" || value === "triangle" || value === "line";
}

function isFontWeight(value: unknown): value is TextLayer["fontWeight"] {
  return value === 400 || value === 600 || value === 700 || value === 800;
}

function isTextAlign(value: unknown): value is TextLayer["textAlign"] {
  return value === "left" || value === "center" || value === "right";
}

function isImageFit(value: unknown): value is ImageLayer["fit"] {
  return value === "cover" || value === "contain" || value === "fill";
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
