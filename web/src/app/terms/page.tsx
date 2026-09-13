import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Правила использования сервиса ПиксЛокал.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1
        className="text-4xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        Условия использования
      </h1>
      <div className="mt-6 space-y-4 text-[var(--ink-soft)] leading-relaxed">
        <p>
          Сервис предоставляется «как есть», бесплатно, без гарантий непрерывной
          доступности. Вы самостоятельно проверяете результат перед публикацией
          или передачей файлов третьим лицам.
        </p>
        <p>
          Запрещено использовать сервис для обработки незаконного контента.
          Вы несёте ответственность за файлы, которые открываете в браузере.
        </p>
        <p>
          Мы можем менять функции, дизайн и условия. Актуальная версия всегда на
          этой странице.
        </p>
      </div>
    </article>
  );
}
