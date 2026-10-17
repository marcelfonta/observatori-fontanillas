"""Pure helpers for matching CECAT PDF map panels to dates and UTC windows."""

from __future__ import annotations

import re
from pathlib import Path


WINDOW_BY_IMAGE_SLOT = {
    1: (0, 6),
    3: (6, 12),
    5: (12, 18),
    7: (18, 24),
}


def image_window(name: str) -> tuple[int, int] | None:
    """Return the window encoded by an official map XObject name.

    CECAT may keep numbering across pages (img9, img11, ...) instead of
    restarting at img1. The low three bits preserve the panel position while
    even-numbered siblings are masks rather than colour maps.
    """

    match = re.fullmatch(r"img(\d+)", Path(name).stem.lower())
    if not match:
        return None
    return WINDOW_BY_IMAGE_SLOT.get(int(match.group(1)) % 8)


def extract_panel_layout(text: str) -> list[tuple[str, int, int]]:
    """Read each map date and UTC window in visual/text extraction order."""

    token_pattern = re.compile(
        r"Dia:\s*(\d{2})/(\d{2})/(\d{4})(?:\s+\d{2}:\d{2})?"
        r"|De\s*(0|6|12|18)\s*a\s*(6|12|18|24)\s*hores",
        re.IGNORECASE,
    )
    current_date: str | None = None
    panels: list[tuple[str, int, int]] = []
    for match in token_pattern.finditer(text):
        if match.group(1):
            current_date = f"{match.group(3)}-{match.group(2)}-{match.group(1)}"
            continue
        if current_date is None:
            raise ValueError("S'ha trobat una franja de mapa sense la data oficial associada.")
        panels.append((current_date, int(match.group(4)), int(match.group(5))))
    return panels
