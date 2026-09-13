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

## Деплой (только static/edge, без бэкенда)

Подробно: [`../research/07-economics-and-domains.md`](../research/07-economics-and-domains.md).

1. Домен **pixlocal.ru** уже куплен — см. [`../research/08-launch-playbook.md`](../research/08-launch-playbook.md).
2. Выставьте `NEXT_PUBLIC_SITE_URL=https://pixlocal.ru`.
3. Задеплойте на **Vercel** или **Cloudflare Pages** — **не** арендуйте VPS.
4. Не добавляйте API/Server Actions для загрузки файлов — обработка только в браузере.
5. Вебмастер + GSC + sitemap; Метрика/GA4 в env.
6. После трафика — РСЯ/AdSense, затем `NEXT_PUBLIC_ADS_ENABLED=true`.

## Лицензии

См. [LICENSES.md](./LICENSES.md) — Canvas API, heic2any/libheif (LGPL-3.0), jszip (MIT).

## Монетизация и итерации

- [`../research/05-monetize.md`](../research/05-monetize.md)
- [`../research/06-iterate.md`](../research/06-iterate.md)
