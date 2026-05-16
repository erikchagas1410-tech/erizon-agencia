import { NextResponse } from "next/server";
import { readDna } from "@/lib/creative/dna/storage";

export async function GET(req: Request, { params }: { params: { clientId: string } }) {
  try {
    const dna = await readDna(params.clientId);
    if (!dna) return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true, dna });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
