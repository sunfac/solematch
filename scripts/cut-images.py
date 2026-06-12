"""AI background removal for harvested product images (owner requirement).
Downloads each baked-background source, runs U2Net via rembg, writes
transparent PNGs to assets/shoes/<slug>.png. Re-run after new harvests.
Usage: python scripts/cut-images.py
"""
import io
import os
import urllib.request

from rembg import remove

SOURCES = {
    "adidas-adizero-evo-sl": "https://assets.adidas.com/images/w_600,f_auto,q_auto/b40f570a26144541bd73e1ee967ce5b1_9366/Adizero_EVO_SL_Shoes_White_JH6206_HM1.jpg",
    "adidas-adios-pro-4": "https://assets.adidas.com/images/w_600,f_auto,q_auto/f1f647656f4a4815a104d5b4c6fd019a_9366/Adizero_Adios_Pro_4_Shoes_Black_JR6365_HM1.jpg",
    "hoka-bondi-9": "https://dms.deckers.com/hoka/image/upload/t_product-xlarge-wp/v1780331724/1162011-FDNV_1.png?_s=RAABAB0",
    "saucony-endorphin-speed-5": "https://thekit.wolverineworldwide.com/match/media_lookup/S21007-10_1/?preset=dw-large",
}

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "shoes")
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

for slug, url in SOURCES.items():
    out_path = os.path.join(OUT_DIR, f"{slug}.png")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
    cut = remove(raw)
    with open(out_path, "wb") as f:
        f.write(cut)
    print(f"{slug}: {len(raw)//1024}KB -> {len(cut)//1024}KB transparent PNG")

print("done ->", os.path.abspath(OUT_DIR))
