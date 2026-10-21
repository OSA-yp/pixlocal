import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
};

/** Root shell — real <html> lives in [locale]/layout for lang/dir. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
