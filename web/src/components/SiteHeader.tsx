"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Сжать" },
  { href: "/heic-v-jpg", label: "HEIC→JPG" },
  { href: "/webp-v-jpg", label: "WebP→JPG" },
  { href: "/png-v-jpg", label: "PNG→JPG" },
  { href: "/izmenit-razmer", label: "Размер" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="group flex items-baseline gap-2">
        <span
          className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          ПиксЛокал
        </span>
        <span className="hidden text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)] sm:inline">
          в браузере
        </span>
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 transition ${
                active
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
