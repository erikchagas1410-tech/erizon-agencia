"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Operação" },
  { href: "/clientes", label: "Clientes" }
];

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-white/64 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
