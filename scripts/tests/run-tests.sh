#!/bin/bash
# Inflexion — Exécution des tests unitaires des scripts
# Usage : bash scripts/tests/run-tests.sh

set -e

echo "═══════════════════════════════════════"
echo "  Inflexion — Tests unitaires scripts"
echo "═══════════════════════════════════════"

node --test scripts/tests/lib/claude-api.test.mjs
node --test scripts/tests/semplice-composite.test.mjs
node --test scripts/tests/semplice-zones-config.test.mjs
node --test scripts/tests/semplice-validator-v3.test.mjs

echo ""
echo "✅ Tous les tests sont passés."
