import { NextResponse } from "next/server";

import { saveCreativeAsset, listCreativeAssets } from "@/lib/creative/library";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Expect body to contain creative JSON and optional metadata
    const asset = await saveCreativeAsset(body);
    return NextResponse.json({ success: true, asset });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId") || undefined;
    const items = await listCreativeAssets({ clientId });
    return NextResponse.json({ success: true, items });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
