"""Read-only catalog snapshot and visual-review sheets; never calls image AI."""
import hashlib
import io
import json
import os
import textwrap
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import dotenv_values, load_dotenv
from PIL import Image, ImageDraw, ImageOps
from pymongo import MongoClient

from render_cover_batch import review_font

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "memory" / "cover_review_final"
load_dotenv(ROOT / ".env")
BASE = dotenv_values(ROOT.parent / "frontend" / ".env")["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


def snapshot():
    with MongoClient(os.environ["MONGO_URL"]) as client:
        docs = list(client[os.environ["DB_NAME"]].stories.find({}, {
            "_id": 0, "id": 1, "title": 1, "hook": 1, "category_id": 1,
            "hero_image_generated": 1, "hero_image_thumb": 1, "hero_image": 1,
        }))
    missing = [d["id"] for d in docs if not (d.get("hero_image_generated") or d.get("hero_image"))]
    if missing:
        raise SystemExit(f"Finish missing covers BEFORE catalog review: {len(missing)}")
    return sorted(docs, key=lambda d: (d.get("category_id", ""), d["title"]))


def fetch(item):
    index, doc = item
    entry = {"number": index, **doc}
    source = doc.get("hero_image_generated") or doc["hero_image"]
    target = OUT / "images" / f"{index:03d}-{doc['id']}.jpg"
    try:
        url = f"{BASE}/api/media/{doc['id']}" if doc.get("hero_image_generated") else source
        response = requests.get(url, timeout=75)
        response.raise_for_status()
        raw = response.content
        with Image.open(io.BytesIO(raw)) as original:
            original.load()
            entry.update({"dimensions": list(original.size), "format": original.format})
            image = ImageOps.exif_transpose(original).convert("RGB")
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        image.save(target, quality=94)
        tiny = list(image.convert("L").resize((9, 8)).getdata())
        bits = [tiny[y * 9 + x] > tiny[y * 9 + x + 1] for y in range(8) for x in range(8)]
        entry.update({"sha256": hashlib.sha256(raw).hexdigest(),
                      "dhash": sum(int(bit) << i for i, bit in enumerate(bits)),
                      "file": str(target.relative_to(ROOT.parent)), "error": None})
    except Exception as exc:
        entry["error"] = f"{type(exc).__name__}: {str(exc)[:180]}"
    return entry


def render(entries):
    pages = []
    font = review_font(24)
    small = review_font(20)
    for start in range(0, len(entries), 6):
        page = Image.new("RGB", (1800, 1800), "#111827")
        draw = ImageDraw.Draw(page)
        for slot, entry in enumerate(entries[start:start + 6]):
            x, y = slot % 3 * 600 + 12, slot // 3 * 900 + 12
            draw.text((x, y), f"#{entry['number']:03d} | {entry.get('category_id', '')}", font=font, fill="white")
            if not entry["error"]:
                with Image.open(ROOT.parent / entry["file"]) as image:
                    thumb = ImageOps.contain(image, (576, 590))
                    page.paste(thumb, (x + (576 - thumb.width) // 2, y + 40))
            else:
                draw.text((x, y + 120), "IMAGE UNAVAILABLE", font=font, fill="orange")
            offset = y + 640
            for line in textwrap.wrap(entry["title"], 42):
                draw.text((x, offset), line, font=font, fill="white")
                offset += 29
            offset += 10
            for line in textwrap.wrap(entry.get("hook", ""), 52)[:5]:
                draw.text((x, offset), line, font=small, fill="#cbd5e1")
                offset += 24
        pages.append(page)
    for start in range(0, len(pages), 6):
        first, last = start * 6 + 1, min((start + 6) * 6, len(entries))
        target = OUT / f"catalog-{first:03d}-{last:03d}.pdf"
        pages[start].save(target, save_all=True, append_images=pages[start + 1:start + 6], resolution=140)
        print(target, flush=True)


def main():
    docs = snapshot()
    if (OUT / "catalog.json").exists():
        raise SystemExit("Snapshot already exists; preserve its review numbering.")
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        entries = list(pool.map(fetch, enumerate(docs, 1)))
    pairs = []
    for i, a in enumerate(entries):
        for b in entries[i + 1:]:
            if a["error"] or b["error"]:
                continue
            distance = (a["dhash"] ^ b["dhash"]).bit_count()
            if a["sha256"] == b["sha256"] or distance <= 5:
                pairs.append({"numbers": [a["number"], b["number"]],
                              "ids": [a["id"], b["id"]], "distance": distance,
                              "identical": a["sha256"] == b["sha256"]})
    report = {"created_at": datetime.now(timezone.utc).isoformat(), "total": len(entries),
              "entries": entries, "similarity_candidates": pairs}
    (OUT / "catalog.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    render(entries)
    print(json.dumps({"total": len(entries), "errors": sum(bool(e["error"]) for e in entries),
                      "similar_pairs": len(pairs)}), flush=True)


if __name__ == "__main__":
    main()