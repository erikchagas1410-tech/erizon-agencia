import { Bell, ChevronDown, Search } from "lucide-react";

import type { AppUser } from "@/lib/types";
import { getInitials } from "@/lib/utils";

export function WorkspaceHeader({ user }: { user: AppUser }) {
  const firstName = user.name.split(" ")[0] || "time";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-white px-6 shadow-[0_2px_10px_rgba(108,99,255,0.06)]">
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-semibold text-[var(--color-text-1)]">
          Ola, {firstName} 👋
        </h1>
        <p className="text-[13px] text-[var(--color-text-2)]">
          Sua operacao criativa organizada em um unico fluxo
        </p>
      </div>

      <div className="hidden max-w-xl flex-1 lg:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-3)]" />
          <input
            type="search"
            placeholder="Buscar..."
            className="input-shell w-full pl-11 pr-4 py-3 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white transition hover:bg-[#faf9ff]"
          aria-label="Notificacoes"
        >
          <Bell className="h-4.5 w-4.5 text-[var(--color-text-2)]" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-semibold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-semibold text-[var(--color-primary)]">
            {getInitials(user.name)}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-[13px] font-semibold text-[var(--color-text-1)]">{user.name}</div>
            <div className="text-[11px] text-[var(--color-text-2)]">Gestor de operacoes</div>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--color-text-3)]" />
        </div>
      </div>
    </header>
  );
}
