#!/usr/bin/env bash
# Prüft die Abhängigkeiten. Aufruf: bash scripts/audit.sh high|moderate
# Jede Ausnahme steht hier mit Kennung und ist in docs/SECURITY.md begründet
# (Paket, Stufe, Laufzeit oder Werkzeug, Grund, Datum, prüfen bis).
set -euo pipefail
stufe="${1:-high}"
ausnahmen=(
  --ignore GHSA-67mh-4wv8-2f99   # esbuild 0.18 über drizzle-kit, nur Entwicklungsserver, kein Update – prüfen bis 10.11.2026
)
# Die Form ${a[@]+…} hält auch eine leere Liste aus: bash 3.2 (macOS) bricht
# sonst unter set -u ab. Leer ist das Ziel, sobald keine Ausnahme mehr nötig ist.
bun audit --audit-level="$stufe" ${ausnahmen[@]+"${ausnahmen[@]}"}
