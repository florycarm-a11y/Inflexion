#!/usr/bin/env bash
# briefing-alert.sh — Alerte visible (issue GitHub → e-mail au propriétaire du dépôt)
#
# Usage : scripts/briefing-alert.sh <fail|ok> <controle|pipeline> [fichier-rapport]
#
#   controle : appelé par fetch-data.yml après scripts/check-briefing.mjs
#              (briefing publié figé, contradictoire ou mal libellé)
#   pipeline : appelé par generate-unified-briefing.yml quand la génération échoue
#              (crédit Anthropic épuisé, clé invalide, erreur du script…)
#
# Chaque source gère SA propre issue (label distinct) : un briefing encore frais
# ne doit pas refermer l'alerte « crédit épuisé », et inversement.
#   fail → ouvre l'issue si aucune n'est ouverte (e-mail), sinon met à jour son corps
#          sans commentaire (pas d'e-mail à chaque passage, deux fois par jour)
#   ok   → ferme l'issue ouverte avec un commentaire « rétabli »
#
# Variables : GH_TOKEN (requis), GITHUB_SERVER_URL / GITHUB_REPOSITORY / GITHUB_RUN_ID (Actions).
# Ne fait jamais échouer le workflow : une alerte qui casse n'est pas une alerte.

set -uo pipefail

STATUS="${1:?usage: briefing-alert.sh <fail|ok> <controle|pipeline> [rapport]}"
SOURCE="${2:?source manquante : controle ou pipeline}"
REPORT="${3:-}"

case "$SOURCE" in
  controle) LABEL="alerte-briefing";  TITLE="🩺 Briefing publié non conforme (contrôle qualité)" ;;
  pipeline) LABEL="alerte-pipeline";  TITLE="🧠 Génération du briefing en échec" ;;
  *) echo "source inconnue : $SOURCE" >&2; exit 0 ;;
esac

RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
existing=$(gh issue list --label "$LABEL" --state open --json number --jq '.[0].number // empty' 2>/dev/null || true)

if [ "$STATUS" = "ok" ]; then
  if [ -n "$existing" ]; then
    gh issue close "$existing" --comment "✅ Rétabli — dernier passage : $RUN_URL" || true
    echo "Issue #$existing fermée (rétabli)."
  fi
  exit 0
fi

# ── Diagnostic lisible ───────────────────────────────────────
cause=""
if [ -n "$REPORT" ] && [ -f "$REPORT" ]; then
  if grep -qi "credit balance is too low" "$REPORT"; then
    cause="**Cause : crédit Anthropic épuisé.** Recharger sur console.anthropic.com → Plans & Billing, puis relancer « Generate Unified Briefing » (onglet Actions → Run workflow)."
  elif grep -qiE "invalid x-api-key|authentication_error" "$REPORT"; then
    cause="**Cause : clé API Anthropic invalide.** Vérifier le secret \`ANTHROPIC_API_KEY\` (Settings → Secrets and variables → Actions)."
  elif grep -q "vieux de" "$REPORT"; then
    cause="**Cause : briefing figé.** Le générateur ne tourne plus : voir la dernière exécution de « Generate Unified Briefing » dans l'onglet Actions (crédit Anthropic, workflow désactivé…)."
  fi
fi

extrait=""
if [ -n "$REPORT" ] && [ -f "$REPORT" ]; then
  extrait=$(tail -n 40 "$REPORT" | sed 's/```/ʼʼʼ/g')
fi

# (Pas d'apostrophe dans un « ${var:-…} » entre guillemets : bash l'y prend pour une quote.)
[ -n "$cause" ] || cause="Le contrôle a échoué : voir l’extrait et le journal ci-dessous."
[ -n "$extrait" ] || extrait="(pas de rapport)"
maj=$(date -u +'%Y-%m-%d %H:%M UTC')

body="$cause

**Dernier passage :** $RUN_URL
**Mis à jour :** $maj

\`\`\`
$extrait
\`\`\`

_Issue gérée automatiquement par \`scripts/briefing-alert.sh\` : elle se ferme seule quand le problème disparaît._"

if [ -z "$existing" ]; then
  gh label create "$LABEL" --color B60205 --description "Alerte automatique du briefing" --force >/dev/null 2>&1 || true
  gh issue create --title "$TITLE" --label "$LABEL" --body "$body" || true
  echo "Issue d'alerte ouverte ($LABEL)."
else
  gh issue edit "$existing" --body "$body" >/dev/null || true
  echo "Issue #$existing mise à jour ($LABEL)."
fi
exit 0
