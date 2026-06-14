"""AI background removal for harvested product images (owner requirement).

Reads every entry in src/data/devImages.json, downloads the source, runs U2Net
via rembg, and writes a TRANSPARENT PNG to assets/shoes/<slug>.png. These cut
PNGs are bundled and cleared for production (imageFor ships LOCAL_SHOE_IMAGES
ungated) so the live app shows the real shoes we have with NO white tile.

Idempotent: skips a slug that already has a cut PNG (so the 4 hand-curated cuts
are preserved). Delete the PNG to force a re-cut. Re-run after new harvests.

Usage: python scripts/cut-images.py
"""
import json
import os
import urllib.parse
import urllib.request

from rembg import new_session, remove

ROOT = os.path.join(os.path.dirname(__file__), "..")
DEV_JSON = os.path.join(ROOT, "src", "data", "devImages.json")
OUT_DIR = os.path.join(ROOT, "assets", "shoes")
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}


def encode_url(url: str) -> str:
    """Percent-encode non-ASCII chars (e.g. a literal ™) so urllib can open it."""
    try:
        url.encode("ascii")
        return url
    except UnicodeEncodeError:
        return urllib.parse.quote(url, safe=":/?#[]@!$&'()*+,;=%~")

with open(DEV_JSON, encoding="utf-8") as fh:
    dev = json.load(fh)

# one session, reused across every image (loads the U2Net model once)
session = new_session("u2net")

ok, skipped, failed = [], [], []
for slug, meta in dev.items():
    out_path = os.path.join(OUT_DIR, f"{slug}.png")
    if os.path.exists(out_path):
        skipped.append(slug)
        continue
    url = meta.get("url") if isinstance(meta, dict) else meta
    if not url:
        failed.append((slug, "no url"))
        continue
    try:
        parsed = urllib.parse.urlparse(url)
        headers = {**HEADERS, "Referer": f"{parsed.scheme}://{parsed.netloc}/"}
        req = urllib.request.Request(encode_url(url), headers=headers)
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
        cut = remove(raw, session=session)
        with open(out_path, "wb") as f:
            f.write(cut)
        ok.append(slug)
        print(f"cut  {slug}: {len(raw)//1024}KB -> {len(cut)//1024}KB transparent")
    except Exception as e:  # noqa: BLE001 - report and continue, one bad URL shouldn't abort the batch
        failed.append((slug, str(e)[:90]))
        print(f"FAIL {slug}: {str(e)[:90]}")

print(f"\n{len(ok)} cut, {len(skipped)} skipped (already had a cut), {len(failed)} failed")
for slug, why in failed:
    print(f"  - {slug}: {why}")
print("out ->", os.path.abspath(OUT_DIR))
