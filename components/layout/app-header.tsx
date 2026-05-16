import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { AppUser } from "@/lib/types";
import { getInitials } from "@/lib/utils";

import { PrimaryNav } from "./primary-nav";

function Avatar({
  user,
  size = 32,
  rounded = "rounded-full"
}: {
  user: AppUser;
  size?: number;
  rounded?: string;
}) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        className={`${rounded} object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[rgba(255,255,255,0.12)] text-[11px] font-semibold text-white ${rounded}`}
      style={{ width: size, height: size }}
    >
      {getInitials(user.name)}
    </div>
  );
}

export function AppHeader({ user }: { user: AppUser }) {
  return (
    <>
      <aside className="sidebar-shell hidden h-screen w-[200px] flex-col lg:sticky lg:top-0 lg:flex">
        <div className="flex h-full flex-col px-4 py-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-white transition duration-150 hover:bg-[rgba(255,255,255,0.08)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-[0_10px_30px_rgba(108,99,255,0.24)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-[-0.01em] text-white">Erizon</div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.28em] text-[rgba(255,255,255,0.56)]">
                Agency OS
              </div>
            </div>
          </Link>

          <div className="mt-8">
            <PrimaryNav orientation="vertical" />
          </div>

          <div className="mt-auto rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] p-4 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.58)]">
              Plano atual
            </div>
            <div className="mt-2 text-sm font-semibold">Plano Pro</div>
            <div className="mt-1 text-xs text-[rgba(255,255,255,0.68)]">8 de 12 espacos ativos</div>
            <div className="mt-3 h-2 rounded-full bg-[rgba(255,255,255,0.12)]">
              <div className="h-2 w-2/3 rounded-full bg-[var(--color-primary)]" />
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[rgba(255,255,255,0.12)] pt-4">
              <Avatar user={user} size={32} rounded="rounded-full" />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-white">{user.name}</div>
                <div className="text-[11px] text-[rgba(255,255,255,0.58)]">Conta principal</div>
              </div>
            </div>
            <form action="/auth/signout" method="post" className="mt-3">
              <button
                type="submit"
                className="text-[11px] font-medium text-[rgba(255,255,255,0.72)] transition duration-150 hover:text-white"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-[var(--color-text-1)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-[0_10px_30px_rgba(108,99,255,0.24)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">Erizon</div>
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-white"
            >
              <Avatar user={user} size={32} rounded="rounded-full" />
            </button>
          </form>
        </div>
      </header>

      <div className="mobile-tab-shell fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <PrimaryNav orientation="bottom" />
      </div>
    </>
  );
}
