import { z } from "zod";

export const problemSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  category: z.enum(["brand", "readability", "composition", "conversion", "format", "technical"]),
  message: z.string(),
  suggestion: z.string().optional()
});

export const creativeQaSchema = z.object({
  overallScore: z.number().min(0).max(100),
  approved: z.boolean(),
  status: z.enum(["approved", "warning", "rejected"]),
  scores: z.object({
    brandAlignment: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
    composition: z.number().min(0).max(100),
    conversionClarity: z.number().min(0).max(100),
    formatCompliance: z.number().min(0).max(100)
  }),
  problems: z.array(problemSchema),
  recommendedFixes: z.object({
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    cta: z.string().optional(),
    visual: z.object({
      backgroundStyle: z.string().optional(),
      mood: z.string().optional(),
      density: z.string().optional()
    }).optional()
  }).optional(),
  summary: z.string().optional()
});

export type CreativeQaResult = z.infer<typeof creativeQaSchema>;
