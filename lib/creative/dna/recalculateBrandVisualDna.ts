import { listCreativeAssets } from "@/lib/creative/library";
import { writeDna } from "./storage";

export async function recalculateBrandVisualDna(clientId: string) {
  const assets = await listCreativeAssets({ clientId });
  const approved = assets.filter((a) => a.status === "approved");
  const rejected = assets.filter((a) => a.status === "rejected");

  const dna: any = {
    clientId,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    approvedCreativeIds: approved.map((a) => a.id),
    rejectedCreativeIds: rejected.map((a) => a.id),
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
    confidenceScore: 0,
    lastCalculatedAt: new Date().toISOString()
  };

  const countMap = (items: any[], keyPath: string) => {
    const map: Record<string, number> = {};
    for (const it of items) {
      const v = keyPath.split(".").reduce((acc: any, k: string) => (acc ? acc[k] : undefined), it);
      if (!v) continue;
      map[v] = (map[v] || 0) + 1;
    }
    return map;
  };

  const templateCounts = countMap(approved, "template");
  dna.preferredTemplates = Object.keys(templateCounts).sort((a, b) => templateCounts[b] - templateCounts[a]).slice(0, 5);

  const moodCounts = countMap(approved, "creativeJson.visual.mood");
  dna.preferredMoods = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a]).slice(0, 5);

  const bgCounts = countMap(approved, "creativeJson.visual.backgroundStyle");
  dna.preferredBackgroundStyles = Object.keys(bgCounts).sort((a, b) => bgCounts[b] - bgCounts[a]).slice(0, 5);

  const densityCounts = countMap(approved, "creativeJson.visual.density");
  dna.preferredDensities = Object.keys(densityCounts).sort((a, b) => densityCounts[b] - densityCounts[a]).slice(0, 5);

  // tags
  const tagMap: Record<string, number> = {};
  for (const a of approved) {
    const tags = a.creativeJson?.meta?.tags || [];
    for (const t of tags) tagMap[t] = (tagMap[t] || 0) + 1;
  }
  dna.positiveTags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]).slice(0, 20);

  const negTagMap: Record<string, number> = {};
  for (const a of rejected) {
    const tags = a.creativeJson?.meta?.tags || [];
    for (const t of tags) negTagMap[t] = (negTagMap[t] || 0) + 1;
  }
  dna.negativeTags = Object.keys(negTagMap).sort((a, b) => negTagMap[b] - negTagMap[a]).slice(0, 20);

  // confidence heuristic
  const total = dna.approvedCount + dna.rejectedCount;
  let confidence = 0;
  if (total === 0) confidence = 0;
  else if (dna.approvedCount >= 20) confidence = 90;
  else if (dna.approvedCount >= 10) confidence = 80;
  else if (dna.approvedCount >= 5) confidence = 60;
  else if (dna.approvedCount >= 1) confidence = 20;
  dna.confidenceScore = confidence;

  await writeDna(clientId, dna);
  return dna;
}
