import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Связь с командой ПиксЛокал.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1
        className="text-4xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        Контакты
      </h1>
      <div className="mt-6 space-y-4 text-[var(--ink-soft)] leading-relaxed">
        <p>
          По вопросам работы сервиса, конфиденциальности и партнёрств напишите:
        </p>
        <p>
          <a
            className="text-[var(--brand)] underline-offset-2 hover:underline"
            href="mailto:hello@pixlocal.ru"
          >
            hello@pixlocal.ru
          </a>
        </p>
        <p className="text-sm">
          Письма принимаются после настройки Email Routing в Cloudflare (см.
          план запуска).
        </p>
      </div>
    </article>
  );
}
