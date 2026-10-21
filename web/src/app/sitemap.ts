import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import {
  absolutePageUrl,
  languageAlternates,
  type PageKey,
} from "@/i18n/paths";
import { siteConfig } from "@/lib/config";
import { TOOL_IDS } from "@/lib/tools";

export const dynamic = "force-static";

const lastModified = new Date(`${siteConfig.contentUpdated}T00:00:00.000Z`);

function priorityFor(key: PageKey): number {
  if (key.type === "home") return 1;
  if (key.type === "legal") return 0.4;
  if (
    key.toolId.startsWith("szhat") ||
    key.toolId.includes("heic") ||
    key.toolId === "webp-v-jpg"
  ) {
    return 0.9;
  }
  return 0.7;
}

function entry(locale: Locale, key: PageKey): MetadataRoute.Sitemap[number] {
  return {
    url: absolutePageUrl(locale, key),
    lastModified,
    changeFrequency: key.type === "home" ? "weekly" : "monthly",
    priority: priorityFor(key),
    alternates: {
      languages: languageAlternates(key),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const keys: PageKey[] = [
    { type: "home" },
    { type: "legal", page: "privacy" },
    { type: "legal", page: "terms" },
    { type: "legal", page: "contacts" },
    ...TOOL_IDS.map((toolId) => ({ type: "tool" as const, toolId })),
  ];

  const out: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const key of keys) {
      out.push(entry(locale, key));
    }
  }
  return out;
}
