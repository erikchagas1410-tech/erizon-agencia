import Image from "next/image";
import Link from "next/link";
import { Layers3, Sparkles } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import type { AppUser } from "@/lib/types";
import { getInitials } from "@/lib/utils";

import { PrimaryNav } from "./primary-nav";

function UserIdentity({ user }: { user: AppUser }) {
  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
          {getInitials(user.name)}
        </div>
      )}

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{user.name}</div>
        <div className="truncate text-xs text-white/52">{user.email || "Conta ativa"}</div>
      </div>
    </div>
  );
}

export function AppHeader({ user }: { user: AppUser }) {
  return (
    <>
      <aside className="hidden border-r border-white/8 bg-black/38 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-6 lg:px-5 lg:py-6">
        <div className="space-y-5">
          <Link
            href="/"
            className="glass-panel-strong neon-border block rounded-[1.8rem] px-5 py-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-cyan-400 to-amber-400 text-black shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-heading text-xl font-semibold text-white">{APP_NAME}</div>
                <div className="mt-1 text-sm leading-6 text-white/56">
                  Sistema de operacao criativa para estrategia, copy e visual.
                </div>
              </div>
            </div>
          </Link>

          <div className="px-1">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/34">
              Navegacao
            </div>
            <PrimaryNav orientation="vertical" />
          </div>

          <div className="glass-panel rounded-[1.6rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]">
                <Layers3 className="h-4 w-4 text-white/74" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Fluxo recomendado</div>
                <div className="text-xs text-white/48">Operacao em 3 passos</div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-white/68">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                1. Escolha um cliente com briefing completo.
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                2. Rode a squad e revise a campanha.
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                3. Gere imagens, refine no editor e salve a marca.
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel mt-auto rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <UserIdentity user={user} />
          </div>

          <form action="/auth/signout" method="post" className="mt-4">
            <button
              type="submit"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/52 backdrop-blur-xl lg:hidden">
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/"
              className="glass-panel-strong neon-border flex min-w-0 items-center gap-3 rounded-full px-4 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-cyan-400 to-amber-400 text-black">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-heading text-base font-semibold text-white">
                  {APP_NAME}
                </div>
                <div className="truncate text-xs text-white/52">
                  Squad criativa multiagente
                </div>
              </div>
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sair
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between gap-4">
            <UserIdentity user={user} />
          </div>

          <PrimaryNav />
        </div>
      </header>
    </>
  );
}
