#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE="${1:-$HOME/bin/camera-public-variants.sh}"
UNIT_DIR="$HOME/.config/systemd/user"
SERVICE="$UNIT_DIR/meteo-camera-privacy.service"
TIMER="$UNIT_DIR/meteo-camera-privacy.timer"
[[ -x "$SOURCE" ]] || { echo "No es troba l'script executable: $SOURCE" >&2; exit 1; }
mkdir -p "$UNIT_DIR"

cat > "$SERVICE" <<EOF
[Unit]
Description=Genera la variant pública de la càmera amb filtre de privacitat
After=network-online.target

[Service]
Type=oneshot
ExecStart=$SOURCE
Nice=10
IOSchedulingClass=idle
EOF

cat > "$TIMER" <<'EOF'
[Unit]
Description=Actualitza la càmera pública amb privacitat

[Timer]
OnCalendar=*-*-* *:*:20 Europe/Madrid
Persistent=true
RandomizedDelaySec=10s
Unit=meteo-camera-privacy.service

[Install]
WantedBy=timers.target
EOF

systemctl --user daemon-reload
# Evita que l'antic generador amb marca, però sense difuminat, torni a
# sobreescriure la variant pública protegida.
systemctl --user disable --now meteo-camera-brand.timer 2>/dev/null || true
systemctl --user enable --now meteo-camera-privacy.timer
systemctl --user start meteo-camera-privacy.service
systemctl --user status meteo-camera-privacy.timer --no-pager
echo "Filtre de privacitat actiu. L'original queda només a l'arxiu privat local."
