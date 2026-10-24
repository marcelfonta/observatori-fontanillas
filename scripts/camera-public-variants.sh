#!/usr/bin/env bash
set -Eeuo pipefail

# Genera l'única variant apta per a publicació. Les cases immediates dels dos
# extrems inferiors queden difuminades; l'original roman només a l'arxiu local.

BASE="${CAMERA_BASE:-$HOME/meteo-camera}"
SOURCE="${1:-$BASE/latest.jpg}"
OUTPUT="$BASE/latest-public.jpg"
PREVIEW="$BASE/latest-preview.jpg"
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
trap 'rm -f "$TEMP" "$PREVIEW_TEMP" "$CO2_VALUE" "$CO2_DATE"' EXIT
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
    FILTER="${FILTER},drawbox=x=75:y=85:w=2040:h=570:color=black@0.78:t=fill,drawbox=x=75:y=85:w=25:h=570:color=0xF4CE46:t=fill,drawtext=fontfile='$FONT':text='CO₂ ATMOSFÈRIC':fontcolor=0xF4CE46:fontsize=100:x=145:y=125,drawtext=fontfile='$FONT':textfile='$CO2_VALUE':fontcolor=white:fontsize=260:x=140:y=250,drawtext=fontfile='$FONT':text='ppm':fontcolor=white:fontsize=100:x=1540:y=390,drawtext=fontfile='$FONT':text='MAUNA LOA · NOAA':fontcolor=white:fontsize=80:x=145:y=555,drawtext=fontfile='$FONT':textfile='$CO2_DATE':fontcolor=white:fontsize=65:x=1370:y=565"
  fi
fi
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$SOURCE" -vf "$FILTER" -frames:v 1 -q:v 2 "$TEMP"
mv "$TEMP" "$OUTPUT"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$OUTPUT" -vf "scale=960:-2" -frames:v 1 -q:v 4 "$PREVIEW_TEMP"
mv "$PREVIEW_TEMP" "$PREVIEW"

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
