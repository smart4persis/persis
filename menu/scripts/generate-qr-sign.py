#!/usr/bin/env python3
"""Generate QR menu sign assets (PNG + PDF) matching menu styling."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import qrcode
from PIL import Image

MENU_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = MENU_DIR / "assets"
QR_DIR = ASSETS_DIR / "qr"
QR_PATH = QR_DIR / "qr-menu-code.png"
WHATSAPP_QR_PATH = ASSETS_DIR / "qr-whatsapp-code.png"
FACEBOOK_QR_PATH = ASSETS_DIR / "qr-facebook-code.png"
INSTAGRAM_QR_PATH = ASSETS_DIR / "qr-instagram-code.png"
RENDER_SCRIPT = MENU_DIR / "scripts" / "render-qr-sign.js"

MENU_URL = "https://persisbiryanihouston.com/menu"
WHATSAPP_URL = "https://chat.whatsapp.com/HHJR7gD3ujzKkaxRvoVZCO"
FACEBOOK_URL = "https://www.facebook.com/persisbiryaniindiangrillhouston/"
INSTAGRAM_URL = "https://www.instagram.com/persisbiryani1"
MENU_QR_PX = 1110  # 1.85in @ 600 DPI source for sharp downscale
SOCIAL_QR_PX = 346  # 0.72in @ 480 DPI for menu back cover print


def generate_qr_code(url: str, path: Path, size_px: int) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=24,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0a1f1a", back_color="#f5efe3").convert("RGB")
    img = img.resize((size_px, size_px), Image.Resampling.NEAREST)
    img.save(path, "PNG", optimize=False)
    print(f"Wrote {path} ({size_px}x{size_px}px)")


def render_sign() -> None:
    result = subprocess.run(
        ["node", str(RENDER_SCRIPT)],
        cwd=MENU_DIR / "scripts",
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        raise SystemExit(result.returncode)
    print(result.stdout.strip())


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    QR_DIR.mkdir(parents=True, exist_ok=True)
    generate_qr_code(MENU_URL, QR_PATH, MENU_QR_PX)
    generate_qr_code(WHATSAPP_URL, WHATSAPP_QR_PATH, SOCIAL_QR_PX)
    generate_qr_code(FACEBOOK_URL, FACEBOOK_QR_PATH, SOCIAL_QR_PX)
    generate_qr_code(INSTAGRAM_URL, INSTAGRAM_QR_PATH, SOCIAL_QR_PX)
    render_sign()


if __name__ == "__main__":
    main()
