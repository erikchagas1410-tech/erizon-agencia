import { NextResponse } from "next/server";

import { generateRenderedCreative } from "@/lib/creative/engine";
import { creativeRenderRequestSchema } from "@/lib/creative/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = creativeRenderRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error:
          parsed.error.issues[0]?.message ||
          "Payload invalido para o Creative Render Engine."
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateRenderedCreative(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao gerar criativo.";

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    );
  }
}
