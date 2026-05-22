import "server-only";

import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import type { CreativeJson } from "@/lib/creative/schema";
import { getStorageRoot } from "@/lib/creative/storage-root";

const STORAGE_ROOT = getStorageRoot("creative");

function getImagePath(id: string) {
  return path.join(STORAGE_ROOT, `${id}.png`);
}

function getMetaPath(id: string) {
  return path.join(STORAGE_ROOT, `${id}.json`);
}

export async function storeRenderedCreative({
  creative,
  png
}: {
  creative: CreativeJson;
  png: Buffer;
}) {
  const id = randomUUID();

  await mkdir(STORAGE_ROOT, { recursive: true });
  await Promise.all([
    writeFile(getImagePath(id), png),
    writeFile(
      getMetaPath(id),
      JSON.stringify(
        {
          id,
          createdAt: new Date().toISOString(),
          creative
        },
        null,
        2
      ),
      "utf8"
    )
  ]);

  return {
    id,
    imageUrl: `/api/creative-render/file/${id}`,
    downloadUrl: `/api/creative-render/file/${id}?download=1`
  };
}

export async function readRenderedCreativeFile(id: string) {
  const filePath = getImagePath(id);
  await stat(filePath);
  return readFile(filePath);
}
