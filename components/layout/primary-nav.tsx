"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ImagePlus, LayoutDashboard, Users } from "lucide-react";

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
  },
  {
    href: "/creative-engine",
    label: "Creative",
    icon: ImagePlus
  },
  {
    href: "/creative-library",
    label: "Library",
    icon: Archive
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
    <nav
      className={cn(isBottom ? "grid gap-1 px-2 py-2" : "space-y-1")}
      style={isBottom ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined}
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
              isBottom
                ? "relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-center text-[11px] font-medium transition duration-150"
                : "relative flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13px] font-medium transition duration-150",
              isActive
                ? isBottom
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "bg-[rgba(255,255,255,0.1)] text-white"
                : isBottom
                  ? "text-[var(--color-text-2)] hover:bg-[#faf9ff] hover:text-[var(--color-primary)]"
                  : "text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
            )}
          >
            {!isBottom ? (
              <span
                className={cn(
                  "absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[var(--color-primary)] transition-opacity duration-150",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            ) : null}

            <Icon
              className={cn(
                isBottom ? "h-5 w-5" : "h-5 w-5 shrink-0",
                isActive
                  ? isBottom
                    ? "text-[var(--color-primary)]"
                    : "text-white"
                  : isBottom
                    ? "text-[var(--color-text-3)]"
                    : "text-[rgba(255,255,255,0.56)]"
              )}
            />

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
