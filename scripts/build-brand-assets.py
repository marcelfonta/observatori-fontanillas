"""Genera el paquet PNG de marca a partir de geometria vectorial equivalent."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "icons"
SCALE = 4


def scaled(points, factor):
    return [(round(x * factor), round(y * factor)) for x, y in points]


def draw_symbol(size, maskable=False):
    canvas = size * SCALE
    image = Image.new("RGB", (canvas, canvas), "#205846")
    draw = ImageDraw.Draw(image)
    if maskable:
        inset = round(canvas * .20)
        card_inset = inset
    else:
        card_inset = round(canvas * .055)

    left = card_inset
    top = card_inset
    right = canvas - card_inset
    bottom = canvas - card_inset
    radius = round((right - left) * .25)
    stroke = max(SCALE, round(canvas * .018))
    draw.rounded_rectangle(
        (left, top, right, bottom), radius=radius,
        fill="#286D55", outline="#A3E5B5", width=stroke
    )

    span = right - left
    def px(x): return left + span * x
    def py(y): return top + span * y

    draw.ellipse(
        (px(.72), py(.16), px(.89), py(.33)),
        fill="#E6C56C"
    )
    draw.polygon(scaled([
        (px(.10) / SCALE, py(.79) / SCALE),
        (px(.36) / SCALE, py(.34) / SCALE),
        (px(.52) / SCALE, py(.57) / SCALE),
        (px(.67) / SCALE, py(.40) / SCALE),
        (px(.91) / SCALE, py(.79) / SCALE),
    ], SCALE), fill="#70AD87")
    draw.polygon(scaled([
        (px(.10) / SCALE, py(.79) / SCALE),
        (px(.36) / SCALE, py(.40) / SCALE),
        (px(.66) / SCALE, py(.79) / SCALE),
    ], SCALE), fill="#C1F3CE")

    line = [
        (px(.11), py(.80)), (px(.25), py(.83)), (px(.40), py(.83)),
        (px(.56), py(.79)), (px(.72), py(.78)), (px(.89), py(.81)),
    ]
    draw.line(line, fill="#A3E2EE", width=max(SCALE, round(span * .035)), joint="curve")
    return image.resize((size, size), Image.Resampling.LANCZOS)


def save(size, name, maskable=False):
    draw_symbol(size, maskable=maskable).save(OUT / name, optimize=True)


OUT.mkdir(parents=True, exist_ok=True)
save(16, "favicon-16.png")
save(32, "favicon-32.png")
save(180, "apple-touch-icon.png")
save(192, "icon-192.png")
save(512, "icon-512.png")
save(192, "icon-maskable-192.png", maskable=True)
save(512, "icon-maskable-512.png", maskable=True)
print("Paquet d’icones V12.2 generat.")
