#!/usr/bin/env bash
# Заливка статики Next.js (web/out) в Yandex Object Storage.
# Нужны: AWS CLI, ключи сервисного аккаунта (S3-совместимый API).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  # Only export KEY=value lines safe for bash (skip passwords with unquoted parens)
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^(AWS_|YC_|NEXT_PUBLIC_|SITE_URL=) ]] || continue
    export "$line" 2>/dev/null || true
  done < "$REPO_ROOT/.env"
  set +a
fi
OUT="${1:-$ROOT/out}"
BUCKET="${YC_BUCKET:-pixlocal.ru}"
ENDPOINT="${YC_S3_ENDPOINT:-https://storage.yandexcloud.net}"
REGION="${AWS_DEFAULT_REGION:-ru-central1}"

if [[ ! -f "$OUT/index.html" ]]; then
  echo "Нет $OUT/index.html — сначала: cd web && npm run build" >&2
  exit 1
fi

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Задайте AWS_ACCESS_KEY_ID и AWS_SECRET_ACCESS_KEY (статический ключ сервисного аккаунта Yandex Cloud)." >&2
  exit 1
fi

export AWS_DEFAULT_REGION="$REGION"
export AWS_EC2_METADATA_DISABLED=true

# Бакет с точкой в имени (pixlocal.ru) — только path-style.
aws configure set default.s3.addressing_style path >/dev/null

echo "Sync $OUT → s3://$BUCKET ($ENDPOINT)"

# HTML: short CDN TTL so origin is not hit on every request (Yandex CDN ~5s
# origin timeout → 504 on MISS). Hashed /_next assets stay immutable below.
aws s3 sync "$OUT" "s3://$BUCKET" \
  --endpoint-url "$ENDPOINT" \
  --delete \
  --cache-control "public, max-age=300, must-revalidate"

aws s3 sync "$OUT/_next" "s3://$BUCKET/_next" \
  --endpoint-url "$ENDPOINT" \
  --cache-control "public, max-age=31536000, immutable"

# Service worker must revalidate quickly so clients pick up new revisions.
if [[ -f "$OUT/sw.js" ]]; then
  aws s3 cp "$OUT/sw.js" "s3://$BUCKET/sw.js" \
    --endpoint-url "$ENDPOINT" \
    --content-type "application/javascript; charset=utf-8" \
    --cache-control "public, max-age=0, must-revalidate"
fi

if [[ -f "$OUT/manifest.webmanifest" ]]; then
  aws s3 cp "$OUT/manifest.webmanifest" "s3://$BUCKET/manifest.webmanifest" \
    --endpoint-url "$ENDPOINT" \
    --content-type "application/manifest+json" \
    --cache-control "public, max-age=86400"
fi

# Metadata-картинки Next без расширения: иначе Object Storage отдаст octet-stream.
for f in icon apple-icon opengraph-image; do
  if [[ -f "$OUT/$f" ]]; then
    aws s3 cp "$OUT/$f" "s3://$BUCKET/$f" \
      --endpoint-url "$ENDPOINT" \
      --content-type "image/png" \
      --cache-control "public, max-age=86400"
  fi
done

# /path и /path/ — Object Storage не делает redirect как Vercel.
# Копируем index.html ещё и как объект без слэша (старые URL без trailing slash).
while IFS= read -r -d '' html; do
  rel="${html#"$OUT"/}"
  key="${rel%/index.html}"
  case "$key" in
    404|_next|_next/*) continue ;;
  esac
  aws s3 cp "$html" "s3://$BUCKET/$key" \
    --endpoint-url "$ENDPOINT" \
    --content-type "text/html; charset=utf-8" \
    --cache-control "public, max-age=300, must-revalidate"
done < <(find "$OUT" -mindepth 2 -name index.html -print0)

echo "Готово: s3://$BUCKET"
