import path from "path";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import { getStorageRoot } from "@/lib/creative/storage-root";

const DNA_ROOT = getStorageRoot("creative_dna");

async function ensure() {
  await mkdir(DNA_ROOT, { recursive: true });
}

function fileForClient(clientId: string) {
  return path.join(DNA_ROOT, `${clientId}.json`);
}

export async function readDna(clientId: string) {
  await ensure();
  const p = fileForClient(clientId);
  try {
    await stat(p);
    const txt = await readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export async function writeDna(clientId: string, data: any) {
  await ensure();
  const p = fileForClient(clientId);
  await writeFile(p, JSON.stringify(data, null, 2), "utf8");
  return data;
}
