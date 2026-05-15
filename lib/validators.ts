import { z } from "zod";

const colorSlotSchema = z.enum([
  "primary",
  "secondary",
  "accent",
  "white",
  "black",
  "transparent"
]);

const baseLayerSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
  locked: z.boolean(),
  visible: z.boolean(),
  zIndex: z.number()
});

const backgroundLayerSchema = baseLayerSchema.extend({
  type: z.literal("background"),
  fill: z.string().min(1),
  gradient: z
    .object({
      angle: z.number(),
      from: z.string().min(1),
      to: z.string().min(1)
    })
    .optional()
});

const shapeLayerSchema = baseLayerSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle", "triangle", "line"]),
  fill: z.string().min(1),
  borderRadius: z.number().min(0),
  stroke: z
    .object({
      color: z.string().min(1),
      width: z.number().min(0)
    })
    .optional()
});

const textLayerSchema = baseLayerSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(1),
  fontWeight: z.union([
    z.literal(400),
    z.literal(600),
    z.literal(700),
    z.literal(800)
  ]),
  color: z.string().min(1),
  textAlign: z.enum(["left", "center", "right"]),
  lineHeight: z.number().min(0.5),
  letterSpacing: z.number(),
  uppercase: z.boolean()
});

const imageLayerSchema = baseLayerSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  fit: z.enum(["cover", "contain", "fill"])
});

const logoLayerSchema = baseLayerSchema.extend({
  type: z.literal("logo"),
  fit: z.literal("contain")
});

export const editorLayerSchema = z.discriminatedUnion("type", [
  backgroundLayerSchema,
  shapeLayerSchema,
  textLayerSchema,
  imageLayerSchema,
  logoLayerSchema
]);

export const editorLayersSchema = z.array(editorLayerSchema);

export const clientPayloadSchema = z.object({
  name: z.string().min(2, "Informe o nome da marca."),
  voice_tone: z.string().min(8, "Descreva o tom de voz."),
  personality: z.string().min(8, "Descreva a personalidade da marca."),
  core_values: z.string().min(8, "Informe os valores centrais."),
  main_objective: z.string().min(8, "Explique o objetivo principal."),
  post_sign_off: z.string().min(2, "Informe a assinatura fixa."),
  value_proposition: z.string().min(8, "Explique o diferencial real."),
  content_style: z.string().min(8, "Descreva o estilo de conteudo."),
  visual_aesthetic: z.string().min(5, "Descreva o tom visual."),
  reason_to_exist: z.string().min(8, "Explique o motivo de existir."),
  content_pillars: z
    .array(z.string().min(2))
    .min(3, "Cadastre entre 3 e 5 pilares.")
    .max(5, "Cadastre entre 3 e 5 pilares."),
  brand_character: z
    .string()
    .min(16, "Descreva o personagem da marca em 2 ou 3 linhas."),
  brand_colors: z.string(),
  logo_url: z.string().trim().max(3_000_000).nullable().optional()
});

export const agencyRequestSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  request: z
    .string()
    .min(3, "Digite um pedido para o time.")
    .max(500, "O pedido precisa ter ate 500 caracteres.")
});

const brandAttachmentSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().startsWith("image/"),
  dataUrl: z.string().startsWith("data:image/"),
  size: z.number().max(4_000_000)
});

const brandHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
  attachments: z.array(brandAttachmentSchema).max(5)
});

export const brandChatRequestSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  message: z.string().max(4000),
  attachments: z.array(brandAttachmentSchema).max(5),
  history: z.array(brandHistoryMessageSchema).max(16)
});

export const aiTemplateRequestSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  format: z.enum(["feed", "story", "carousel_cover"]),
  category: z
    .enum(["institucional", "produto", "promocional", "depoimento", "conteudo"])
    .or(z.string().min(3).max(48)),
  userInstruction: z.string().max(4000).optional()
});

export const aiTemplateAnalyzeRequestSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  layers: editorLayersSchema
});

export const aiTemplateSuggestTextsRequestSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  layers: editorLayersSchema,
  userInstruction: z.string().max(4000).optional()
});

export const canvasTemplateSaveSchema = z.object({
  name: z.string().min(2).max(120),
  format: z.enum(["feed", "story", "carousel_cover"]),
  category: z.enum([
    "institucional",
    "produto",
    "promocional",
    "depoimento",
    "conteudo"
  ]),
  layers: editorLayersSchema,
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),
  thumbnail: z.string().max(2_000_000).optional(),
  client_id: z.string().uuid().optional().nullable()
});

export const canvasTemplateDeleteSchema = z.object({
  id: z.string().uuid("Template invalido.")
});

export const colorSlotValueSchema = colorSlotSchema;
