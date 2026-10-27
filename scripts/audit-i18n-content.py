#!/usr/bin/env python3
"""Inventory untranslated source strings in public HTML documents.

An exact-key inventory is a conservative review aid: runtime patterns may
translate some reported strings, while JavaScript-created text needs a browser
check in addition to this source audit.
"""

from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "municipis.html", "comparativa.html", "metodologia.html",
    "privacitat.html", "condicions.html", "colaboracions.html",
    "historial-avisos.html", "models-franca.html", "xarxes.html", "fonta.html",
    "aula/analisi-aiguat-4-octubre-2026.html",
    "aula/analisi-aiguat-4-octubre-2026-solucions.html",
]
ATTRIBUTES = ("placeholder", "aria-label", "title", "alt")


class VisibleStrings(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.strings = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.stack.append(tag)
        for name in ATTRIBUTES:
            if values.get(name):
                self.strings.append(values[name].strip())
        if tag == "meta" and (
            values.get("name") in ("description", "twitter:title", "twitter:description", "twitter:image:alt")
            or values.get("property") in ("og:title", "og:description", "og:image:alt")
        ):
            self.strings.append((values.get("content") or "").strip())

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

    def handle_data(self, data):
        value = data.strip()
        if value and not any(tag in self.stack for tag in ("script", "style", "noscript", "code", "pre")):
            self.strings.append(value)


keys = set(json.loads(subprocess.check_output(
    ["node", "--input-type=module", "-e", "import {PHRASES} from './src/core/i18n.js'; console.log(JSON.stringify(Object.keys(PHRASES)))"],
    cwd=ROOT, text=True,
)))
missing = defaultdict(list)
for filename in PAGES:
    parser = VisibleStrings()
    parser.feed((ROOT / filename).read_text())
    for value in sorted(set(parser.strings)):
        if value not in keys and re.search(r"[A-Za-zÀ-ÿ]{3}", value):
            missing[filename].append(value)

print(json.dumps(dict(missing), ensure_ascii=False, indent=2))
