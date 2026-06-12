"""AI multi-angle generation PoC (owner request: "use ChatGPT to modify scraped
images to aid 3D modelling"). Takes an AI-cut product PNG and asks gpt-image-1
to re-render the SAME shoe from new angles — frames usable for a drag-to-rotate
multi-view player, and as photogrammetry-style reference views for image-to-3D
tools. Same preview-only legal stance as devImages (derivative of brand photos).
Usage:  $env:OPENAI_API_KEY='...'; python scripts/gen-views.py <slug>
"""
import base64
import json
import os
import sys

import requests

KEY = os.environ.get("OPENAI_API_KEY")
if not KEY:
    raise SystemExit("OPENAI_API_KEY not set")

slug = sys.argv[1] if len(sys.argv) > 1 else "adidas-adizero-evo-sl"
src = os.path.join(os.path.dirname(__file__), "..", "assets", "shoes", f"{slug}.png")
out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "shoes", "views")
os.makedirs(out_dir, exist_ok=True)

ANGLES = {
    "rear34": "rotated to a three-quarter REAR view showing the heel counter and outsole edge",
    "front34": "rotated to a three-quarter FRONT view showing the toe box",
}

for name, angle in ANGLES.items():
    resp = requests.post(
        "https://api.openai.com/v1/images/edits",
        headers={"Authorization": f"Bearer {KEY}"},
        files={"image": (f"{slug}.png", open(src, "rb"), "image/png")},
        data={
            "model": "gpt-image-1",
            "prompt": (
                f"The exact same running shoe as in the image, identical colourway and "
                f"materials, {angle}, floating on a fully transparent background, "
                f"photorealistic product photography, consistent studio lighting"
            ),
            "size": "1024x1024",
            "quality": "medium",
            "background": "transparent",
        },
        timeout=300,
    )
    resp.raise_for_status()
    b64 = resp.json()["data"][0]["b64_json"]
    out = os.path.join(out_dir, f"{slug}--{name}.png")
    with open(out, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"{name}: wrote {out} ({os.path.getsize(out)//1024}KB)")
