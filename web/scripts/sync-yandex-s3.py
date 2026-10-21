#!/usr/bin/env python3
"""Sync web/out to Yandex Object Storage (S3 API). Uses env from repo .env."""
from __future__ import annotations

import mimetypes
import os
import sys
from pathlib import Path

import boto3
from botocore.config import Config

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out"


def load_env() -> None:
    env_path = REPO / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if not key.startswith(("AWS_", "YC_", "NEXT_PUBLIC_")) and key != "SITE_URL":
            continue
        val = val.strip().strip("'").strip('"')
        os.environ.setdefault(key, val)


def content_type(path: Path) -> str:
    name = path.name
    if name in {"icon", "apple-icon", "opengraph-image"}:
        return "image/png"
    if path.suffix == ".html" or name == "index.html":
        return "text/html; charset=utf-8"
    if path.suffix == ".xml":
        return "application/xml"
    if path.suffix == ".txt":
        return "text/plain; charset=utf-8"
    if path.suffix == ".js":
        return "application/javascript"
    if path.suffix == ".css":
        return "text/css"
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or "application/octet-stream"


def cache_control(rel: str) -> str:
    if rel.startswith("_next/"):
        return "public, max-age=31536000, immutable"
    if rel in {"icon", "apple-icon", "opengraph-image"}:
        return "public, max-age=86400"
    return "public, max-age=0, must-revalidate"


def main() -> None:
    load_env()
    # Prefer AWS_* ; fall back to YC_SA_* used in GitHub secrets naming
    access = os.environ.get("AWS_ACCESS_KEY_ID") or os.environ.get("YC_SA_ACCESS_KEY_ID")
    secret = os.environ.get("AWS_SECRET_ACCESS_KEY") or os.environ.get(
        "YC_SA_SECRET_ACCESS_KEY"
    )
    bucket = os.environ.get("YC_BUCKET", "pixlocal.ru")
    endpoint = os.environ.get("YC_S3_ENDPOINT", "https://storage.yandexcloud.net")
    region = os.environ.get("AWS_DEFAULT_REGION", "ru-central1")

    if not access or not secret:
        raise SystemExit("Need AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env")
    if not (OUT / "index.html").is_file():
        raise SystemExit(f"No {OUT}/index.html — run npm run build first")

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=access,
        aws_secret_access_key=secret,
        config=Config(s3={"addressing_style": "path"}),
    )

    local_files: dict[str, Path] = {}
    for path in OUT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(OUT).as_posix()
        local_files[rel] = path
        # Also publish /path without trailing slash for deep pages
        if rel.endswith("/index.html") and rel != "index.html":
            key = rel[: -len("/index.html")]
            if key and not key.startswith("_next"):
                local_files[key] = path

    print(f"Sync {OUT} → s3://{bucket} ({len(local_files)} keys)")

    remote = set()
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            remote.add(obj["Key"])

    uploaded = 0
    for key, path in sorted(local_files.items()):
        extra = {
            "ContentType": content_type(path),
            "CacheControl": cache_control(key),
        }
        s3.upload_file(str(path), bucket, key, ExtraArgs=extra)
        uploaded += 1
        if uploaded % 50 == 0:
            print(f"  … {uploaded}/{len(local_files)}")

    # Delete remote keys that are no longer in the build (except keep nothing critical)
    stale = remote - set(local_files.keys())
    # Never delete the IndexNow key file if somehow missing locally — it's in out/
    deleted = 0
    for key in sorted(stale):
        s3.delete_object(Bucket=bucket, Key=key)
        deleted += 1

    print(f"Uploaded {uploaded}, deleted {deleted}. Done: s3://{bucket}")


if __name__ == "__main__":
    main()
