#!/usr/bin/env bash
set -Eeuo pipefail

# Instal·la una automatització local i reversible a la Raspberry.
# Prepara cada nit el vídeo del dia anterior. El Worker valora el moviment del
# cel i, quan correspon, els avisos oficials abans de decidir si el publica.
# Els vídeos descartats queden preparats per a publicació manual.

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
StartLimitIntervalSec=45min
StartLimitBurst=3

[Service]
Type=oneshot
ExecStart=$SOURCE yesterday --auto
Nice=10
IOSchedulingClass=idle
Restart=on-failure
RestartSec=10min
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
echo "Automatització activada: preparació diària i publicació selectiva, màxim una per dia."
echo "Per retirar-la: systemctl --user disable --now meteo-camera-timelapse.timer"
