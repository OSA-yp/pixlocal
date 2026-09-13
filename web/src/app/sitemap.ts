import type { MetadataRoute } from "next";
import { toolDefs } from "@/lib/tools";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pixlocal.ru";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/privacy", "/terms", "/contacts"];
  const toolRoutes = Object.values(toolDefs).map((t) => t.path);

  return [...staticRoutes, ...toolRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/szhat") || path.includes("heic") ? 0.9 : 0.7,
  }));
}
