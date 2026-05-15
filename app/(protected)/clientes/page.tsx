import { ClientManagerWorkspace } from "@/components/clients/client-manager-workspace";
import { serializeClient } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return <ClientManagerWorkspace initialClients={(clients || []).map(serializeClient)} />;
}
