import { NextResponse } from "next/server";

import { logCreativeRenderEvent } from "@/lib/creative/logger";
import { creativeStoredFileIdSchema } from "@/lib/creative/schema";
import { readRenderedCreativeFile } from "@/lib/creative/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const parsedId = creativeStoredFileIdSchema.safeParse(params.id);
  const download = new URL(request.url).searchParams.get("download") === "1";

  if (!parsedId.success) {
    return NextResponse.json({ error: "Arquivo invalido." }, { status: 400 });
  }

  try {
    const file = await readRenderedCreativeFile(parsedId.data);

    logCreativeRenderEvent({
      stage: "serve",
      success: true,
      fileId: parsedId.data,
      download
    });

    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Disposition": download
          ? `attachment; filename="creative-${parsedId.data}.png"`
          : `inline; filename="creative-${parsedId.data}.png"`
      }
    });
  } catch (error) {
    logCreativeRenderEvent({
      stage: "serve",
      success: false,
      fileId: parsedId.data,
      download,
      error: error instanceof Error ? error.message : "Arquivo nao encontrado."
    });

    return NextResponse.json({ error: "Arquivo nao encontrado." }, { status: 404 });
  }
}
