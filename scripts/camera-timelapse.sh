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
SOCIAL_FRAME_RATE=30
mkdir -p "$OUTPUT_DIR"

[[ -d "$SOURCE_DIR" ]] || { echo "No existeix l'arxiu $SOURCE_DIR" >&2; exit 1; }
# Les imatges reduïdes van al disc, no a /tmp (que pot ser tmpfs a la Raspberry).
TMP_DIR="$(mktemp -d "$OUTPUT_DIR/.timelapse-${DATE}.XXXXXX")"
trap 'rm -rf "$TMP_DIR"; rm -f "$OUTPUT_TMP" "$SOCIAL_TMP"' EXIT
LIST="$TMP_DIR/frames.txt"
IMAGES=()
while IFS= read -r image; do IMAGES+=("$image"); done < <(find "$SOURCE_DIR" -maxdepth 1 -type f -name 'nord-*.jpg' -size +20k -print | sort)
FRAME_COUNT="${#IMAGES[@]}"
if (( FRAME_COUNT < 6 )); then
  echo "Calen almenys 6 captures vàlides; n'hi ha $FRAME_COUNT." >&2
  exit 1
fi

FONT="$(fc-match -f '%{file}' 'DejaVu Sans:style=Bold' 2>/dev/null || true)"
[[ -f "$FONT" ]] || FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
CO2_VALUE="$TMP_DIR/co2-value.txt"
CO2_SOURCE="$TMP_DIR/co2-source.txt"
CO2_COMPARE="$TMP_DIR/co2-compare.txt"
# La dada és opcional: si NOAA no és recent, el vídeo continua sense càpsula.
if command -v curl >/dev/null && command -v python3 >/dev/null; then
  curl --fail --silent --max-time 5 "${CAMERA_CO2_URL:-https://fonta-meteo.marcelfonta.workers.dev/climate/co2}" | \
    python3 -c '
import datetime,json,pathlib,sys
try:
    value=json.load(sys.stdin).get("co2") or {}
    date=datetime.date.fromisoformat(value["date"])
    age=(datetime.datetime.now(datetime.timezone.utc).date()-date).days
    ppm=float(value["ppm"])
    if value.get("fresh") is not True or not 0<=age<=3 or not 250<=ppm<=650:
        raise ValueError("CO2 absent o antic")
    number=f"{ppm:.2f}".replace(".",",")
    date_label=date.strftime("%d/%m/%Y")
    pathlib.Path(sys.argv[1]).write_text(f"{number} ppm",encoding="utf-8")
    pathlib.Path(sys.argv[2]).write_text(f"Mauna Loa · NOAA · {date_label}",encoding="utf-8")
    history=[]
    for label,key,date_key,years in (("Fa 1 any","yearAgoPpm","yearAgoDate",1),("Fa 10 anys","tenYearsAgoPpm","tenYearsAgoDate",10)):
        past=value.get(key)
        past_date=value.get(date_key)
        if isinstance(past,(int,float)) and 250<=past<=650 and isinstance(past_date,str) and past_date[:4]==str(date.year-years):
            history.append(f"{label} {past:.2f}".replace(".",","))
    pathlib.Path(sys.argv[3]).write_text("\n".join(item+" ppm" for item in history),encoding="utf-8")
except (ValueError,KeyError,TypeError,json.JSONDecodeError):
    pass
' "$CO2_VALUE" "$CO2_SOURCE" "$CO2_COMPARE" || true
fi
# La targeta final només admet una lectura oficial del mateix dia del vídeo.
# En regenerar dies antics no s'hi incrusta l'estat de l'aire d'avui.
AIR_TIME="$TMP_DIR/air-time.txt"
AIR_NO2="$TMP_DIR/air-no2.txt"
AIR_O3="$TMP_DIR/air-o3.txt"
AIR_PM10="$TMP_DIR/air-pm10.txt"
AIR_NO2_COLOR="$TMP_DIR/air-no2-color.txt"
AIR_O3_COLOR="$TMP_DIR/air-o3-color.txt"
AIR_PM10_COLOR="$TMP_DIR/air-pm10-color.txt"
if command -v curl >/dev/null && command -v python3 >/dev/null; then
  curl --fail --silent --max-time 8 "${CAMERA_AIR_URL:-https://www.gencat.cat/territori/quaire/json/estat.json}" | python3 -c '
import datetime,json,math,re,sys
from pathlib import Path
from zoneinfo import ZoneInfo
try:
    day,time_path,*paths=sys.argv[1:]
    data=json.load(sys.stdin)
    station=next((item.get("properties",{}) for item in data["features"] if item.get("id")=="ES1275A" and item.get("properties",{}).get("localitat")=="Sant Celoni"),None)
    if station is None:
        raise ValueError("station missing")
    stamp=station["dataActualitzacio"]
    if not re.fullmatch(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}",stamp):
        raise ValueError("invalid station time")
    local=datetime.datetime.strptime(stamp,"%d/%m/%Y %H:%M").replace(tzinfo=ZoneInfo("Europe/Madrid"))
    age=(datetime.datetime.now(datetime.timezone.utc)-local.astimezone(datetime.timezone.utc)).total_seconds()
    if local.date().isoformat()!=day or local.replace(fold=0).utcoffset()!=local.replace(fold=1).utcoffset() or not -300<=age<10800:
        raise ValueError("stale or different day")
    colors={"bona":"0x238D5A","raonablement_bona":"0x8CAC34","regular":"0xB8891F","desfavorable":"0xB73535","molt_desfavorable":"0x873F93","extremadament_desfavorable":"0x5F275B"}
    components={item.get("abbr"):item for item in station.get("contaminants",[])}
    found=0
    for label,value_path,color_path in zip(("NO2","O3","PM10"),paths[:3],paths[3:]):
        row=next((row for row in components.get(label,{}).get("dadesHoraries",[]) if row.get("hora")==local.strftime("%H")),None)
        color=colors.get(row.get("qualitat")) if row else None
        try:
            value=float(str(row.get("valor","")).replace(",",".")) if row else math.nan
        except (ValueError,TypeError):
            continue
        if color and math.isfinite(value) and 0<=value<=1000:
            Path(value_path).write_text(str(round(value)),encoding="utf-8")
            Path(color_path).write_text(color,encoding="utf-8")
            found+=1
    if found:
        Path(time_path).write_text(stamp,encoding="utf-8")
except (ValueError,KeyError,TypeError,json.JSONDecodeError):
    pass
' "$DATE" "$AIR_TIME" "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR" || true
fi
# La càmera conserva l'última lectura oficial vàlida de cada dia. Això permet
# generar l'endemà el vídeo sense atribuir-hi la lectura d'un altre dia.
AIR_SNAPSHOT="$BASE/air-observations/$DATE.json"
if [[ ! -s "$AIR_TIME" && -r "$AIR_SNAPSHOT" ]] && command -v python3 >/dev/null; then
  python3 -c '
import datetime,json,pathlib,re,sys
try:
    day,snapshot,time_path,*paths=sys.argv[1:]
    data=json.loads(pathlib.Path(snapshot).read_text(encoding="utf-8"))
    stamp=data["time"]
    if data.get("station")!="ES1275A" or not re.fullmatch(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}",stamp):
        raise ValueError("invalid station snapshot")
    if datetime.datetime.strptime(stamp,"%d/%m/%Y %H:%M").date().isoformat()!=day:
        raise ValueError("different day")
    allowed={"0x238D5A","0x8CAC34","0xB8891F","0xB73535","0x873F93","0x5F275B"}
    found=0
    for label,value_path,color_path in zip(("NO2","O3","PM10"),paths[:3],paths[3:]):
        item=data.get("pollutants",{}).get(label,{})
        value=item.get("value")
        color=item.get("color")
        if isinstance(value,int) and not isinstance(value,bool) and 0<=value<=1000 and color in allowed:
            pathlib.Path(value_path).write_text(str(value),encoding="utf-8")
            pathlib.Path(color_path).write_text(color,encoding="utf-8")
            found+=1
    if found:
        pathlib.Path(time_path).write_text(stamp,encoding="utf-8")
except (ValueError,KeyError,TypeError,AttributeError,json.JSONDecodeError,OSError):
    pass
' "$DATE" "$AIR_SNAPSHOT" "$AIR_TIME" "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR"
fi
# La versió principal selecciona el centre panoràmic en 16:9 i elimina el 10%
# inferior, on apareixen les cases més pròximes. El retall substitueix els
# desenfocaments i redueix fortament el consum de memòria de la Raspberry.
FILTER="scale=1280:-2,crop=ih*0.90*16/9:ih*0.90:(iw-ih*0.90*16/9)/2:0,scale=1280:720"

# FFmpeg acumulava memòria en descodificar les captures originals durant el
# concat i el nucli el matava en una Raspberry de 415 MiB. Cada procés tracta
# una sola foto; el concat només llegeix JPEG de 1280×720 ja protegits.
for index in "${!IMAGES[@]}"; do
  frame="$(printf '%s/frame-%04d.jpg' "$TMP_DIR" "$index")"
  MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel error -y \
    -threads 1 -i "${IMAGES[$index]}" -filter_threads 1 -filter_complex_threads 1 \
    -vf "$FILTER" -frames:v 1 -q:v 3 -f image2 -update 1 "$frame"
  [[ -s "$frame" ]] || { echo "No s'ha pogut reduir el fotograma $((index + 1))." >&2; exit 1; }
  printf "file '%s'\nduration 0.12\n" "${frame//\'/\'\\\'\'}" >> "$LIST"
done
printf "file '%s'\n" "${frame//\'/\'\\\'\'}" >> "$LIST"

# Una targeta final conserva l'hora i la font de cada lectura. Les mesures
# representen el tancament del dia, no tots els fotogrames del timelapse.
if [[ -s "$CO2_VALUE" || -s "$AIR_TIME" ]] && ffmpeg -hide_banner -filters 2>/dev/null | grep ' drawtext ' >/dev/null; then
  CARD="$TMP_DIR/context-card.jpg"
  CARD_FILTER="drawbox=x=20:y=650:w=375:h=45:color=0xF4CE46@0.93:t=fill,drawtext=fontfile='$FONT':text='SANT CELONI · $DATE':fontcolor=0x14211D:fontsize=22:x=33:y=656,drawtext=fontfile='$FONT':text='METEO FONTANILLAS · CÀMERA NORD':fontcolor=0x14211D:fontsize=12:x=34:y=682"
  if [[ -s "$CO2_VALUE" ]]; then
    CARD_FILTER+=",drawbox=x=20:y=18:w=330:h=150:color=black@0.65:t=fill,drawbox=x=20:y=18:w=5:h=150:color=0xF4CE46:t=fill,drawtext=fontfile='$FONT':text='CO₂ · DADA DE TANCAMENT':fontcolor=0xF4CE46:fontsize=16:x=33:y=27,drawtext=fontfile='$FONT':textfile='$CO2_VALUE':fontcolor=white:fontsize=32:x=34:y=49,drawtext=fontfile='$FONT':textfile='$CO2_SOURCE':fontcolor=white@0.86:fontsize=11:x=34:y=147"
    if [[ -s "$CO2_COMPARE" ]]; then
      CARD_FILTER+=",drawtext=fontfile='$FONT':textfile='$CO2_COMPARE':fontcolor=white@0.9:fontsize=14:line_spacing=2:x=34:y=91"
    fi
  fi
  if [[ -s "$AIR_TIME" ]]; then
    CARD_FILTER+=",drawbox=x=963:y=532:w=290:h=46:color=black@0.55:t=fill,drawtext=fontfile='$FONT':text='XVPCA · SANT CELONI':fontcolor=white:fontsize=13:x=976:y=536,drawtext=fontfile='$FONT':textfile='$AIR_TIME':fontcolor=white@0.85:fontsize=12:x=976:y=556"
    for pollutant in NO2 O3 PM10; do
      case "$pollutant" in
        NO2) card_x=966; air_value="$AIR_NO2"; air_color="$AIR_NO2_COLOR" ;;
        O3) card_x=1061; air_value="$AIR_O3"; air_color="$AIR_O3_COLOR" ;;
        PM10) card_x=1156; air_value="$AIR_PM10"; air_color="$AIR_PM10_COLOR" ;;
      esac
      if [[ -s "$air_value" && -s "$air_color" ]]; then
        card_color="$(cat "$air_color")"
        CARD_FILTER+=",drawtext=fontfile='$FONT':text='●':fontcolor=$card_color:fontsize=110:x=$card_x:y=577,drawtext=fontfile='$FONT':text='$pollutant':fontcolor=white:fontsize=17:x=$card_x+(79-text_w)/2:y=599,drawtext=fontfile='$FONT':textfile='$air_value':fontcolor=white:fontsize=26:x=$card_x+(79-text_w)/2:y=622"
      else
        CARD_FILTER+=",drawtext=fontfile='$FONT':text='●':fontcolor=0x555D5B:fontsize=110:x=$card_x:y=577,drawtext=fontfile='$FONT':text='$pollutant':fontcolor=white:fontsize=17:x=$card_x+(79-text_w)/2:y=599,drawtext=fontfile='$FONT':text='—':fontcolor=white:fontsize=26:x=$card_x+(79-text_w)/2:y=622"
      fi
    done
  fi
  if MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel error -y \
    -threads 1 -i "$frame" \
    -filter_threads 1 -filter_complex_threads 1 \
    -vf "$CARD_FILTER" -frames:v 1 -q:v 3 -f image2 -update 1 "$CARD" && [[ -s "$CARD" ]]; then
    printf "file '%s'\nduration 3\nfile '%s'\n" "$CARD" "$CARD" >> "$LIST"
  else
    echo 'Targeta de context omesa: la creació ha fallat; el timelapse continuarà sense les dades addicionals.' >&2
  fi
fi

rm -f "$OUTPUT_TMP"
MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel error -y \
  -threads 1 -f concat -safe 0 -i "$LIST" \
  -filter_threads 1 -filter_complex_threads 1 \
  -vf format=yuv420p \
  -r 20 -an -c:v libx264 -threads 1 -preset superfast -crf 20 -maxrate 5M -bufsize 10M \
  -pix_fmt yuv420p -movflags +faststart -f mp4 "$OUTPUT_TMP"
[[ -s "$OUTPUT_TMP" ]] || { echo "FFmpeg no ha creat un vídeo vàlid." >&2; exit 1; }
mv "$OUTPUT_TMP" "$OUTPUT"

# Adaptació vertical lleugera per a Reels i TikTok. Reutilitza el panoràmic
# protegit, el centra sobre un fons fosc estàtic i no duplica ni desenfoca el
# vídeo. Així només cal una cadena de filtres i molt poca memòria addicional.
SOCIAL_FILTER="scale=720:405,pad=720:1280:0:(oh-ih)/2:color=#101820"
if ffmpeg -hide_banner -filters 2>/dev/null | grep ' drawtext ' >/dev/null; then
  SOCIAL_FILTER+=",drawbox=x=24:y=44:w=672:h=88:color=black@0.42:t=fill,drawtext=fontfile='$FONT':text='TIMELAPSE DEL CEL':fontcolor=white:fontsize=32:x=45:y=69,drawbox=x=24:y=h-123:w=672:h=79:color=black@0.42:t=fill,drawtext=fontfile='$FONT':text='PANORÀMICA COMPLETA':fontcolor=white@0.86:fontsize=19:x=45:y=h-102,drawtext=fontfile='$FONT':text='meteo.fontanillas.cat':fontcolor=white:fontsize=24:x=45:y=h-76"
fi

rm -f "$SOCIAL_TMP"
MALLOC_ARENA_MAX=1 ffmpeg -nostdin -hide_banner -loglevel error -y \
  -threads 1 -i "$OUTPUT" \
  -filter_threads 1 -filter_complex_threads 1 \
  -vf "$SOCIAL_FILTER" -r "$SOCIAL_FRAME_RATE" -an -c:v libx264 -threads 1 \
  -preset superfast -crf 20 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -movflags +faststart -f mp4 "$SOCIAL_TMP"
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
