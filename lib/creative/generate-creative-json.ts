import "server-only";

import { GROQ_TEXT_MODEL, getGroqClient, readGroqText } from "@/lib/groq-client";
import {
  creativeJsonSchema,
  type CreativeJson,
  type CreativeRenderRequest
} from "@/lib/creative/schema";

const GENERATE_SYSTEM_PROMPT = [
  "Voce e um diretor criativo de performance para anuncios de social media.",
  "Gere apenas JSON valido para um criativo renderizado por HTML/CSS controlado.",
  "Nao gere HTML, markdown, comentarios, cercas de codigo ou explicacoes.",
  "Use somente o schema pedido.",
  "Escolha um template entre: pain_point, benefit, offer.",
  "Use headline com ate 72 caracteres.",
  "Use subheadline com ate 140 caracteres.",
  "Use cta com ate 32 caracteres.",
  "As cores devem ser hex validos no formato #RRGGBB.",
  "O resultado deve ser claro, legivel, orientado a conversao e adequado para layout fixo."
].join(" ");

const REPAIR_SYSTEM_PROMPT = [
  "Voce corrige JSON de criativos para um schema estrito.",
  "Retorne apenas JSON valido.",
  "Nao inclua explicacoes, markdown ou qualquer texto extra.",
  "Corrija limites de caracteres, enums e cores hex quando necessario."
].join(" ");

export async function generateCreativeJson(
  input: CreativeRenderRequest
): Promise<CreativeJson> {
  const raw = await callGroqJson({
    system: GENERATE_SYSTEM_PROMPT,
    user: buildGeneratePrompt(input),
    maxTokens: 900
  });

  const normalized = normalizeCreativeCandidate(raw, input);
  const firstPass = creativeJsonSchema.safeParse(normalized);

  if (firstPass.success) {
    return firstPass.data;
  }

  const repairedRaw = await callGroqJson({
    system: REPAIR_SYSTEM_PROMPT,
    user: buildRepairPrompt(raw, firstPass.error.issues.map((issue) => issue.message)),
    maxTokens: 900
  });
  const repaired = normalizeCreativeCandidate(repairedRaw, input);
  const secondPass = creativeJsonSchema.safeParse(repaired);

  if (secondPass.success) {
    return secondPass.data;
  }

  throw new Error(
    `Creative JSON invalido apos uma tentativa de correcao: ${secondPass.error.issues
      .slice(0, 3)
      .map((issue) => issue.message)
      .join("; ")}`
  );
}

async function callGroqJson({
  system,
  user,
  maxTokens
}: {
  system: string;
  user: string;
  maxTokens: number;
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
    temperature: 0.35,
    top_p: 1,
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" }
  });

  const text = readGroqText(completion.choices[0]?.message?.content);

  if (!text) {
    throw new Error("A IA nao retornou Creative JSON.");
  }

  return parseJsonFromText(text);
}

function buildGeneratePrompt(input: CreativeRenderRequest) {
  const arr = [
    "Schema esperado:",
    JSON.stringify(
      {
        template: "pain_point | benefit | offer",
        format: "feed_square | feed_portrait | story",
        headline: "string ate 72 chars",
        subheadline: "string opcional ate 140 chars",
        cta: "string opcional ate 32 chars",
        brand: {
          name: "string",
          logoUrl: "url opcional",
          colors: {
            primary: "#RRGGBB",
            secondary: "#RRGGBB opcional",
            accent: "#RRGGBB opcional",
            background: "#RRGGBB opcional"
          },
          fontFamily: "string opcional"
        },
        visual: {
          backgroundStyle: "solid | gradient | mesh | grid | abstract",
          mood: "premium | tech | clean | bold | minimal",
          density: "low | medium | high"
        },
        compliance: {
          avoidPeople: true,
          avoidFakeUI: true,
          avoidTooMuchText: true
        }
      },
      null,
      2
    ),
    "",
    "Briefing da campanha:",
    JSON.stringify(input, null, 2),
    "",
    "Instrucoes criativas:",
    "- Escolha o template mais adequado para performance.",
    "- Foque em uma headline forte e objetiva.",
    "- Subheadline deve complementar, nao repetir.",
    "- CTA deve ser curta e acionavel.",
    "- Nao invente interfaces falsas, pessoas ou excesso de texto.",
    "- Use a marca e a paleta fornecidas.",
    "- O criativo sera renderizado em layout controlado, entao priorize clareza."
  ];

  const base = arr.join("\n");
  const anyInput = input as any;
  if (anyInput.dnaPrompt && typeof anyInput.dnaPrompt === "string" && anyInput.dnaPrompt.trim()) {
    return [base, "", "Contexto de Brand Visual DNA:", anyInput.dnaPrompt].join("\n");
  }

  return base;
}

function buildRepairPrompt(raw: unknown, issues: string[]) {
  return [
    "Corrija este JSON para o schema estrito de criativo.",
    "Problemas encontrados:",
    ...issues.map((issue) => `- ${issue}`),
    "",
    "JSON recebido:",
    JSON.stringify(raw, null, 2),
    "",
    "Retorne apenas o JSON corrigido."
  ].join("\n");
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

function normalizeCreativeCandidate(
  value: unknown,
  input: CreativeRenderRequest
): CreativeJson {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  const template = normalizeTemplate(source.template, input);
  const brandSource =
    source.brand && typeof source.brand === "object" && !Array.isArray(source.brand)
      ? (source.brand as Record<string, unknown>)
      : {};
  const colorsSource =
    brandSource.colors &&
    typeof brandSource.colors === "object" &&
    !Array.isArray(brandSource.colors)
      ? (brandSource.colors as Record<string, unknown>)
      : {};
  const visualSource =
    source.visual && typeof source.visual === "object" && !Array.isArray(source.visual)
      ? (source.visual as Record<string, unknown>)
      : {};
  const complianceSource =
    source.compliance && typeof source.compliance === "object" && !Array.isArray(source.compliance)
      ? (source.compliance as Record<string, unknown>)
      : {};

  const primary = normalizeHexColor(colorsSource.primary, input.brand.colors.primary);
  const secondary = normalizeHexColor(
    colorsSource.secondary,
    input.brand.colors.secondary || shiftHex(primary, -18)
  );
  const accent = normalizeHexColor(
    colorsSource.accent,
    input.brand.colors.accent || shiftHex(primary, 34)
  );
  const background = normalizeHexColor(
    colorsSource.background,
    input.brand.colors.background || shiftHex(primary, -42)
  );

  return {
    template,
    format: input.format,
    headline: limitText(
      typeof source.headline === "string" ? source.headline : fallbackHeadline(input),
      72
    ),
    subheadline: optionalText(source.subheadline, 140),
    cta: optionalText(source.cta, 32),
    brand: {
      name: limitText(
        typeof brandSource.name === "string" ? brandSource.name : input.brand.name,
        64
      ),
      logoUrl: normalizeOptionalUrl(brandSource.logoUrl, input.brand.logoUrl),
      colors: {
        primary,
        secondary,
        accent,
        background
      },
      fontFamily:
        typeof brandSource.fontFamily === "string" && brandSource.fontFamily.trim()
          ? brandSource.fontFamily.trim().slice(0, 48)
          : input.brand.fontFamily
    },
    visual: {
      backgroundStyle: normalizeEnum(
        visualSource.backgroundStyle,
        ["solid", "gradient", "mesh", "grid", "abstract"],
        pickBackgroundStyle(template)
      ),
      mood: normalizeEnum(
        visualSource.mood,
        ["premium", "tech", "clean", "bold", "minimal"],
        pickMood(input)
      ),
      density: normalizeEnum(
        visualSource.density,
        ["low", "medium", "high"],
        pickDensity(input)
      )
    },
    compliance: {
      avoidPeople: normalizeBoolean(complianceSource.avoidPeople, true),
      avoidFakeUI: normalizeBoolean(complianceSource.avoidFakeUI, true),
      avoidTooMuchText: normalizeBoolean(complianceSource.avoidTooMuchText, true)
    }
  };
}

function normalizeTemplate(value: unknown, input: CreativeRenderRequest) {
  if (value === "pain_point" || value === "benefit" || value === "offer") {
    return value;
  }

  const combined = `${input.briefing} ${input.objective}`.toLowerCase();

  if (
    /(trial|teste|demo|oferta|gratuito|gratis|promoc|agende|cadastre)/.test(combined)
  ) {
    return "offer";
  }

  if (
    /(perde|perdendo|dor|manual|caos|atraso|problema|demora|whatsapp|relatorio)/.test(
      combined
    )
  ) {
    return "pain_point";
  }

  return "benefit";
}

function fallbackHeadline(input: CreativeRenderRequest) {
  if (/trial|teste|demo|gratuito|gratis/i.test(input.objective)) {
    return `Teste ${input.brand.name} e ganhe mais velocidade`;
  }

  if (/manual|perde tempo|relatorio|whatsapp/i.test(input.briefing)) {
    return "Pare de perder tempo operando campanhas no manual";
  }

  return `${input.brand.name}: criativo pensado para conversao`;
}

function pickBackgroundStyle(template: CreativeJson["template"]) {
  if (template === "pain_point") {
    return "grid";
  }

  if (template === "offer") {
    return "gradient";
  }

  return "mesh";
}

function pickMood(input: CreativeRenderRequest): CreativeJson["visual"]["mood"] {
  const combined = `${input.niche} ${input.objective} ${input.briefing}`.toLowerCase();

  if (/(saas|tech|automacao|dados|dashboard|performance)/.test(combined)) {
    return "tech";
  }

  if (/(premium|luxo|sofistic)/.test(combined)) {
    return "premium";
  }

  if (/(oferta|urgencia|agora|lancar|lancamento)/.test(combined)) {
    return "bold";
  }

  return "clean";
}

function pickDensity(input: CreativeRenderRequest): CreativeJson["visual"]["density"] {
  const combined = `${input.briefing} ${input.objective}`.toLowerCase();

  if (/(minimal|simples|limpo|clean)/.test(combined)) {
    return "low";
  }

  if (/(oferta|urgencia|lancamento|impacto|bold)/.test(combined)) {
    return "high";
  }

  return "medium";
}

function limitText(value: string, max: number) {
  const sanitized = sanitizeText(value);
  return sanitized.length <= max ? sanitized : `${sanitized.slice(0, max - 1).trim()}…`;
}

function optionalText(value: unknown, max: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = sanitizeText(value);
  return sanitized ? limitText(sanitized, max) : undefined;
}

function sanitizeText(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function normalizeOptionalUrl(value: unknown, fallback?: string) {
  const candidate = typeof value === "string" ? value.trim() : fallback?.trim();

  if (!candidate) {
    return undefined;
  }

  if (/^(https?:\/\/|data:image\/)/i.test(candidate)) {
    return candidate;
  }

  return fallback;
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeHexColor(value: unknown, fallback: string) {
  const candidate =
    typeof value === "string" && value.trim() ? value.trim() : fallback.trim();
  const normalized = candidate.startsWith("#") ? candidate : `#${candidate}`;

  if (/^#([0-9a-f]{3})$/i.test(normalized)) {
    const [, short] = normalized.match(/^#([0-9a-f]{3})$/i) || [];

    if (short) {
      return `#${short
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
        .toUpperCase()}`;
    }
  }

  if (/^#([0-9a-f]{6})$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return fallback.toUpperCase();
}

function shiftHex(hex: string, amount: number) {
  const normalized = normalizeHexColor(hex, "#6C63FF").replace("#", "");
  const channels = normalized.match(/.{1,2}/g) || ["6C", "63", "FF"];
  const shifted = channels.map((chunk) => {
    const value = Number.parseInt(chunk, 16);
    const next = Math.max(0, Math.min(255, value + amount));
    return next.toString(16).padStart(2, "0");
  });

  return `#${shifted.join("").toUpperCase()}`;
}
