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
    image = Image.new("RGB", (canvas, canvas), "#2D765C")
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
        fill="#378368", outline="#B8F0C8", width=stroke
    )

    span = right - left
    def px(x): return left + span * x
    def py(y): return top + span * y

    draw.ellipse(
        (px(.72), py(.16), px(.89), py(.33)),
        fill="#FFD37A"
    )
    draw.polygon(scaled([
        (px(.09) / SCALE, py(.76) / SCALE),
        (px(.35) / SCALE, py(.34) / SCALE),
        (px(.50) / SCALE, py(.55) / SCALE),
        (px(.67) / SCALE, py(.38) / SCALE),
        (px(.92) / SCALE, py(.76) / SCALE),
    ], SCALE), fill="#80C49A")
    draw.polygon(scaled([
        (px(.09) / SCALE, py(.76) / SCALE),
        (px(.35) / SCALE, py(.43) / SCALE),
        (px(.52) / SCALE, py(.65) / SCALE),
        (px(.62) / SCALE, py(.54) / SCALE),
        (px(.82) / SCALE, py(.76) / SCALE),
    ], SCALE), fill="#D9F7DE")

    line = [
        (px(.12), py(.80)), (px(.27), py(.80)), (px(.31), py(.74)),
        (px(.36), py(.84)), (px(.42), py(.77)), (px(.55), py(.77)),
        (px(.59), py(.73)), (px(.64), py(.82)), (px(.88), py(.82)),
    ]
    draw.line(line, fill="#A9ECF4", width=max(SCALE, round(span * .032)), joint="curve")
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
print("Paquet d’icones V21 generat.")
