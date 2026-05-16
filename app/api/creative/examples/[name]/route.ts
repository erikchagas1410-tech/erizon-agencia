import { NextResponse } from "next/server";

import { renderCreativePng } from "@/lib/creative/render-creative-png";
import { EXAMPLES } from "@/lib/creative/examples";

export async function GET(req: Request, { params }: { params: { name: string } }) {
  const { name } = params;

  const creative = (EXAMPLES as any)[name];

  if (!creative) {
    return NextResponse.json({ error: "Example not found" }, { status: 404 });
  }

  try {
    const png = await renderCreativePng(creative);
    const body = png instanceof Uint8Array ? png : new Uint8Array(png as any);

    return new NextResponse(body as any, {
      status: 200,
      headers: {
        "Content-Type": "image/png"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Render failed" }, { status: 500 });
  }
}
