#!/bin/bash
# Rend les instruments ou une gravure dans studio/rendu/, au prochain numéro libre, puis fabrique la planche.
# N'écrase jamais un rendu. N'installe rien. N'envoie rien sur Internet.
#
# Usage (depuis n'importe quel répertoire) :
#   bash studio/outils/rendre.sh instrument
#   bash studio/outils/rendre.sh gravure <nom> <16x9|5x3> [focal "50,50"] [kicker] [legende]
set -u
ICI="$(cd "$(dirname "$0")" && pwd)"
STUDIO="$(dirname "$ICI")"
[ $# -ge 1 ] || { echo "Usage : $0 instrument | gravure <nom> <16x9|5x3> [focal] [kicker] [legende]" >&2; exit 1; }

# ---------- les outils ----------
command -v node >/dev/null 2>&1 || { echo "Il manque Node.js 22 ou plus (nodejs.org)." >&2; exit 1; }
MAJEURE=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)
[ "${MAJEURE:-0}" -ge 22 ] || { echo "Node.js $(node --version) est trop ancien : il faut la version 22 ou plus." >&2; exit 1; }
PY="${PYTHON:-$(command -v python3)}" ; [ -n "$PY" ] || { echo "Il manque python3 (avec Pillow) pour la planche." >&2; exit 1; }
"$PY" -c 'import PIL' 2>/dev/null || { echo "Pillow manque pour $PY. Installez-le ($PY -m pip install pillow) ou indiquez un autre Python via PYTHON=/opt/homebrew/bin/python3." >&2; exit 1; }
if [ -n "${CHROME:-}" ]; then
  CANDIDATS=("$CHROME")
else
  CANDIDATS=("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium")
fi
CHROME_OK=0
for c in "${CANDIDATS[@]}"; do
  [ -x "$c" ] && { CHROME_OK=1; break; }
done
if [ "$CHROME_OK" -ne 1 ]; then
  if [ -n "${CHROME:-}" ]; then echo "CHROME=$CHROME n'est pas un exécutable." >&2
  else echo "Il manque Google Chrome, ou indiquez son chemin dans la variable CHROME." >&2; fi
  exit 1
fi

# ---------- la tâche ----------
MODE="$1"
ENTREE=""
trap '[ -n "$ENTREE" ] && [ "$MODE" = gravure ] && rm -f "$ENTREE"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
case "$MODE" in
  instrument)
    BASE="instrument"; ENTREE="instrument" ;;
  gravure)
    [ $# -ge 3 ] || { echo "Usage : $0 gravure <nom> <16x9|5x3> [focal] [kicker] [legende]" >&2; exit 1; }
    NOM="$2"; FORMAT="$3"; FOCAL="${4:-50,50}"; KICKER="${5:-Analyse}"; LEGENDE="${6:-}"
    case "$FORMAT" in 16x9|5x3) ;; *) echo "Format inconnu : $FORMAT (16x9 ou 5x3)" >&2; exit 1 ;; esac
    SOURCE=""
    for ext in jpg jpeg png webp; do [ -f "$STUDIO/sources/$NOM.$ext" ] && { SOURCE="../sources/$NOM.$ext"; break; }; done
    [ -n "$SOURCE" ] || { echo "Source introuvable : studio/sources/$NOM.(jpg|jpeg|png|webp)" >&2; exit 1; }
    BASE="gravure-$NOM"
    ENTREE=$(mktemp "${TMPDIR:-/tmp}/taches-XXXXXX") || { echo "mktemp a échoué." >&2; exit 1; }
    node -e '
      const [source, format, focal, kicker, legende, nom] = process.argv.slice(1);
      console.log(JSON.stringify([{ scene: "gravure.html", params: { source, format, focal, kicker, legende }, sortie: `${nom}-${format}.webp` }]));
    ' "$SOURCE" "$FORMAT" "$FOCAL" "$KICKER" "$LEGENDE" "$NOM" > "$ENTREE" ;;
  *) echo "Mode inconnu : $MODE (instrument ou gravure)" >&2; exit 1 ;;
esac

# ---------- le numéro ----------
N=1
while [ -e "$STUDIO/rendu/$BASE-v$N" ]; do N=$((N+1)); done
SORTIE="$STUDIO/rendu/$BASE-v$N"

# ---------- le rendu et la planche ----------
DEBUT=$(date +%s)
# en mode instrument, le mot "instrument" est passé tel quel : rendre.mjs énumère lui-même en interrogeant la scène
node "$ICI/rendre.mjs" "$ENTREE" "$SORTIE" || { echo "Le rendu a échoué. Les images déjà produites, s'il y en a, sont dans $SORTIE." >&2; exit 1; }
echo "Rendu en $(( $(date +%s) - DEBUT )) s : $SORTIE"
"$PY" "$ICI/planche.py" "$SORTIE"
exit 0
