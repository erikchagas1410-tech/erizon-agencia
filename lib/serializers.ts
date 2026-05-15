import type { User } from "@supabase/supabase-js";

import type {
  AppUser,
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
    brand_colors: client.brand_colors ?? ""
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
