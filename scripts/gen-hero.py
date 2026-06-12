"""Generate the landing hero image via OpenAI image API (key from OPENAI_API_KEY
env only — never written to disk). Produces an ORIGINAL, brand-free neon shoe
so the hero carries no trademark/trade-dress risk, unlike scraped photos.
Usage:  $env:OPENAI_API_KEY='...'; python scripts/gen-hero.py
"""
import base64
import json
import os
import urllib.request

KEY = os.environ.get("OPENAI_API_KEY")
if not KEY:
    raise SystemExit("OPENAI_API_KEY not set")

PROMPT = (
    "A single futuristic running shoe, completely original fictional design. "
    "STRICTLY NO logos, NO swoosh, NO stripes, NO brand marks, NO emblems of any "
    "kind — the side panel is clean engineered mesh with only geometric texture. "
    "Side profile floating at a slight three-quarter angle, dramatic neon rim "
    "lighting in volt green (#C8FF00) and cyan (#00E5FF) with a magenta accent, "
    "on a pure black background, dark stadium-at-night mood, glossy midsole foam, "
    "carbon plate glow line, photorealistic product photography, high detail, "
    "centered, generous margin around the shoe"
)

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "hero-shoe.png")


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


try:
    png = call("gpt-image-1", {"model": "gpt-image-1", "prompt": PROMPT, "size": "1536x1024", "quality": "high"})
    print("generated with gpt-image-1")
except Exception as e:  # fall back to dall-e-3 if gpt-image-1 unavailable on this key
    print(f"gpt-image-1 failed ({e}); trying dall-e-3")
    png = call(
        "dall-e-3",
        {"model": "dall-e-3", "prompt": PROMPT, "size": "1792x1024", "quality": "hd", "response_format": "b64_json"},
    )
    print("generated with dall-e-3")

with open(OUT, "wb") as f:
    f.write(png)
print("wrote", os.path.abspath(OUT), f"{os.path.getsize(OUT)//1024}KB")
