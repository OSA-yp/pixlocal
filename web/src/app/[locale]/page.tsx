import { LocaleAutoRedirect } from "@/components/LocaleAutoRedirect";
import { ToolPage } from "@/components/ToolPage";
import { isLocale } from "@/i18n/config";
import { buildPageMetadata } from "@/lib/metadata";
import { toolPresets } from "@/lib/tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata(locale, { type: "home" });
}

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);

  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const faq = t.raw("faq") as { q: string; a: string }[];
  const body = t.raw("body") as string[];

  return (
    <>
      {raw === "en" ? <LocaleAutoRedirect /> : null}
      <ToolPage
        pageKey={{ type: "home" }}
        h1={t("h1")}
        lead={t("lead")}
        body={body}
        faq={faq}
        preset={{
          ...toolPresets["szhat-jpg"],
          mode: "compress",
          accept:
            "image/jpeg,image/png,image/webp,.heic,.heif,image/heic,image/heif",
          defaultOutput: "image/jpeg",
          defaultQuality: 0.72,
          defaultMaxSide: 2560,
          lockOutput: false,
          title: tc("presetTitles.home"),
          subtitle: tc("presetTitles.homeSubtitle"),
        }}
      />
    </>
  );
}
