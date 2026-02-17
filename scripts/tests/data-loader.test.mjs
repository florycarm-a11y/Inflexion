/**
 * Tests unitaires — data-loader.js
 *
 * Exécution :  node --test scripts/tests/data-loader.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zéro dépendance)
 *
 * Couvre :
 *   A. formatUSD / formatPercent / isFresh        (utilitaires publics)
 *   B. scoreArticle                                (scoring qualité)
 *   C. curateArticles                              (curation multi-rubrique)
 *   D. truncateTitle / isSummaryRedundant          (nettoyage articles)
 *   E. isArticleRelevant                           (filtrage hors-sujet)
 *   F. getPriceForSymbol                           (lookup prix cross-source)
 *   G. getNewsForSymbol                            (alertes croisées watchlist)
 *   H. getAlertsForSymbol                          (alertes IA par symbole)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// data-loader.js utilise un IIFE + module.exports fallback (CommonJS)
const require = createRequire(import.meta.url);
const DataLoader = require('../../data-loader.js');

const {
    scoreArticle,
    curateArticles,
    truncateTitle,
    isSummaryRedundant,
    isArticleRelevant,
    SOURCE_TIERS,
    _setCache,
    _setInitialized,
    _resetCache,
} = DataLoader._internals;


// ═══════════════════════════════════════════════════════════════
// A. Utilitaires publics : formatUSD, formatPercent, isFresh
// ═══════════════════════════════════════════════════════════════

describe('A. formatUSD', () => {
    it('formate des montants simples (format français)', () => {
        // Format français : virgule décimale, espace insécable séparateur de milliers, $ après
        const result = DataLoader.formatUSD(1234.56);
        assert.ok(result.includes('1'), 'Contient 1');
        assert.ok(result.includes('234'), 'Contient 234');
        assert.ok(result.includes('56'), 'Contient 56');
        assert.ok(result.endsWith('$'), 'Se termine par $');
    });

    it('formate les trillions', () => {
        assert.equal(DataLoader.formatUSD(2.5e12), '2,5 T$');
    });

    it('formate les milliards', () => {
        assert.equal(DataLoader.formatUSD(1.8e9), '1,8 Mrd $');
    });

    it('formate les millions', () => {
        assert.equal(DataLoader.formatUSD(42.3e6), '42,3 M $');
    });

    it('respecte le nombre de décimales', () => {
        const result = DataLoader.formatUSD(99.1, 0);
        assert.ok(result.includes('99'), 'Contient 99');
        assert.ok(result.endsWith('$'), 'Se termine par $');
    });

    it('gère zéro', () => {
        const result = DataLoader.formatUSD(0);
        assert.ok(result.includes('0'), 'Contient 0');
        assert.ok(result.endsWith('$'), 'Se termine par $');
    });
});

describe('A. formatPercent', () => {
    it('formate un pourcentage positif avec signe + (format français)', () => {
        const result = DataLoader.formatPercent(3.14);
        assert.equal(result.text, '+3,14%');
        assert.equal(result.positive, true);
    });

    it('formate un pourcentage négatif (format français)', () => {
        const result = DataLoader.formatPercent(-2.5);
        assert.equal(result.text, '-2,50%');
        assert.equal(result.positive, false);
    });

    it('gère zéro (positif, format français)', () => {
        const result = DataLoader.formatPercent(0);
        assert.equal(result.text, '+0,00%');
        assert.equal(result.positive, true);
    });

    it('retourne N/A pour null', () => {
        const result = DataLoader.formatPercent(null);
        assert.equal(result.text, 'N/A');
        assert.equal(result.positive, false);
    });

    it('retourne N/A pour NaN', () => {
        const result = DataLoader.formatPercent(NaN);
        assert.equal(result.text, 'N/A');
        assert.equal(result.positive, false);
    });
});

describe('A. isFresh', () => {
    it('retourne true pour une date récente (1h)', () => {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        assert.equal(DataLoader.isFresh(oneHourAgo), true);
    });

    it('retourne false pour une date ancienne (24h)', () => {
        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        assert.equal(DataLoader.isFresh(oneDayAgo), false);
    });

    it('retourne false pour null', () => {
        assert.equal(DataLoader.isFresh(null), false);
    });

    it('retourne false pour undefined', () => {
        assert.equal(DataLoader.isFresh(undefined), false);
    });

    it('retourne true pour maintenant', () => {
        assert.equal(DataLoader.isFresh(new Date().toISOString()), true);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. scoreArticle
// ═══════════════════════════════════════════════════════════════

describe('B. scoreArticle', () => {
    it('donne un score élevé à un article Tier 1 complet', () => {
        const article = {
            source: 'Reuters',
            title: 'Fed maintient ses taux : impact sur les marchés de +2,5 %',
            description: 'La Réserve fédérale américaine a décidé de maintenir ses taux directeurs inchangés, provoquant un rebond significatif sur les indices boursiers mondiaux.',
            publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1h
            image: 'https://example.com/fed.jpg',
            lang: 'fr',
        };
        const score = scoreArticle(article);
        assert.ok(score >= 70, `Score Tier 1 complet devrait être >= 70, obtenu: ${score}`);
    });

    it('donne un score moyen à un article Tier 2', () => {
        const article = {
            source: 'MarketWatch',
            title: 'Le Nasdaq rebondit après les annonces de la Fed',
            description: 'Les marchés américains ont rebondi mardi.',
            publishedAt: new Date(Date.now() - 36000000).toISOString(), // 10h
        };
        const score = scoreArticle(article);
        assert.ok(score >= 30 && score <= 70, `Score Tier 2 devrait être entre 30-70, obtenu: ${score}`);
    });

    it('donne un score bas à un article Tier 3 sans description', () => {
        const article = {
            source: 'GNews',
            title: 'News',
            description: '',
        };
        const score = scoreArticle(article);
        assert.ok(score < 30, `Score Tier 3 sans desc devrait être < 30, obtenu: ${score}`);
    });

    it('pénalise les titres clickbait', () => {
        const clickbait = scoreArticle({
            source: 'Reuters',
            title: 'BREAKING: marchés en folie',
            description: 'Article détaillé sur les marchés en ébullition après les décisions de la BCE.',
        });
        const normal = scoreArticle({
            source: 'Reuters',
            title: 'Marchés en hausse après décision BCE',
            description: 'Article détaillé sur les marchés en ébullition après les décisions de la BCE.',
        });
        assert.ok(normal > clickbait, `Normal (${normal}) devrait battre clickbait (${clickbait})`);
    });

    it('accorde un bonus aux titres contenant des données chiffrées', () => {
        const withData = scoreArticle({
            source: 'CNBC',
            title: 'Or en hausse de 2,5 % à 5 100 $ l\'once',
            description: 'Le métal jaune continue sa progression haussière.',
        });
        const without = scoreArticle({
            source: 'CNBC',
            title: 'Or en hausse significative cette semaine',
            description: 'Le métal jaune continue sa progression haussière.',
        });
        assert.ok(withData > without, `Avec données (${withData}) devrait battre sans (${without})`);
    });

    it('accorde un bonus de fraîcheur aux articles récents', () => {
        const recent = scoreArticle({
            source: 'Reuters',
            title: 'Fed maintient ses taux directeurs inchangés',
            description: 'Décision attendue par les marchés.',
            publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1h
        });
        const old = scoreArticle({
            source: 'Reuters',
            title: 'Fed maintient ses taux directeurs inchangés',
            description: 'Décision attendue par les marchés.',
            publishedAt: new Date(Date.now() - 172800000).toISOString(), // 48h
        });
        assert.ok(recent > old, `Récent (${recent}) devrait battre ancien (${old})`);
    });

    it('privilégie les articles en français', () => {
        const fr = scoreArticle({
            source: 'CNBC',
            title: 'Marchés financiers en progression constante',
            description: 'Les indices boursiers américains ont progressé.',
            lang: 'fr',
        });
        const en = scoreArticle({
            source: 'CNBC',
            title: 'Marchés financiers en progression constante',
            description: 'Les indices boursiers américains ont progressé.',
            lang: 'en',
        });
        assert.ok(fr > en, `FR (${fr}) devrait battre EN (${en})`);
    });

    it('plafonne le score à 100', () => {
        const perfect = scoreArticle({
            source: 'Reuters',
            title: 'Fed relève ses taux de 0,25 % à 5,75 % : impact immédiat sur les marchés et les devises internationales',
            description: 'La Réserve fédérale américaine a décidé de relever ses taux directeurs pour la première fois en six mois, provoquant des mouvements importants sur les marchés obligataires et actions.',
            publishedAt: new Date(Date.now() - 1800000).toISOString(),
            image: 'https://example.com/img.jpg',
            lang: 'fr',
        });
        assert.ok(perfect <= 100, `Score ne devrait pas dépasser 100, obtenu: ${perfect}`);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. curateArticles
// ═══════════════════════════════════════════════════════════════

function makeArticle(rubrique, source, title, url) {
    return {
        rubrique,
        source: source || 'Reuters',
        title: title || `Article ${rubrique} ${Math.random().toString(36).slice(2, 8)}`,
        description: 'Description détaillée de l\'article avec suffisamment de contenu.',
        url: url || `https://example.com/${Math.random().toString(36).slice(2, 10)}`,
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        lang: 'fr',
    };
}

describe('C. curateArticles', () => {
    it('retourne le nombre cible d\'articles', () => {
        const articles = [];
        for (let i = 0; i < 30; i++) {
            const rubriques = ['geopolitique', 'marches', 'crypto', 'matieres_premieres', 'ai_tech'];
            articles.push(makeArticle(rubriques[i % 5]));
        }
        const result = curateArticles(articles, 12);
        assert.equal(result.length, 12);
    });

    it('garantit au moins 2 articles par rubrique', () => {
        const articles = [];
        const rubriques = ['geopolitique', 'marches', 'crypto', 'matieres_premieres', 'ai_tech'];
        for (let i = 0; i < 40; i++) {
            articles.push(makeArticle(rubriques[i % 5]));
        }
        const result = curateArticles(articles, 12);

        const counts = {};
        result.forEach(a => {
            counts[a.rubrique] = (counts[a.rubrique] || 0) + 1;
        });
        rubriques.forEach(r => {
            assert.ok((counts[r] || 0) >= 2, `Rubrique ${r} devrait avoir >= 2 articles, a ${counts[r] || 0}`);
        });
    });

    it('limite à max 3 articles par rubrique (phase 2)', () => {
        const articles = [];
        // 20 articles marchés, 2 de chaque autre
        for (let i = 0; i < 20; i++) articles.push(makeArticle('marches'));
        for (const r of ['geopolitique', 'crypto', 'matieres_premieres', 'ai_tech']) {
            articles.push(makeArticle(r));
            articles.push(makeArticle(r));
        }
        const result = curateArticles(articles, 12);

        const marchesCount = result.filter(a => a.rubrique === 'marches').length;
        assert.ok(marchesCount <= 4, `Marchés ne devrait pas dépasser 4, obtenu: ${marchesCount}`);
    });

    it('gère le cas avec peu d\'articles', () => {
        const articles = [
            makeArticle('geopolitique'),
            makeArticle('crypto'),
        ];
        const result = curateArticles(articles, 12);
        assert.equal(result.length, 2);
    });

    it('évite les doublons (même URL)', () => {
        const articles = [
            makeArticle('geopolitique', 'Reuters', 'Titre A', 'https://example.com/same'),
            makeArticle('marches', 'Bloomberg', 'Titre B', 'https://example.com/same'),
            makeArticle('crypto', 'CoinDesk', 'Titre C'),
        ];
        const result = curateArticles(articles, 12);
        const urls = result.map(a => a.url);
        const unique = new Set(urls);
        assert.equal(urls.length, unique.size, 'Pas de doublons d\'URL');
    });

    it('trie les résultats par score décroissant', () => {
        const articles = [];
        for (let i = 0; i < 20; i++) {
            const rubriques = ['geopolitique', 'marches', 'crypto', 'matieres_premieres', 'ai_tech'];
            articles.push(makeArticle(rubriques[i % 5]));
        }
        const result = curateArticles(articles, 10);
        for (let i = 1; i < result.length; i++) {
            assert.ok(
                result[i - 1]._qualityScore >= result[i]._qualityScore,
                `Articles non triés à l'index ${i}: ${result[i - 1]._qualityScore} >= ${result[i]._qualityScore}`
            );
        }
    });

    it('utilise le défaut de 12 sans argument targetTotal', () => {
        const articles = [];
        for (let i = 0; i < 30; i++) {
            const rubriques = ['geopolitique', 'marches', 'crypto', 'matieres_premieres', 'ai_tech'];
            articles.push(makeArticle(rubriques[i % 5]));
        }
        const result = curateArticles(articles);
        assert.equal(result.length, 12);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. truncateTitle / isSummaryRedundant
// ═══════════════════════════════════════════════════════════════

describe('D. truncateTitle', () => {
    it('ne tronque pas un titre court', () => {
        assert.equal(truncateTitle('Titre court', 120), 'Titre court');
    });

    it('tronque un titre long au dernier mot complet', () => {
        const long = 'Ce titre est beaucoup trop long et devrait être tronqué proprement au dernier mot complet avant la limite de caractères';
        const result = truncateTitle(long, 50);
        assert.ok(result.length <= 51, `Résultat trop long: ${result.length}`); // +1 pour l'ellipsis
        assert.ok(result.endsWith('\u2026'), 'Devrait se terminer par …');
    });

    it('gère null', () => {
        assert.equal(truncateTitle(null, 120), null);
    });

    it('gère un titre vide', () => {
        assert.equal(truncateTitle('', 120), '');
    });
});

describe('D. isSummaryRedundant', () => {
    it('détecte un résumé qui commence comme le titre', () => {
        assert.equal(
            isSummaryRedundant(
                'Fed maintient ses taux directeurs',
                'Fed maintient ses taux directeurs. La décision était attendue par les marchés.'
            ),
            true
        );
    });

    it('détecte un résumé contenant le titre entier', () => {
        assert.equal(
            isSummaryRedundant(
                'Or en hausse',
                'Article complet : Or en hausse, les analystes recommandent la prudence.'
            ),
            true
        );
    });

    it('détecte une redondance par mots communs (>60%)', () => {
        assert.equal(
            isSummaryRedundant(
                'Bitcoin chute sous les 73 000 dollars face aux tensions géopolitiques',
                'Face aux tensions géopolitiques mondiales, le bitcoin chute brutalement sous les 73 000 dollars'
            ),
            true
        );
    });

    it('accepte un résumé complémentaire', () => {
        assert.equal(
            isSummaryRedundant(
                'Fed maintient ses taux',
                'Les marchés européens ont réagi positivement à l\'annonce, avec le CAC 40 en hausse de 1,2 %.'
            ),
            false
        );
    });

    it('retourne false pour des entrées vides', () => {
        assert.equal(isSummaryRedundant('', ''), false);
        assert.equal(isSummaryRedundant(null, 'test'), false);
        assert.equal(isSummaryRedundant('test', null), false);
    });
});


// ═══════════════════════════════════════════════════════════════
// E. isArticleRelevant
// ═══════════════════════════════════════════════════════════════

describe('E. isArticleRelevant', () => {
    it('accepte un article financier classique', () => {
        assert.equal(
            isArticleRelevant({
                title: 'S&P 500 en hausse de 1,2 % après la décision de la Fed',
                description: 'Les marchés américains ont progressé mardi.',
                rubrique: 'marches',
            }),
            true
        );
    });

    it('rejette un article sport Champions League (pattern global)', () => {
        assert.equal(
            isArticleRelevant({
                title: 'Champions League : results and standings',
                description: 'PSG faces Bayern Munich tonight.',
                rubrique: 'marches',
            }),
            false
        );
    });

    it('rejette un article recette dans rubrique geopolitique', () => {
        assert.equal(
            isArticleRelevant({
                title: 'Recette du poulet basquaise revisitée',
                description: 'Une recette simple et rapide.',
                rubrique: 'geopolitique',
            }),
            false
        );
    });

    it('rejette un test de SUV dans la rubrique marchés', () => {
        assert.equal(
            isArticleRelevant({
                title: 'Test du nouveau SUV Peugeot 3008',
                description: 'Essai routier complet de la voiture française.',
                rubrique: 'marches',
            }),
            false
        );
    });

    it('rejette un article péage dans ai_tech', () => {
        assert.equal(
            isArticleRelevant({
                title: 'Péage : nouvelle hausse des tarifs sur l\'A6',
                description: 'Les automobilistes vont payer plus cher.',
                rubrique: 'ai_tech',
            }),
            false
        );
    });

    it('accepte un article sans rubrique', () => {
        assert.equal(
            isArticleRelevant({
                title: 'Inflation en zone euro : 2,4 % en janvier',
                description: 'La BCE surveille l\'évolution des prix.',
            }),
            true
        );
    });
});


// ═══════════════════════════════════════════════════════════════
// F. getPriceForSymbol
// ═══════════════════════════════════════════════════════════════

describe('F. getPriceForSymbol', () => {
    beforeEach(() => {
        _resetCache();
        _setInitialized(true);
    });

    afterEach(() => {
        _resetCache();
    });

    it('trouve un prix crypto dans CoinGecko', () => {
        _setCache('crypto', {
            prices: [
                { id: 'bitcoin', symbol: 'btc', price: 73000, change_24h: -2.5 },
                { id: 'ethereum', symbol: 'eth', price: 2200, change_24h: -1.8 },
            ],
        });
        const result = DataLoader.getPriceForSymbol('BTC', 'crypto');
        assert.deepEqual(result, { price: 73000, change: -2.5, source: 'CoinGecko' });
    });

    it('fallback vers Messari si CoinGecko ne trouve pas', () => {
        _setCache('crypto', { prices: [] });
        _setCache('messari', {
            assets: [
                { symbol: 'SOL', price: 98, percent_change_24h: 3.2 },
            ],
        });
        const result = DataLoader.getPriceForSymbol('SOL', 'crypto');
        assert.deepEqual(result, { price: 98, change: 3.2, source: 'Messari' });
    });

    it('trouve un indice US dans Finnhub', () => {
        _setCache('markets', {
            quotes: [
                { symbol: 'SPY', name: 'S&P 500', price: 5100, change: 1.2 },
            ],
        });
        const result = DataLoader.getPriceForSymbol('SPY', 'stock');
        assert.deepEqual(result, { price: 5100, change: 1.2, source: 'Finnhub' });
    });

    it('trouve un indice européen dans Twelve Data', () => {
        _setCache('europeanMarkets', {
            indices: [
                { symbol: 'CAC40', name: 'CAC 40', price: 7800, change_pct: 0.8 },
            ],
        });
        const result = DataLoader.getPriceForSymbol('CAC40', 'index');
        assert.deepEqual(result, { price: 7800, change: 0.8, source: 'Twelve Data' });
    });

    it('retourne null si non initialisé', () => {
        _setInitialized(false);
        const result = DataLoader.getPriceForSymbol('BTC', 'crypto');
        assert.equal(result, null);
    });

    it('retourne null si symbole introuvable', () => {
        _setCache('crypto', { prices: [] });
        _setCache('messari', { assets: [] });
        _setCache('markets', { quotes: [] });
        _setCache('europeanMarkets', { indices: [] });
        _setCache('alphaVantage', { forex: [], topMovers: { gainers: [], losers: [] } });
        const result = DataLoader.getPriceForSymbol('XXXYZ');
        assert.equal(result, null);
    });

    it('cherche dans toutes les sources sans catégorie', () => {
        _setCache('crypto', { prices: [] });
        _setCache('messari', { assets: [] });
        _setCache('markets', {
            quotes: [{ symbol: 'AAPL', name: 'Apple', price: 185, change: 0.5 }],
        });
        const result = DataLoader.getPriceForSymbol('AAPL');
        assert.deepEqual(result, { price: 185, change: 0.5, source: 'Finnhub' });
    });
});


// ═══════════════════════════════════════════════════════════════
// G. getNewsForSymbol
// ═══════════════════════════════════════════════════════════════

describe('G. getNewsForSymbol', () => {
    beforeEach(() => {
        _resetCache();
        _setInitialized(true);
    });

    afterEach(() => {
        _resetCache();
    });

    it('trouve des articles mentionnant un symbole', () => {
        _setCache('news', {
            categories: {
                crypto: [
                    { title: 'Bitcoin chute sous 73 000 $', description: 'Le BTC...', url: 'https://a.com/1', publishedAt: '2026-02-17T10:00:00Z' },
                    { title: 'Ethereum en hausse', description: 'ETH monte.', url: 'https://a.com/2', publishedAt: '2026-02-17T09:00:00Z' },
                ],
            },
        });
        const result = DataLoader.getNewsForSymbol('BTC', 'Bitcoin');
        assert.equal(result.length, 1);
        assert.ok(result[0].title.includes('Bitcoin'));
    });

    it('utilise les alias (NVDA → nvidia)', () => {
        _setCache('news', {
            categories: {
                ai_tech: [
                    { title: 'Nvidia pulvérise les attentes', description: 'Résultats Q3.', url: 'https://a.com/3', publishedAt: '2026-02-17T10:00:00Z' },
                ],
            },
        });
        const result = DataLoader.getNewsForSymbol('NVDA');
        assert.equal(result.length, 1);
    });

    it('limite les résultats à 5', () => {
        const articles = [];
        for (let i = 0; i < 10; i++) {
            articles.push({
                title: `Article bitcoin numéro ${i}`,
                description: 'BTC en mouvement.',
                url: `https://a.com/${i}`,
                publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
            });
        }
        _setCache('news', { categories: { crypto: articles } });
        const result = DataLoader.getNewsForSymbol('BTC');
        assert.equal(result.length, 5);
    });

    it('retourne un tableau vide si non initialisé', () => {
        _setInitialized(false);
        assert.deepEqual(DataLoader.getNewsForSymbol('BTC'), []);
    });

    it('déduplique par URL', () => {
        _setCache('news', {
            categories: {
                crypto: [
                    { title: 'Bitcoin article', description: '', url: 'https://same.com', publishedAt: '2026-02-17T10:00:00Z' },
                ],
                marches: [
                    { title: 'Bitcoin et marchés', description: '', url: 'https://same.com', publishedAt: '2026-02-17T09:00:00Z' },
                ],
            },
        });
        const result = DataLoader.getNewsForSymbol('BTC');
        assert.equal(result.length, 1);
    });

    it('trie par date décroissante', () => {
        _setCache('news', {
            categories: {
                crypto: [
                    { title: 'Bitcoin ancien', description: '', url: 'https://a.com/old', publishedAt: '2026-02-15T10:00:00Z' },
                    { title: 'Bitcoin récent', description: '', url: 'https://a.com/new', publishedAt: '2026-02-17T10:00:00Z' },
                ],
            },
        });
        const result = DataLoader.getNewsForSymbol('BTC');
        assert.equal(result[0].url, 'https://a.com/new');
    });
});


// ═══════════════════════════════════════════════════════════════
// H. getAlertsForSymbol
// ═══════════════════════════════════════════════════════════════

describe('H. getAlertsForSymbol', () => {
    beforeEach(() => {
        _resetCache();
        _setInitialized(true);
    });

    afterEach(() => {
        _resetCache();
    });

    it('trouve des alertes mentionnant un symbole', () => {
        _setCache('alerts', {
            alertes: [
                { titre: 'Alerte BTC', texte: 'Le Bitcoin chute sous un support clé.' },
                { titre: 'Alerte Or', texte: 'L\'or atteint un nouveau record.' },
            ],
        });
        const result = DataLoader.getAlertsForSymbol('BTC');
        assert.equal(result.length, 1);
        assert.equal(result[0].titre, 'Alerte BTC');
    });

    it('recherche dans titre ET texte', () => {
        _setCache('alerts', {
            alertes: [
                { titre: 'Alerte marchés', texte: 'Nvidia (NVDA) en hausse de 5 %.' },
            ],
        });
        const result = DataLoader.getAlertsForSymbol('NVDA');
        assert.equal(result.length, 1);
    });

    it('recherche insensible à la casse', () => {
        _setCache('alerts', {
            alertes: [
                { titre: 'ethereum en baisse', texte: 'eth perd 3 %.' },
            ],
        });
        const result = DataLoader.getAlertsForSymbol('ETH');
        assert.equal(result.length, 1);
    });

    it('retourne un tableau vide si non initialisé', () => {
        _setInitialized(false);
        assert.deepEqual(DataLoader.getAlertsForSymbol('BTC'), []);
    });

    it('retourne un tableau vide si pas d\'alertes', () => {
        _setCache('alerts', { alertes: [] });
        assert.deepEqual(DataLoader.getAlertsForSymbol('BTC'), []);
    });

    it('retourne un tableau vide si alertes null', () => {
        _setCache('alerts', {});
        assert.deepEqual(DataLoader.getAlertsForSymbol('BTC'), []);
    });
});


// ═══════════════════════════════════════════════════════════════
// I. SOURCE_TIERS — Vérifications de cohérence
// ═══════════════════════════════════════════════════════════════

describe('I. SOURCE_TIERS', () => {
    it('contient au moins 50 sources', () => {
        assert.ok(Object.keys(SOURCE_TIERS).length >= 50,
            `Attendu >= 50 sources, obtenu: ${Object.keys(SOURCE_TIERS).length}`);
    });

    it('toutes les valeurs sont 1, 2 ou 3', () => {
        Object.entries(SOURCE_TIERS).forEach(([source, tier]) => {
            assert.ok([1, 2, 3].includes(tier), `Source "${source}" a un tier invalide: ${tier}`);
        });
    });

    it('les grandes rédactions sont Tier 1', () => {
        ['Reuters', 'Bloomberg', 'Le Monde', 'Les Echos', 'BBC'].forEach(src => {
            assert.equal(SOURCE_TIERS[src], 1, `${src} devrait être Tier 1`);
        });
    });

    it('les agrégateurs sont Tier 3', () => {
        ['GNews', 'NewsAPI', 'Yahoo Finance'].forEach(src => {
            assert.equal(SOURCE_TIERS[src], 3, `${src} devrait être Tier 3`);
        });
    });
});
