/**
 * Tests unitaires — app.js (escapeHTML, cardHTML)
 *
 * Execution :  node --test scripts/tests/app.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. escapeHTML   (prevention XSS)
 *   B. cardHTML     (generation HTML article)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// app.js est un script browser avec module.exports fallback (CommonJS)
const require = createRequire(import.meta.url);
const { escapeHTML, cardHTML } = require('../../app.js');


// ═══════════════════════════════════════════════════════════════
// A. escapeHTML — prevention XSS
// ═══════════════════════════════════════════════════════════════

describe('A. escapeHTML', () => {
    it('echappe le caractere &', () => {
        assert.equal(escapeHTML('AT&T'), 'AT&amp;T');
    });

    it('echappe le caractere <', () => {
        assert.equal(escapeHTML('a < b'), 'a &lt; b');
    });

    it('echappe le caractere >', () => {
        assert.equal(escapeHTML('a > b'), 'a &gt; b');
    });

    it('echappe les guillemets doubles', () => {
        assert.equal(escapeHTML('"Bonjour"'), '&quot;Bonjour&quot;');
    });

    it('echappe les apostrophes', () => {
        assert.equal(escapeHTML("l'or"), 'l&#039;or');
    });

    it('neutralise une balise script XSS', () => {
        const input = '<script>alert(1)</script>';
        const result = escapeHTML(input);
        assert.ok(!result.includes('<script>'));
        assert.ok(result.includes('&lt;script&gt;'));
    });

    it('neutralise un vecteur XSS par attribut', () => {
        const input = '" onmouseover="alert(1)';
        const result = escapeHTML(input);
        assert.ok(!result.includes('"'));
        assert.ok(result.includes('&quot;'));
    });

    it('retourne chaine vide pour null', () => {
        assert.equal(escapeHTML(null), '');
    });

    it('retourne chaine vide pour undefined', () => {
        assert.equal(escapeHTML(undefined), '');
    });

    it('retourne chaine vide pour chaine vide', () => {
        assert.equal(escapeHTML(''), '');
    });

    it('passe le texte sans caracteres speciaux tel quel', () => {
        assert.equal(escapeHTML('Texte normal'), 'Texte normal');
    });

    it('echappe tous les caracteres speciaux combines', () => {
        assert.equal(
            escapeHTML('<div class="a" data-x=\'b\'>c & d</div>'),
            '&lt;div class=&quot;a&quot; data-x=&#039;b&#039;&gt;c &amp; d&lt;/div&gt;'
        );
    });
});


// ═══════════════════════════════════════════════════════════════
// B. cardHTML — generation HTML article
// ═══════════════════════════════════════════════════════════════

describe('B. cardHTML', () => {
    it('genere le HTML pour un article complet', () => {
        const article = {
            title: 'Titre test',
            source: 'Reuters',
            description: 'Description test',
            time: 'Il y a 2h',
            url: 'https://example.com',
            category: 'markets',
            image: 'https://img.example.com/photo.jpg'
        };
        const html = cardHTML(article);
        assert.ok(html.includes('Titre test'));
        assert.ok(html.includes('Reuters'));
        assert.ok(html.includes('Description test'));
        assert.ok(html.includes('https://example.com'));
        assert.ok(html.includes('markets'));
        assert.ok(html.includes('photo.jpg'));
    });

    it('retourne chaine vide pour null', () => {
        assert.equal(cardHTML(null), '');
    });

    it('echappe les caracteres dangereux dans le titre', () => {
        const article = { title: '<script>alert(1)</script>' };
        const html = cardHTML(article);
        assert.ok(!html.includes('<script>alert(1)</script>'));
        assert.ok(html.includes('&lt;script&gt;'));
    });

    it('tronque la description longue a 150 caracteres', () => {
        const article = {
            title: 'Long desc',
            description: 'A'.repeat(200)
        };
        const html = cardHTML(article);
        // La description echappee doit etre tronquee a ~147 + '...'
        assert.ok(html.includes('...'));
    });
});
