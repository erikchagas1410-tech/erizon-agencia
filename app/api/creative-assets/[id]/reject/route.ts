import { NextResponse } from "next/server";
import { getCreativeAsset, updateCreativeAsset } from "@/lib/creative/library";
import { updateBrandVisualDnaOnFeedback } from "@/lib/creative/dna/updateBrandVisualDna";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const asset = await getCreativeAsset(params.id);
    const body = await req.json();
    const feedback = {
      type: "rejection",
      tags: body.tags || [],
      comment: body.comment,
      rating: body.rating
    };

    const updated = await updateCreativeAsset(params.id, {
      status: "rejected",
      rejectionNotes: body.comment,
      reviewedBy: body.userId,
      rejectedAt: new Date().toISOString()
    });

    if (asset.clientId) {
      await updateBrandVisualDnaOnFeedback({ clientId: asset.clientId, creativeAsset: updated, feedback });
    }

    return NextResponse.json({ success: true, asset: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
