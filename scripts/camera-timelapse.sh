#!/usr/bin/env bash
set -Eeuo pipefail

# Genera el timelapse diari des de l'arxiu local de la Raspberry.
# Amb --auto, només demana publicació per a dilluns, dimecres i divendres.

usage() {
  echo "Ús: $0 [AAAA-MM-DD|yesterday] [--upload-preview|--auto]" >&2
}

DATE="${1:-$(date +%F)}"
UPLOAD="${2:-}"
if [[ "$DATE" == "yesterday" ]]; then
  DATE="$(date -d yesterday +%F)"
fi
if [[ ! "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || [[ -n "$UPLOAD" && "$UPLOAD" != "--upload-preview" && "$UPLOAD" != "--auto" ]]; then
  usage
  exit 2
fi

for command in ffmpeg find sort mktemp; do
  command -v "$command" >/dev/null || { echo "Falta l'ordre $command" >&2; exit 1; }
done

YEAR="${DATE:0:4}"
MONTH="${DATE:5:2}"
DAY="${DATE:8:2}"
BASE="${CAMERA_BASE:-$HOME/meteo-camera}"
SOURCE_DIR="$BASE/arxiu/$YEAR/$MONTH/$DAY"
OUTPUT_DIR="$BASE/timelapses"
OUTPUT="$OUTPUT_DIR/meteo-fontanillas-nord-$DATE.mp4"
OUTPUT_TMP="$OUTPUT.part"
mkdir -p "$OUTPUT_DIR"

[[ -d "$SOURCE_DIR" ]] || { echo "No existeix l'arxiu $SOURCE_DIR" >&2; exit 1; }
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"; rm -f "$OUTPUT_TMP"' EXIT
LIST="$TMP_DIR/frames.txt"

while IFS= read -r image; do
  printf "file '%s'\n" "${image//\'/\'\\\'\'}" >> "$LIST"
  printf 'duration 0.12\n' >> "$LIST"
done < <(find "$SOURCE_DIR" -maxdepth 1 -type f -name 'nord-*.jpg' -size +20k -print | sort)

FRAME_COUNT="$(grep -c '^file ' "$LIST" 2>/dev/null || true)"
if (( FRAME_COUNT < 6 )); then
  echo "Calen almenys 6 captures vàlides; n'hi ha $FRAME_COUNT." >&2
  exit 1
fi
LAST_FRAME="$(tail -n 2 "$LIST" | head -n 1 | sed "s/^file '//;s/'$//")"
printf "file '%s'\n" "$LAST_FRAME" >> "$LIST"

FONT="$(fc-match -f '%{file}' 'DejaVu Sans:style=Bold' 2>/dev/null || true)"
[[ -f "$FONT" ]] || FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FILTER="scale=960:-2,split=7[base][l1][l2][l3][r1][r2][r3];[l1]crop=iw*0.10:ih*0.28:0:ih*0.55,boxblur=8:2[l1b];[l2]crop=iw*0.09:ih*0.24:iw*0.10:ih*0.62,boxblur=8:2[l2b];[l3]crop=iw*0.06:ih*0.18:iw*0.19:ih*0.70,boxblur=8:2[l3b];[r1]crop=iw*0.08:ih*0.17:iw*0.76:ih*0.77,boxblur=8:2[r1b];[r2]crop=iw*0.08:ih*0.23:iw*0.84:ih*0.69,boxblur=8:2[r2b];[r3]crop=iw*0.08:ih*0.30:iw*0.92:ih*0.60,boxblur=8:2[r3b];[base][l1b]overlay=0:H*0.55[m1];[m1][l2b]overlay=W*0.10:H*0.62[m2];[m2][l3b]overlay=W*0.19:H*0.70[m3];[m3][r1b]overlay=W*0.76:H*0.77[m4];[m4][r2b]overlay=W*0.84:H*0.69[m5];[m5][r3b]overlay=W*0.92:H*0.60"
if ffmpeg -hide_banner -filters 2>/dev/null | grep ' drawtext ' >/dev/null; then
  FILTER+=",drawbox=x=0:y=ih-70:w=iw:h=70:color=black@0.58:t=fill,drawtext=fontfile='$FONT':text='Meteo Fontanillas · Sant Celoni · Càmera nord':fontcolor=white:fontsize=30:x=28:y=h-th-22"
else
  echo "Avís: aquest ffmpeg no inclou drawtext; la prova es crea sense rètol." >&2
fi

rm -f "$OUTPUT_TMP"
ffmpeg -nostdin -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$LIST" \
  -vf "$FILTER" -r 20 -an -c:v libx264 -threads 1 -preset ultrafast -crf 22 \
  -pix_fmt yuv420p -movflags +faststart -f mp4 "$OUTPUT_TMP"
[[ -s "$OUTPUT_TMP" ]] || { echo "FFmpeg no ha creat un vídeo vàlid." >&2; exit 1; }
mv "$OUTPUT_TMP" "$OUTPUT"

echo "Timelapse creat: $OUTPUT"
echo "Fotogrames: $FRAME_COUNT"
AUTO_DAY=false
case "$(date -d "$DATE" +%u)" in
  1|3|5) AUTO_DAY=true ;;
esac
if [[ "$UPLOAD" == "--auto" && "$AUTO_DAY" == true ]]; then
  echo "Publicació automàtica: prevista a Instagram, Facebook, TikTok i YouTube"
else
  echo "Publicació automàtica: no correspon a aquesta data"
fi

if [[ "$UPLOAD" == "--upload-preview" || "$UPLOAD" == "--auto" ]]; then
  ENV_FILE="${CAMERA_UPLOAD_ENV:-$HOME/.config/meteo-camera/upload.env}"
  [[ -r "$ENV_FILE" ]] || { echo "No es pot llegir $ENV_FILE" >&2; exit 1; }
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  : "${CAMERA_UPLOAD_URL:?Falta CAMERA_UPLOAD_URL}"
  : "${CAMERA_UPLOAD_TOKEN:?Falta CAMERA_UPLOAD_TOKEN}"
  PREVIEW_URL="${CAMERA_UPLOAD_URL%/camera/nord/upload}/camera/nord/timelapse-upload"
  curl --fail --silent --show-error --max-time 180 --retry 2 --retry-all-errors \
    -X PUT "$PREVIEW_URL" \
    -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
    -H 'Content-Type: video/mp4' \
    -H "Content-Length: $(stat -c %s "$OUTPUT")" \
    -H "X-Timelapse-Date: $DATE" \
    -H "X-Timelapse-Frames: $FRAME_COUNT" \
    --data-binary "@$OUTPUT"
  echo
  if [[ "$UPLOAD" == "--auto" && "$AUTO_DAY" == true ]]; then
    PUBLISH_URL="${CAMERA_UPLOAD_URL%/camera/nord/upload}/camera/nord/timelapse-publish"
    curl --fail --silent --show-error --max-time 180 --retry 2 --retry-all-errors \
      -X POST "$PUBLISH_URL" \
      -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
      -H 'Content-Type: application/json' \
      --data "{\"date\":\"$DATE\"}"
    echo
  fi
fi
