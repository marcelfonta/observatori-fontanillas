#!/bin/bash
set -Eeuo pipefail

export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
project_root="$(cd "$(dirname "$(realpath "$0")")/.." && pwd)"
project="$project_root/ios/MeteoFontanillas/MeteoFontanillas.xcodeproj"
build_dir="$HOME/Library/Caches/MeteoFontanillas-iPhone"

devices_json=""
finish() {
  result=$?
  [[ -z "$devices_json" ]] || rm -f "$devices_json"
  if (( result == 0 )); then
    printf '\nAplicació actualitzada. Obre Meteo Fontanillas a l’iPhone per renovar el giny.\n'
  else
    printf '\nNo s’ha completat l’actualització (error %s). Revisa el missatge anterior.\n' "$result"
  fi
  printf 'Prem Retorn per tancar aquesta finestra...'
  read -r _ || true
}
trap finish EXIT

[[ -d /Applications/Xcode.app ]] || { echo 'Cal instal·lar Xcode a Aplicacions.'; exit 1; }
[[ -f "$project/project.pbxproj" ]] || { echo 'No trobo el projecte de l’app.'; exit 1; }

devices_json="$(mktemp)"
xcrun devicectl list devices --json-output "$devices_json" >/dev/null
devices=()
while IFS= read -r device; do devices+=("$device"); done < <(python3 - "$devices_json" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
for device in data.get('result', {}).get('devices', []):
    props = device.get('deviceProperties') or device.get('properties') or {}
    hardware = device.get('hardwareProperties') or {}
    connection = device.get('connectionProperties') or {}
    name = props.get('name') or device.get('name') or ''
    identifier = device.get('identifier') or ''
    if (hardware.get('deviceType') == 'iPhone'
            and hardware.get('reality') == 'physical'
            and props.get('bootState') == 'booted'
            and connection.get('pairingState') == 'paired'
            and connection.get('tunnelState') != 'unavailable'
            and identifier):
        print(f'{name}\t{identifier}')
PY
)

if (( ${#devices[@]} == 0 )); then
  echo 'No hi ha cap iPhone connectat i desbloquejat. Connecta’l per cable i torna-ho a provar.'
  exit 1
fi

if (( ${#devices[@]} == 1 )); then
  chosen="${devices[0]}"
else
  echo 'Tria l’iPhone que vols actualitzar:'
  for i in "${!devices[@]}"; do printf '%s) %s\n' "$((i + 1))" "${devices[i]%%$'\t'*}"; done
  read -r -p 'Número: ' choice
  [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#devices[@]} )) || { echo 'Opció incorrecta.'; exit 1; }
  chosen="${devices[choice-1]}"
fi

name="${chosen%%$'\t'*}"
identifier="${chosen#*$'\t'}"
printf 'Compilant per a %s...\n' "$name"
xcodebuild -project "$project" -scheme MeteoFontanillas -configuration Debug \
  -destination "platform=iOS,id=$identifier" -derivedDataPath "$build_dir" \
  -allowProvisioningUpdates build >"$build_dir.log" 2>&1 || {
    tail -n 35 "$build_dir.log"
    if grep -q 'No Account for Team' "$build_dir.log"; then
      echo 'Obre Xcode → Settings → Apple Accounts i inicia sessió amb el compte que té l’equip de signatura del projecte. Després torna a prémer l’accés directe.'
    fi
    exit 1
  }

app="$build_dir/Build/Products/Debug-iphoneos/MeteoFontanillas.app"
[[ -d "$app" ]] || { echo 'La compilació ha acabat, però no trobo l’app generada.'; exit 1; }
printf 'Instal·lant a %s...\n' "$name"
xcrun devicectl device install app --device "$identifier" "$app"
