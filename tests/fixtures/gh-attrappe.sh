#!/usr/bin/env bash
# Attrappe für gh in den Tests von scripts/sicherheits-meldung.sh.
# Hält höchstens ein offenes Issue in $ATTRAPPE_DIR, wendet --jq mit dem echten
# jq an und schreibt jeden Aufruf in `aufrufe`. Unbekannte Aufrufe landen in
# `unbekannt` und scheitern.
set -euo pipefail
d="$ATTRAPPE_DIR"

option() {
  local name="$1"
  shift
  while [ $# -gt 0 ]; do
    if [ "$1" = "$name" ]; then
      printf '%s' "$2"
      return 0
    fi
    shift
  done
}

filter="$(option --jq "$@")"
antworten() {
  if [ -n "$filter" ]; then jq -r "$filter"; else cat; fi
}

case "${1:-} ${2:-}" in
  "issue list")
    printf 'issue list state=%s label=%s\n' "$(option --state "$@")" "$(option --label "$@")" >> "$d/aufrufe"
    if [ -f "$d/nummer" ]; then
      jq -n --argjson n "$(cat "$d/nummer")" '[{number: $n, title: "Sicherheitsmeldungen"}]'
    else
      echo '[]'
    fi | antworten
    ;;
  "issue view")
    echo "issue view $3" >> "$d/aufrufe"
    jq -n --rawfile body "$d/body" '{body: $body}' | antworten
    ;;
  "issue create")
    printf 'issue create title=%s label=%s assignee=%s\n' \
      "$(option --title "$@")" "$(option --label "$@")" "$(option --assignee "$@")" >> "$d/aufrufe"
    option --body "$@" > "$d/body"
    echo 7 > "$d/nummer"
    echo "https://github.com/AdamBaranyi/Evidarium/issues/7"
    ;;
  "issue edit")
    echo "issue edit $3" >> "$d/aufrufe"
    option --body "$@" > "$d/body"
    ;;
  "issue comment")
    echo "issue comment $3" >> "$d/aufrufe"
    option --body "$@" > "$d/kommentar"
    ;;
  "issue close")
    echo "issue close $3" >> "$d/aufrufe"
    option --comment "$@" > "$d/kommentar"
    rm -f "$d/nummer"
    ;;
  "label create")
    echo "label create $3" >> "$d/aufrufe"
    ;;
  *)
    echo "$*" >> "$d/unbekannt"
    exit 1
    ;;
esac
