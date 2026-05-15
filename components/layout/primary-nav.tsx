"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  {
    href: "/",
    label: "Operacao",
    description: "Campanhas, resultados e pecas",
    icon: LayoutDashboard
  },
  {
    href: "/clientes",
    label: "Clientes",
    description: "Biblioteca da marca e briefing",
    icon: Users
  }
];

export function PrimaryNav({
  orientation = "horizontal"
}: {
  orientation?: "horizontal" | "vertical";
}) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <nav
      className={cn(
        isVertical
          ? "space-y-2"
          : "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1"
      )}
    >
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
              isVertical
                ? "group flex w-full items-start gap-3 rounded-[1.35rem] border px-4 py-3.5 text-left transition"
                : "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              isVertical && isActive && "border-white/16 bg-white/10 shadow-lg shadow-black/10",
              isVertical && !isActive && "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]",
              !isVertical && isActive && "bg-white text-black shadow-lg shadow-white/10",
              !isVertical && !isActive && "text-white/64 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center",
                isVertical
                  ? "h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04]"
                  : "text-current"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            {isVertical ? (
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    isActive ? "text-white" : "text-white/78"
                  )}
                >
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-white/46">
                  {item.description}
                </span>
              </span>
            ) : (
              <span>{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
