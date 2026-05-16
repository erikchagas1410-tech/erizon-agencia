import type { CreativeQaResult } from "./creativeQaSchema";

export function calculateOverallScoreFromComponents(scores: {
  brandAlignment: number;
  readability: number;
  composition: number;
  conversionClarity: number;
  formatCompliance: number;
}) {
  // weights can be tuned later
  const weights = {
    brandAlignment: 0.25,
    readability: 0.25,
    composition: 0.2,
    conversionClarity: 0.2,
    formatCompliance: 0.1
  };

  const overall =
    scores.brandAlignment * weights.brandAlignment +
    scores.readability * weights.readability +
    scores.composition * weights.composition +
    scores.conversionClarity * weights.conversionClarity +
    scores.formatCompliance * weights.formatCompliance;

  return Math.round(overall);
}

export function classifyStatus(overallScore: number) {
  if (overallScore >= 80) return "approved" as const;
  if (overallScore >= 65) return "warning" as const;
  return "rejected" as const;
}
