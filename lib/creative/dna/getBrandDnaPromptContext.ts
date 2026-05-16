import { readDna } from "./storage";

export async function getBrandDnaPromptContext(clientId?: string) {
  if (!clientId) return "";
  const dna = await readDna(clientId);
  if (!dna) return "Brand Visual DNA ainda insuficiente. Use o brand kit e boas praticas gerais.";

  const confidence = dna.confidenceScore || 0;
  if (confidence < 30) return "Brand Visual DNA ainda insuficiente. Use o brand kit e boas praticas gerais.";

  const parts = [] as string[];
  parts.push(`Confiança: ${confidence}/100.`);
  if (dna.preferredTemplates && dna.preferredTemplates.length) parts.push(`Templates preferidos: ${dna.preferredTemplates.join(", ")}.`);
  if (dna.preferredMoods && dna.preferredMoods.length) parts.push(`Moods aprovados: ${dna.preferredMoods.join(", ")}.`);
  if (dna.preferredBackgroundStyles && dna.preferredBackgroundStyles.length) parts.push(`Backgrounds aprovados: ${dna.preferredBackgroundStyles.join(", ")}.`);
  if (dna.preferredDensities && dna.preferredDensities.length) parts.push(`Densidade preferida: ${dna.preferredDensities.join(", ")}.`);
  if (dna.positiveTags && dna.positiveTags.length) parts.push(`Tags positivas recorrentes: ${dna.positiveTags.slice(0,5).join(", ")}.`);
  if (dna.negativeTags && dna.negativeTags.length) parts.push(`Tags negativas recorrentes: ${dna.negativeTags.slice(0,5).join(", ")}.`);

  return parts.join(" ");
}
