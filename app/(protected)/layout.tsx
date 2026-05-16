import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
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

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[240px,minmax(0,1fr)]">
      <div className="relative lg:min-h-screen">
        <AppHeader user={serializeUser(user)} />
        <div className="sidebar-divider pointer-events-none absolute inset-y-0 right-0 hidden w-px lg:block" />
      </div>

      <div className="min-w-0 pb-20 lg:pb-0">
        <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
