#!/usr/bin/env bash
set -Eeuo pipefail

# Genera l'única variant apta per a publicació. Les cases immediates dels dos
# extrems inferiors queden difuminades; l'original roman només a l'arxiu local.

BASE="${CAMERA_BASE:-$HOME/meteo-camera}"
SOURCE="${1:-$BASE/latest.jpg}"
OUTPUT="$BASE/latest-public.jpg"
ENV_FILE="${CAMERA_UPLOAD_ENV:-$HOME/.config/meteo-camera/upload.env}"
FONT="$(fc-match -f '%{file}' 'DejaVu Sans:style=Bold' 2>/dev/null || true)"
[[ -f "$FONT" ]] || FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
[[ -r "$SOURCE" ]] || { echo "No es pot llegir $SOURCE" >&2; exit 1; }
[[ -r "$ENV_FILE" ]] || { echo "No es pot llegir $ENV_FILE" >&2; exit 1; }

FILTER="split=3[base][left][right];[left]crop=iw*0.23:ih*0.55:0:ih*0.45,boxblur=36:2[leftb];[right]crop=iw*0.28:ih*0.55:iw*0.72:ih*0.45,boxblur=36:2[rightb];[base][leftb]overlay=0:H-h[masked];[masked][rightb]overlay=W-w:H-h,drawbox=x=0:y=ih-110:w=iw:h=110:color=black@0.58:t=fill,drawtext=fontfile='$FONT':text='Meteo Fontanillas · Sant Celoni · Càmera nord':fontcolor=white:fontsize=44:x=42:y=h-th-34"
TEMP="$(mktemp --suffix=.jpg)"
trap 'rm -f "$TEMP"' EXIT
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$SOURCE" -vf "$FILTER" -frames:v 1 -q:v 2 "$TEMP"
mv "$TEMP" "$OUTPUT"

# shellcheck disable=SC1090
source "$ENV_FILE"
: "${CAMERA_UPLOAD_URL:?Falta CAMERA_UPLOAD_URL}"
: "${CAMERA_UPLOAD_TOKEN:?Falta CAMERA_UPLOAD_TOKEN}"
CAPTURED_AT="$(date -r "$SOURCE" --iso-8601=seconds)"
curl --fail --silent --show-error --max-time 60 --retry 2 --retry-all-errors \
  -X PUT "${CAMERA_UPLOAD_URL%/camera/nord/upload}/camera/nord/upload-branded" \
  -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
  -H 'Content-Type: image/jpeg' \
  -H "Content-Length: $(stat -c %s "$OUTPUT")" \
  -H "X-Captured-At: $CAPTURED_AT" \
  --data-binary "@$OUTPUT"
echo
echo "Variant pública amb privacitat actualitzada: $OUTPUT"
