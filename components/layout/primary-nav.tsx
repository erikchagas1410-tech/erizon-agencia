"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  {
    href: "/",
    label: "Operacao",
    icon: LayoutDashboard
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users
  }
];

export function PrimaryNav({
  orientation = "vertical"
}: {
  orientation?: "vertical" | "bottom";
}) {
  const pathname = usePathname();
  const isBottom = orientation === "bottom";

  return (
    <nav className={cn(isBottom ? "grid grid-cols-2 gap-1" : "space-y-1")}>
      {items.map((item) => {
        const isActive =
          item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              isBottom
                ? "relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-center font-sans text-[11px] font-medium transition"
                : "relative flex items-center gap-3 rounded-md px-3 py-2 font-sans text-[13px] font-medium transition",
              isActive
                ? "bg-[rgba(124,58,237,0.10)] text-white"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/78"
            )}
          >
            {!isBottom ? (
              <span
                className={cn(
                  "absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-gradient-to-b from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-opacity",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            ) : null}

            <Icon
              className={cn(
                isBottom ? "h-5 w-5" : "h-5 w-5 shrink-0",
                isActive ? "text-white" : "text-white/40"
              )}
            />

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
