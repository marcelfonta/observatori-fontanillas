#!/usr/bin/env bash
set -Eeuo pipefail

# Instal·la una automatització local i reversible a la Raspberry.
# Prepara cada nit el vídeo del dia anterior. Els vídeos de dilluns, dimecres
# i divendres també es publiquen a Instagram, Facebook, TikTok i YouTube,
# amb recuperació idempotent des del Worker si algun canal encara els processa.

SOURCE="${1:-$HOME/bin/camera-timelapse.sh}"
UNIT_DIR="$HOME/.config/systemd/user"
SERVICE="$UNIT_DIR/meteo-camera-timelapse.service"
TIMER="$UNIT_DIR/meteo-camera-timelapse.timer"

[[ -x "$SOURCE" ]] || { echo "No es troba l'script executable: $SOURCE" >&2; exit 1; }
mkdir -p "$UNIT_DIR"

cat > "$SERVICE" <<EOF
[Unit]
Description=Prepara el timelapse diari de la càmera nord
After=network-online.target

[Service]
Type=oneshot
ExecStart=$SOURCE yesterday --auto
Nice=10
IOSchedulingClass=idle
Restart=on-failure
RestartSec=10min
StartLimitIntervalSec=45min
StartLimitBurst=3
StandardOutput=append:%h/meteo-camera/timelapse.log
StandardError=append:%h/meteo-camera/timelapse.log
EOF

cat > "$TIMER" <<'EOF'
[Unit]
Description=Preparació diària i publicació selectiva del timelapse

[Timer]
OnCalendar=*-*-* 00:20:00 Europe/Madrid
Persistent=true
RandomizedDelaySec=5m
Unit=meteo-camera-timelapse.service

[Install]
WantedBy=timers.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now meteo-camera-timelapse.timer
systemctl --user status meteo-camera-timelapse.timer --no-pager

echo
echo "Automatització activada: preparació diària i publicació dilluns, dimecres i divendres."
echo "Per retirar-la: systemctl --user disable --now meteo-camera-timelapse.timer"
