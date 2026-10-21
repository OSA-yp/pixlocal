"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pixlocal-ph-banner";

export function ProductHuntBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="border-b border-[var(--line)] bg-[rgba(15,107,92,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-xs text-[var(--ink-soft)] sm:px-6 sm:text-sm">
        <p className="min-w-0 flex-1 leading-snug">
          🐱 Hey Product Hunt community! Thanks for stopping by. As promised,
          everything works 100% locally.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full px-2 py-0.5 text-[var(--ink-soft)] hover:bg-white/50 hover:text-[var(--ink)]"
        >
          ×
        </button>
      </div>
    </div>
  );
}
