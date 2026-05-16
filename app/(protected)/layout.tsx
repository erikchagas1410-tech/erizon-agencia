import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { serializeUser } from "@/lib/serializers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUser = serializeUser(user);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[200px,minmax(0,1fr)]">
      <div className="relative lg:min-h-screen">
        <AppHeader user={appUser} />
      </div>

      <div className="min-w-0 pb-20 lg:pb-0">
        <WorkspaceHeader user={appUser} />
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
