#!/usr/bin/env node
/**
 * Inflexion — Génération d'alertes de marché
 *
 * Ce script :
 * 1. Lit les données de marché (crypto, marchés, FNG, forex, macro)
 * 2. Détecte les mouvements significatifs (dépassement de seuils)
 * 3. Utilise Claude pour rédiger des alertes concises
 * 4. Écrit le résultat dans data/alerts.json
 *
 * Exécuté toutes les 6h par GitHub Actions (après analyze-sentiment)
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import { ALERTS_SYSTEM_PROMPT } from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Seuils de détection ─────────────────────────────────────

const THRESHOLDS = {
    /** Variation 24h crypto (%) pour déclencher une alerte */
    crypto_change_24h_pct: 5.0,
    /** Variation 7j crypto (%) pour déclencher une alerte */
    crypto_change_7d_pct: 10.0,
    /** Variation marché (%) pour déclencher une alerte */
    market_change_pct: 2.0,
    /** Variation du Fear & Greed (points sur 7j) pour déclencher une alerte */
    fear_greed_change_points: 10,
    /** Seuils extrêmes du Fear & Greed */
    fear_greed_extreme_low: 15,
    fear_greed_extreme_high: 85,
};

// ─── Utilitaires ─────────────────────────────────────────────

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  📝 ${filepath.split('/').pop()} sauvegardé`);
}

function loadJSON(filename) {
    const filepath = join(DATA_DIR, filename);
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

// ─── Détection des mouvements significatifs ──────────────────

/**
 * Détecte les mouvements significatifs dans les données crypto.
 * @param {Object} cryptoData - Données de data/crypto.json
 * @returns {Array<Object>} Mouvements détectés
 */
function detectCryptoChanges(cryptoData) {
    if (!cryptoData?.prices?.length) return [];

    const changes = [];
    for (const coin of cryptoData.prices) {
        // Variation 24h significative
        if (Math.abs(coin.change_24h) >= THRESHOLDS.crypto_change_24h_pct) {
            changes.push({
                type: 'crypto_24h',
                categorie: 'crypto',
                severite: Math.abs(coin.change_24h) >= 10 ? 'urgent' : 'attention',
                donnees: {
                    symbole: coin.symbol,
                    nom: coin.name,
                    prix: coin.price,
                    variation_24h: Math.round(coin.change_24h * 100) / 100,
                    market_cap: coin.market_cap,
                },
                description: `${coin.name} (${coin.symbol}) : ${coin.change_24h > 0 ? '+' : ''}${coin.change_24h.toFixed(2)}% sur 24h (prix: $${coin.price.toLocaleString('fr-FR')})`,
            });
        }

        // Variation 7j significative
        if (coin.change_7d && Math.abs(coin.change_7d) >= THRESHOLDS.crypto_change_7d_pct) {
            changes.push({
                type: 'crypto_7d',
                categorie: 'crypto',
                severite: Math.abs(coin.change_7d) >= 20 ? 'urgent' : 'attention',
                donnees: {
                    symbole: coin.symbol,
                    nom: coin.name,
                    prix: coin.price,
                    variation_7d: Math.round(coin.change_7d * 100) / 100,
                },
                description: `${coin.name} (${coin.symbol}) : ${coin.change_7d > 0 ? '+' : ''}${coin.change_7d.toFixed(2)}% sur 7 jours`,
            });
        }
    }
    return changes;
}

/**
 * Détecte les mouvements significatifs dans les données marchés.
 * @param {Object} marketsData - Données de data/markets.json
 * @returns {Array<Object>} Mouvements détectés
 */
function detectMarketChanges(marketsData) {
    if (!marketsData?.quotes?.length) return [];

    const changes = [];
    for (const quote of marketsData.quotes) {
        if (Math.abs(quote.change) >= THRESHOLDS.market_change_pct) {
            changes.push({
                type: 'market',
                categorie: 'marches',
                severite: Math.abs(quote.change) >= 3 ? 'urgent' : 'attention',
                donnees: {
                    symbole: quote.symbol,
                    nom: quote.name,
                    prix: quote.price,
                    variation: Math.round(quote.change * 100) / 100,
                },
                description: `${quote.name} (${quote.symbol}) : ${quote.change > 0 ? '+' : ''}${quote.change.toFixed(2)}% (prix: $${quote.price.toFixed(2)})`,
            });
        }
    }
    return changes;
}

/**
 * Détecte les mouvements significatifs du Fear & Greed Index.
 * @param {Object} fngData - Données de data/fear-greed.json
 * @returns {Array<Object>} Mouvements détectés
 */
function detectFearGreedChanges(fngData) {
    if (!fngData?.current) return [];

    const changes = [];
    const score = fngData.current.value;
    const weekChange = fngData.changes?.week;

    // Niveau extrême
    if (score <= THRESHOLDS.fear_greed_extreme_low) {
        changes.push({
            type: 'fng_extreme',
            categorie: 'macro',
            severite: score <= 10 ? 'urgent' : 'attention',
            donnees: {
                score,
                label: fngData.current.label,
                variation_7j: weekChange,
            },
            description: `Fear & Greed Index à ${score} (${fngData.current.label})${weekChange ? `, variation 7j: ${weekChange > 0 ? '+' : ''}${weekChange} pts` : ''}`,
        });
    } else if (score >= THRESHOLDS.fear_greed_extreme_high) {
        changes.push({
            type: 'fng_extreme',
            categorie: 'macro',
            severite: score >= 90 ? 'urgent' : 'attention',
            donnees: {
                score,
                label: fngData.current.label,
                variation_7j: weekChange,
            },
            description: `Fear & Greed Index à ${score} (${fngData.current.label})${weekChange ? `, variation 7j: ${weekChange > 0 ? '+' : ''}${weekChange} pts` : ''}`,
        });
    }

    // Variation hebdomadaire significative
    if (weekChange && Math.abs(weekChange) >= THRESHOLDS.fear_greed_change_points) {
        changes.push({
            type: 'fng_change',
            categorie: 'macro',
            severite: 'info',
            donnees: {
                score,
                label: fngData.current.label,
                variation_7j: weekChange,
            },
            description: `Fear & Greed : variation de ${weekChange > 0 ? '+' : ''}${weekChange} pts sur 7 jours (actuellement ${score})`,
        });
    }

    return changes;
}

// ─── Génération des textes d'alerte via Claude ───────────────

/**
 * Génère les textes d'alerte via Claude à partir des changements détectés.
 * @param {Array<Object>} changes - Mouvements significatifs détectés
 * @returns {Promise<Array<Object>>} Alertes rédigées
 */
async function generateAlertTexts(changes) {
    if (changes.length === 0) return [];

    const changesText = changes
        .map((c, i) => `[${i + 1}] ${c.description}`)
        .join('\n');

    const userMessage = `Date : ${new Date().toISOString().split('T')[0]}

${changes.length} mouvement(s) significatif(s) détecté(s) :

${changesText}

Rédige une alerte pour chaque mouvement.`;

    try {
        const result = await callClaudeJSON({
            systemPrompt: ALERTS_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 1500,
            label: 'alerts',
            validate: (data) => {
                if (!Array.isArray(data.alertes)) return 'Champ "alertes" manquant';
                return true;
            },
        });

        // Enrichir les alertes avec les données brutes
        const dateStr = new Date().toISOString();
        return result.alertes.map((alerte, i) => ({
            id: `alert-${new Date().toISOString().split('T')[0]}-${String(i + 1).padStart(3, '0')}`,
            ...alerte,
            horodatage: dateStr,
            donnees: changes[i]?.donnees || {},
        }));
    } catch (err) {
        console.error(`  ✗ Erreur génération alertes: ${err.message}`);
        return [];
    }
}

// ─── Exécution principale ────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — Génération d\'alertes');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    // Charger les données
    const cryptoData = loadJSON('crypto.json');
    const marketsData = loadJSON('markets.json');
    const fngData = loadJSON('fear-greed.json');

    console.log(`\n📊 Données chargées :`);
    console.log(`  Crypto: ${cryptoData?.prices?.length || 0} coins`);
    console.log(`  Marchés: ${marketsData?.quotes?.length || 0} indices`);
    console.log(`  FNG: ${fngData?.current?.value ?? 'N/A'}`);

    // Détecter les changements significatifs
    const allChanges = [
        ...detectCryptoChanges(cryptoData),
        ...detectMarketChanges(marketsData),
        ...detectFearGreedChanges(fngData),
    ];

    console.log(`\n🔍 ${allChanges.length} mouvement(s) significatif(s) détecté(s)`);

    if (allChanges.length === 0) {
        console.log('\n✓ Aucune alerte à générer — marchés calmes');
        if (!DRY_RUN) {
            const alertsData = {
                updated: new Date().toISOString(),
                alertes: [],
                stats: { total: 0, urgent: 0, attention: 0, info: 0 },
            };
            writeJSON(join(DATA_DIR, 'alerts.json'), alertsData);
        }
        return;
    }

    for (const change of allChanges) {
        const icon = change.severite === 'urgent' ? '🔴' : change.severite === 'attention' ? '🟡' : '🔵';
        console.log(`  ${icon} ${change.description}`);
    }

    if (DRY_RUN) {
        console.log('\n🔍 [DRY-RUN] Résumé des alertes qui seraient générées :');
        for (const c of allChanges) {
            console.log(`  • [${c.severite}] ${c.categorie}: ${c.description}`);
        }
        console.log(`\n✓ [DRY-RUN] ${allChanges.length} alerte(s) — aucun fichier écrit`);
        return;
    }

    // Générer les alertes via Claude
    let alertes = [];
    if (process.env.ANTHROPIC_API_KEY) {
        console.log('\n✍️  Rédaction des alertes via Claude...');
        alertes = await generateAlertTexts(allChanges);
    } else {
        // Fallback sans Claude : utiliser les descriptions brutes
        console.log('\n⚠ ANTHROPIC_API_KEY non définie — alertes brutes');
        alertes = allChanges.map((c, i) => ({
            id: `alert-${new Date().toISOString().split('T')[0]}-${String(i + 1).padStart(3, '0')}`,
            titre: c.description.slice(0, 80),
            texte: c.description,
            categorie: c.categorie,
            severite: c.severite,
            impact: (c.donnees.variation_24h ?? c.donnees.variation ?? c.donnees.variation_7j ?? 0) > 0 ? 'haussier' : 'baissier',
            horodatage: new Date().toISOString(),
            donnees: c.donnees,
        }));
    }

    // Calculer les stats
    const stats = {
        total: alertes.length,
        urgent: alertes.filter(a => a.severite === 'urgent').length,
        attention: alertes.filter(a => a.severite === 'attention').length,
        info: alertes.filter(a => a.severite === 'info').length,
    };

    // Sauvegarder
    const alertsData = {
        updated: new Date().toISOString(),
        alertes,
        stats,
        model: process.env.ANTHROPIC_API_KEY ? 'claude-haiku-4-5-20251001' : null,
    };

    writeJSON(join(DATA_DIR, 'alerts.json'), alertsData);

    // Résumé
    const usageStats = getUsageStats();
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  🔴 ${stats.urgent} urgent(es)`);
    console.log(`  🟡 ${stats.attention} attention`);
    console.log(`  🔵 ${stats.info} info`);
    console.log(`  📊 Total: ${stats.total} alerte(s)`);
    if (usageStats.totalCalls > 0) {
        console.log(`  💰 Claude API : ${usageStats.totalCalls} appels, ~$${usageStats.estimatedCostUSD}`);
    }
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
