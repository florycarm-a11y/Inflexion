#!/bin/bash
# Inflexion — Exécution des tests unitaires des scripts
# Usage : bash scripts/tests/run-tests.sh

set -e

echo "═══════════════════════════════════════"
echo "  Inflexion — Tests unitaires scripts"
echo "═══════════════════════════════════════"

node --test scripts/tests/lib/claude-api.test.mjs

echo ""
echo "✅ Tous les tests sont passés."
