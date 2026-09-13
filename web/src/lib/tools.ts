import type { OutputFormat } from "@/lib/image";
import type { ToolPreset } from "@/components/ImageTool";

type Def = {
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  body: string[];
  faq: { q: string; a: string }[];
  preset: ToolPreset;
};

export const toolDefs: Record<string, Def> = {
  "heic-v-jpg": {
    path: "/heic-v-jpg",
    title: "HEIC в JPG онлайн бесплатно",
    description:
      "Конвертер HEIC в JPG в браузере без загрузки на сервер. Пакетная обработка фото с iPhone.",
    h1: "HEIC в JPG онлайн",
    lead: "Преобразуйте фото iPhone (HEIC/HEIF) в JPG прямо в браузере — без облака и регистрации.",
    body: [
      "HEIC — стандарт камеры iPhone, но Windows, многие сайты и принтеры его не принимают. Конвертация в JPG решает задачу за секунды.",
      "ПиксЛокал декодирует HEIC локально и сохраняет JPEG с настраиваемым качеством. Можно сразу ужать вес под лимит формы.",
    ],
    faq: [
      {
        q: "Сохраняются ли метаданные?",
        a: "При перекодировании через canvas часть EXIF может быть потеряна. Для архива важных снимков держите оригинал HEIC.",
      },
      {
        q: "Почему JPG иногда больше HEIC?",
        a: "HEIC эффективнее JPEG. Мы автоматически снижаем качество и ограничиваем сторону (по умолчанию 2560 px), чтобы файл стал легче. Уменьшите качество или макс. сторону при необходимости.",
      },
      {
        q: "Можно ли несколько файлов сразу?",
        a: "Да, выберите пачку HEIC и скачайте ZIP с JPG или поделитесь отдельными кадрами в «Фото» через «Поделиться».",
      },
    ],
    preset: {
      mode: "convert",
      title: "HEIC → JPG",
      subtitle: "",
      accept: ".heic,.heif,image/heic,image/heif,image/*",
      defaultOutput: "image/jpeg",
      lockOutput: true,
      defaultQuality: 0.75,
      defaultMaxSide: 2560,
    },
  },
  "webp-v-jpg": {
    path: "/webp-v-jpg",
    title: "WebP в JPG онлайн",
    description: "Конвертер WebP в JPG бесплатно в браузере. Без загрузки на сервер.",
    h1: "WebP в JPG",
    lead: "Откройте скачанный WebP в любом редакторе: конвертация в JPG локально на устройстве.",
    body: [
      "WebP часто встречается на сайтах. Если программа или форма не принимает WebP — перекодируйте в JPG здесь.",
      "Обработка идёт в браузере, файлы не отправляются на сервер ПиксЛокал.",
    ],
    faq: [
      {
        q: "Почему JPG тяжелее WebP?",
        a: "WebP обычно эффективнее. JPG нужен ради совместимости, а не ради меньшего веса.",
      },
    ],
    preset: {
      mode: "convert",
      title: "WebP → JPG",
      subtitle: "",
      accept: "image/webp,.webp",
      defaultOutput: "image/jpeg",
      lockOutput: true,
      defaultQuality: 0.8,
      defaultMaxSide: 2560,
    },
  },
  "png-v-jpg": {
    path: "/png-v-jpg",
    title: "PNG в JPG онлайн",
    description: "Конвертер PNG в JPG онлайн бесплатно, локально в браузере.",
    h1: "PNG в JPG",
    lead: "Переведите PNG в JPG и сильно уменьшите вес файлов для веба и мессенджеров.",
    body: [
      "PNG хорош для графики с прозрачностью, но для фото часто избыточен. JPG или WebP дают меньший вес.",
      "Прозрачные области при сохранении в JPG заполняются фоном canvas (светлым).",
    ],
    faq: [
      {
        q: "Как сохранить прозрачность?",
        a: "Оставьте PNG или выберите WebP в общем компрессоре на главной.",
      },
    ],
    preset: {
      mode: "convert",
      title: "PNG → JPG",
      subtitle: "",
      accept: "image/png,.png",
      defaultOutput: "image/jpeg",
      lockOutput: true,
      defaultQuality: 0.8,
      defaultMaxSide: 2560,
    },
  },
  "jpg-v-png": {
    path: "/jpg-v-png",
    title: "JPG в PNG онлайн",
    description: "Конвертер JPG в PNG онлайн в браузере без регистрации.",
    h1: "JPG в PNG",
    lead: "Сконвертируйте JPEG в PNG локально, если нужен PNG-формат для дальнейшей обработки.",
    body: [
      "Конвертация JPG→PNG не добавляет деталей, потерянных при сжатии JPEG, но даёт формат без повторных JPEG-артефактов при правках.",
    ],
    faq: [
      {
        q: "Файл станет больше?",
        a: "Часто да: PNG без потерь обычно тяжелее JPEG.",
      },
    ],
    preset: {
      mode: "convert",
      title: "JPG → PNG",
      subtitle: "",
      accept: "image/jpeg,.jpg,.jpeg",
      defaultOutput: "image/png",
      lockOutput: true,
      defaultQuality: 0.92,
    },
  },
  "jpg-v-webp": {
    path: "/jpg-v-webp",
    title: "JPG в WebP онлайн",
    description: "Конвертер JPG в WebP для сайтов — локально в браузере.",
    h1: "JPG в WebP",
    lead: "Подготовьте изображения для быстрых страниц: JPG → WebP без облака.",
    body: [
      "WebP помогает Core Web Vitals и экономит трафик. ПиксЛокал кодирует WebP на устройстве пользователя.",
    ],
    faq: [
      {
        q: "Все ли браузеры открывают WebP?",
        a: "Современные — да. Для старых клиентов держите JPG-фолбэк.",
      },
    ],
    preset: {
      mode: "convert",
      title: "JPG → WebP",
      subtitle: "",
      accept: "image/jpeg,.jpg,.jpeg",
      defaultOutput: "image/webp" as OutputFormat,
      lockOutput: true,
      defaultQuality: 0.8,
    },
  },
  "png-v-webp": {
    path: "/png-v-webp",
    title: "PNG в WebP онлайн",
    description: "Конвертер PNG в WebP онлайн бесплатно в браузере.",
    h1: "PNG в WebP",
    lead: "Сожмите PNG в WebP локально — удобно для лендингов и карточек товаров.",
    body: [
      "WebP часто легче PNG при сопоставимом виде. Для логотипов с прозрачностью проверьте результат визуально.",
    ],
    faq: [
      {
        q: "Сохраняется ли прозрачность?",
        a: "WebP поддерживает альфа-канал; итог зависит от браузерного энкодера.",
      },
    ],
    preset: {
      mode: "convert",
      title: "PNG → WebP",
      subtitle: "",
      accept: "image/png,.png",
      defaultOutput: "image/webp",
      lockOutput: true,
      defaultQuality: 0.8,
    },
  },
  "webp-v-png": {
    path: "/webp-v-png",
    title: "WebP в PNG онлайн",
    description: "Конвертер WebP в PNG онлайн, обработка в браузере.",
    h1: "WebP в PNG",
    lead: "Нужен PNG из WebP — конвертируйте локально и скачайте результат.",
    body: [
      "Полезно, когда редактор или печатный сервис принимает только PNG.",
    ],
    faq: [
      {
        q: "Будет ли файл больше?",
        a: "Обычно да, PNG без потерь весит больше WebP.",
      },
    ],
    preset: {
      mode: "convert",
      title: "WebP → PNG",
      subtitle: "",
      accept: "image/webp,.webp",
      defaultOutput: "image/png",
      lockOutput: true,
      defaultQuality: 0.92,
    },
  },
  "izmenit-razmer": {
    path: "/izmenit-razmer",
    title: "Изменить размер фото онлайн",
    description: "Уменьшить разрешение фото онлайн — ресайз длинной стороны в браузере.",
    h1: "Изменить размер фото",
    lead: "Ограничьте длинную сторону в пикселях и при необходимости сожмите вес файла.",
    body: [
      "Ресайз помогает уложиться в требования соцсетей и ускорить страницы. Задайте максимум по большей стороне — пропорции сохранятся.",
    ],
    faq: [
      {
        q: "Можно ли увеличить фото?",
        a: "Технически да, но качество не вырастет. Инструмент рассчитан на уменьшение.",
      },
    ],
    preset: {
      mode: "resize",
      title: "Ресайз",
      subtitle: "",
      accept: "image/*",
      defaultOutput: "image/jpeg",
      defaultQuality: 0.85,
      defaultMaxSide: 1920,
    },
  },
  "szhat-do-100kb": {
    path: "/szhat-do-100kb",
    title: "Сжать фото до 100 КБ онлайн",
    description: "Сжать изображение до 100 КБ онлайн бесплатно в браузере.",
    h1: "Сжать фото до 100 КБ",
    lead: "Подгоните вес файла под лимит формы или вложения — цель 100 КБ, обработка локально.",
    body: [
      "Инструмент снижает качество JPEG/WebP, пока размер не приблизится к цели. Для сложных кадров может понадобиться уменьшить разрешение.",
    ],
    faq: [
      {
        q: "Всегда ли получится ровно 100 КБ?",
        a: "Не всегда: зависит от содержимого кадра. Можно дополнительно снизить макс. сторону в пикселях.",
      },
    ],
    preset: {
      mode: "compress",
      title: "До 100 КБ",
      subtitle: "",
      accept: "image/*",
      defaultOutput: "image/jpeg",
      defaultQuality: 0.7,
      defaultTargetKb: 100,
      defaultMaxSide: 1600,
    },
  },
  "szhat-png": {
    path: "/szhat-png",
    title: "Сжать PNG онлайн",
    description: "Сжать PNG онлайн бесплатно — локально в браузере, без регистрации.",
    h1: "Сжать PNG онлайн",
    lead: "Уменьшите вес PNG: перекодируйте в WebP/JPG или оставьте PNG с ресайзом.",
    body: [
      "Браузерный PNG-энкодер не делает heavy lossless-оптимизацию как специализированные CLI. Для максимального сжатия выберите WebP или JPG, если прозрачность не нужна.",
    ],
    faq: [
      {
        q: "Почему PNG почти не сжался?",
        a: "PNG без потерь ограничен. Смените формат результата на WebP или JPG.",
      },
    ],
    preset: {
      mode: "compress",
      title: "Сжать PNG",
      subtitle: "",
      accept: "image/png,.png",
      defaultOutput: "image/webp",
      defaultQuality: 0.8,
    },
  },
  "szhat-jpg": {
    path: "/szhat-jpg",
    title: "Сжать JPG онлайн",
    description: "Сжать JPEG онлайн бесплатно без загрузки на сервер.",
    h1: "Сжать JPG онлайн",
    lead: "Пережмите JPEG с контролем качества и целевого веса — всё в браузере.",
    body: [
      "Повторное сжатие JPEG добавляет артефакты: начинайте с умеренного качества 70–85% и смотрите превью.",
    ],
    faq: [
      {
        q: "Можно ли пакетно?",
        a: "Да, загрузите несколько JPG и скачайте ZIP.",
      },
    ],
    preset: {
      mode: "compress",
      title: "Сжать JPG",
      subtitle: "",
      accept: "image/jpeg,.jpg,.jpeg",
      defaultOutput: "image/jpeg",
      lockOutput: true,
      defaultQuality: 0.75,
    },
  },
};
