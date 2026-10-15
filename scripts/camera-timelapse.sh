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
SOCIAL_OUTPUT="$OUTPUT_DIR/meteo-fontanillas-nord-$DATE-social.mp4"
SOCIAL_TMP="$SOCIAL_OUTPUT.part"
mkdir -p "$OUTPUT_DIR"

[[ -d "$SOURCE_DIR" ]] || { echo "No existeix l'arxiu $SOURCE_DIR" >&2; exit 1; }
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"; rm -f "$OUTPUT_TMP" "$SOCIAL_TMP"' EXIT
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
PRIVACY_FILTER="scale=960:-2,split=7[base][l1][l2][l3][r1][r2][r3];[l1]crop=iw*0.10:ih*0.28:0:ih*0.55,boxblur=8:2[l1b];[l2]crop=iw*0.09:ih*0.24:iw*0.10:ih*0.62,boxblur=8:2[l2b];[l3]crop=iw*0.06:ih*0.18:iw*0.19:ih*0.70,boxblur=8:2[l3b];[r1]crop=iw*0.08:ih*0.17:iw*0.76:ih*0.77,boxblur=8:2[r1b];[r2]crop=iw*0.08:ih*0.23:iw*0.84:ih*0.69,boxblur=8:2[r2b];[r3]crop=iw*0.08:ih*0.30:iw*0.92:ih*0.60,boxblur=8:2[r3b];[base][l1b]overlay=0:H*0.55[m1];[m1][l2b]overlay=W*0.10:H*0.62[m2];[m2][l3b]overlay=W*0.19:H*0.70[m3];[m3][r1b]overlay=W*0.76:H*0.77[m4];[m4][r2b]overlay=W*0.84:H*0.69[m5];[m5][r3b]overlay=W*0.92:H*0.60[private]"

# La versió principal selecciona el centre panoràmic en 16:9. Evita el zoom
# vertical extrem i conserva l'àrea marcada com a mínima a la prova visual.
FILTER="$PRIVACY_FILTER;[private]crop=ih*16/9:ih:(iw-ih*16/9)/2:0,scale=1280:720"

rm -f "$OUTPUT_TMP"
ffmpeg -nostdin -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$LIST" \
  -vf "$FILTER" -r 20 -an -c:v libx264 -threads 1 -preset ultrafast -crf 22 \
  -pix_fmt yuv420p -movflags +faststart -f mp4 "$OUTPUT_TMP"
[[ -s "$OUTPUT_TMP" ]] || { echo "FFmpeg no ha creat un vídeo vàlid." >&2; exit 1; }
mv "$OUTPUT_TMP" "$OUTPUT"

# Adaptació vertical per a Reels i TikTok. El mateix enquadrament 16:9 ocupa el
# centre del llenç sense deformar-se; el fons desenfocat només completa el 9:16.
SOCIAL_FILTER="$PRIVACY_FILTER;[private]split=2[bg][hero];[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=24:6,eq=brightness=-0.24[backdrop];[hero]crop=ih*16/9:ih:(iw-ih*16/9)/2:0,scale=720:405[panorama];[backdrop][panorama]overlay=0:(H-h)/2[composed]"
if ffmpeg -hide_banner -filters 2>/dev/null | grep ' drawtext ' >/dev/null; then
  SOCIAL_FILTER+=",drawbox=x=24:y=44:w=672:h=88:color=black@0.42:t=fill,drawtext=fontfile='$FONT':text='TIMELAPSE DEL CEL':fontcolor=white:fontsize=31:x=46:y=70,drawbox=x=24:y=h-122:w=672:h=78:color=black@0.42:t=fill,drawtext=fontfile='$FONT':text='PANORÀMICA COMPLETA':fontcolor=white@0.86:fontsize=18:x=46:y=h-101,drawtext=fontfile='$FONT':text='meteo.fontanillas.cat':fontcolor=white:fontsize=24:x=46:y=h-76"
fi

rm -f "$SOCIAL_TMP"
ffmpeg -nostdin -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$LIST" \
  -vf "$SOCIAL_FILTER" -r 20 -an -c:v libx264 -threads 1 \
  -preset ultrafast -crf 22 -pix_fmt yuv420p -movflags +faststart -f mp4 "$SOCIAL_TMP"
[[ -s "$SOCIAL_TMP" ]] || { echo "FFmpeg no ha creat la versió social vertical." >&2; exit 1; }
mv "$SOCIAL_TMP" "$SOCIAL_OUTPUT"

echo "Timelapse creat: $OUTPUT"
echo "Versió social 9:16: $SOCIAL_OUTPUT"
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
    -H 'X-Timelapse-Variant: landscape' \
    --data-binary "@$OUTPUT"
  echo
  curl --fail --silent --show-error --max-time 180 --retry 2 --retry-all-errors \
    -X PUT "$PREVIEW_URL" \
    -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
    -H 'Content-Type: video/mp4' \
    -H "Content-Length: $(stat -c %s "$SOCIAL_OUTPUT")" \
    -H "X-Timelapse-Date: $DATE" \
    -H "X-Timelapse-Frames: $FRAME_COUNT" \
    -H 'X-Timelapse-Variant: vertical' \
    --data-binary "@$SOCIAL_OUTPUT"
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
