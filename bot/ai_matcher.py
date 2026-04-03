"""
Matching intelligent marché → zone SEMPLICE via Claude Haiku.

Remplace le matching par mots-clés quand ANTHROPIC_API_KEY est disponible.
Fallback silencieux vers le matching par mots-clés si l'API est indisponible.
"""

import json
import logging

from config import Config
from market_scanner import PolyMarket, MatchedMarket
from semplice_loader import Zone

logger = logging.getLogger("inflexion-bot")

SYSTEM_PROMPT = """Tu es un analyste géopolitique expert. Tu reçois une question de marché prédictif
et une liste de zones géopolitiques avec leurs scores de risque SEMPLICE (échelle 1-7).

Pour chaque question, tu dois :
1. Identifier la zone SEMPLICE la plus pertinente (ou "none" si aucune ne correspond)
2. Évaluer la pertinence du matching (0.0-1.0)
3. Identifier le type d'événement parmi : conflict, sanctions, regime_change, regime_stability,
   nuclear, blockade, crisis, deal_peace, economic, generic

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{"zone_id": "...", "relevance": 0.X, "event_type": "...", "reasoning": "..."}"""


async def ai_match_markets(
    markets: list[PolyMarket],
    zones: list[Zone],
    cfg: Config,
    batch_size: int = 10,
) -> list[MatchedMarket]:
    """
    Match les marchés aux zones SEMPLICE via Claude Haiku.

    Traite par batch pour limiter les appels API.
    Retourne une liste de MatchedMarket avec des scores de matching plus fiables.
    """
    if not cfg.anthropic_key:
        logger.warning("ANTHROPIC_API_KEY absent — fallback vers matching par mots-clés")
        return []

    try:
        import anthropic
    except ImportError:
        logger.warning("Module anthropic non installé — fallback vers matching par mots-clés")
        return []

    client = anthropic.Anthropic(api_key=cfg.anthropic_key)
    zone_map = {z.id: z for z in zones}
    matched: list[MatchedMarket] = []

    # Résumé des zones pour le prompt
    zones_desc = "\n".join(
        f"- {z.id} ({z.name}): Risque={z.composite:.1f}, Opp={z.opp_composite:.1f}, Région={z.region}"
        for z in zones
    )

    for i in range(0, len(markets), batch_size):
        batch = markets[i:i + batch_size]
        questions = "\n".join(
            f"{j+1}. [{m.condition_id}] {m.question}"
            for j, m in enumerate(batch)
        )

        prompt = f"""Zones SEMPLICE disponibles :
{zones_desc}

Marchés à matcher :
{questions}

Pour CHAQUE marché, donne le matching JSON (un par ligne) :"""

        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2000,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

            text = response.content[0].text.strip()

            for line in text.split("\n"):
                line = line.strip()
                if not line.startswith("{"):
                    continue
                try:
                    result = json.loads(line)
                    zone_id = result.get("zone_id", "none")
                    if zone_id == "none" or zone_id not in zone_map:
                        continue

                    relevance = float(result.get("relevance", 0))
                    if relevance < 0.2:
                        continue

                    # Trouver le marché correspondant
                    cid = None
                    for m in batch:
                        if any(kw in m.question.lower() for kw in zone_map[zone_id].keywords[:3]):
                            cid = m.condition_id
                            break

                    if not cid:
                        # Fallback : prendre le marché dans l'ordre
                        idx = len([r for r in matched if r.zone.id == zone_id])
                        if idx < len(batch):
                            cid = batch[min(idx, len(batch) - 1)].condition_id

                    market = next((m for m in batch if m.condition_id == cid), None)
                    if not market:
                        continue

                    matched.append(MatchedMarket(
                        market=market,
                        zone=zone_map[zone_id],
                        match_score=relevance,
                        matched_keywords=[result.get("event_type", "generic")],
                    ))

                except (json.JSONDecodeError, ValueError):
                    continue

        except Exception as e:
            logger.warning("Erreur Claude Haiku batch %d: %s", i, e)
            continue

    logger.info("AI Matcher: %d/%d marchés matchés via Haiku", len(matched), len(markets))
    return matched
