/**
 * Tests unitaires — scripts/fetch-data.mjs (parsing RSS/HTML)
 *
 * Execution :  node --test scripts/tests/fetch-data.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. stripHTML            (nettoyage HTML + entites)
 *   B. extractRSSFields     (parsing RSS 2.0)
 *   C. extractAtomFields    (parsing Atom 1.0)
 *   D. parseRSSItems        (decoupe XML en items)
 *   E. isRelevantForCategory (filtre pertinence par rubrique)
 *   F. formatDate           (formatage dates)
 *   G. isMarketOpen / isEuropeanMarketOpen (horaires marches)
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import {
    stripHTML, extractRSSFields, extractAtomFields, parseRSSItems,
    isRelevantForCategory, formatDate, isMarketOpen, isEuropeanMarketOpen
} from '../../scripts/fetch-data.mjs';


// ═══════════════════════════════════════════════════════════════
// A. stripHTML — nettoyage tags HTML et entites
// ═══════════════════════════════════════════════════════════════

describe('A. stripHTML', () => {
    it('supprime les tags HTML simples', () => {
        assert.equal(stripHTML('<p>Hello</p>'), 'Hello');
    });

    it('supprime les tags imbriques', () => {
        assert.equal(stripHTML('<div><strong>Texte</strong> <em>gras</em></div>'), 'Texte gras');
    });

    it('decode &amp; en &', () => {
        assert.equal(stripHTML('AT&amp;T'), 'AT&T');
    });

    it('decode &lt; et &gt; en < et >', () => {
        assert.equal(stripHTML('a &lt; b &gt; c'), 'a < b > c');
    });

    it('decode &quot; en guillemet double', () => {
        assert.equal(stripHTML('&quot;Bonjour&quot;'), '"Bonjour"');
    });

    it('decode &#39; en apostrophe', () => {
        assert.equal(stripHTML('l&#39;or'), "l'or");
    });

    it('decode &nbsp; en espace', () => {
        assert.equal(stripHTML('mot&nbsp;suivant'), 'mot suivant');
    });

    it('normalise les espaces multiples', () => {
        assert.equal(stripHTML('  trop   d\'espaces  '), "trop d'espaces");
    });

    it('retourne chaine vide pour null', () => {
        assert.equal(stripHTML(null), '');
    });

    it('retourne chaine vide pour undefined', () => {
        assert.equal(stripHTML(undefined), '');
    });

    it('retourne chaine vide pour chaine vide', () => {
        assert.equal(stripHTML(''), '');
    });

    it('passe le texte sans tags tel quel', () => {
        assert.equal(stripHTML('Texte brut'), 'Texte brut');
    });
});


// ═══════════════════════════════════════════════════════════════
// B. extractRSSFields — parsing bloc RSS 2.0
// ═══════════════════════════════════════════════════════════════

describe('B. extractRSSFields', () => {
    it('extrait un bloc RSS complet', () => {
        const block = `
            <title>Titre article</title>
            <description>Description courte</description>
            <link>https://example.com/article</link>
            <pubDate>Mon, 17 Feb 2026 10:00:00 GMT</pubDate>
        `;
        const result = extractRSSFields(block);
        assert.equal(result.title, 'Titre article');
        assert.equal(result.description, 'Description courte');
        assert.equal(result.link, 'https://example.com/article');
        assert.equal(result.pubDate, 'Mon, 17 Feb 2026 10:00:00 GMT');
    });

    it('gere les champs manquants', () => {
        const block = '<title>Seulement un titre</title>';
        const result = extractRSSFields(block);
        assert.equal(result.title, 'Seulement un titre');
        assert.equal(result.description, '');
        assert.equal(result.link, null);
        assert.equal(result.pubDate, null);
        assert.equal(result.image, null);
    });

    it('gere les blocs CDATA', () => {
        const block = `
            <title><![CDATA[Titre avec <b>HTML</b> dedans]]></title>
            <description><![CDATA[<p>Description HTML</p>]]></description>
            <link>https://example.com/cdata</link>
        `;
        const result = extractRSSFields(block);
        assert.equal(result.title, 'Titre avec HTML dedans');
        assert.equal(result.description, 'Description HTML');
    });

    it('extrait image depuis enclosure', () => {
        const block = `
            <title>Article avec image</title>
            <enclosure url="https://img.example.com/photo.jpg" type="image/jpeg" />
        `;
        const result = extractRSSFields(block);
        assert.equal(result.image, 'https://img.example.com/photo.jpg');
    });

    it('extrait image depuis media:content', () => {
        const block = `
            <title>Article media</title>
            <media:content url="https://img.example.com/media.png" medium="image" />
        `;
        const result = extractRSSFields(block);
        assert.equal(result.image, 'https://img.example.com/media.png');
    });

    it('extrait image depuis media:thumbnail', () => {
        const block = `
            <title>Article thumb</title>
            <media:thumbnail url="https://img.example.com/thumb.jpg" />
        `;
        const result = extractRSSFields(block);
        assert.equal(result.image, 'https://img.example.com/thumb.jpg');
    });

    it('extrait image depuis img dans description CDATA', () => {
        const block = `
            <title>Article img desc</title>
            <description><![CDATA[<img src="https://img.example.com/inline.jpg" /> Texte]]></description>
        `;
        const result = extractRSSFields(block);
        assert.equal(result.image, 'https://img.example.com/inline.jpg');
    });

    it('utilise dc:date si pubDate absent', () => {
        const block = `
            <title>Article DC</title>
            <dc:date>2026-02-17T10:00:00Z</dc:date>
        `;
        const result = extractRSSFields(block);
        assert.equal(result.pubDate, '2026-02-17T10:00:00Z');
    });

    it('utilise content:encoded si description absente', () => {
        const block = `
            <title>Article encoded</title>
            <content:encoded><![CDATA[<p>Contenu complet de l'article</p>]]></content:encoded>
        `;
        const result = extractRSSFields(block);
        assert.equal(result.description, "Contenu complet de l'article");
    });

    it('tronque la description a 300 caracteres', () => {
        const longDesc = 'A'.repeat(400);
        const block = `
            <title>Long</title>
            <description>${longDesc}</description>
        `;
        const result = extractRSSFields(block);
        assert.equal(result.description.length, 300);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. extractAtomFields — parsing bloc Atom 1.0
// ═══════════════════════════════════════════════════════════════

describe('C. extractAtomFields', () => {
    it('extrait un bloc Atom complet', () => {
        const block = `
            <title>Titre Atom</title>
            <summary>Resume Atom</summary>
            <link href="https://example.com/atom-article" rel="alternate" />
            <published>2026-02-17T10:00:00Z</published>
        `;
        const result = extractAtomFields(block);
        assert.equal(result.title, 'Titre Atom');
        assert.equal(result.description, 'Resume Atom');
        assert.equal(result.link, 'https://example.com/atom-article');
        assert.equal(result.pubDate, '2026-02-17T10:00:00Z');
    });

    it('utilise content si summary absent', () => {
        const block = `
            <title>Atom content</title>
            <content type="html">Contenu detaille</content>
            <link href="https://example.com/content" />
        `;
        const result = extractAtomFields(block);
        assert.equal(result.description, 'Contenu detaille');
    });

    it('utilise updated si published absent', () => {
        const block = `
            <title>Atom updated</title>
            <updated>2026-02-16T08:00:00Z</updated>
        `;
        const result = extractAtomFields(block);
        assert.equal(result.pubDate, '2026-02-16T08:00:00Z');
    });

    it('extrait le lien href', () => {
        const block = `
            <title>Lien test</title>
            <link href="https://blog.example.com/post" type="text/html" rel="alternate" />
        `;
        const result = extractAtomFields(block);
        assert.equal(result.link, 'https://blog.example.com/post');
    });

    it('extrait image depuis content HTML', () => {
        const block = `
            <title>Atom image</title>
            <content type="html"><![CDATA[<img src="https://img.example.com/atom.jpg" /> texte]]></content>
        `;
        const result = extractAtomFields(block);
        assert.equal(result.image, 'https://img.example.com/atom.jpg');
    });

    it('gere les champs manquants', () => {
        const block = '<title>Titre seul</title>';
        const result = extractAtomFields(block);
        assert.equal(result.title, 'Titre seul');
        assert.equal(result.description, '');
        assert.equal(result.link, null);
        assert.equal(result.pubDate, null);
        assert.equal(result.image, null);
    });

    it('tronque la description a 300 caracteres', () => {
        const longSummary = 'B'.repeat(400);
        const block = `<title>Long Atom</title><summary>${longSummary}</summary>`;
        const result = extractAtomFields(block);
        assert.equal(result.description.length, 300);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. parseRSSItems — decoupe XML en items
// ═══════════════════════════════════════════════════════════════

describe('D. parseRSSItems', () => {
    it('parse un XML RSS 2.0 avec plusieurs items', () => {
        const xml = `
            <rss version="2.0">
                <channel>
                    <title>Mon flux</title>
                    <item>
                        <title>Article 1</title>
                        <link>https://example.com/1</link>
                    </item>
                    <item>
                        <title>Article 2</title>
                        <link>https://example.com/2</link>
                    </item>
                </channel>
            </rss>
        `;
        const items = parseRSSItems(xml);
        assert.equal(items.length, 2);
        assert.equal(items[0].title, 'Article 1');
        assert.equal(items[1].title, 'Article 2');
    });

    it('parse un XML Atom avec entries', () => {
        const xml = `
            <feed xmlns="http://www.w3.org/2005/Atom">
                <title>Blog Atom</title>
                <entry>
                    <title>Post 1</title>
                    <link href="https://example.com/post1" />
                    <summary>Resume post 1</summary>
                </entry>
                <entry>
                    <title>Post 2</title>
                    <link href="https://example.com/post2" />
                </entry>
            </feed>
        `;
        const items = parseRSSItems(xml);
        assert.equal(items.length, 2);
        assert.equal(items[0].title, 'Post 1');
        assert.equal(items[0].description, 'Resume post 1');
        assert.equal(items[1].title, 'Post 2');
    });

    it('retourne un tableau vide pour XML vide', () => {
        const items = parseRSSItems('');
        assert.equal(items.length, 0);
    });

    it('retourne un tableau vide pour XML sans items ni entries', () => {
        const xml = '<rss><channel><title>Vide</title></channel></rss>';
        const items = parseRSSItems(xml);
        assert.equal(items.length, 0);
    });

    it('ignore les items sans titre', () => {
        const xml = `
            <rss version="2.0">
                <channel>
                    <item>
                        <title>Valide</title>
                        <link>https://example.com/ok</link>
                    </item>
                    <item>
                        <description>Pas de titre</description>
                    </item>
                </channel>
            </rss>
        `;
        const items = parseRSSItems(xml);
        assert.equal(items.length, 1);
        assert.equal(items[0].title, 'Valide');
    });

    it('prefere les items RSS aux entries Atom si les deux sont presents', () => {
        const xml = `
            <rss version="2.0">
                <channel>
                    <item>
                        <title>RSS item</title>
                    </item>
                </channel>
            </rss>
            <feed>
                <entry>
                    <title>Atom entry</title>
                </entry>
            </feed>
        `;
        const items = parseRSSItems(xml);
        // Atom est un fallback uniquement si pas d'items RSS
        assert.equal(items.length, 1);
        assert.equal(items[0].title, 'RSS item');
    });
});


// ═══════════════════════════════════════════════════════════════
// E. isRelevantForCategory — filtre de pertinence par rubrique
// ═══════════════════════════════════════════════════════════════

describe('E. isRelevantForCategory', () => {
    it('accepte un article finance dans markets', () => {
        const article = { title: 'Wall Street en hausse', description: 'Les marches financiers progressent' };
        assert.equal(isRelevantForCategory(article, 'markets', 'France 24'), true);
    });

    it('rejette un article sport dans markets', () => {
        const article = { title: 'Le PSG gagne la Ligue des Champions', description: 'Football : victoire historique' };
        assert.equal(isRelevantForCategory(article, 'markets', 'France 24'), false);
    });

    it('accepte tout pour une source specialisee', () => {
        const article = { title: 'Article quelconque', description: 'Rien de financier' };
        assert.equal(isRelevantForCategory(article, 'markets', 'MarketWatch'), true);
    });

    it('accepte un article crypto dans la rubrique crypto', () => {
        const article = { title: 'Bitcoin depasse 100k', description: 'Le BTC atteint un nouveau record' };
        assert.equal(isRelevantForCategory(article, 'crypto', 'BBC World'), true);
    });

    it('accepte tout pour une categorie inconnue', () => {
        const article = { title: 'Quelque chose', description: 'Pas important' };
        assert.equal(isRelevantForCategory(article, 'unknown_category', 'Source X'), true);
    });

    it('accepte un article geopolitique', () => {
        const article = { title: 'Conflit au Moyen-Orient', description: 'Tensions militaires' };
        assert.equal(isRelevantForCategory(article, 'geopolitics', 'RFI'), true);
    });
});


// ═══════════════════════════════════════════════════════════════
// F. formatDate — formatage dates
// ═══════════════════════════════════════════════════════════════

describe('F. formatDate', () => {
    it('formate une date ISO valide', () => {
        const result = formatDate('2026-02-17T10:00:00Z');
        // Le format est "jour mois." — depend du fuseau local
        assert.ok(result.includes('17'));
        assert.ok(result.includes('fév.'));
    });

    it('formate le 1er janvier', () => {
        const result = formatDate('2026-01-01T00:00:00Z');
        assert.ok(result.includes('jan.'));
    });

    it('gere une date en decembre', () => {
        const result = formatDate('2025-12-25T12:00:00Z');
        assert.ok(result.includes('déc.'));
    });
});


// ═══════════════════════════════════════════════════════════════
// G. isMarketOpen / isEuropeanMarketOpen — horaires marches
// ═══════════════════════════════════════════════════════════════

describe('G. isMarketOpen', () => {
    it('retourne un booleen', () => {
        const result = isMarketOpen();
        assert.equal(typeof result, 'boolean');
    });
});

describe('G. isEuropeanMarketOpen', () => {
    it('retourne un booleen', () => {
        const result = isEuropeanMarketOpen();
        assert.equal(typeof result, 'boolean');
    });
});
