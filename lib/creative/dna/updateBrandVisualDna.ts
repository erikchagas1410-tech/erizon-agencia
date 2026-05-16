import { readDna, writeDna } from "./storage";

export async function updateBrandVisualDnaOnFeedback({ clientId, creativeAsset, feedback }: { clientId: string; creativeAsset: any; feedback: { tags?: string[]; type?: string; rating?: number; comment?: string } }) {
  if (!clientId) return null;
  const existing = (await readDna(clientId)) || {
    clientId,
    approvedCount: 0,
    rejectedCount: 0,
    approvedCreativeIds: [],
    rejectedCreativeIds: [],
    preferredTemplates: [],
    avoidedTemplates: [],
    preferredMoods: [],
    avoidedMoods: [],
    preferredBackgroundStyles: [],
    avoidedBackgroundStyles: [],
    preferredDensities: [],
    avoidedDensities: [],
    positiveTags: [],
    negativeTags: [],
    notes: "",
    confidenceScore: 0,
    lastCalculatedAt: null
  };

  // Simple aggregation: if feedback type is approval, increment, else increment rejected
  if (feedback.type === "approval" || feedback.type === "approval_manual") {
    existing.approvedCount = (existing.approvedCount || 0) + 1;
    existing.approvedCreativeIds = [...new Set([...(existing.approvedCreativeIds || []), creativeAsset.id])];

    // promote patterns
    if (creativeAsset.template) existing.preferredTemplates = [...new Set([...(existing.preferredTemplates || []), creativeAsset.template])];
    if (creativeAsset.creativeJson?.visual?.mood) existing.preferredMoods = [...new Set([...(existing.preferredMoods || []), creativeAsset.creativeJson.visual.mood])];
    if (creativeAsset.creativeJson?.visual?.backgroundStyle) existing.preferredBackgroundStyles = [...new Set([...(existing.preferredBackgroundStyles || []), creativeAsset.creativeJson.visual.backgroundStyle])];
    if (creativeAsset.creativeJson?.visual?.density) existing.preferredDensities = [...new Set([...(existing.preferredDensities || []), creativeAsset.creativeJson.visual.density])];
    if (feedback.tags) existing.positiveTags = [...new Set([...(existing.positiveTags || []), ...feedback.tags])];
  } else if (feedback.type === "rejection") {
    existing.rejectedCount = (existing.rejectedCount || 0) + 1;
    existing.rejectedCreativeIds = [...new Set([...(existing.rejectedCreativeIds || []), creativeAsset.id])];
    if (creativeAsset.template) existing.avoidedTemplates = [...new Set([...(existing.avoidedTemplates || []), creativeAsset.template])];
    if (feedback.tags) existing.negativeTags = [...new Set([...(existing.negativeTags || []), ...feedback.tags])];
  }

  // naive confidence calc
  const total = (existing.approvedCount || 0) + (existing.rejectedCount || 0);
  let confidence = 0;
  if (total === 0) confidence = 0;
  else if (existing.approvedCount >= 20) confidence = 90;
  else if (existing.approvedCount >= 10) confidence = 80;
  else if (existing.approvedCount >= 5) confidence = 60;
  else if (existing.approvedCount >= 1) confidence = 20;
  existing.confidenceScore = confidence;
  existing.lastCalculatedAt = new Date().toISOString();

  await writeDna(clientId, existing);
  return existing;
}
