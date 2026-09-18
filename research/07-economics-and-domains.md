# 07. Экономика, сайзинг и домены — только без бэкенда

Дата: сентябрь 2026. Бренд: **ПиксЛокал**. Продукт: [`web/`](../web/).

## Жёсткое ограничение

**Бэкенда нет и не планируется** в рамках этой стратегии:

- нет VPS / собственной VM;
- нет API загрузки файлов;
- нет БД и серверной обработки изображений;
- нет S3 для пользовательских файлов.

USP «файлы не уходят на сервер» обязателен. Инфраструктура = **статика в Yandex Object Storage + один домен**. Vercel / Cloudflare Pages в РФ на мобильных режутся ТСПУ — не использовать как origin.

```mermaid
flowchart LR
  user[Пользователь]
  storage[Yandex_Object_Storage]
  browser[Браузер_обработка]
  ads[РСЯ_AdSense]
  user --> storage --> browser
  user --> ads
```

---

## 1. Сайзинг облака (0 собственного сервера)

| Ресурс | Значение |
|---|---|
| vCPU | 0 |
| RAM | 0 |
| Диск приложения | 0 (HTML/JS в Object Storage, бакет сайта ≠ хранилище юзер-фото) |
| Канал под юзер-фото | нет (обработка в браузере) |

### Этап A — старт (0–20k визитов/мес)

| Компонент | Выбор | Стоимость |
|---|---|---|
| Хостинг | Yandex Object Storage (хостинг сайта, free tier) | **0 ₽** |
| DNS | Yandex Cloud DNS (зона уже на `ns1`/`ns2.yandexcloud.net`) | **0 ₽** на старте |
| Домен | один `.ru` | **~200–900 ₽/год** |
| Почта | Cloudflare Email Routing → личный ящик / Yandex 360 | **0–~200 ₽/мес** |
| Аналитика | Метрика + GA4 | **0 ₽** |

**Итого год 1 типично: ≈ 500–1500 ₽** (почти только домен).

### Этап B — рост (20–200k+ визитов/мес)

Без VPS. Если free Object Storage упёрся в GET/трафик:

- смотреть фактический счёт Yandex Cloud (копейки сверх квот GET);
- при устойчивых десятках тысяч визитов — дешёвый shared в РФ (Beget Start и аналоги), **не** Vercel/Cloudflare Pages.

Vercel Pro / Cloudflare Pro **не** апгрейд для аудитории РФ: ТСПУ душит эти CDN на мобильных.

### Трафик vs Object Storage

| Визиты/мес | Исходящий трафик статики (грубо) | Действие |
|---:|---|---|
| 5k | ~5–20 ГБ | free (100 ГБ исходящего) |
| 20k+ | смотреть квоту **100k GET/мес** | сверх квоты — копейки, не Vercel |
| 200k | ~200–800 ГБ | трафик сверх 100 ГБ + GET; всё ещё без бэкенда |
| 1M+ | считать GET и ГБ | shared/CDN в РФ, без VPS |

---

## 2. Экономика

Формула: `доход/мес ≈ визиты × RPM / 1000`  
RPM ориентир после модерации рекламы: **50–150 ₽** (не гарантия).

| Визиты/мес | RPM 50 ₽ | RPM 100 ₽ | RPM 150 ₽ |
|---:|---:|---:|---:|
| 10k | 500 ₽ | 1 000 ₽ | 1 500 ₽ |
| 50k | 2 500 ₽ | 5 000 ₽ | 7 500 ₽ |
| 200k | 10 000 ₽ | 20 000 ₽ | 30 000 ₽ |

- Себестоимость визита на этапе A ≈ **0 ₽** (кроме комиссии сети/налога).
- Окупаемость домена — при первых тысячах визитов с рекламой.
- Заметный доход — при устойчивых десятках тысяч визитов (месяцы SEO, не дни).
- Pro CDN покупать **по факту** лимитов или уже имеющейся выручки — не заранее.

---

## 3. Стратегия домена

### Правила

1. **Один** брендовый домен — не сетка exact-match.
2. Зона: **`.ru`** в приоритете; запас `.com` / `.online`, если имя занято.
3. Не держать параллельно `.ru` + `.com` с одним контентом без 301.
4. Кластер запросов — **путями** на сайте (`/heic-v-jpg`, `/szhat-jpg`, …).
5. Не брать spam-имена вида `besplatno-szhat-foto-online.ru`.

### Критерии проверки перед покупкой

| Шаг | Что сделать |
|---|---|
| 1 | WHOIS / проверка у REG.RU, Timeweb или Beget — свободен ли домен |
| 2 | DNS: нет «чужих» NS/A (см. пробу ниже) |
| 3 | [Wayback Machine](https://web.archive.org) — нет токсичной истории |
| 4 | Поиск по имени + «отзывы» / товарные знаки |
| 5 | Соцсети / Telegram: свободен ли @ник |
| 6 | Цена регистрации и продления `.ru` на 1 год |

### Shortlist имён (латиница под «ПиксЛокал»)

**Выбран и куплен (сен 2026): [`pixlocal.ru`](https://pixlocal.ru)** — 1 год.  
На момент покупки DNS стояли `statuspage1.nic.ru` / `statuspage2.nic.ru`. Сейчас NS → **Yandex Cloud DNS**, origin — Object Storage — см. [08-launch-playbook.md](08-launch-playbook.md).

Архив кандидатов ([domain_dns_probe.json](domain_dns_probe.json)):

| Домен | Статус |
|---|---|
| **pixlocal.ru** | **наш, зарегистрирован** |
| localpix.ru, pixlok.ru, lokpix.ru, … | не покупаем |
| pixli.ru, pixcraft.ru | заняты (DNS) |

После покупки: `NEXT_PUBLIC_SITE_URL=https://pixlocal.ru`, контакты `wasp777@mail.ru`.

---

## 4. Деплой статики (без серверных фич)

Сборка: `output: 'export'` в [`web/next.config.ts`](../web/next.config.ts) → каталог `web/out`. Выкладка: GitHub Action [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) → бакет `pixlocal.ru`.

### Разрешено

- Статический HTML/JS/CSS в **Yandex Object Storage** (режим хостинга сайта)
- Клиентский JS: canvas, heic2any, JSZip
- Переменные только `NEXT_PUBLIC_*` (URL, аналитика, флаги рекламы) — в GitHub Actions **Variables**
- DNS: Yandex Cloud DNS, ANAME на `pixlocal.ru.website.yandexcloud.net`

### Запрещено (ломает стратегию)

- Origin на Vercel, Cloudflare Pages, Cloudflare proxy (оранжевое облако) — ТСПУ на мобильных в РФ
- Route Handlers / API Routes для приёма файлов
- Server Actions, пишущие файлы или вызывающие тяжёлую обработку картинок на сервере
- Object Storage / S3 **под пользовательские фото** (сайт в бакете — это статика приложения, не загрузки)
- Аренда VPS «чтобы было куда деплоить»
- `output: 'standalone'` + свой Node на VM

### Практический деплой — Yandex Object Storage

Пошагово в консоли: [08-launch-playbook.md](08-launch-playbook.md). Кратко:

1. `cd web && npm run build` (или push в `main` — Action)
2. Бакет с именем **точно** `pixlocal.ru`, публичный, хостинг, index `index.html`, ошибка `404.html`
3. Let's Encrypt в Certificate Manager, HTTPS на бакете
4. DNS: CNAME `pixlocal.ru` → `pixlocal.ru.website.yandexcloud.net`, **DNS only**
5. Секреты GitHub: `YC_SA_ACCESS_KEY_ID`, `YC_SA_SECRET_ACCESS_KEY`

Локальный просмотр статики: `npx serve out` из `web/` (не `next start` — это не Node-сервер).

Реклама и Метрика: см. [05-monetize.md](05-monetize.md), [06-iterate.md](06-iterate.md). Флаг `NEXT_PUBLIC_ADS_ENABLED=false` до модерации.

---

## 5. Чеклист запуска (без аренды VM)

### Домен и DNS

- [ ] Выбрать имя из shortlist, подтвердить свободу у регистратора
- [ ] Купить **один** `.ru` на 1 год
- [ ] Зона Cloud DNS `pixlocal.ru.`, NS у регистратора `ns1`/`ns2.yandexcloud.net`
- [ ] Не покупать второй домен и не арендовать VPS

### Хостинг

- [ ] Бакет Object Storage `pixlocal.ru`, хостинг сайта, публичный доступ
- [ ] HTTPS (Certificate Manager / Let's Encrypt)
- [ ] GitHub Action: секреты ключа сервисного аккаунта, успешный sync
- [ ] `NEXT_PUBLIC_SITE_URL=https://pixlocal.ru`
- [ ] Проверить canonical / sitemap: `https://pixlocal.ru/sitemap.xml`
- [ ] Android без VPN (мобильный интернет): главная и инструмент открываются

### Почта и юр. страницы

- [x] Контакт на `/contacts`: `wasp777@mail.ru` (без доменной почты)
- [ ] Перечитать `/privacy` и `/terms` под реальный домен

### Поиск и аналитика

- [ ] Яндекс.Вебмастер — добавить сайт, sitemap
- [ ] Google Search Console — то же
- [ ] Яндекс.Метрика + (по желанию) GA4 → ID в env
- [ ] Мониторинг «Алиса AI» в Вебмастере (после индексации)

### Монетизация (позже)

- [ ] Стабильный трафик и нормальное поведение
- [ ] Заявка РСЯ / AdSense
- [ ] Прописать ID блоков, `NEXT_PUBLIC_ADS_ENABLED=true`
- [ ] Не перекрывать dropzone рекламой

### Когда повышать бюджет

- [ ] Free GET/трафик Object Storage исчерпан → сначала смотреть счёт (обычно копейки)
- [ ] Иначе — не повышать; не возвращаться на Vercel/Cloudflare Pages

---

## Итог одной строкой

**0 собственного сервера + Object Storage free + 1× `.ru` ≈ 1–2 тыс. ₽/год**; бэкенд, VPS и зарубежный CDN вне стратегии.
