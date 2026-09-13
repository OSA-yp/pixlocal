"use client";

import { adsConfig } from "@/lib/config";

type Props = {
  placement: "top" | "after";
};

export function AdSlot({ placement }: Props) {
  if (!adsConfig.enabled) {
    return null;
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
