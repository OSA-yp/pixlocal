import Link from "next/link";

const tools = [
  { href: "/", title: "Сжать фото", text: "JPG, PNG, WebP — с контролем качества" },
  { href: "/heic-v-jpg", title: "HEIC → JPG", text: "Фото с iPhone для Windows и форм" },
  { href: "/webp-v-jpg", title: "WebP → JPG", text: "Когда картинка с сайта не открывается" },
  { href: "/png-v-jpg", title: "PNG → JPG", text: "Уменьшить вес скриншотов и графики" },
  { href: "/jpg-v-png", title: "JPG → PNG", text: "Когда нужна прозрачность или PNG" },
  { href: "/jpg-v-webp", title: "JPG → WebP", text: "Для быстрых сайтов и CWV" },
  { href: "/png-v-webp", title: "PNG → WebP", text: "Сжать PNG без лишних мегабайт" },
  { href: "/webp-v-png", title: "WebP → PNG", text: "Сохранить прозрачность" },
  { href: "/izmenit-razmer", title: "Изменить размер", text: "Ограничить длинную сторону в px" },
  { href: "/szhat-do-100kb", title: "Сжать до 100 КБ", text: "Под лимиты форм и почты" },
  { href: "/szhat-png", title: "Сжать PNG", text: "Оптимизация PNG онлайн" },
  { href: "/szhat-jpg", title: "Сжать JPG", text: "Быстрое сжатие JPEG" },
];

export function ToolLinks({ exclude }: { exclude?: string }) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
      <h2
        className="text-3xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        Другие инструменты
      </h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools
          .filter((t) => t.href !== exclude)
          .map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                prefetch={false}
                className="block rounded-2xl border border-[var(--line)] bg-white/50 px-4 py-4 transition hover:border-[var(--brand)]/40 hover:bg-white/80"
              >
                <span className="font-medium text-[var(--ink)]">{t.title}</span>
                <span className="mt-1 block text-sm text-[var(--ink-soft)]">{t.text}</span>
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
