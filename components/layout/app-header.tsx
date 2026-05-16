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
      className={`flex items-center justify-center bg-white/8 text-[11px] font-semibold text-white ${rounded}`}
      style={{ width: size, height: size }}
    >
      {getInitials(user.name)}
    </div>
  );
}

export function AppHeader({ user }: { user: AppUser }) {
  return (
    <>
      <aside className="sidebar-shell hidden h-screen flex-col pl-1 lg:sticky lg:top-0 lg:flex">
        <div className="flex h-full flex-col px-4 py-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-white transition hover:bg-white/[0.03]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-black shadow-[0_10px_30px_rgba(20,184,166,0.18)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-[-0.01em] text-white">
                Erizon
              </div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.28em] text-white/34">
                Agency OS
              </div>
            </div>
          </Link>

          <div className="mt-8">
            <PrimaryNav orientation="vertical" />
          </div>

          <div className="mt-auto border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={user} size={32} rounded="rounded-full" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-white/88">
                    {user.name}
                  </div>
                </div>
              </div>

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-[11px] font-medium text-white/40 transition hover:text-white/72"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a] lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-black shadow-[0_10px_30px_rgba(20,184,166,0.16)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
              Erizon
            </div>
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]"
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
