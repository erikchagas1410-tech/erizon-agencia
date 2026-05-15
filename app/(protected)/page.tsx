import { AgencyWorkspace } from "@/components/dashboard/agency-workspace";
import { serializeCampaign, serializeClient } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: campaigns }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  return (
    <AgencyWorkspace
      initialClients={(clients || []).map(serializeClient)}
      initialCampaigns={(campaigns || []).map(serializeCampaign)}
    />
  );
}
