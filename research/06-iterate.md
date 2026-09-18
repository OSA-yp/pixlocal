# Итерации после запуска

Сайт в проде: [https://pixlocal.ru](https://pixlocal.ru). Рекламу не включать, пока нет стабильного органика. Стратегия роста и privacy: [09-growth-and-privacy.md](09-growth-and-privacy.md).

Цели в коде (имена совпадают с `reachGoal` / GA4): `file_select`, `download`, `zip_download` — см. [`web/src/lib/track.ts`](../web/src/lib/track.ts).

---

## День 0 — кабинеты (сделать один раз)

Без этого Метрика на сайте не появится: скрипт вставляется только если задан `NEXT_PUBLIC_YM_ID`.

1. [Яндекс.Метрика](https://metrika.yandex.ru) → создать счётчик на `https://pixlocal.ru`. Включить вебвизор, карту кликов, точный показатель отказов. Скопировать числовой ID.
2. Цели типа «JavaScript-событие», идентификаторы **точно**:
   - `file_select` — выбор файлов (не пересчёт настроек)
   - `download` — скачать один файл или «Поделиться»
   - `zip_download` — ZIP
   Главная конверсия: `download`. ZIP — вторичная.
3. [Яндекс.Вебмастер](https://webmaster.yandex.ru) → `https://pixlocal.ru`. Подтверждение: DNS TXT в Cloud DNS **или** счётчик Метрики **или** `NEXT_PUBLIC_YANDEX_VERIFICATION` + Redeploy.
4. Отправить sitemap: `https://pixlocal.ru/sitemap.xml`.
5. Запросить обход:
   - `https://pixlocal.ru/`
   - `https://pixlocal.ru/heic-v-jpg/`
   - `https://pixlocal.ru/szhat-jpg/`
   - `https://pixlocal.ru/szhat-do-100kb/`
   - `https://pixlocal.ru/webp-v-jpg/`
6. [Google Search Console](https://search.google.com/search-console) — URL-prefix `https://pixlocal.ru`, sitemap, проверка тех же URL. Токен: DNS TXT или `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
7. В GitHub → Settings → Variables (подхватывает [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)):
   - `NEXT_PUBLIC_SITE_URL` не обязателен (в workflow уже `https://pixlocal.ru`)
   - `NEXT_PUBLIC_YM_ID=<id>`
   - по желанию `NEXT_PUBLIC_GA4_ID`
   - `NEXT_PUBLIC_ADS_ENABLED` оставить пустым или `false`
8. Actions → **Deploy to Yandex Object Storage** (нужны секреты ключа бакета). Проверка: DevTools → Network есть запрос на `mc.yandex.ru`; через 5–15 мин визит в Метрике. Тест: сжать фото → скачать — цель `download` должна сработать. На Android без VPN главная должна открываться.

После выкладки индексации:

1. Ключ IndexNow: `https://pixlocal.ru/7f3a9c2e4b18d056a91c4e8f02b7d3c5.txt` должен отдавать ту же строку. Пинг: в каталоге `web/` выполнить `npm run indexnow`.
2. [Яндекс.Вебмастер](https://webmaster.yandex.ru): регион **Россия**, sitemap принят, «Важные страницы» и **Переобход**:
   - `https://pixlocal.ru/`
   - `https://pixlocal.ru/heic-v-jpg/`
   - `https://pixlocal.ru/szhat-do-100kb/`
   - `https://pixlocal.ru/szhat-jpg/`
   - `https://pixlocal.ru/webp-v-jpg/`
3. [Google Search Console](https://search.google.com/search-console): sitemap + «Проверка URL → Запрос индексирования» по тем же пяти.
4. Через 3–7 дней: `site:pixlocal.ru` в Яндексе и Google.

Контакт на сайте: `wasp777@mail.ru` (личная почта, доменный ящик не используем).

---

## Wordstat (один раз на старте)

В [Wordstat](https://wordstat.yandex.ru) сверить частотности из [NICHE_DECISION.md](NICHE_DECISION.md). Не плодить страницы, если фраза уже закрыта текущими URL.

Минимум проверить:

- сжать фото онлайн / бесплатно / без регистрации
- heic в jpg / heic в jpg онлайн / конвертер heic
- webp в jpg
- сжать jpg / сжать png
- сжать фото до 100 кб
- изменить размер фото онлайн

---

## Пятница, 15 минут — ритуал статистики

### Метрика

- Визиты и источники: поиск / прямые / рефералы
- Страницы входа: какие из 12 посадочных живые
- Воронка: визит → `file_select` → `download` (ZIP отдельно)
- Вебвизор: 5–10 сессий, где бросили dropzone (особенно мобильный)
- Устройства: доля смартфонов (HEIC часто с iPhone)

### Вебмастер и Search Console

- Индексация: все URL из sitemap в поиске, без 4xx
- Запросы и CTR по кластерам: HEIC, compress, webp, 100 КБ
- Ошибки обхода
- Отчёт «Алиса AI» — только смотреть, не оптимизировать под него

`site:pixlocal.ru` в Яндексе и Google. Пустой индекс 3–7 дней после запуска — норма.

Нормы 4–8 недель для нового домена: десятки–сотни визитов, не тысячи. Успех — 12 URL в индексе и клики по HEIC / «сжать до 100 кб», а не топ по голове «сжать фото онлайн».

---

## Недели 2–8 и месяцы 1–3

- Новые посадочные **только** если Вебмастер/GSC показывают спрос без URL (например «сжать до 200 кб»). Не блог «ради SEO».
- Сниппеты править по CTR в [`web/src/lib/tools.ts`](../web/src/lib/tools.ts).
- UX — только по вебвизору.
- Упоминания 1–2 в неделю, по делу: iPhone/Windows/маркетплейсы, вопрос про HEIC или лимит 100 КБ, USP «файл не уходит на сервер». Один честный текст на VC.ru/Хабре допустим.
- Не делать: каталоги «добавить сайт», гостевой спам, PBN, накрутка ПФ, Директ/Ads, РСЯ/AdSense, статьи без CTA в инструмент, второй продукт.

Приоритет внутренних ссылок (шапка): `/`, `/heic-v-jpg`, `/szhat-do-100kb`, `/szhat-jpg`, `/webp-v-jpg`. Остальное — блок «Другие инструменты».

---

## Метрики успеха

- День 7: Метрика видит визиты, цели срабатывают, sitemap принят
- День 30: 12 инструментов в индексе, есть показы по HEIC / 100 КБ
- День 90: растут клики по long-tail; доля `download` / визит не проседает

После этого — решение по рекламным блокам ([05-monetize.md](05-monetize.md)), не по закупке трафика.
