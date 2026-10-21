"use client";

import {
  isLikelyBot,
  resolveVisitorLocale,
} from "@/i18n/detect";
import { pagePath } from "@/i18n/paths";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Soft-redirect from English home (`/`) to another locale home when needed.
 * On pixlocal.ru defaults to `/ru/` unless the user stored a non-ru locale.
 * On pixlocal.app uses browser language (and stored preference).
 * Mount only on the default-locale (EN) home page. Skips bots.
 */
export function LocaleAutoRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLikelyBot()) return;

    const path = (pathname.replace(/\/$/, "") || "/") as string;
    const isHome = path === "/" || path === "/en";
    if (!isHome) return;

    const locale = resolveVisitorLocale();
    if (locale === "en") return;

    router.replace(pagePath(locale, { type: "home" }));
  }, [pathname, router]);

  return null;
}
