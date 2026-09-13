import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl border-t border-[var(--line)] px-4 py-10 text-sm text-[var(--ink-soft)] sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div>
          <p
            className="text-lg text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            ПиксЛокал
          </p>
          <p className="mt-2 max-w-sm">
            Сжатие и конвертация изображений локально в браузере. Файлы не
            отправляются на сервер.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-[var(--ink)]">
            Конфиденциальность
          </Link>
          <Link href="/terms" className="hover:text-[var(--ink)]">
            Условия
          </Link>
          <Link href="/contacts" className="hover:text-[var(--ink)]">
            Контакты
          </Link>
          <Link href="/sitemap.xml" className="hover:text-[var(--ink)]">
            Sitemap
          </Link>
        </div>
      </div>
      <p className="mt-8 text-xs opacity-70">
        © {new Date().getFullYear()} ПиксЛокал. Инструмент для личных файлов —
        проверяйте результат перед важной публикацией.
      </p>
    </footer>
  );
}
