import { z } from "zod";

const HEX_COLOR_PATTERN = /^#(?:[0-9A-Fa-f]{6})$/;

function isValidLogoReference(value: string) {
  return /^(https?:\/\/|data:image\/)/i.test(value);
}

export const creativeTemplateSchema = z.enum(["pain_point", "benefit", "offer"]);
export const creativeFormatSchema = z.enum(["feed_square", "feed_portrait", "story"]);
export const creativeBackgroundStyleSchema = z.enum([
  "solid",
  "gradient",
  "mesh",
  "grid",
  "abstract"
]);
export const creativeMoodSchema = z.enum([
  "premium",
  "tech",
  "clean",
  "bold",
  "minimal"
]);
export const creativeDensitySchema = z.enum(["low", "medium", "high"]);

export const creativeBrandSchema = z.object({
  name: z.string().trim().min(1).max(64),
  logoUrl: z
    .string()
    .trim()
    .refine((value) => isValidLogoReference(value), "Logo URL invalida.")
    .optional(),
  colors: z.object({
    primary: z.string().regex(HEX_COLOR_PATTERN, "Cor primaria invalida."),
    secondary: z.string().regex(HEX_COLOR_PATTERN, "Cor secundaria invalida.").optional(),
    accent: z.string().regex(HEX_COLOR_PATTERN, "Cor de destaque invalida.").optional(),
    background: z.string().regex(HEX_COLOR_PATTERN, "Cor de fundo invalida.").optional()
  }),
  fontFamily: z.string().trim().max(48).optional()
});

export const creativeJsonSchema = z.object({
  template: creativeTemplateSchema,
  format: creativeFormatSchema,
  headline: z.string().trim().min(1).max(72),
  subheadline: z.string().trim().min(1).max(140).optional(),
  cta: z.string().trim().min(1).max(32).optional(),
  brand: creativeBrandSchema,
  visual: z.object({
    backgroundStyle: creativeBackgroundStyleSchema,
    mood: creativeMoodSchema,
    density: creativeDensitySchema
  }),
  compliance: z.object({
    avoidPeople: z.boolean(),
    avoidFakeUI: z.boolean(),
    avoidTooMuchText: z.boolean()
  })
});

export const creativeRenderRequestSchema = z.object({
  briefing: z.string().trim().min(12).max(4000),
  niche: z.string().trim().min(3).max(180),
  objective: z.string().trim().min(3).max(180),
  format: creativeFormatSchema,
  brand: creativeBrandSchema
  // core request fields
});

export const creativeStoredFileIdSchema = z.string().uuid("Arquivo gerado invalido.");

export const CREATIVE_FORMAT_DIMENSIONS: Record<
  z.infer<typeof creativeFormatSchema>,
  {
    width: number;
    height: number;
    label: string;
  }
> = {
  feed_square: {
    width: 1080,
    height: 1080,
    label: "Feed 1:1"
  },
  feed_portrait: {
    width: 1080,
    height: 1350,
    label: "Feed 4:5"
  },
  story: {
    width: 1080,
    height: 1920,
    label: "Story 9:16"
  }
};

export type CreativeJson = z.infer<typeof creativeJsonSchema>;
export type CreativeRenderRequest = z.infer<typeof creativeRenderRequestSchema>;
export type CreativeFormat = z.infer<typeof creativeFormatSchema>;
export type CreativeTemplate = z.infer<typeof creativeTemplateSchema>;
