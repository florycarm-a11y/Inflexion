#!/usr/bin/env python3
"""
Inflexion — Audit linguistique automatisé
Vérifie que tout le contenu visible du site est rédigé en français correct :
  - Pas d'anglicismes (sauf noms propres : S&P 500, Nasdaq, Bitcoin…)
  - Devises européennes privilégiées (€ plutôt que $, sauf données de marché)
  - Unités européennes (km, kg, °C…)
  - Typographie française (guillemets « », espaces insécables, etc.)
  - Qualité rédactionnelle (grammaire, orthographe, style éditorial)

Usage :
    ANTHROPIC_API_KEY=sk-... python3 scripts/check-french.py
    python3 scripts/check-french.py --file index.html
    python3 scripts/check-french.py --fix  # Suggère les corrections

Requiert : pip install anthropic
"""

import os
import sys
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path

# ─── Configuration ──────────────────────────────────────────

SITE_ROOT = Path(__file__).resolve().parent.parent

HTML_FILES = [
    'index.html',
    'markets.html',
    'crypto.html',
    'geopolitics.html',
    'commodities.html',
    'etf.html',
    'analysis.html',
    'mentions-legales.html',
    'confidentialite.html',
    'cgu.html',
]

# Balises dont le contenu n'est pas du texte visible
SKIP_TAGS = {'script', 'style', 'noscript', 'svg', 'code', 'pre'}

# Modèle Claude à utiliser (Haiku = rapide et économique pour cette tâche)
MODEL = 'claude-haiku-4-5-20251001'

SYSTEM_PROMPT = """Tu es un correcteur linguistique expert en français éditorial pour un site
d'information financière francophone (inflexionhub.com).

## Ton rôle
Auditer le contenu textuel extrait des pages HTML et signaler les problèmes.

## 1. Anglicismes
EXCEPTIONS autorisées (NE PAS signaler) :
- Noms propres : S&P 500, Nasdaq, Bitcoin, Ethereum, Nvidia, Tesla, Apple, Microsoft,
  Google, OpenAI, TradingView, Bloomberg, CNBC, GitHub, Newsletter
- Termes financiers internationalisés : ETF, spread, trading, hedge fund, market cap
  (contexte données), DeFi, TVL, stablecoin, NFT, IPO, CEO, Fed, FOMC, OPEP/OPEC,
  short/long (positions)
- Technologie : API, GPU, CPU, LLM, framework
- Labels d'interface technique : tooltip, placeholder (dans le code)

À CORRIGER (avec suggestion) :
- "bullish" → "haussier", "bearish" → "baissier"
- "supply chain" → "chaîne d'approvisionnement"
- "outlook" → "perspectives", "momentum" → "dynamique" ou "élan"
- "rally" → "rebond" ou "hausse", "selloff" → "vente massive" ou "correction"
- "inflows/outflows" → "entrées/sorties de capitaux"
- "yield" (hors contexte DeFi) → "rendement"
- "dashboard" → "tableau de bord", "update" → "mise à jour"
- "market cap" (dans texte éditorial) → "capitalisation boursière"
- "ticker" → "bandeau de cotation"

## 2. Devises et formats
- Les cours en USD ($) sont acceptés pour les marchés américains
- Les textes éditoriaux devraient mentionner les équivalents EUR quand pertinent
- Format français : 1 234,56 € (espace insécable avant €, virgule décimale)

## 3. Unités
- Système métrique uniquement (km, kg, °C, etc.)

## 4. Typographie française
- Guillemets : « texte » (avec espaces insécables) au lieu de "texte"
- Espaces insécables avant : ; ! ? » et après «
- Tiret cadratin (—) pour les incises, pas le tiret court (-)
- Points de suspension : … (caractère unique) et non ...

## 5. Terminologie financière
Vérifier la cohérence entre les pages :
- "cours" vs "prix" (les deux sont acceptables)
- "marché haussier" vs "bull market" (préférer le français dans le texte éditorial)
- "capitalisation boursière" vs "market cap" (préférer le français)

## 6. Qualité rédactionnelle
- Orthographe et grammaire
- Accords (genre, nombre)
- Style éditorial professionnel et accessible
- Cohérence terminologique entre les pages

## Format de réponse
Pour chaque problème, indique :
- **Sévérité** : CRITIQUE | IMPORTANT | MINEUR
- **Passage** : le texte exact concerné
- **Catégorie** : anglicisme | typographie | devise | terminologie | orthographe
- **Correction** : suggestion

Si la page est correcte, réponds : "Aucun problème détecté."
Réponds UNIQUEMENT en français. Sois concis et précis."""


# ─── Extraction du texte visible ────────────────────────────

class TextExtractor(HTMLParser):
    """Extrait le texte visible d'un fichier HTML, en ignorant scripts/styles/SVG."""

    def __init__(self):
        super().__init__()
        self._text_parts = []
        self._skip_depth = 0
        self._current_tag = None

    def handle_starttag(self, tag, attrs):
        self._current_tag = tag
        if tag in SKIP_TAGS:
            self._skip_depth += 1
        # Ajouter un saut de ligne pour les balises block
        if tag in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div',
                    'section', 'article', 'header', 'footer', 'nav', 'td', 'th'):
            self._text_parts.append('\n')

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
        self._current_tag = None

    def handle_data(self, data):
        if self._skip_depth == 0:
            text = data.strip()
            if text:
                self._text_parts.append(text)

    def get_text(self):
        raw = ' '.join(self._text_parts)
        # Nettoyer les sauts de ligne multiples
        lines = [line.strip() for line in raw.split('\n')]
        return '\n'.join(line for line in lines if line)


def extract_text(html_path):
    """Extrait le texte visible d'un fichier HTML."""
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    extractor = TextExtractor()
    extractor.feed(html)
    return extractor.get_text()


# ─── Audit via Claude API ───────────────────────────────────

def audit_page(client, filename, text, fix_mode=False):
    """Envoie le texte extrait à Claude pour audit linguistique."""

    mode_instruction = ""
    if fix_mode:
        mode_instruction = """

En plus de l'audit, propose pour chaque problème la correction exacte
au format :
  AVANT : [texte original]
  APRÈS : [texte corrigé]
"""

    user_prompt = f"""Audite le contenu textuel de la page **{filename}** du site Inflexion.

{mode_instruction}

--- DÉBUT DU CONTENU ---
{text}
--- FIN DU CONTENU ---"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}]
    )

    return response.content[0].text


# ─── Rapport ────────────────────────────────────────────────

def print_header(text):
    width = max(60, len(text) + 4)
    print(f"\n{'═' * width}")
    print(f"  {text}")
    print(f"{'═' * width}")


def print_section(filename, result):
    print(f"\n{'─' * 50}")
    print(f"📄  {filename}")
    print(f"{'─' * 50}")
    print(result)


# ─── Point d'entrée ─────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Audit linguistique du site Inflexion via Claude API"
    )
    parser.add_argument(
        '--file', '-f',
        help="Auditer un seul fichier (ex: index.html)"
    )
    parser.add_argument(
        '--fix',
        action='store_true',
        help="Afficher les suggestions de correction détaillées"
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help="Sortie au format JSON (pour intégration CI)"
    )
    parser.add_argument(
        '--model', '-m',
        default=MODEL,
        help=f"Modèle Claude à utiliser (défaut: {MODEL})"
    )
    args = parser.parse_args()

    # Vérifier la clé API
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        msg = "ANTHROPIC_API_KEY non définie — audit linguistique ignoré."
        if args.json:
            print(json.dumps({"_info": msg}, ensure_ascii=False, indent=2))
        else:
            print(f"⚠️  {msg}")
            print("   Pour activer l'audit : export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(0)

    try:
        import anthropic
    except ImportError:
        msg = "Module anthropic non installé (pip install anthropic) — audit ignoré."
        if args.json:
            print(json.dumps({"_info": msg}, ensure_ascii=False, indent=2))
        else:
            print(f"⚠️  {msg}")
        sys.exit(0)

    client = anthropic.Anthropic(api_key=api_key)

    # Déterminer les fichiers à auditer
    if args.file:
        files = [args.file]
    else:
        files = HTML_FILES

    print_header("Audit linguistique — Inflexion")
    print(f"Modèle : {args.model}")
    print(f"Mode : {'corrections détaillées' if args.fix else 'audit standard'}")
    print(f"Fichiers : {len(files)}")

    results = {}
    total_issues = 0

    for filename in files:
        filepath = SITE_ROOT / filename
        if not filepath.exists():
            print(f"\n⚠️  {filename} introuvable, ignoré.")
            continue

        # Extraire le texte
        text = extract_text(filepath)
        if not text.strip():
            print(f"\n⚠️  {filename} — aucun texte visible extrait.")
            continue

        print(f"\n⏳ Analyse de {filename} ({len(text)} caractères)...")

        try:
            result = audit_page(client, filename, text, fix_mode=args.fix)
            results[filename] = result

            if not args.json:
                print_section(filename, result)

        except Exception as e:
            error_msg = f"Erreur API : {e}"
            results[filename] = error_msg
            if not args.json:
                print(f"\n❌ {filename} — {error_msg}")

    # Sortie JSON (pour CI)
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print_header("Audit terminé")
        print(f"Pages analysées : {len(results)}/{len(files)}")


if __name__ == '__main__':
    main()
