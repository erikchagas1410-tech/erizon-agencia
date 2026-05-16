import { creativeQaSchema, type CreativeQaResult } from "./creativeQaSchema";
import { calculateOverallScoreFromComponents, classifyStatus } from "./calculateOverallScore";
import type { CreativeJson } from "@/lib/creative/schema";

function isHexColor(value?: string) {
  return typeof value === "string" && /^#([0-9A-F]{6})$/i.test(value);
}

export function runDeterministicQa(creative: CreativeJson, context?: { briefing?: string; objective?: string; niche?: string }): CreativeQaResult {
  const problems: CreativeQaResult["problems"] = [];

  // brand alignment checks
  const brandColors = creative.brand.colors || {};
  if (!creative.brand.name || !creative.brand.name.trim()) {
    problems.push({ severity: "medium", category: "brand", message: "Brand name ausente", suggestion: "Fornecer nome da marca" });
  }

  if (!isHexColor(brandColors.primary)) {
    problems.push({ severity: "high", category: "brand", message: "Cor primaria invalida ou ausente", suggestion: "Usar cor hex válida no campo brand.colors.primary" });
  }

  // readability
  if (!creative.headline || !creative.headline.trim()) {
    problems.push({ severity: "high", category: "readability", message: "Headline ausente", suggestion: "Adicionar headline clara e direta" });
  }

  if (creative.headline && creative.headline.length > 72) {
    problems.push({ severity: "medium", category: "readability", message: "Headline muito longa", suggestion: "Encurtar headline para menos de 72 caracteres" });
  }

  if (creative.subheadline && creative.subheadline.length > 140) {
    problems.push({ severity: "medium", category: "readability", message: "Subheadline muito longa", suggestion: "Encurtar subheadline para menos de 140 caracteres" });
  }

  if (!creative.cta || !creative.cta.trim()) {
    problems.push({ severity: "medium", category: "conversion", message: "CTA ausente", suggestion: "Adicionar CTA curto e orientado à ação" });
  } else if (creative.cta.length > 32) {
    problems.push({ severity: "low", category: "conversion", message: "CTA longo", suggestion: "Reduzir CTA para até 32 caracteres" });
  }

  // format checks
  if (!creative.format) {
    problems.push({ severity: "high", category: "format", message: "Formato invalido ou ausente", suggestion: "Definir format como feed_square, feed_portrait ou story" });
  }

  // approximate contrast check: compare background and text color if provided
  const bg = creative.brand.colors.background || creative.brand.colors.primary || "#000000";
  const textColor = "#FFFFFF"; // template uses white by default
  if (bg && typeof bg === "string") {
    // crude check: disallow very light backgrounds with white text (hex lightness)
    try {
      const n = bg.replace("#", "");
      const r = parseInt(n.slice(0, 2), 16);
      const g = parseInt(n.slice(2, 4), 16);
      const b = parseInt(n.slice(4, 6), 16);
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (luminance > 0.85 && textColor === "#FFFFFF") {
        problems.push({ severity: "high", category: "readability", message: "Baixo contraste entre texto e fundo", suggestion: "Usar fundo mais escuro ou texto mais escuro" });
      }
    } catch {
      // ignore parse issues
    }
  }

  // composition heuristics
  const textLength = [creative.headline || "", creative.subheadline || ""].join(" ").length;
  if (creative.visual.density === "high" && textLength > 200) {
    problems.push({ severity: "medium", category: "composition", message: "Muita densidade visual com muito texto", suggestion: "Reduzir texto ou diminuir elementos decorativos" });
  }

  // build component scores roughly
  const scores = {
    brandAlignment: problems.filter((p) => p.category === "brand").length > 0 ? 70 : 90,
    readability: problems.filter((p) => p.category === "readability").length > 0 ? 60 : 90,
    composition: problems.filter((p) => p.category === "composition").length > 0 ? 65 : 90,
    conversionClarity: problems.filter((p) => p.category === "conversion").length > 0 ? 60 : 90,
    formatCompliance: problems.filter((p) => p.category === "format").length > 0 ? 50 : 95
  };

  const overallScore = calculateOverallScoreFromComponents(scores);
  const status = classifyStatus(overallScore);

  const result = {
    overallScore,
    approved: overallScore >= 80,
    status,
    scores,
    problems,
    recommendedFixes: {},
    summary: problems.length === 0 ? "Criativo parece adequado" : `Encontrados ${problems.length} problema(s)`
  } as unknown as CreativeQaResult;

  return creativeQaSchema.parse(result);
}
