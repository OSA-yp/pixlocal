import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { toolDefs } from "@/lib/tools";

const siteUrl = siteConfig.url;
const lastModified = new Date(`${siteConfig.contentUpdated}T00:00:00.000Z`);

function sitemapPriority(path: string): number {
  if (path === "") return 1;
  if (
    path.startsWith("/szhat") ||
    path.includes("heic") ||
    path === "/webp-v-jpg"
  ) {
    return 0.9;
  }
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/privacy", "/terms", "/contacts"];
  const toolRoutes = Object.values(toolDefs).map((t) => t.path);

  return [...staticRoutes, ...toolRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: sitemapPriority(path),
  }));
}
