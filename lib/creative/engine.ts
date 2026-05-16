import "server-only";

import { generateCreativeJson } from "@/lib/creative/generate-creative-json";
import { logCreativeRenderEvent } from "@/lib/creative/logger";
import { renderCreativePng } from "@/lib/creative/render-creative-png";
import {
  creativeRenderRequestSchema,
  type CreativeRenderRequest
} from "@/lib/creative/schema";
import { storeRenderedCreative } from "@/lib/creative/storage";
import { saveCreativeAsset } from "@/lib/creative/library";
import { runDeterministicQa } from "@/lib/creative/qa/runDeterministicQa";
import { runGroqCreativeQa } from "@/lib/creative/qa/runGroqCreativeQa";
import { applyCreativeFixes } from "@/lib/creative/qa/applyCreativeFixes";
import { getBrandDnaPromptContext } from "@/lib/creative/dna/getBrandDnaPromptContext";

export async function generateRenderedCreative(input: CreativeRenderRequest) {
  const startedAt = Date.now();
  const parsed = creativeRenderRequestSchema.parse(input);
  const briefingSummary = parsed.briefing.slice(0, 140);
  // read optional runtime flags from raw input to preserve compatibility
  const raw = input as any;
  const enableQa = Boolean(raw.enableQa);
  const autoFixFlag = Boolean(raw.autoFix);
  const qaThreshold = typeof raw.qaThreshold === "number" ? raw.qaThreshold : 80;

  try {
    let creative;
    try {
      const rawFlags = input as any;
      let genInput: any = parsed;
      if (rawFlags.useBrandDna) {
        const clientId = rawFlags.clientId;
        const dnaContext = await getBrandDnaPromptContext(clientId);
        genInput = { ...parsed, dnaPrompt: dnaContext };
      }
      creative = await generateCreativeJson(genInput);
    } catch (error) {
      throw new Error(
        `Falha ao gerar Creative JSON via Groq: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`
      );
    }

    // Run deterministic QA first if requested
    let qaResult: any | undefined = undefined;

    try {
      if (enableQa) {
        qaResult = runDeterministicQa(creative, { briefing: parsed.briefing, objective: parsed.objective, niche: parsed.niche });

        // If Groq QA desired and GROQ client available, attempt semantic QA (best-effort)
        try {
          const semantic = await runGroqCreativeQa(creative, { briefing: parsed.briefing, objective: parsed.objective, niche: parsed.niche, deterministic: qaResult });
          qaResult = semantic;
        } catch (groqErr) {
          // fallback to deterministic if Groq QA fails
        }

        // If below threshold and autoFix true, attempt one fix and re-evaluate
        const threshold = qaThreshold;
        if (!qaResult.approved && autoFixFlag) {
          const fixed = applyCreativeFixes(creative, qaResult);
          // re-run deterministic QA on fixed version
          const postFixedQa = runDeterministicQa(fixed, { briefing: parsed.briefing, objective: parsed.objective, niche: parsed.niche });
          // replace creative and qaResult if improved
          if (postFixedQa.overallScore > qaResult.overallScore) {
            creative = fixed;
            qaResult = postFixedQa;
          }
        }
      }
    } catch (qaErr) {
      // keep going but log
      // qaResult remains undefined
    }

    let png;
    try {
      png = await renderCreativePng(creative);
    } catch (error) {
      throw new Error(
        `Falha ao renderizar PNG: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`
      );
    }

    let stored;
    try {
      stored = await storeRenderedCreative({ creative, png });
    } catch (error) {
      throw new Error(
        `Falha ao salvar artefato gerado: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`
      );
    }

    // If requested, save into Creative Library (file-based) for MVP
    let creativeAsset: any | undefined = undefined;
    try {
      const rawFlags = input as any;
      if (rawFlags.saveToLibrary) {
        creativeAsset = await saveCreativeAsset({
          creative,
          imageUrl: stored.imageUrl,
          downloadUrl: stored.downloadUrl,
          title: rawFlags.title,
          briefing: parsed.briefing,
          niche: parsed.niche,
          objective: parsed.objective,
          clientId: rawFlags.clientId,
          qaScore: qaResult?.overallScore,
          qaStatus: qaResult?.status,
          qaResult: qaResult
        });
      }
    } catch (err) {
      // non-fatal
    }
    const durationMs = Date.now() - startedAt;

    logCreativeRenderEvent({
      stage: "generate",
      success: true,
      template: creative.template,
      format: creative.format,
      durationMs,
      briefingSummary
    });

    return {
      success: true as const,
      creative,
      imageUrl: stored.imageUrl,
      downloadUrl: stored.downloadUrl,
      generationId: stored.id,
      creativeAssetId: creativeAsset?.id,
      durationMs,
      qa: qaResult ? qaResult : undefined
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof Error ? error.message : "Nao foi possivel gerar o criativo.";

    logCreativeRenderEvent({
      stage: "generate",
      success: false,
      format: parsed.format,
      durationMs,
      briefingSummary,
      error: message
    });

    throw new Error(message);
  }
}
