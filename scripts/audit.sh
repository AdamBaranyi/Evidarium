#!/usr/bin/env bash
# Prüft die Abhängigkeiten. Aufruf: bash scripts/audit.sh high|moderate
# Jede Ausnahme steht hier mit Kennung und ist in docs/SECURITY.md begründet
# (Paket, Stufe, Laufzeit oder Werkzeug, Grund, Datum, prüfen bis).
set -euo pipefail
stufe="${1:-high}"
ausnahmen=(
  --ignore GHSA-67mh-4wv8-2f99   # esbuild 0.18 über drizzle-kit, nur Entwicklungsserver, kein Update – prüfen bis 10.11.2026
)
bun audit --audit-level="$stufe" "${ausnahmen[@]}"
