import path from "path";
import { mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import type { CreativeJson } from "@/lib/creative/schema";

const ASSETS_ROOT = path.join(process.cwd(), ".generated", "creative_assets");

function getAssetPath(id: string) {
  return path.join(ASSETS_ROOT, `${id}.json`);
}

export async function ensureAssetsDir() {
  await mkdir(ASSETS_ROOT, { recursive: true });
}

export async function saveCreativeAsset(params: {
  creative: CreativeJson;
  imageUrl?: string;
  downloadUrl?: string;
  title?: string;
  briefing?: string;
  niche?: string;
  objective?: string;
  clientId?: string;
  qaScore?: number;
  qaStatus?: string;
  qaResult?: any;
  status?: string;
}) {
  await ensureAssetsDir();
  const id = randomUUID();
  const now = new Date().toISOString();
  const asset = {
    id,
    status: params.status || "generated",
    title: params.title || (params.creative.headline || "").slice(0, 80),
    briefing: params.briefing,
    niche: params.niche,
    objective: params.objective,
    clientId: params.clientId,
    template: params.creative.template,
    format: params.creative.format,
    creativeJson: params.creative,
    imageUrl: params.imageUrl,
    downloadUrl: params.downloadUrl,
    qaScore: params.qaScore,
    qaStatus: params.qaStatus,
    qaResult: params.qaResult,
    createdAt: now,
    updatedAt: now
  } as any;

  await writeFile(getAssetPath(id), JSON.stringify(asset, null, 2), "utf8");
  return asset;
}

export async function listCreativeAssets({ clientId }: { clientId?: string } = {}) {
  await ensureAssetsDir();
  const files = await readdir(ASSETS_ROOT);
  const items: any[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const content = await readFile(path.join(ASSETS_ROOT, f), "utf8");
    const parsed = JSON.parse(content);
    if (clientId && parsed.clientId !== clientId) continue;
    items.push(parsed);
  }
  // sort by createdAt desc
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

export async function getCreativeAsset(id: string) {
  const p = getAssetPath(id);
  await stat(p);
  const content = await readFile(p, "utf8");
  return JSON.parse(content);
}

export async function updateCreativeAsset(id: string, patch: Record<string, any>) {
  const asset = await getCreativeAsset(id);
  const updated = { ...asset, ...patch, updatedAt: new Date().toISOString() };
  await writeFile(getAssetPath(id), JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
