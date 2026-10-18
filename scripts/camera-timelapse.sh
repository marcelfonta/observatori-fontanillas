#!/usr/bin/env bash
set -Eeuo pipefail

# Genera el timelapse diari des de l'arxiu local de la Raspberry.
# Amb --auto, prepara cada dia i delega al Worker la decisió de publicar.

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

for command in ffmpeg find sort mktemp grep; do
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
# La versió principal selecciona el centre panoràmic en 16:9 i elimina el 10%
# inferior, on apareixen les cases més pròximes. El retall substitueix els
# desenfocaments i redueix fortament el consum de memòria de la Raspberry.
FILTER="scale=960:-2,crop=ih*0.90*16/9:ih*0.90:(iw-ih*0.90*16/9)/2:0,scale=960:540"

rm -f "$OUTPUT_TMP"
MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel error -y \
  -threads 1 -f concat -safe 0 -i "$LIST" \
  -filter_threads 1 -filter_complex_threads 1 \
  -vf "$FILTER" -r 20 -an -c:v libx264 -threads 1 -preset ultrafast -crf 22 \
  -pix_fmt yuv420p -movflags +faststart -f mp4 "$OUTPUT_TMP"
[[ -s "$OUTPUT_TMP" ]] || { echo "FFmpeg no ha creat un vídeo vàlid." >&2; exit 1; }
mv "$OUTPUT_TMP" "$OUTPUT"

# Adaptació vertical lleugera per a Reels i TikTok. Reutilitza el panoràmic
# protegit, el centra sobre un fons fosc estàtic i no duplica ni desenfoca el
# vídeo. Així només cal una cadena de filtres i molt poca memòria addicional.
SOCIAL_FILTER="scale=540:304,pad=540:960:0:(oh-ih)/2:color=#101820"
if ffmpeg -hide_banner -filters 2>/dev/null | grep ' drawtext ' >/dev/null; then
  SOCIAL_FILTER+=",drawbox=x=18:y=33:w=504:h=66:color=black@0.42:t=fill,drawtext=fontfile='$FONT':text='TIMELAPSE DEL CEL':fontcolor=white:fontsize=24:x=34:y=52,drawbox=x=18:y=h-92:w=504:h=59:color=black@0.42:t=fill,drawtext=fontfile='$FONT':text='PANORÀMICA COMPLETA':fontcolor=white@0.86:fontsize=14:x=34:y=h-76,drawtext=fontfile='$FONT':text='meteo.fontanillas.cat':fontcolor=white:fontsize=18:x=34:y=h-56"
fi

rm -f "$SOCIAL_TMP"
MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel error -y \
  -threads 1 -i "$OUTPUT" \
  -filter_threads 1 -filter_complex_threads 1 \
  -vf "$SOCIAL_FILTER" -r 20 -an -c:v libx264 -threads 1 \
  -preset ultrafast -crf 22 -pix_fmt yuv420p -movflags +faststart -f mp4 "$SOCIAL_TMP"
[[ -s "$SOCIAL_TMP" ]] || { echo "FFmpeg no ha creat la versió social vertical." >&2; exit 1; }
mv "$SOCIAL_TMP" "$SOCIAL_OUTPUT"

echo "Timelapse creat: $OUTPUT"
echo "Versió social 9:16: $SOCIAL_OUTPUT"
echo "Fotogrames: $FRAME_COUNT"
MOTION_SCENE_THRESHOLD="${CAMERA_TIMELAPSE_SCENE_THRESHOLD:-0.035}"
MOTION_MIN_PERMILLE="${CAMERA_TIMELAPSE_MOTION_MIN_PERMILLE:-180}"
SCENE_CHANGES="$(MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel info \
  -threads 1 -i "$OUTPUT" -filter_threads 1 -filter_complex_threads 1 \
  -vf "fps=8,crop=iw*0.70:ih*0.45:iw*0.15:ih*0.18,scale=160:-2,select='gt(scene,$MOTION_SCENE_THRESHOLD)',metadata=print" \
  -an -f null - 2>&1 | grep -c 'lavfi.scene_score' || true)"
SCENE_CHANGES="${SCENE_CHANGES:-0}"
MOTION_PERMILLE=$(( SCENE_CHANGES * 1000 / FRAME_COUNT ))
STRONG_MOTION=false
if (( SCENE_CHANGES >= 12 && MOTION_PERMILLE >= MOTION_MIN_PERMILLE )); then
  STRONG_MOTION=true
fi
echo "Moviment meteorològic: $SCENE_CHANGES canvis ($((MOTION_PERMILLE / 10)).$((MOTION_PERMILLE % 10))%) · intens=$STRONG_MOTION"
if [[ "$UPLOAD" == "--auto" && "$STRONG_MOTION" == true ]]; then
  echo "Selecció automàtica: el Worker decidirà segons calendari i avisos oficials"
else
  echo "Selecció automàtica: queda preparat, sense publicació per moviment insuficient"
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
  if [[ "$UPLOAD" == "--auto" ]]; then
    PUBLISH_URL="${CAMERA_UPLOAD_URL%/camera/nord/upload}/camera/nord/timelapse-publish"
    curl --fail --silent --show-error --max-time 180 --retry 2 --retry-all-errors \
      -X POST "$PUBLISH_URL" \
      -H "Authorization: Bearer $CAMERA_UPLOAD_TOKEN" \
      -H 'Content-Type: application/json' \
      --data "{\"date\":\"$DATE\",\"motion\":{\"sceneChanges\":$SCENE_CHANGES,\"frameCount\":$FRAME_COUNT,\"ratioPermille\":$MOTION_PERMILLE}}"
    echo
  fi
fi
