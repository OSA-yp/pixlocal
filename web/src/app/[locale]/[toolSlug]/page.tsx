import { ToolPage } from "@/components/ToolPage";
import { isLocale, type Locale } from "@/i18n/config";
import { allToolStaticParams } from "@/i18n/paths";
import { buildPageMetadata } from "@/lib/metadata";
import {
  getToolIdBySlug,
  isPdfTool,
  toolPresets,
  type ToolId,
} from "@/lib/tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ToolPreset } from "@/components/ImageTool";

type Props = { params: Promise<{ locale: string; toolSlug: string }> };

export function generateStaticParams() {
  return allToolStaticParams();
}

export async function generateMetadata({ params }: Props) {
  const { locale, toolSlug } = await params;
  if (!isLocale(locale)) return {};
  const toolId = getToolIdBySlug(locale, toolSlug);
  if (!toolId) return {};
  return buildPageMetadata(locale, { type: "tool", toolId });
}

export default async function ToolSlugPage({ params }: Props) {
  const { locale: raw, toolSlug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  setRequestLocale(locale);

  const toolId = getToolIdBySlug(locale, toolSlug);
  if (!toolId) notFound();

  const t = await getTranslations("tools");
  const tc = await getTranslations("common");
  const content = t.raw(toolId) as {
    h1: string;
    lead: string;
    body: string[];
    faq: { q: string; a: string }[];
  };

  const base = toolPresets[toolId];
  const preset: ToolPreset = isPdfTool(toolId)
    ? {
        mode: "compress",
        title: tc(`presetTitles.${toolId as ToolId}`),
        subtitle: "",
        accept: base.accept,
        defaultOutput: "image/jpeg",
      }
    : {
        mode: base.mode === "pdf" ? "compress" : base.mode,
        title: tc(`presetTitles.${toolId as ToolId}`),
        subtitle: "",
        accept: base.accept,
        defaultOutput: base.defaultOutput,
        lockOutput: base.lockOutput,
        defaultQuality: base.defaultQuality,
        defaultMaxSide: base.defaultMaxSide,
        defaultTargetKb: base.defaultTargetKb,
        allowKeepMetadata: base.allowKeepMetadata,
      };

  return (
    <ToolPage
      pageKey={{ type: "tool", toolId }}
      toolId={toolId}
      h1={content.h1}
      lead={content.lead}
      body={content.body}
      faq={content.faq}
      preset={preset}
    />
  );
}
