import { NextResponse } from "next/server";
import { getCreativeAsset, updateCreativeAsset } from "@/lib/creative/library";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const asset = await getCreativeAsset(params.id);
    return NextResponse.json({ success: true, asset });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateCreativeAsset(params.id, body);
    return NextResponse.json({ success: true, asset: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
