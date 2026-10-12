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

FILTER="split=7[base][l1][l2][l3][r1][r2][r3];[l1]crop=iw*0.10:ih*0.28:0:ih*0.55,boxblur=18:2[l1b];[l2]crop=iw*0.09:ih*0.24:iw*0.10:ih*0.62,boxblur=18:2[l2b];[l3]crop=iw*0.06:ih*0.18:iw*0.19:ih*0.70,boxblur=18:2[l3b];[r1]crop=iw*0.08:ih*0.17:iw*0.76:ih*0.77,boxblur=18:2[r1b];[r2]crop=iw*0.08:ih*0.23:iw*0.84:ih*0.69,boxblur=18:2[r2b];[r3]crop=iw*0.08:ih*0.30:iw*0.92:ih*0.60,boxblur=18:2[r3b];[base][l1b]overlay=0:H*0.55[m1];[m1][l2b]overlay=W*0.10:H*0.62[m2];[m2][l3b]overlay=W*0.19:H*0.70[m3];[m3][r1b]overlay=W*0.76:H*0.77[m4];[m4][r2b]overlay=W*0.84:H*0.69[m5];[m5][r3b]overlay=W*0.92:H*0.60,drawbox=x=0:y=ih-110:w=iw:h=110:color=black@0.58:t=fill,drawtext=fontfile='$FONT':text='Meteo Fontanillas · Sant Celoni · Càmera nord':fontcolor=white:fontsize=44:x=42:y=h-th-34"
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
