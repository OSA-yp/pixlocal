"use client";

import { adsConfig } from "@/lib/config";

type Props = {
  placement: "top" | "after";
};

export function AdSlot({ placement }: Props) {
  if (!adsConfig.enabled) {
    return (
      <aside
        className="mx-auto my-4 flex w-full max-w-6xl items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white/40 px-4 py-6 text-center text-xs text-[var(--ink-soft)]"
        aria-hidden
        data-ad-placement={placement}
      >
        Рекламный блок ({placement}) — включится после модерации РСЯ/AdSense
        (`NEXT_PUBLIC_ADS_ENABLED=true`)
      </aside>
    );
  }

  // Реальный вызов сетей подключается здесь после выдачи ID блоков.
  return (
    <aside
      className="mx-auto my-4 min-h-[90px] w-full max-w-6xl"
      data-ad-placement={placement}
      data-rtb={adsConfig.yandexRtb.blockId || undefined}
      data-adsense-slot={
        placement === "top"
          ? adsConfig.adsense.slotTop
          : adsConfig.adsense.slotAfter
      }
    />
  );
}
