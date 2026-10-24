#!/usr/bin/env bash
set -Eeuo pipefail

# Genera l'única variant apta per a publicació. Les cases immediates dels dos
# extrems inferiors queden difuminades; l'original roman només a l'arxiu local.

BASE="${CAMERA_BASE:-$HOME/meteo-camera}"
SOURCE="${1:-$BASE/latest.jpg}"
if [[ "${CAMERA_PREVIEW_ONLY:-0}" == 1 ]]; then
  : "${CAMERA_PREVIEW_DIR:?Indica un directori temporal amb CAMERA_PREVIEW_DIR}"
  [[ -d "$CAMERA_PREVIEW_DIR" && "$CAMERA_PREVIEW_DIR" != "$BASE" ]] || { echo "El directori de prova ha de ser diferent del directori de la càmera" >&2; exit 1; }
  OUTPUT="$CAMERA_PREVIEW_DIR/latest-public.jpg"
  PREVIEW="$CAMERA_PREVIEW_DIR/latest-preview.jpg"
else
  OUTPUT="$BASE/latest-public.jpg"
  PREVIEW="$BASE/latest-preview.jpg"
fi
ENV_FILE="${CAMERA_UPLOAD_ENV:-$HOME/.config/meteo-camera/upload.env}"
FONT="$(fc-match -f '%{file}' 'DejaVu Sans:style=Bold' 2>/dev/null || true)"
[[ -f "$FONT" ]] || FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
[[ -r "$SOURCE" ]] || { echo "No es pot llegir $SOURCE" >&2; exit 1; }
[[ -r "$ENV_FILE" ]] || { echo "No es pot llegir $ENV_FILE" >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"
: "${CAMERA_UPLOAD_URL:?Falta CAMERA_UPLOAD_URL}"
: "${CAMERA_UPLOAD_TOKEN:?Falta CAMERA_UPLOAD_TOKEN}"

FILTER="split=7[base][l1][l2][l3][r1][r2][r3];[l1]crop=iw*0.10:ih*0.28:0:ih*0.55,boxblur=18:2[l1b];[l2]crop=iw*0.09:ih*0.24:iw*0.10:ih*0.62,boxblur=18:2[l2b];[l3]crop=iw*0.06:ih*0.18:iw*0.19:ih*0.70,boxblur=18:2[l3b];[r1]crop=iw*0.08:ih*0.17:iw*0.76:ih*0.77,boxblur=18:2[r1b];[r2]crop=iw*0.08:ih*0.23:iw*0.84:ih*0.69,boxblur=18:2[r2b];[r3]crop=iw*0.08:ih*0.30:iw*0.92:ih*0.60,boxblur=18:2[r3b];[base][l1b]overlay=0:H*0.55[m1];[m1][l2b]overlay=W*0.10:H*0.62[m2];[m2][l3b]overlay=W*0.19:H*0.70[m3];[m3][r1b]overlay=W*0.76:H*0.77[m4];[m4][r2b]overlay=W*0.84:H*0.69[m5];[m5][r3b]overlay=W*0.92:H*0.60,drawbox=x=75:y=ih-265:w=2420:h=190:color=0xF4CE46@0.95:t=fill,drawtext=fontfile='$FONT':text='SANT CELONI  ·  BAIX MONTSENY':fontcolor=0x14211D:fontsize=94:x=130:y=h-238,drawtext=fontfile='$FONT':text='METEO FONTANILLAS  ·  CÀMERA NORD':fontcolor=0x14211D:fontsize=57:x=134:y=h-144"
TEMP="$(mktemp --suffix=.jpg)"
PREVIEW_TEMP="$(mktemp --suffix=.jpg)"
CO2_VALUE="$(mktemp)"
CO2_DATE="$(mktemp)"
AIR_NO2="$(mktemp)"
AIR_O3="$(mktemp)"
AIR_PM10="$(mktemp)"
AIR_TIME="$(mktemp)"
AIR_NO2_COLOR="$(mktemp)"
AIR_O3_COLOR="$(mktemp)"
AIR_PM10_COLOR="$(mktemp)"
trap 'rm -f "$TEMP" "$PREVIEW_TEMP" "$CO2_VALUE" "$CO2_DATE" "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_TIME" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR"' EXIT
# El Worker és l'única font normalitzada; una fallada NOAA no atura la càmera.
CO2_URL="${CAMERA_UPLOAD_URL%/camera/nord/upload}/climate/co2"
if curl --fail --silent --show-error --max-time 5 "$CO2_URL" | python3 -c '
import json,sys
value_file,date_file=sys.argv[1:]
try:
    value=json.load(sys.stdin).get("co2")
    if not value or not value.get("fresh"):
        raise ValueError("missing or stale")
    ppm=float(value["ppm"])
    date=value["date"]
    if not 300 <= ppm <= 700:
        raise ValueError("out of range")
    if not isinstance(date,str) or len(date) != 10:
        raise ValueError("invalid date")
    with open(value_file,"w") as output:
        output.write(f"{ppm:.2f}")
    with open(date_file,"w") as output:
        output.write(date)
except (ValueError,KeyError,TypeError,json.JSONDecodeError):
    pass
' "$CO2_VALUE" "$CO2_DATE"; then
  if [[ -s "$CO2_VALUE" && -s "$CO2_DATE" ]]; then
    # Càpsula neutral: el valor de Mauna Loa no és cap mesura local de qualitat de l'aire.
    FILTER="${FILTER},drawbox=x=75:y=85:w=1110:h=155:color=black@0.48:t=fill,drawbox=x=75:y=85:w=11:h=155:color=0xF4CE46:t=fill,drawtext=fontfile='$FONT':text='CO₂':fontcolor=0xF4CE46:fontsize=78:x=120:y=119,drawtext=fontfile='$FONT':textfile='$CO2_VALUE':fontcolor=white:fontsize=108:x=390:y=100,drawtext=fontfile='$FONT':text='ppm':fontcolor=white:fontsize=50:x=910:y=154"
  fi
fi
# CAMS Europe és una estimació modelitzada d'una cel·la d'uns 11 km, no una
# lectura local de l'estació. Sense dades recents, no s'imprimeix cap valor.
if curl --fail --silent --show-error --max-time 5 \
  'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=41.6906&longitude=2.4890&current=nitrogen_dioxide,ozone,pm10&domains=cams_europe&timezone=UTC' | python3 -c '
import datetime,json,math,sys
from pathlib import Path
from zoneinfo import ZoneInfo
try:
    data=json.load(sys.stdin)
    current=data["current"]
    observed=datetime.datetime.fromisoformat(current["time"]+"+00:00")
    age=(datetime.datetime.now(datetime.timezone.utc)-observed).total_seconds()
    if not -1800 <= age <= 10800:
        raise ValueError("stale CAMS time")
    keys=("nitrogen_dioxide","ozone","pm10")
    values=[float(current[key]) for key in keys]
    if any(not math.isfinite(value) or not 0 <= value <= 1000 for value in values):
        raise ValueError("invalid CAMS value")
    # Franges horàries europees (EEA, revisió 2024). Els colors
    # classifiquen cada valor del model; no són un índex oficial de cap estació.
    limits=((10,25,60,100,150),(60,100,120,160,180),(15,45,120,195,270))
    colors=("0x238D5A","0xB8891F","0xC65F22","0xB73535","0x873F93","0x5F275B")
    for path,value,levels,color_path in zip(sys.argv[1:4],values,limits,sys.argv[5:8]):
        Path(path).write_text(str(round(value)))
        band=next((index for index,limit in enumerate(levels) if value <= limit),5)
        Path(color_path).write_text(colors[band])
    local=observed.astimezone(ZoneInfo("Europe/Madrid"))
    Path(sys.argv[4]).write_text(local.strftime("%d/%m %Hh ")+local.tzname())
except (ValueError,KeyError,TypeError,json.JSONDecodeError):
    pass
' "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_TIME" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR"; then
  if [[ -s "$AIR_NO2" && -s "$AIR_O3" && -s "$AIR_PM10" && -s "$AIR_TIME" && -s "$AIR_NO2_COLOR" && -s "$AIR_O3_COLOR" && -s "$AIR_PM10_COLOR" ]]; then
    for pollutant in NO2 O3 PM10; do
      case "$pollutant" in
        NO2) air_x=6030; air_value="$AIR_NO2"; air_color="$AIR_NO2_COLOR" ;;
        O3) air_x=6490; air_value="$AIR_O3"; air_color="$AIR_O3_COLOR" ;;
        PM10) air_x=6950; air_value="$AIR_PM10"; air_color="$AIR_PM10_COLOR" ;;
      esac
      FILTER="${FILTER},drawtext=fontfile='$FONT':text='●':fontcolor=$(cat "$air_color")@0.9:borderw=7:bordercolor=0x07241A@0.7:fontsize=360:x=$air_x:y=1690,drawtext=fontfile='$FONT':text='$pollutant':fontcolor=white:fontsize=64:x=$air_x+(300-text_w)/2:y=1755,drawtext=fontfile='$FONT':textfile='$air_value':fontcolor=white:fontsize=98:x=$air_x+(300-text_w)/2:y=1830"
    done
  fi
fi
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$SOURCE" -vf "$FILTER" -frames:v 1 -q:v 2 "$TEMP"
mv "$TEMP" "$OUTPUT"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$OUTPUT" -vf "scale=960:-2" -frames:v 1 -q:v 4 "$PREVIEW_TEMP"
mv "$PREVIEW_TEMP" "$PREVIEW"

if [[ "${CAMERA_PREVIEW_ONLY:-0}" == 1 ]]; then
  echo "Prova local preparada (sense pujada): $OUTPUT"
  echo "Miniatura local: $PREVIEW"
  exit 0
fi
CAPTURED_AT="$(date -r "$SOURCE" --iso-8601=seconds)"
curl --fail --silent --show-error --max-time 60 --retry 2 --retry-all-errors \
  -X PUT "${CAMERA_UPLOAD_URL%/camera/nord/upload}/camera/nord/upload-branded" \
  -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
  -H 'Content-Type: image/jpeg' \
  -H "Content-Length: $(stat -c %s "$OUTPUT")" \
  -H "X-Captured-At: $CAPTURED_AT" \
  --data-binary "@$OUTPUT"
echo
curl --fail --silent --show-error --max-time 60 --retry 2 --retry-all-errors \
  -X PUT "${CAMERA_UPLOAD_URL%/camera/nord/upload}/camera/nord/upload-preview" \
  -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
  -H 'Content-Type: image/jpeg' \
  -H "Content-Length: $(stat -c %s "$PREVIEW")" \
  -H "X-Captured-At: $CAPTURED_AT" \
  --data-binary "@$PREVIEW"
echo
echo "Variant pública amb privacitat actualitzada: $OUTPUT"
echo "Miniatura web actualitzada: $PREVIEW"
