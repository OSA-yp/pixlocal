# Лицензии сторонних компонентов (PixLocal)

Обработка изображений и PDF выполняется **в браузере пользователя**. Сервис не загружает содержимое файлов на свой сервер для обработки.

## Сжатие и конвертация JPG / PNG / WebP

- **Технология:** встроенный [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) браузера (`canvas.toBlob`).
- **Отдельной npm-библиотеки сжатия нет.**
- **Легальность:** стандарт веб-платформы; использование законно.

## HEIC / HEIF

- **Пакет:** [`heic-to`](https://github.com/hoppergee/heic-to)
- **Под капотом:** [libheif](https://github.com/strukturag/libheif) 1.22+ (декодирование HEIF, в т.ч. iOS 18 / HDR gain map)
- **Лицензия libheif:** LGPL-3.0
- **Легальность:** open-source декодер; распространённая практика для онлайн-конвертеров. Это не «взлом» формата Apple, а свободная реализация чтения контейнера HEIF. При распространении бинарников/WASM соблюдайте условия LGPL (сохранение уведомлений о лицензии, возможность получить соответствующий код библиотеки — у upstream-проекта).

## ZIP

- **Пакет:** [`jszip`](https://github.com/Stuk/jszip)
- **Лицензия:** MIT — свободно для коммерческого использования.

## PDF (структура, merge/split, метаданные, JPG↔PDF)

- **Пакет:** [`pdf-lib`](https://pdf-lib.js.org/)
- **Лицензия:** MIT

## PDF (рендер страниц, сжатие через растрирование, превью)

- **Пакет:** [`pdfjs-dist`](https://github.com/mozilla/pdf.js) (Mozilla PDF.js)
- **Лицензия:** Apache-2.0
- **Worker:** `public/pdf.worker.min.mjs` копируется из пакета при сборке

## PDF (пароль: protect / unlock)

- **Пакеты:** [`@pdfsmaller/pdf-encrypt`](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt), [`@pdfsmaller/pdf-decrypt`](https://www.npmjs.com/package/@pdfsmaller/pdf-decrypt)
- **Лицензия:** MIT
- **Алгоритмы:** AES-256 / RC4 по спецификации PDF; не обход защиты без пароля пользователя

## UI / фреймворк

- Next.js, React — лицензии MIT.

## Вывод

Коммерческий сайт-утилита с клиентской обработкой и этими зависимостями **легален**. Пользовательские фото и PDF обрабатываются локально; ответственность за загружаемый контент лежит на пользователе (см. условия использования).
