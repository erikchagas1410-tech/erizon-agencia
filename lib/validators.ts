import { z } from "zod";

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
  brand_colors: z.string()
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
