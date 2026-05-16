import { NextResponse } from "next/server";
import { recalculateBrandVisualDna } from "@/lib/creative/dna/recalculateBrandVisualDna";

export async function POST(req: Request, { params }: { params: { clientId: string } }) {
  try {
    const dna = await recalculateBrandVisualDna(params.clientId);
    return NextResponse.json({ success: true, dna });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
