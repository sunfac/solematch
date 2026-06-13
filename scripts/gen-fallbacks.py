"""Generate ORIGINAL, brand-free neon trainer images — one per shoe category —
to REPLACE the line-art silhouette fallback wherever a real product photo is
missing. Because these are generated original art (no logos, no trade dress,
no scraped brand photography) they carry no licensing risk and CAN ship to
production, unlike the localhost-gated real-shoe images.

Each category prompt encodes the build so the fallback stays informative:
a racer reads low and sleek, a max-cushion reads tall and chunky — the same
"shape tells you the build" idea as the silhouette, but photoreal.

Key resolution (never written to disk, never echoed):
  1. OPENAI_API_KEY env var, else
  2. a line `OPENAI_API_KEY=sk-...` in a gitignored .env.local at repo root.

Usage:  python scripts/gen-fallbacks.py            (all categories)
        python scripts/gen-fallbacks.py race daily (subset)
Output: assets/fallback/<category>.png  (transparent PNG, square)
"""
import base64
import json
import os
import sys
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")


def load_key() -> str:
    k = os.environ.get("OPENAI_API_KEY")
    if k:
        return k.strip()
    envfile = os.path.join(ROOT, ".env.local")
    if os.path.exists(envfile):
        for line in open(envfile, encoding="utf-8"):
            line = line.strip()
            if line.startswith("OPENAI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(
        "OPENAI_API_KEY not found. Set it as an env var, or put "
        "OPENAI_API_KEY=sk-... in a gitignored .env.local at the repo root."
    )


KEY = load_key()

BASE = (
    "A single futuristic running shoe, completely original fictional design. "
    "STRICTLY NO logos, NO swoosh, NO stripes, NO brand marks or emblems of any kind — "
    "clean engineered mesh upper with only geometric texture. Side profile, slight "
    "three-quarter angle, floating. Dramatic neon rim lighting in volt green (#C8FF00) "
    "and cyan (#00E5FF) with a magenta (#FF2DD4) accent, glossy midsole foam, "
    "photorealistic product photography, high detail, centered, generous margin, "
    "TRANSPARENT background."
)

# Build-specific shape language so the fallback still communicates the category.
CATEGORY = {
    "race": "An ultralight low-stack carbon racing flat: thin, fast, aggressive forward rake, minimal sleek profile, visible carbon plate glow line.",
    "tempo": "A lightweight responsive tempo trainer: moderate stack, sleek and snappy, a quick-looking profile.",
    "daily": "A balanced everyday daily trainer: medium stack, smooth rounded profile, versatile look.",
    "max_cushion": "A maximal-cushion cruiser: very TALL, THICK, chunky high-stack midsole, plush oversized foam, dramatic height.",
    "stability": "A supportive stability trainer: wide planted base, structured medium-high stack, a steady solid stance.",
    "budget": "A clean simple everyday running shoe: modest stack, honest no-frills profile.",
}

OUT_DIR = os.path.join(ROOT, "assets", "fallback")
os.makedirs(OUT_DIR, exist_ok=True)


def call(model: str, body: dict) -> bytes:
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read())
    item = data["data"][0]
    if "b64_json" in item:
        return base64.b64decode(item["b64_json"])
    with urllib.request.urlopen(item["url"], timeout=120) as img:
        return img.read()


def generate(cat: str) -> None:
    prompt = f"{CATEGORY[cat]} {BASE}"
    try:
        png = call("gpt-image-1", {
            "model": "gpt-image-1", "prompt": prompt,
            "size": "1024x1024", "quality": "high", "background": "transparent",
        })
        how = "gpt-image-1"
    except Exception as e:
        print(f"  {cat}: gpt-image-1 failed ({e}); trying dall-e-3")
        png = call("dall-e-3", {
            "model": "dall-e-3", "prompt": prompt,
            "size": "1024x1024", "quality": "hd", "response_format": "b64_json",
        })
        how = "dall-e-3 (no transparency)"
    out = os.path.join(OUT_DIR, f"{cat}.png")
    with open(out, "wb") as f:
        f.write(png)
    print(f"  + {cat:<12} {os.path.getsize(out)//1024}KB  [{how}]")


cats = [c for c in sys.argv[1:] if c in CATEGORY] or list(CATEGORY)
print(f"generating {len(cats)} category fallbacks -> {OUT_DIR}")
for c in cats:
    generate(c)
print("done. Wire them in src/lib/affiliate.ts (imageFor) + ShoeCard fallback.")
