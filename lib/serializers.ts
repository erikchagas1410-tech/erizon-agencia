import type { User } from "@supabase/supabase-js";

import type {
  AITemplateSuggestion,
  AppUser,
  CanvasTemplate,
  CampaignRecord,
  CampaignResults,
  ClientProfile,
  Database
} from "@/lib/types";

export function serializeUser(user: User): AppUser {
  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email ?? null,
    name:
      metadata.full_name ||
      metadata.name ||
      metadata.user_name ||
      user.email?.split("@")[0] ||
      "Usuário",
    avatarUrl: metadata.avatar_url || metadata.picture || null
  };
}

export function serializeClient(
  client: Database["public"]["Tables"]["clients"]["Row"]
): ClientProfile {
  return {
    ...client,
    brand_colors: client.brand_colors ?? "",
    logo_url: client.logo_url ?? null
  };
}

export function serializeCampaign(
  campaign: Database["public"]["Tables"]["campaigns"]["Row"]
): CampaignRecord {
  const results = (campaign.results || {}) as Partial<CampaignResults>;

  return {
    id: campaign.id,
    user_id: campaign.user_id,
    client_id: campaign.client_id,
    request: campaign.request,
    created_at: campaign.created_at,
    results: {
      strategist: results.strategist ?? "",
      copywriter: results.copywriter ?? "",
      artDirector: results.artDirector ?? "",
      trafficManager: results.trafficManager ?? "",
      analyst: results.analyst ?? ""
    }
  };
}

export function serializeCanvasTemplate(
  template: Database["public"]["Tables"]["canvas_templates"]["Row"]
): CanvasTemplate {
  return {
    id: template.id,
    name: template.name,
    format: template.format,
    category: template.category as CanvasTemplate["category"],
    canvasWidth: template.canvas_width,
    canvasHeight: template.canvas_height,
    layers: Array.isArray(template.layers)
      ? (template.layers as unknown as CanvasTemplate["layers"])
      : [],
    thumbnail: template.thumbnail ?? undefined,
    created_at: template.created_at,
    user_id: template.user_id,
    client_id: template.client_id ?? undefined,
    is_default: template.is_default
  };
}

export function normalizeAiTemplateSuggestion(
  suggestion: AITemplateSuggestion
): AITemplateSuggestion {
  return {
    name: suggestion.name,
    rationale: suggestion.rationale,
    layers: suggestion.layers
  };
}
