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
CO2_YEAR="$(mktemp)"
CO2_DECADE="$(mktemp)"
AIR_NO2="$(mktemp)"
AIR_O3="$(mktemp)"
AIR_PM10="$(mktemp)"
AIR_TIME="$(mktemp)"
AIR_NO2_COLOR="$(mktemp)"
AIR_O3_COLOR="$(mktemp)"
AIR_PM10_COLOR="$(mktemp)"
trap 'rm -f "$TEMP" "$PREVIEW_TEMP" "$CO2_VALUE" "$CO2_DATE" "$CO2_YEAR" "$CO2_DECADE" "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_TIME" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR"' EXIT
# El Worker és l'única font normalitzada; una fallada NOAA no atura la càmera.
CO2_URL="${CAMERA_UPLOAD_URL%/camera/nord/upload}/climate/co2"
if curl --fail --silent --show-error --max-time 5 "$CO2_URL" | python3 -c '
import json,sys
value_file,date_file,year_file,decade_file=sys.argv[1:]
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
    for years,ppm_key,date_key,path in ((1,"yearAgoPpm","yearAgoDate",year_file),(10,"tenYearsAgoPpm","tenYearsAgoDate",decade_file)):
        historic=value.get(ppm_key)
        historic_date=value.get(date_key)
        if isinstance(historic,(float,int)) and 250 <= historic <= 650 and isinstance(historic_date,str) and historic_date[:4]==str(int(date[:4])-years):
            with open(path,"w") as output:
                output.write(f"{historic:.2f}")
except (ValueError,KeyError,TypeError,json.JSONDecodeError):
    pass
' "$CO2_VALUE" "$CO2_DATE" "$CO2_YEAR" "$CO2_DECADE"; then
  if [[ -s "$CO2_VALUE" && -s "$CO2_DATE" ]]; then
    # Tres lectures diàries comparables de Mauna Loa. La fitxa web n'explica la font i el retard.
    FILTER="${FILTER},drawbox=x=75:y=85:w=1110:h=225:color=black@0.48:t=fill,drawbox=x=75:y=85:w=11:h=225:color=0xF4CE46:t=fill,drawtext=fontfile='$FONT':text='CO₂':fontcolor=0xF4CE46:fontsize=67:x=115:y=104,drawtext=fontfile='$FONT':text='Últim':fontcolor=white:fontsize=52:x=390:y=107,drawtext=fontfile='$FONT':textfile='$CO2_VALUE':fontcolor=white:fontsize=74:x=620:y=96,drawtext=fontfile='$FONT':text='ppm':fontcolor=white:fontsize=36:x=1010:y=135"
    if [[ -s "$CO2_YEAR" ]]; then
      FILTER="${FILTER},drawtext=fontfile='$FONT':text='Fa 1 any':fontcolor=white@0.85:fontsize=43:x=390:y=181,drawtext=fontfile='$FONT':textfile='$CO2_YEAR':fontcolor=white@0.9:fontsize=48:x=755:y=176"
    fi
    if [[ -s "$CO2_DECADE" ]]; then
      FILTER="${FILTER},drawtext=fontfile='$FONT':text='Fa 10 anys':fontcolor=white@0.85:fontsize=43:x=390:y=244,drawtext=fontfile='$FONT':textfile='$CO2_DECADE':fontcolor=white@0.9:fontsize=48:x=755:y=239"
    fi
  fi
fi
# Mesures provisionals de l'estació oficial XVPCA ES1275A. Si falta un
# contaminant o la darrera actualització és antiga, no es dibuixa cap cercle.
if curl --fail --silent --show-error --max-time 8 \
  'https://www.gencat.cat/territori/quaire/json/estat.json' | python3 -c '
import datetime,json,math,re,sys
from pathlib import Path
from zoneinfo import ZoneInfo
try:
    data=json.load(sys.stdin)
    station=next((feature["properties"] for feature in data["features"] if feature.get("id")=="ES1275A" and feature.get("properties",{}).get("localitat")=="Sant Celoni"),None)
    if not station:
        raise ValueError("station missing")
    stamp=station["dataActualitzacio"]
    if not re.fullmatch(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}",stamp):
        raise ValueError("invalid station time")
    local=datetime.datetime.strptime(stamp,"%d/%m/%Y %H:%M").replace(tzinfo=ZoneInfo("Europe/Madrid"))
    if local.replace(fold=0).utcoffset()!=local.replace(fold=1).utcoffset():
        raise ValueError("ambiguous station time")
    age=(datetime.datetime.now(datetime.timezone.utc)-local.astimezone(datetime.timezone.utc)).total_seconds()
    if not -300 <= age < 10800:
        raise ValueError("stale station time")
    colors={"bona":"0x238D5A","raonablement_bona":"0x8CAC34","regular":"0xB8891F","desfavorable":"0xB73535","molt_desfavorable":"0x873F93","extremadament_desfavorable":"0x5F275B"}
    components={item.get("abbr"):item for item in station.get("contaminants",[])}
    for pollutant,value_path,color_path in zip(("NO2","O3","PM10"),sys.argv[1:4],sys.argv[5:8]):
        component=components.get(pollutant,{})
        row=next((row for row in component.get("dadesHoraries",[]) if row.get("hora")==local.strftime("%H")),None)
        quality=colors.get(row.get("qualitat")) if row else None
        try:
            value=float(str(row.get("valor","")).replace(",",".")) if row else math.nan
        except (ValueError,TypeError):
            continue
        if quality and math.isfinite(value) and 0 <= value <= 1000:
            Path(value_path).write_text(str(round(value)))
            Path(color_path).write_text(quality)
    Path(sys.argv[4]).write_text(stamp)
except (ValueError,KeyError,TypeError,json.JSONDecodeError):
    pass
' "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_TIME" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR"; then
  if [[ -s "$AIR_TIME" ]]; then
    if [[ "${CAMERA_PREVIEW_ONLY:-0}" != 1 ]]; then
      python3 -c '
import datetime,json,os,pathlib,sys,tempfile
base,stamp_path,*paths=sys.argv[1:]
stamp=pathlib.Path(stamp_path).read_text(encoding="utf-8")
day=datetime.datetime.strptime(stamp,"%d/%m/%Y %H:%M").date().isoformat()
pollutants={}
for label,value_path,color_path in zip(("NO2","O3","PM10"),paths[:3],paths[3:]):
    value_file,color_file=pathlib.Path(value_path),pathlib.Path(color_path)
    if value_file.stat().st_size and color_file.stat().st_size:
        pollutants[label]={"value":int(value_file.read_text()),"color":color_file.read_text()}
if pollutants:
    directory=pathlib.Path(base)/"air-observations"
    directory.mkdir(parents=True,exist_ok=True)
    fd,temp=tempfile.mkstemp(prefix=".air-",dir=directory)
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as output:
            json.dump({"station":"ES1275A","time":stamp,"pollutants":pollutants},output)
        os.replace(temp,directory/f"{day}.json")
    finally:
        if os.path.exists(temp): os.unlink(temp)
' "$BASE" "$AIR_TIME" "$AIR_NO2" "$AIR_O3" "$AIR_PM10" "$AIR_NO2_COLOR" "$AIR_O3_COLOR" "$AIR_PM10_COLOR" || true
    fi
    for pollutant in NO2 O3 PM10; do
      case "$pollutant" in
        NO2) air_x=6030; air_value="$AIR_NO2"; air_color="$AIR_NO2_COLOR" ;;
        O3) air_x=6490; air_value="$AIR_O3"; air_color="$AIR_O3_COLOR" ;;
        PM10) air_x=6950; air_value="$AIR_PM10"; air_color="$AIR_PM10_COLOR" ;;
      esac
      if [[ -s "$air_value" && -s "$air_color" ]]; then
        FILTER="${FILTER},drawtext=fontfile='$FONT':text='●':fontcolor=$(cat "$air_color")@0.9:borderw=7:bordercolor=0x07241A@0.7:fontsize=360:x=$air_x:y=1690,drawtext=fontfile='$FONT':text='$pollutant':fontcolor=white:fontsize=64:x=$air_x+(300-text_w)/2:y=1755,drawtext=fontfile='$FONT':textfile='$air_value':fontcolor=white:fontsize=98:x=$air_x+(300-text_w)/2:y=1830"
      else
        # Conserva les tres posicions; el guió gris indica una lectura no publicada.
        FILTER="${FILTER},drawtext=fontfile='$FONT':text='●':fontcolor=0x555D5B@0.9:borderw=7:bordercolor=0x07241A@0.7:fontsize=360:x=$air_x:y=1690,drawtext=fontfile='$FONT':text='$pollutant':fontcolor=white:fontsize=64:x=$air_x+(300-text_w)/2:y=1755,drawtext=fontfile='$FONT':text='—':fontcolor=white:fontsize=98:x=$air_x+(300-text_w)/2:y=1830"
      fi
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
