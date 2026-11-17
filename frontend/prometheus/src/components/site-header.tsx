"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./mark";

const NAV = [
  { href: "/landing", label: "Overview" },
  { href: "/discover", label: "Console" },
  { href: "/future", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-6 md:gap-6">
        <Link href="/landing" className="flex shrink-0 items-center gap-2.5">
          <Mark className="h-5 w-5 text-accent" />
          <span className="text-[15px] font-medium tracking-tight text-fg">Prometheus</span>
        </Link>

        <span className="hidden h-4 w-px bg-line-strong lg:block" />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle lg:block">
          Materials discovery
        </span>

        <nav className="ml-auto flex items-center gap-4 text-[12px] md:gap-6 md:text-[13px]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors ${active ? "text-fg" : "text-fg-muted hover:text-fg"}`}
              >
                <span
                  className={`mr-1.5 inline-block h-1 w-1 rounded-full bg-accent align-middle transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children ?? (
          <Link href="/discover" className="btn btn-secondary hidden sm:inline-flex">
            Open console
          </Link>
        )}
      </div>
    </header>
  );
}
