# ПиксЛокал

Приватный онлайн-хаб: сжатие и конвертация изображений **в браузере** (JPG / PNG / WebP / HEIC).  
Ниша выбрана по исследованию рынка — см. [`../research/NICHE_DECISION.md`](../research/NICHE_DECISION.md).

## Запуск

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой (статика в РФ, без бэкенда)

Подробно: [`../research/07-economics-and-domains.md`](../research/07-economics-and-domains.md), чеклист консоли: [`../research/08-launch-playbook.md`](../research/08-launch-playbook.md).

1. Домен **pixlocal.ru** уже куплен.
2. `NEXT_PUBLIC_SITE_URL=https://pixlocal.ru` (в GitHub Variables / локально).
3. `npm run build` → каталог `out/`. Прод: бакет Yandex Object Storage `pixlocal.ru`, GitHub Action [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). **Не** Vercel и **не** Cloudflare Pages: на Android в РФ без VPN их режет ТСПУ.
4. DNS: Cloud DNS, запись **ANAME** `@` → `pixlocal.ru.website.yandexcloud.net`. NS уже `ns1.yandexcloud.net` / `ns2.yandexcloud.net` (NIC.RU). Cloudflare не нужен.
5. Не добавляйте API/Server Actions для загрузки файлов — обработка только в браузере.
6. Вебмастер + GSC + sitemap; Метрика/GA4 в Variables.
7. После трафика — РСЯ/AdSense, затем `NEXT_PUBLIC_ADS_ENABLED=true`.

Шрифты Google качаются **на билде**. Локально в РФ `npm run build` может упасть без доступа к fonts.google.com; выкладка идёт с раннера GitHub (вне РФ).

Локально посмотреть статику: `npx serve out` (не `next start`).

## Лицензии

См. [LICENSES.md](./LICENSES.md) — Canvas API, heic-to/libheif (LGPL-3.0), jszip (MIT).

## Монетизация и итерации

- [`../research/05-monetize.md`](../research/05-monetize.md)
- [`../research/06-iterate.md`](../research/06-iterate.md)
