"""Normalize cut product images to a CONSISTENT frame.

Each rembg cut leaves the shoe at a different size/position in a different-shaped
canvas, so the shoes render at wildly different sizes (a banner crop shows a tiny
shoe; a tight crop shows a huge one). This trims every cut to the shoe's alpha
bounding box, then pads it back out to a UNIFORM aspect ratio with the shoe
filling a uniform fraction — so every product shot renders at a consistent size
(matching the well-framed Asics shots). Centered, transparent padding.

Idempotent: trimming to the alpha bbox recovers the shoe regardless of any
padding a previous run added, so re-running is safe. Run after cut-images.py.

Usage: python scripts/normalize-images.py
"""
import glob
import os

from PIL import Image

ASPECT = 2.2   # uniform canvas width : height (side-profile shoe friendly)
FILL = 0.84    # shoe fills this fraction of the limiting canvas dimension
MAX_W = 900    # cap output width so files stay lean (only ever downscales)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "shoes")

done = 0
for f in sorted(glob.glob(os.path.join(OUT_DIR, "*.png"))):
    im = Image.open(f).convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        continue
    shoe = im.crop(bbox)
    sw, sh = shoe.size
    # canvas sized so the limiting dimension of the shoe fills exactly FILL,
    # and the other dimension never exceeds FILL either
    cw = max(sw, sh * ASPECT) / FILL
    ch = cw / ASPECT
    if cw > MAX_W:
        scale = MAX_W / cw
        cw, ch = MAX_W, MAX_W / ASPECT
        shoe = shoe.resize((round(sw * scale), round(sh * scale)), Image.LANCZOS)
        sw, sh = shoe.size
    canvas = Image.new("RGBA", (round(cw), round(ch)), (0, 0, 0, 0))
    canvas.alpha_composite(shoe, (round((cw - sw) / 2), round((ch - sh) / 2)))
    canvas.save(f, optimize=True)
    done += 1

print(f"normalized {done} images to {ASPECT}:1 @ {int(FILL * 100)}% fill")
