# Claude Code Routines — Inflexion

Ce répertoire contient les prompts système des 4 Routines Claude Code qui orchestrent le pipeline IA d'Inflexion.

## Routines

| Fichier | Routine | Trigger | Fréquence |
|---------|---------|---------|-----------|
| `master-prompt.md` | Inflexion Master Pipeline | API webhook (fetch-data) + schedule `30 6,18 * * *` | 2x/jour |
| `inspector-prompt.md` | Inflexion Production Inspector | schedule `0 7,19 * * *` | 2x/jour (Master +30min) |
| `newsletter-prompt.md` | Inflexion Weekly Newsletter | schedule `0 10 * * 0` | dimanche 10h UTC |
| `semplice-validator-prompt.md` | Inflexion SEMPLICE Weekly Validator | schedule `0 22 * * 6` | samedi 22h UTC |

## Setup initial

1. Créer chaque Routine sur https://claude.ai/code via `/schedule`
2. Copier-coller le contenu du fichier `.md` correspondant dans le prompt système
3. Connecter le repository `Inflexion`
4. Configurer triggers (API pour Master, schedule pour tous)
5. Pour Master : récupérer l'endpoint URL et le token, ajouter en secrets GHA :
   - `ROUTINE_WEBHOOK_TOKEN`
   - `ROUTINE_MASTER_URL`

## Rollback

Si les Routines dysfonctionnent de manière répétée :

1. Décommenter `on: schedule:` dans :
   - `.github/workflows/generate-article.yml`
   - `.github/workflows/generate-unified-briefing.yml`
   - `.github/workflows/generate-newsletter.yml`
2. Désactiver les 4 Routines sur claude.ai/code
3. Push → le pipeline GHA legacy reprend

## Références

- Design spec : `docs/superpowers/specs/2026-04-23-routines-migration-design.md`
- Plan d'implémentation : `docs/superpowers/plans/2026-04-23-routines-migration.md`
- Blog Anthropic : https://claude.com/blog/introducing-routines-in-claude-code
