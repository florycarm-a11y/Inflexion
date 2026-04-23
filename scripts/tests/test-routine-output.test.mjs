import { test } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateBriefing } from '../test-routine-output.mjs';

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'routine-test-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('validateBriefing accepte un briefing conforme', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const good = {
      generated_at: new Date().toISOString(),
      summary: 'Un briefing factuel qui décrit la situation des marchés. '.repeat(20),
      sources: [
        { name: 'Reuters', url: 'https://reuters.com/x' },
        { name: 'FT', url: 'https://ft.com/x' },
        { name: 'Bloomberg', url: 'https://bloomberg.com/x' },
      ],
      disclaimer: 'Les informations ci-dessus ne constituent pas un conseil en investissement.',
    };
    writeFileSync(path, JSON.stringify(good));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.errors, []);
  });
});

test('validateBriefing rejette un JSON malformé', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    writeFileSync(path, '{"invalid": ');
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('JSON invalide')));
  });
});

test('validateBriefing rejette un contenu < 500 chars', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    writeFileSync(path, JSON.stringify({ summary: 'court', sources: [], disclaimer: '' }));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('contenu trop court')));
  });
});

test('validateBriefing rejette un disclaimer AMF manquant', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const bad = {
      summary: 'Contenu valide et suffisamment long. '.repeat(20),
      sources: [{ name: 'X', url: 'y' }, { name: 'Y', url: 'z' }, { name: 'Z', url: 'w' }],
      disclaimer: 'Autre texte sans mention conseil',
    };
    writeFileSync(path, JSON.stringify(bad));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('disclaimer AMF')));
  });
});

test('validateBriefing rejette < 3 sources', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const bad = {
      summary: 'Contenu valide et suffisamment long. '.repeat(20),
      sources: [{ name: 'X', url: 'y' }],
      disclaimer: 'Les informations ci-dessus ne constituent pas un conseil en investissement.',
    };
    writeFileSync(path, JSON.stringify(bad));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('sources')));
  });
});

test('validateBriefing rejette la présence de placeholders TBD/undefined', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const bad = {
      summary: 'Contenu avec TBD au milieu. '.repeat(20),
      sources: [{ name: 'X', url: 'y' }, { name: 'Y', url: 'z' }, { name: 'Z', url: 'w' }],
      disclaimer: 'Les informations ci-dessus ne constituent pas un conseil en investissement.',
    };
    writeFileSync(path, JSON.stringify(bad));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('placeholder')));
  });
});
