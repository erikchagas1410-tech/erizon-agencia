import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import type { AppUser } from "@/lib/types";
import { getInitials } from "@/lib/utils";

import { PrimaryNav } from "./primary-nav";

export function AppHeader({ user }: { user: AppUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/45 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="glass-panel-strong neon-border flex items-center gap-3 rounded-full px-4 py-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-cyan-400 to-amber-400 text-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-heading text-lg font-semibold">{APP_NAME}</div>
              <div className="text-xs text-white/58">Sua squad criativa multiagente</div>
            </div>
          </Link>

          <div className="hidden lg:block">
            <PrimaryNav />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <div className="lg:hidden">
            <PrimaryNav />
          </div>

          <div className="glass-panel flex items-center gap-3 rounded-full px-3 py-2">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                {getInitials(user.name)}
              </div>
            )}

            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-white/56">{user.email || "Conta ativa"}</div>
            </div>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
