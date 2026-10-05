#!/usr/bin/env python3
"""Extract local INUNCAT risk from an official CECAT communiqué.

The script deliberately fails closed: an unknown document structure, missing
maps, stale dates or an unrecognised colour never produces a social card.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import re
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader


TIME_ZONE = ZoneInfo("Europe/Madrid")
STATION_LATITUDE = 41.6906
STATION_LONGITUDE = 2.4890
LOCAL_RADIUS_KM = 12.0

# Geographic extent used by the official 350 x 350 Catalonia maps. The visible
# silhouette is detected per image; these bounds only locate Sant Celoni inside
# that silhouette and are intentionally used with a 12 km neighbourhood.
CATALONIA_BOUNDS = (0.159, 40.523, 3.333, 42.861)

RISK_COLOURS = {
    "green": ((138, 184, 45), 1, "Verd"),
    "yellow": ((229, 193, 0), 2, "Groc"),
    "orange": ((229, 148, 0), 3, "Taronja"),
    "red": ((229, 0, 0), 4, "Vermell"),
}

WINDOW_BY_XOBJECT = {
    "img1": (0, 6),
    "img3": (6, 12),
    "img5": (12, 18),
    "img7": (18, 24),
}


@dataclass(frozen=True)
class MapRisk:
    target_date: str
    phenomenon: str
    start_hour_utc: int
    end_hour_utc: int
    level: str
    rank: int
    counts: dict[str, int]
    image: Image.Image
    station_xy: tuple[int, int]


class NoSupportedRiskMaps(Exception):
    """The communiqué is valid but does not carry the four map panels we publish."""


def safe_official_url(value: str) -> str:
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme != "https" or parsed.hostname != "documents.dadesobertes.gencat.cat":
        raise ValueError("El comunicat no prové del domini oficial de dades obertes de la Generalitat.")
    if not parsed.path.lower().endswith(".pdf"):
        raise ValueError("L'enllaç oficial no apunta a un PDF.")
    return parsed.geturl()


def download_pdf(url: str, limit: int = 12 * 1024 * 1024) -> bytes:
    request = urllib.request.Request(safe_official_url(url), headers={"User-Agent": "MeteoFontanillas/CECAT"})
    with urllib.request.urlopen(request, timeout=30) as response:
        content_type = response.headers.get_content_type()
        content_length = int(response.headers.get("Content-Length") or 0)
        if content_length > limit:
            raise ValueError("El comunicat oficial supera el límit de mida.")
        data = response.read(limit + 1)
    if len(data) > limit or content_type not in {"application/pdf", "application/octet-stream"}:
        raise ValueError("La resposta oficial no és un PDF admissible.")
    if not data.startswith(b"%PDF-"):
        raise ValueError("El fitxer rebut no té capçalera PDF.")
    return data


def nearest_risk(pixel: tuple[int, int, int, int]) -> tuple[str, int] | None:
    red, green, blue, alpha = pixel
    if alpha < 180:
        return None
    closest = min(
        RISK_COLOURS.items(),
        key=lambda item: (red - item[1][0][0]) ** 2 + (green - item[1][0][1]) ** 2 + (blue - item[1][0][2]) ** 2,
    )
    distance = math.sqrt(sum((value - expected) ** 2 for value, expected in zip((red, green, blue), closest[1][0])))
    return (closest[0], closest[1][1]) if distance <= 48 else None


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox or bbox[2] - bbox[0] < image.width * 0.65 or bbox[3] - bbox[1] < image.height * 0.65:
        raise ValueError("La silueta del mapa oficial no té les dimensions esperades.")
    return bbox


def geographic_pixel(image: Image.Image, longitude: float, latitude: float) -> tuple[int, int]:
    left, bottom_lat, right, top_lat = CATALONIA_BOUNDS
    bbox_left, bbox_top, bbox_right, bbox_bottom = alpha_bbox(image)
    x = bbox_left + (longitude - left) / (right - left) * (bbox_right - bbox_left - 1)
    y = bbox_top + (top_lat - latitude) / (top_lat - bottom_lat) * (bbox_bottom - bbox_top - 1)
    return round(x), round(y)


def local_patch_risk(image: Image.Image) -> tuple[str, int, dict[str, int], tuple[int, int]]:
    rgba = image.convert("RGBA")
    station_x, station_y = geographic_pixel(rgba, STATION_LONGITUDE, STATION_LATITUDE)
    # At Sant Celoni's latitude the official map is approximately 1.2 px/km.
    radius = max(6, round(LOCAL_RADIUS_KM * 1.2))
    counts = {key: 0 for key in RISK_COLOURS}
    for y in range(max(0, station_y - radius), min(rgba.height, station_y + radius + 1)):
        for x in range(max(0, station_x - radius), min(rgba.width, station_x + radius + 1)):
            if (x - station_x) ** 2 + (y - station_y) ** 2 > radius**2:
                continue
            classified = nearest_risk(rgba.getpixel((x, y)))
            if classified:
                counts[classified[0]] += 1
    coloured = sum(counts.values())
    if coloured < 30:
        raise ValueError("No s'ha pogut identificar amb prou confiança l'àrea local al mapa.")
    present = [(key, data[1]) for key, data in RISK_COLOURS.items() if counts[key] >= max(5, round(coloured * 0.015))]
    if not present:
        raise ValueError("No s'ha pogut classificar el risc local.")
    level, rank = max(present, key=lambda item: item[1])
    return level, rank, counts, (station_x, station_y)


def xobject_key(name: str) -> str:
    return Path(name).stem.lower()


def extract_map_risks(pdf: bytes) -> list[MapRisk]:
    reader = PdfReader(io.BytesIO(pdf))
    risks: list[MapRisk] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        date_match = re.search(r"Dia:\s*(\d{2})/(\d{2})/(\d{4})", text)
        if not date_match or "Intensitat de pluja" not in text:
            continue
        target_date = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"
        phenomenon = "Intensitat de pluja en 3 hores" if "en 3 hores" in text else "Intensitat de pluja"
        images = {xobject_key(item.name): item.image.convert("RGBA") for item in page.images if item.image.mode == "RGBA"}
        if not set(WINDOW_BY_XOBJECT).issubset(images):
            # Some CECAT updates start the annex with a carry-over page that
            # only contains the remaining two panels from the previous day.
            # Its local XObject names are reused from zero, so those panels
            # cannot be mapped to time windows safely. Ignore that incomplete
            # page and continue until a complete, unambiguous four-panel page.
            # A page that claims to contain four maps but changes their
            # structure must still fail closed.
            if 0 < len(images) < len(WINDOW_BY_XOBJECT):
                continue
            raise ValueError(f"Estructura de mapes oficials no reconeguda per al {target_date}.")
        for key, (start_hour, end_hour) in WINDOW_BY_XOBJECT.items():
            level, rank, counts, station_xy = local_patch_risk(images[key])
            risks.append(MapRisk(target_date, phenomenon, start_hour, end_hour, level, rank, counts, images[key], station_xy))
    if not risks:
        raise NoSupportedRiskMaps("El comunicat no conté mapes municipals de risc de pluja reconeguts.")
    return risks


def local_window_label(item: MapRisk) -> tuple[str, str, str]:
    base = datetime.fromisoformat(item.target_date).replace(tzinfo=timezone.utc)
    start = (base + timedelta(hours=item.start_hour_utc)).astimezone(TIME_ZONE)
    end = (base + timedelta(hours=item.end_hour_utc)).astimezone(TIME_ZONE)
    date_label = start.strftime("%d/%m/%Y")
    if start.date() == end.date():
        window = f"{start:%H:%M}–{end:%H:%M} h"
    else:
        window = f"{start:%d/%m %H:%M}–{end:%d/%m %H:%M} h"
    return date_label, window, end.isoformat()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    choices = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for choice in choices:
        if Path(choice).exists():
            return ImageFont.truetype(choice, size=size)
    return ImageFont.load_default(size=size)


def cover_logo(canvas: Image.Image, logo_path: Path, xy: tuple[int, int], size: int) -> None:
    if not logo_path.exists():
        return
    logo = Image.open(logo_path).convert("RGBA")
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, (xy[0] + (size - logo.width) // 2, xy[1] + (size - logo.height) // 2))


def render_card(items: list[MapRisk], metadata: dict, output_png: Path, output_jpg: Path, logo_path: Path) -> None:
    if len(items) != 4 or len(metadata.get("windows", [])) != 4:
        raise ValueError("Calen exactament les quatre franges oficials per generar la targeta.")
    width, height = 1080, 1350
    canvas = Image.new("RGBA", (width, height), "#061f18")
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((32, 32, width - 32, height - 32), 42, fill="#0b3025", outline="#376f5b", width=3)
    cover_logo(canvas, logo_path, (72, 70), 88)
    draw.text((178, 72), "Meteo Fontanillas", font=font(39, True), fill="#f5faf7")
    draw.text((178, 121), "Observatori meteorològic · Sant Celoni", font=font(22), fill="#b4c8bf")
    draw.rounded_rectangle((780, 78, 988, 124), 23, fill="#173f32", outline="#5f9c83", width=2)
    draw.text((884, 101), "PROTECCIÓ CIVIL", anchor="mm", font=font(18, True), fill="#9fe3bd")

    draw.text((72, 192), "ACTUALITZACIÓ DE RISC LOCAL", font=font(22, True), fill="#86d8a7")
    draw.text((72, 232), "Risc de pluja · evolució del dia", font=font(43, True), fill="#ffffff")
    draw.text((72, 294), f"{metadata['dateLabel']} · Sant Celoni i entorn · hora local", font=font(25, True), fill="#c6d8d0")

    positions = [(72, 350), (552, 350), (72, 710), (552, 710)]
    level_colours = {"green": "#8ab82d", "yellow": "#e5c100", "orange": "#e59400", "red": "#e50000"}
    for item, (panel_x, panel_y), window in zip(items, positions, metadata["windows"]):
        panel = (panel_x, panel_y, panel_x + 456, panel_y + 326)
        draw.rounded_rectangle(panel, 25, fill="#f4f1e9", outline="#77b796", width=3)
        draw.text((panel_x + 24, panel_y + 22), window["windowLabel"], font=font(22, True), fill="#173b2f")
        badge_colour = level_colours[item.level]
        badge_text = RISK_COLOURS[item.level][2].upper()
        draw.rounded_rectangle((panel_x + 317, panel_y + 17, panel_x + 432, panel_y + 53), 18, fill=badge_colour)
        badge_text_colour = "#ffffff" if item.level in {"orange", "red"} else "#173025"
        draw.text((panel_x + 374, panel_y + 35), badge_text, anchor="mm", font=font(15, True), fill=badge_text_colour)

        official = item.image.copy()
        marker = ImageDraw.Draw(official)
        x, y = item.station_xy
        marker.ellipse((x - 11, y - 11, x + 11, y + 11), outline="white", width=6)
        marker.ellipse((x - 6, y - 6, x + 6, y + 6), outline="#073329", width=3)
        official = official.resize((264, 264), Image.Resampling.LANCZOS)
        canvas.alpha_composite(official, (panel_x + 96, panel_y + 58))

    draw.text((72, 1082), "Quatre franges oficials · colors del mapa preservats", font=font(24, True), fill="#f5faf7")
    draw.text((72, 1122), "El marcador situa l’àrea de Sant Celoni. No és probabilitat de pluja.", font=font(20), fill="#c6d8d0")
    draw.text((72, 1160), "Consulta el comunicat vigent i segueix Protecció Civil.", font=font(20), fill="#c6d8d0")
    draw.line((72, 1230, 1008, 1230), fill="#376f5b", width=2)
    draw.text((72, 1260), "Font: CECAT · Protecció Civil · Generalitat de Catalunya", font=font(17), fill="#a9c0b6")
    draw.text((1008, 1260), "meteo.fontanillas.cat", anchor="ra", font=font(18, True), fill="#8fe0ad")

    output_png.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output_png, "PNG", optimize=True)
    canvas.convert("RGB").save(output_jpg, "JPEG", quality=92, optimize=True, progressive=True)


def window_end(item: MapRisk) -> datetime:
    base = datetime.fromisoformat(item.target_date).replace(tzinfo=timezone.utc)
    return base + timedelta(hours=item.end_hour_utc)


def build_result(pdf: bytes, args: argparse.Namespace) -> tuple[dict, list[MapRisk]]:
    risks = extract_map_risks(pdf)
    now = datetime.now(timezone.utc)
    allowed_dates = {(now.astimezone(TIME_ZONE).date() + timedelta(days=offset)).isoformat() for offset in range(4)}
    groups: dict[tuple[str, str], list[MapRisk]] = {}
    for item in risks:
        groups.setdefault((item.target_date, item.phenomenon), []).append(item)
    candidates: list[tuple[int, str, str, list[MapRisk]]] = []
    for (target_date, phenomenon), items in groups.items():
        ordered = sorted(items, key=lambda item: item.start_hour_utc)
        if target_date not in allowed_dates or len(ordered) != 4 or [item.start_hour_utc for item in ordered] != [0, 6, 12, 18]:
            continue
        future_severe = [item for item in ordered if item.rank >= 3 and window_end(item) > now]
        if future_severe:
            candidates.append((max(item.rank for item in future_severe), target_date, phenomenon, ordered))
    if not candidates:
        return {
            "publishable": False,
            "reason": "no_local_orange_red_risk",
            "documentKey": args.document_key,
            "documentUrl": args.document_url,
            "checkedAt": now.isoformat(),
        }, []
    _, _, _, selected = sorted(candidates, key=lambda item: (item[1], -item[0], -int("3 hores" in item[2])))[0]
    strongest = max(selected, key=lambda item: item.rank)
    date_label = datetime.fromisoformat(strongest.target_date).strftime("%d/%m/%Y")
    _, _, valid_until = local_window_label(selected[-1])
    windows = []
    for item in selected:
        _, window_label, end_at = local_window_label(item)
        windows.append({
            "startHourUtc": item.start_hour_utc,
            "endHourUtc": item.end_hour_utc,
            "windowLabel": window_label,
            "endAt": end_at,
            "level": item.level,
            "levelLabel": RISK_COLOURS[item.level][2],
            "riskCounts": item.counts,
        })
    issued_at = now.isoformat()
    result = {
        "publishable": True,
        "source": "CECAT",
        "plan": args.plan,
        "phase": args.phase,
        "officialIssueLabel": args.issued_label,
        "description": args.description,
        "documentKey": args.document_key,
        "documentUrl": args.document_url,
        "documentSha256": hashlib.sha256(pdf).hexdigest(),
        "issuedAt": issued_at,
        "targetDate": strongest.target_date,
        "dateLabel": date_label,
        "windows": windows,
        "validUntil": valid_until,
        "phenomenon": strongest.phenomenon,
        "level": strongest.level,
        "levelLabel": RISK_COLOURS[strongest.level][2],
        "locality": "Sant Celoni i entorn proper",
        "radiusKm": LOCAL_RADIUS_KM,
        "analysisMethod": "official-raster-local-patch-v1",
        "checkedAt": now.isoformat(),
    }
    return result, selected


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--document-url", required=True)
    parser.add_argument("--document-key", required=True)
    parser.add_argument("--plan", default="INUNCAT")
    parser.add_argument("--phase", default="")
    parser.add_argument("--issued-label", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--output-dir", default="build/cecat-local-risk")
    parser.add_argument("--logo", default="assets/icons/icon-512.png")
    args = parser.parse_args()
    output = Path(args.output_dir)
    try:
        pdf = download_pdf(args.document_url)
        metadata, selected = build_result(pdf, args)
        output.mkdir(parents=True, exist_ok=True)
        (output / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        if selected:
            render_card(selected, metadata, output / "card.png", output / "card.jpg", Path(args.logo))
        print(json.dumps(metadata, ensure_ascii=False))
        return 0
    except NoSupportedRiskMaps as error:
        # CECAT also publishes perfectly valid text-only updates. They are not
        # suitable for this visual product, but their absence of maps is an
        # expected no-op rather than an operational failure.
        output.mkdir(parents=True, exist_ok=True)
        skipped = {
            "publishable": False,
            "reason": "no_supported_risk_maps",
            "message": str(error),
            "documentKey": args.document_key,
            "documentUrl": args.document_url,
            "documentSha256": hashlib.sha256(pdf).hexdigest(),
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
        (output / "metadata.json").write_text(json.dumps(skipped, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(skipped, ensure_ascii=False))
        return 0
    except Exception as error:  # fail closed and leave a machine-readable audit
        output.mkdir(parents=True, exist_ok=True)
        failure = {"publishable": False, "reason": "processing_error", "error": str(error)[:500]}
        (output / "metadata.json").write_text(json.dumps(failure, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(failure, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
