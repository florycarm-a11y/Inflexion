# Code Review — PR #93: Article du jour (2026-02-26)

## Summary

This PR updates the daily article from Feb 25 to Feb 26 (focus: Iran-US nuclear
negotiations and geopolitical risk repricing) and reclassifies ~30 articles in
`news.json`. The article archive `data/articles/2026-02-26.json` is correctly
created as a copy.

**Files changed:** 3 (`data/article-du-jour.json`, `data/articles/2026-02-26.json`, `data/news.json`)

---

## Critical Issues

### 1. Instruction 4 Violation — Investment Recommendations (article-du-jour.json)

The "Opportunites" section contains explicit investment recommendations, which
are **strictly forbidden** by the editorial prompt (CLAUDE.md section 9, Instruction 4):

> "NE JAMAIS formuler de recommandation d'achat, de vente, de surponderation
> ou de sous-ponderation."

Violations found:

- **"Valorisation strategique des petrolieres europeennes"** — recommends
  Shell, TotalEnergies, BP with "asymetrie positive si la prime se maintient
  a 10-15 $ le baril"
- **"Capturer la divergence crypto sentiment/fondamentaux"** — recommends
  specific tokens (CFG, SOL, PENGU) with "ratio risque/rendement asymetrique"
- **"Surponderer la tech IA-heavy"** — explicitly says "surponderer"
  (overweight), a word literally forbidden by Instruction 4

These must be rewritten as neutral "Themes a surveiller" (observations) per
the editorial rules.

### 2. Instruction 4 Violation — Missing Disclaimer (article-du-jour.json)

The required CIF-AMF disclaimer is absent. Per Instruction 4, the article must
end with:

> "Ces elements sont des observations factuelles et ne constituent pas un
> conseil en investissement. Consultez un professionnel agree (CIF-AMF)
> avant toute decision."

### 3. Instruction 11 Violation — Word Count Exceeded (article-du-jour.json)

The article content is **1,013 words**, exceeding the 800-word limit.
Instruction 11 states:

> "Le briefing principal ne doit pas depasser 800 mots. Viser 600 a 800 mots."

Recommendation: trim redundancies in the Risques/Opportunites section.

---

## Incorrect Reclassifications (news.json)

5 article reclassifications are clearly wrong:

| Article | Old | New | Should Be |
|---------|-----|-----|-----------|
| "World Liberty Financial proposes new staking-focused governance system for WLFI holders" | `crypto` | `matieres_premieres` | `crypto` — DeFi governance article about WLFI token staking |
| "The impaired animal on-farm" (livestock welfare livestream) | `matieres_premieres` | `ai_tech` | **Filter out** — Hors-sujet per Instruction 9 |
| "OSHA issues penalties for Colorado dairy farm fatalities" | `matieres_premieres` | `geopolitique` | **Filter out** — Workplace safety, not geopolitics |
| "Fake Next.js job interview tests backdoor developer's devices" | `ai_tech` | `marches` | `ai_tech` — Cybersecurity article |
| "Buterin explains 4-year roadmap for faster, quantum-resistant Ethereum" | `crypto` | `ai_tech` | `crypto` — Ethereum blockchain roadmap |

---

## Correct Reclassifications

Several corrections are well-justified:

- "Pentagon asks Boeing and Lockheed about dependence on Anthropic's Claude AI": `marches` -> `ai_tech`
- "Ce qu'il faut savoir sur la fiscalite des cryptomonnaies": `marches` -> `crypto`
- "Trump insists trade deals safe after Supreme Court ruling": `marches` -> `geopolitique`
- "Anthropic, OpenAI Dial Back Safety Language": `crypto` -> `ai_tech`
- "Nvidia Earnings Results Steady Markets": `crypto` -> `marches`
- "SSA-50 Debt Rose to USD5.6 trillion": `matieres_premieres` -> `marches`
- "Golden Dome to require unprecedented coordination": `ai_tech` -> `geopolitique`

---

## Minor Issues

1. **Typo**: "dependance critere" should be "dependance **critique**" (enjeux cles, section 2)
2. **Typo**: "un element cle pour **levee** les sanctions" should be "pour **lever** les sanctions" (infinitive)
3. **Missing trailing newline**: Both JSON files end without `\n`
4. **Debatable reclassifications**: Some Nvidia/tech articles moved `ai_tech` -> `marches` are borderline

---

## Verdict

**Request changes.** The article content violates 3 editorial instructions
(investment recommendations, missing disclaimer, word count). 5 news
reclassifications are incorrect. The core article analysis (Iran focus, macro
data) is solid, but needs the compliance fixes above before merging.
