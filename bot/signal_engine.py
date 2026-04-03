"""
Moteur de signaux v2 — Estimation calibrée des probabilités.

Principe fondamental : SEMPLICE mesure l'instabilité systémique d'une zone,
PAS la probabilité d'un événement spécifique. Le moteur utilise :

1. TAUX DE BASE par type d'événement (données historiques)
2. MULTIPLICATEUR SEMPLICE (les scores ajustent le taux de base)
3. HORIZON TEMPOREL (probabilité cumulée sur la durée du marché)
4. SIGNAL DIRECTIONNEL (le marché sous-estime-t-il le risque ?)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from market_scanner import MatchedMarket
from semplice_loader import RISK_WEIGHTS, OPP_WEIGHTS

if TYPE_CHECKING:
    from inflexion_intel import ZoneIntel, IntelReport


class Direction(Enum):
    BUY_YES = "BUY_YES"
    BUY_NO = "BUY_NO"
    SKIP = "SKIP"


class EventType(Enum):
    # ── Spectre militaire (du limité au total) ──
    MARITIME = "maritime"                # attaque shipping, escorte navale, piraterie
    CYBER_ATTACK = "cyber_attack"        # cyberattaque étatique
    MILITARY_STRIKE = "military_strike"  # frappe ciblée, drone, bombardement limité
    TERRITORIAL = "territorial"          # capture/perte de territoire spécifique
    BLOCKADE = "blockade"                # blocus naval/aérien
    CONFLICT = "conflict"                # guerre totale, invasion, clash militaire
    NUCLEAR = "nuclear"                  # test nucléaire, arme, enrichissement
    INTERVENTION = "intervention"        # opération militaire extérieure (anti-cartel, PKO)
    # ── Résolution ──
    CEASEFIRE = "ceasefire"              # cessez-le-feu, fin d'opérations militaires
    DEAL_PEACE = "deal_peace"            # traité de paix, accord formel
    # ── Politique ──
    ASSASSINATION = "assassination"      # meurtre ciblé d'un leader
    REGIME_CHANGE = "regime_change"      # coup, renversement, purge
    REGIME_STABILITY = "regime_stability"  # leader reste au pouvoir
    ELECTION = "election"                # résultat électoral
    PROTEST = "protest"                  # manifestations de masse, révolution
    SECESSION = "secession"              # indépendance, sécession, référendum
    # ── Diplomatique ──
    DIPLOMACY = "diplomacy"              # visite d'État, rencontre, sommet
    ALLIANCE = "alliance"                # adhésion OTAN/BRICS/UE, pacte militaire
    RECOGNITION = "recognition"          # reconnaissance diplomatique, normalisation
    # ── Économique ──
    SANCTIONS = "sanctions"              # sanctions, embargo, tarifs douaniers
    TRADE_DEAL = "trade_deal"            # accord commercial, ALE
    ECONOMIC = "economic"                # objectif PIB, croissance
    CRISIS = "crisis"                    # crise économique, défaut souverain
    ENERGY = "energy"                    # choc pétrolier/gazier, disruption énergétique
    # ── Autre ──
    HUMANITARIAN = "humanitarian"        # famine, réfugiés, aide humanitaire
    GENERIC = "generic"                  # non classifié


@dataclass
class Signal:
    market: MatchedMarket
    direction: Direction
    semplice_prob: float       # probabilité calibrée (0-1)
    poly_price: float          # prix actuel Polymarket (0-1)
    edge: float                # écart en %
    confidence: float          # 0-1
    reasoning: str
    event_type: EventType = EventType.GENERIC
    base_rate: float = 0.0
    multiplier: float = 1.0
    horizon_years: float = 1.0


# ─── Taux de base annuels par type d'événement ──────────────────────
# Sources : UCDP, Polity IV, SIPRI, COW, données historiques 1946-2024
BASE_RATES: dict[EventType, float] = {
    # Militaire
    EventType.MARITIME:         0.12,   # attaque shipping / incident naval
    EventType.CYBER_ATTACK:     0.15,   # cyberattaque étatique significative
    EventType.MILITARY_STRIKE:  0.14,   # frappe ciblée / bombardement limité
    EventType.TERRITORIAL:      0.15,   # capture/perte de territoire (conflit actif)
    EventType.BLOCKADE:         0.015,  # blocus naval/aérien
    EventType.CONFLICT:         0.06,   # conflit armé majeur / clash bilatéral
    EventType.NUCLEAR:          0.008,  # test nucléaire / arme (très rare)
    EventType.INTERVENTION:     0.10,   # opération militaire extérieure
    # Résolution
    EventType.CEASEFIRE:        0.18,   # cessez-le-feu / fin d'opérations
    EventType.DEAL_PEACE:       0.12,   # traité de paix formel
    # Politique
    EventType.ASSASSINATION:    0.01,   # meurtre ciblé de leader
    EventType.REGIME_CHANGE:    0.10,   # coup / renversement (~15% Sahel, 3% stable)
    EventType.REGIME_STABILITY: 0.90,   # leader reste au pouvoir
    EventType.ELECTION:         0.45,   # parti/candidat spécifique gagne (avantage sortant)
    EventType.PROTEST:          0.15,   # mouvement de masse / révolution
    EventType.SECESSION:        0.03,   # référendum / déclaration d'indépendance
    # Diplomatique
    EventType.DIPLOMACY:        0.20,   # rencontre / visite d'État / sommet
    EventType.ALLIANCE:         0.25,   # adhésion OTAN/BRICS/UE (processus formel)
    EventType.RECOGNITION:      0.10,   # normalisation / reconnaissance diplomatique
    # Économique
    EventType.SANCTIONS:        0.20,   # sanctions / embargo / tarifs
    EventType.TRADE_DEAL:       0.12,   # accord commercial / ALE
    EventType.ECONOMIC:         0.45,   # objectif économique atteint
    EventType.CRISIS:           0.14,   # crise économique / défaut souverain
    EventType.ENERGY:           0.20,   # choc offre/prix énergie
    # Autre
    EventType.HUMANITARIAN:     0.18,   # famine / crise réfugiés
    EventType.GENERIC:          0.15,   # non classifié
}

# ─── Dimensions SEMPLICE pertinentes par type d'événement ────────────
# Indices : S=0, E=1, M=2, P=3, L=4, I=5, C=6, Ee=7
# Chaque ligne somme à 1.00
DIM_WEIGHTS: dict[EventType, list[float]] = {
    #                              S     E     M     P     L     I     C     Ee
    # Militaire
    EventType.MARITIME:         [0.03, 0.15, 0.30, 0.10, 0.07, 0.10, 0.10, 0.15],
    EventType.CYBER_ATTACK:     [0.05, 0.08, 0.10, 0.10, 0.05, 0.20, 0.40, 0.02],
    EventType.MILITARY_STRIKE:  [0.03, 0.05, 0.40, 0.15, 0.05, 0.15, 0.12, 0.05],
    EventType.TERRITORIAL:      [0.05, 0.05, 0.45, 0.15, 0.02, 0.12, 0.12, 0.04],
    EventType.BLOCKADE:         [0.05, 0.10, 0.35, 0.20, 0.05, 0.10, 0.10, 0.05],
    EventType.CONFLICT:         [0.05, 0.05, 0.40, 0.20, 0.02, 0.12, 0.12, 0.04],
    EventType.NUCLEAR:          [0.02, 0.05, 0.45, 0.20, 0.08, 0.10, 0.08, 0.02],
    EventType.INTERVENTION:     [0.05, 0.05, 0.30, 0.25, 0.15, 0.10, 0.05, 0.05],
    # Résolution
    EventType.CEASEFIRE:        [0.10, 0.15, 0.15, 0.30, 0.10, 0.10, 0.05, 0.05],
    EventType.DEAL_PEACE:       [0.10, 0.15, 0.10, 0.30, 0.15, 0.10, 0.05, 0.05],
    # Politique
    EventType.ASSASSINATION:    [0.10, 0.03, 0.15, 0.35, 0.07, 0.20, 0.05, 0.05],
    EventType.REGIME_CHANGE:    [0.20, 0.10, 0.10, 0.35, 0.10, 0.10, 0.03, 0.02],
    EventType.REGIME_STABILITY: [0.15, 0.15, 0.05, 0.40, 0.10, 0.10, 0.03, 0.02],
    EventType.ELECTION:         [0.20, 0.20, 0.02, 0.35, 0.05, 0.15, 0.02, 0.01],
    EventType.PROTEST:          [0.35, 0.15, 0.05, 0.25, 0.05, 0.10, 0.03, 0.02],
    EventType.SECESSION:        [0.25, 0.10, 0.05, 0.30, 0.15, 0.10, 0.03, 0.02],
    # Diplomatique
    EventType.DIPLOMACY:        [0.05, 0.15, 0.15, 0.30, 0.15, 0.10, 0.05, 0.05],
    EventType.ALLIANCE:         [0.05, 0.15, 0.20, 0.30, 0.15, 0.10, 0.03, 0.02],
    EventType.RECOGNITION:      [0.05, 0.10, 0.05, 0.35, 0.20, 0.15, 0.05, 0.05],
    # Économique
    EventType.SANCTIONS:        [0.05, 0.25, 0.05, 0.25, 0.20, 0.10, 0.05, 0.05],
    EventType.TRADE_DEAL:       [0.05, 0.30, 0.03, 0.20, 0.20, 0.10, 0.05, 0.07],
    EventType.ECONOMIC:         [0.10, 0.40, 0.02, 0.15, 0.10, 0.08, 0.05, 0.10],
    EventType.CRISIS:           [0.15, 0.35, 0.05, 0.20, 0.10, 0.05, 0.05, 0.05],
    EventType.ENERGY:           [0.05, 0.30, 0.10, 0.10, 0.05, 0.05, 0.05, 0.30],
    # Autre
    EventType.HUMANITARIAN:     [0.30, 0.20, 0.05, 0.15, 0.05, 0.10, 0.02, 0.13],
    EventType.GENERIC:          RISK_WEIGHTS,
}


def classify_event(question: str) -> tuple[EventType, bool]:
    """
    Classifie le type d'événement parmi 26 types et détecte la polarité.

    Retourne : (event_type, is_negative_event)
    - is_negative_event = True  → événement déstabilisant
    - is_negative_event = False → événement stabilisant/positif

    L'ordre de test est du plus spécifique au plus générique.
    """
    q = question.lower()

    # Détection de polarité : mots qui INVERSENT le sens
    is_reversal = any(w in q for w in [
        "lift ", "remove ", "end ", "drop ", "ease ", "relax ",
        "repeal ", "revoke ", "withdraw ", "roll back",
    ])

    # ── 1. NUCLEAR (très spécifique, toujours prioritaire) ──
    if any(w in q for w in ["nuclear", "nucléaire", "atomic", "nuke", "enrichment",
                             "uranium"]):
        return EventType.NUCLEAR, True

    # ── 2. BLOCKADE ──
    if any(w in q for w in ["blockade", "blocus", "close strait", "close the strait",
                             "naval block"]):
        return EventType.BLOCKADE, True

    # ── 3. MARITIME (shipping, escort, naval incident) ──
    if any(w in q for w in ["target shipping", "target ship", "ships be",
                             "escort", "piracy", "pirate", "naval incident",
                             "shipping lane", "merchant vessel"]):
        return EventType.MARITIME, True

    # ── 4. CYBER_ATTACK ──
    if any(w in q for w in ["cyber attack", "cyberattack", "hack ", "hacking",
                             "cyber operation", "ransomware", "cyber warfare"]):
        return EventType.CYBER_ATTACK, True

    # ── 5. CEASEFIRE / fin d'opérations (AVANT CONFLICT) ──
    if any(w in q for w in ["ceasefire", "cessez", "conflict ends",
                             "end of military", "operations end"]):
        return EventType.CEASEFIRE, False
    if any(w in q for w in ["action ends", "action against", "operations against",
                             "military operation"]) and any(
        w in q for w in ["ends", "end "]):
        return EventType.CEASEFIRE, False
    # "Military action against X ends by Y" pattern
    if "ends" in q and any(w in q for w in ["military action", "military operation"]):
        return EventType.CEASEFIRE, False
    # "Trump announces end of military operations"
    if "end of military" in q or "announces end" in q:
        return EventType.CEASEFIRE, False

    # ── 6. TERRITORIAL (capture/perte de territoire, AVANT CONFLICT) ──
    if any(w in q for w in ["capture", "enter ", "re-enter", "advance into",
                             "take control", "seize ", "fall to",
                             "recogniz" if "sovereignty" in q else "___"]):
        return EventType.TERRITORIAL, True

    # ── 7. ASSASSINATION ──
    if any(w in q for w in ["assassinat", "murder", "kill " if "leader" in q else "___",
                             "targeted killing"]):
        return EventType.ASSASSINATION, True

    # ── 8. RECOGNITION (normalisation, reconnaissance, ambassade) ──
    if any(w in q for w in ["normalize relation", "normalis", "recognize ",
                             "recognition", "reopen", "open embassy",
                             "abraham accords", "recognize sovereignty"]) and any(
        w in q for w in ["relation", "embassy", "accords", "recognition",
                          "sovereignty", "normali"]):
        return EventType.RECOGNITION, False

    # ── 9. DIPLOMACY (rencontres, visites, sommets) ──
    if any(w in q for w in ["visit ", "meet next", "meet in ", "meeting ",
                             "diplomatic", "negotiate", "summit", "talks ",
                             "state visit"]):
        return EventType.DIPLOMACY, False

    # ── 10. ALLIANCE (adhésion OTAN/BRICS/UE) ──
    if any(w in q for w in ["join nato", "join brics", "join the eu",
                             "join eu", "nato member", "alliance", "military pact",
                             "rejoin"]):
        return EventType.ALLIANCE, False

    # ── 11. REGIME_CHANGE (coup, purge) ──
    if any(w in q for w in ["coup", "overthrow", "overthrown", "topple", "oust",
                             "purge", "leadership change"]):
        return EventType.REGIME_CHANGE, True

    # ── 12. REGIME_STABILITY (leader reste — AVANT ELECTION) ──
    if any(w in q for w in ["still be president", "remain in power", "stay in office",
                             "re-elected", "win re-election", "head of state",
                             "out as head"]):
        return EventType.REGIME_STABILITY, False

    # ── 13. SECESSION (AVANT ELECTION pour "vote to leave") ──
    if any(w in q for w in ["secession", "independence", "breakaway", "secede",
                             "leave the federation", "leave canada",
                             "leave the union", "separate from"]):
        return EventType.SECESSION, True

    # ── 14. ELECTION ──
    if any(w in q for w in ["election", "vote ", "seats", "ballot", "referendum",
                             "win the most", "win a majority", "runoff", "qualify for",
                             "hold the most"]):
        return EventType.ELECTION, False

    # ── 15. PROTEST ──
    if any(w in q for w in ["protest", "uprising", "revolution", "riot",
                             "demonstration", "civil unrest", "mass movement"]):
        return EventType.PROTEST, True

    # ── 16. INTERVENTION (opération extérieure) ──
    if any(w in q for w in ["anti-cartel", "peacekeeping", "intervention",
                             "military operation" if "outside" in q else "___"]):
        return EventType.INTERVENTION, True

    # ── 17. DEAL_PEACE (traité formel, accord de paix) ──
    if any(w in q for w in ["peace deal", "peace agreement", "treaty", "accord",
                             "peace"]):
        return EventType.DEAL_PEACE, False

    # ── 18. MILITARY_STRIKE (frappe ciblée — AVANT CONFLICT générique) ──
    if any(w in q for w in ["strike ", "strikes ", "bomb ", "drone strike",
                             "target ", "shell ", "shelling"]) and not any(
        w in q for w in ["trade war", "labor strike", "general strike"]):
        return EventType.MILITARY_STRIKE, True

    # ── 19. CONFLICT (guerre, invasion, clash — catch-all militaire) ──
    if any(w in q for w in ["war", "invasion", "invade", "military offensive",
                             "military action", "military clash",
                             "guerre", "conflit armé", "offensive",
                             "attack", "clash"]):
        return EventType.CONFLICT, True

    # ── 20. ENERGY ──
    if any(w in q for w in ["oil price", "oil embargo", "gas pipeline", "energy crisis",
                             "opec cut", "oil supply", "gas supply", "lng ",
                             "oil field", "refinery", "crude oil pipeline"]):
        return EventType.ENERGY, True

    # ── 21. SANCTIONS ──
    if any(w in q for w in ["sanction", "embargo", "tariff", "trade war",
                             "ban import", "ban export", "impose", "chip ban",
                             "semiconductor ban", "export control"]):
        return EventType.SANCTIONS, not is_reversal

    # ── 22. TRADE_DEAL ──
    if any(w in q for w in ["trade deal", "trade agreement", "free trade",
                             "fta ", "commercial agreement", "trade pact"]):
        return EventType.TRADE_DEAL, False

    # ── 23. HUMANITARIAN ──
    if any(w in q for w in ["famine", "refugee", "humanitarian", "aid ",
                             "food crisis", "displacement"]):
        return EventType.HUMANITARIAN, True

    # ── 24. CRISIS ──
    if any(w in q for w in ["crisis", "default", "collapse", "recession",
                             "crise", "faillite", "bankruptcy"]):
        return EventType.CRISIS, True

    # ── 25. ECONOMIC ──
    if any(w in q for w in ["gdp", "growth", "economy", "pib", "croissance",
                             "inflation target", "3rd largest", "largest economy"]):
        return EventType.ECONOMIC, False

    # ── 26. GENERIC ──
    return EventType.GENERIC, True


def _semplice_multiplier(weighted_score: float) -> float:
    """
    Convertit un score SEMPLICE pondéré (1-7) en multiplicateur du taux de base.

    Courbe centrée sur 4 (milieu de l'échelle) :
    - Score 1 → mult ≈ 0.25 (divise le taux de base par ~4)
    - Score 4 → mult = 1.0  (taux de base inchangé)
    - Score 5.5 → mult ≈ 2.0
    - Score 7 → mult ≈ 3.0  (multiplie le taux de base par ~3)
    """
    x = (weighted_score - 4) / 3  # score 1→-1, 4→0, 7→+1

    if x >= 0:
        mult = 1.0 + x * 2.0  # [1.0, 3.0] pour scores 4-7
    else:
        mult = math.exp(x * 1.4)  # [0.25, 1.0] pour scores 1-4

    return max(0.15, min(3.5, mult))


def _time_horizon_years(end_date: str, reference_date: str | None = None) -> float:
    """Calcule l'horizon temporel en années depuis une date de référence (ou maintenant)."""
    try:
        if "T" in end_date:
            end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        else:
            end = datetime.strptime(end_date[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)

        if reference_date:
            ref = datetime.strptime(reference_date[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        else:
            ref = datetime.now(timezone.utc)

        delta = (end - ref).total_seconds() / (365.25 * 86400)
        return max(delta, 1 / 365)  # minimum 1 jour
    except (ValueError, TypeError):
        return 1.0


def detect_active_conflicts(matched_markets: list[MatchedMarket]) -> dict[str, float]:
    """Détecte les zones en conflit actif via l'analyse des clusters de marchés.

    Si une zone a beaucoup de marchés avec du vocabulaire militaire/conflit,
    c'est le signe d'une opération en cours. Les taux de base historiques
    ne sont plus pertinents → on retourne un multiplicateur de conflit.

    Retourne : {zone_id: conflict_multiplier}
    """
    _CONFLICT_KW = [
        "military action", "strike ", "strikes ", "attack", "clash",
        "ceasefire", "ends by", "ends on", "war ", "invasion",
        "bomb", "drone", "missile", "escalat", "retaliat",
        "target ", "shell", "offensive",
    ]

    zone_hits: dict[str, int] = {}
    for mm in matched_markets:
        q = mm.market.question.lower()
        if any(kw in q for kw in _CONFLICT_KW):
            zone_hits[mm.zone.id] = zone_hits.get(mm.zone.id, 0) + 1

    multipliers: dict[str, float] = {}
    for zid, count in zone_hits.items():
        if count >= 8:
            multipliers[zid] = 5.0   # conflit majeur (ex: opération militaire active)
        elif count >= 5:
            multipliers[zid] = 3.0   # conflit significatif
        elif count >= 3:
            multipliers[zid] = 2.0   # tensions élevées
    return multipliers


# Horizon minimum en jours sous lequel on skippe (sauf conflit actif)
_MIN_HORIZON_DAYS = 7


def estimate_probability(
    market: MatchedMarket,
    reference_date: str | None = None,
    zone_intel: "ZoneIntel | None" = None,
    conflict_multiplier: float = 1.0,
) -> tuple[float, str, EventType, float, float, float]:
    """
    Estime la probabilité calibrée d'un événement.

    Args:
        reference_date: Date de référence ISO (pour backtest). None = maintenant.
        zone_intel: Intelligence Inflexion (vélocité, signatures, watchlist).
        conflict_multiplier: Multiplicateur de conflit actif (≥1.0).

    Retourne : (probabilité, raisonnement, type, base_rate, multiplier, horizon)
    """
    zone = market.zone
    question = market.market.question
    event_type, is_negative = classify_event(question)

    # 1. Taux de base annuel (ajusté si conflit actif détecté)
    base_rate = BASE_RATES[event_type]
    if conflict_multiplier > 1.0:
        base_rate = min(base_rate * conflict_multiplier, 0.85)

    # 2. Score SEMPLICE pondéré selon le type d'événement
    weights = DIM_WEIGHTS[event_type]

    # Choix des scores SEMPLICE selon la nature de l'événement :
    # - Événements positifs → scores d'opportunité
    # - Événements négatifs → scores de risque
    # - Événements mixtes → blend risque/opportunité
    _OPP_TYPES = {EventType.REGIME_STABILITY, EventType.ECONOMIC,
                  EventType.ALLIANCE, EventType.TRADE_DEAL}
    _MIX_TYPES = {EventType.ELECTION, EventType.PROTEST, EventType.SECESSION}
    _DIPLO_TYPES = {EventType.DIPLOMACY, EventType.DEAL_PEACE,
                    EventType.CEASEFIRE, EventType.RECOGNITION}

    if event_type in _OPP_TYPES:
        scores = zone.opp
    elif event_type in _MIX_TYPES:
        scores = [(r + o) / 2 for r, o in zip(zone.scores, zone.opp)]
    elif event_type in _DIPLO_TYPES:
        scores = [(7 - r + o) / 2 for r, o in zip(zone.scores, zone.opp)]
    elif not is_negative:
        scores = [7 - s for s in zone.scores]
    else:
        scores = zone.scores

    weighted_score = sum(s * w for s, w in zip(scores, weights))

    # 3. Multiplicateur SEMPLICE
    mult = _semplice_multiplier(weighted_score)

    # 4. Multiplicateur intelligence Inflexion (vélocité + signatures + watchlist)
    intel_mult = 1.0
    intel_reasoning = ""
    if zone_intel and zone_intel.combined_multiplier != 1.0:
        # Boost signature spécifique au type d'événement
        from inflexion_intel import signature_boost_for_event
        sig_boost = signature_boost_for_event(zone_intel.signatures, event_type.value)
        intel_mult = zone_intel.combined_multiplier * sig_boost
        intel_mult = max(0.5, min(3.0, intel_mult))
        intel_reasoning = f" | Intel×{intel_mult:.2f}({zone_intel.reasoning[:60]})"

    # 5. Probabilité annuelle ajustée
    annual_prob = base_rate * mult * intel_mult
    annual_prob = max(0.005, min(0.95, annual_prob))

    # 5b. Ajustement favori électoral : si le marché price > 65%, c'est un
    # favori clair — on rehausse la probabilité vers le consensus marché
    # pour éviter les BUY_NO sur des quasi-certitudes (Modi, Sheinbaum).
    poly_price = market.market.tokens[0]["price"] if market.market.tokens else 0.5
    if event_type == EventType.ELECTION and poly_price > 0.65:
        market_anchor = poly_price * 0.6 + annual_prob * 0.4
        annual_prob = max(annual_prob, market_anchor)

    # 6. Ajustement pour l'horizon temporel
    horizon = _time_horizon_years(market.market.end_date, reference_date)

    # Correction horizon court : pour les marchés < 3 mois, la conversion
    # annuelle→mensuelle dilue excessivement. On applique un plancher de
    # 0.25 an (3 mois) pour éviter que des événements imminents soient
    # sous-estimés (ex: frappe militaire dans le mois).
    effective_horizon = max(horizon, 0.25) if event_type != EventType.REGIME_STABILITY else horizon

    if event_type == EventType.REGIME_STABILITY:
        final_prob = annual_prob ** horizon
    else:
        final_prob = 1 - (1 - annual_prob) ** effective_horizon

    final_prob = max(0.01, min(0.98, final_prob))

    # Raisonnement structuré
    dim_labels = ["S", "E", "M", "P", "L", "I", "C", "Ee"]
    top_dims = sorted(zip(weights, dim_labels, scores), reverse=True)[:3]
    dims_str = ", ".join(f"{label}={score:.1f}(w={w:.0%})" for w, label, score in top_dims)

    polarity = "négatif" if is_negative else "positif"
    conflict_str = f" ⚠CONFLIT×{conflict_multiplier:.0f}" if conflict_multiplier > 1.0 else ""
    reasoning = (
        f"Type={event_type.value}({polarity}) | Base={BASE_RATES[event_type]:.1%}"
        f"{conflict_str} × Mult={mult:.2f}"
        f"{'×Intel' + f'{intel_mult:.2f}' if intel_mult != 1.0 else ''} "
        f"→ Ann={annual_prob:.1%} → T={horizon:.1f}a → P={final_prob:.1%} | {dims_str}"
        f"{intel_reasoning}"
    )

    return final_prob, reasoning, event_type, base_rate, mult * intel_mult, horizon


def generate_signals(
    matched_markets: list[MatchedMarket],
    min_edge_pct: float = 8.0,
    min_match_score: float = 0.1,
    signals_from_insights: dict[str, float] | None = None,
    intel_report: "IntelReport | None" = None,
) -> list[Signal]:
    """Génère des signaux de trading calibrés."""
    signals: list[Signal] = []
    if signals_from_insights is None:
        signals_from_insights = {}

    # Détecter les conflits actifs (clusters de marchés militaires par zone)
    conflict_mults = detect_active_conflicts(matched_markets)

    for mm in matched_markets:
        if mm.match_score < min_match_score:
            continue

        # Filtre horizon court : skip les marchés < 7 jours sauf si conflit actif
        horizon_days = _time_horizon_years(mm.market.end_date) * 365.25
        zone_in_conflict = mm.zone.id in conflict_mults
        if horizon_days < _MIN_HORIZON_DAYS and not zone_in_conflict:
            continue

        zone_intel = None
        if intel_report:
            zone_intel = intel_report.zones.get(mm.zone.id)

        conflict_mult = conflict_mults.get(mm.zone.id, 1.0)
        prob, reasoning, event_type, base_rate, mult, horizon = estimate_probability(
            mm, zone_intel=zone_intel, conflict_multiplier=conflict_mult,
        )

        # Ajuster avec les insights Inflexion (boost modéré : ±15% max)
        zone_id = mm.zone.id
        if zone_id in signals_from_insights:
            boost = signals_from_insights[zone_id]
            old_prob = prob
            prob = prob * 0.85 + boost * 0.15
            reasoning += f" | Insight boost: {old_prob:.1%}→{prob:.1%}"

        # Token YES
        yes_token = next((t for t in mm.market.tokens if t["outcome"] == "Yes"), None)
        if not yes_token:
            continue

        poly_price = yes_token["price"]
        edge_yes = prob - poly_price
        edge_pct = abs(edge_yes) * 100

        if edge_pct < min_edge_pct:
            continue

        direction = Direction.BUY_YES if edge_yes > 0 else Direction.BUY_NO

        # Confiance composite
        liq_factor = min(mm.market.liquidity / 50000, 1.0)
        match_factor = mm.match_score
        edge_factor = min(edge_pct / 25, 1.0)
        # Pénaliser les multiplicateurs extrêmes (moins fiables)
        stability_factor = 1.0 - 0.3 * min(abs(mult - 1) / 3, 1.0)

        confidence = (
            match_factor * 0.30
            + edge_factor * 0.25
            + liq_factor * 0.20
            + stability_factor * 0.25
        )

        signals.append(Signal(
            market=mm,
            direction=direction,
            semplice_prob=prob,
            poly_price=poly_price,
            edge=edge_pct,
            confidence=confidence,
            reasoning=reasoning,
            event_type=event_type,
            base_rate=base_rate,
            multiplier=mult,
            horizon_years=horizon,
        ))

    signals.sort(key=lambda s: s.edge * s.confidence, reverse=True)
    return signals


import re as _re

# Pattern pour normaliser les dates/nombres dans les questions (dédoublonnage)
_DATE_PATTERNS = _re.compile(
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4}\b"
    r"|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?"
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
    r"|\b(?:on|by|before|after|ends?\s+(?:on|by))\s+\w+\s+\d+"
    r"|\b\d{4}-\d{2}-\d{2}\b",
    _re.IGNORECASE,
)


def _question_root(question: str) -> str:
    """Extrait la racine d'une question en supprimant dates et nombres spécifiques."""
    root = _DATE_PATTERNS.sub("__DATE__", question)
    root = _re.sub(r"\b\d{1,2}(?:st|nd|rd|th)?\b", "__N__", root)
    root = _re.sub(r"\s+", " ", root).strip().lower()
    return root


def deduplicate_signals(
    signals: list[Signal],
    max_per_group: int = 3,
) -> list[Signal]:
    """Déduplique les signaux par question racine + zone.

    Pour chaque groupe de marchés similaires (même question racine, même zone),
    ne garde que les `max_per_group` meilleurs signaux (par edge × confidence).
    """
    groups: dict[str, list[Signal]] = {}
    for sig in signals:
        key = f"{sig.market.zone.id}::{_question_root(sig.market.market.question)}"
        groups.setdefault(key, []).append(sig)

    result: list[Signal] = []
    for key, group in groups.items():
        group.sort(key=lambda s: s.edge * s.confidence, reverse=True)
        result.extend(group[:max_per_group])

    result.sort(key=lambda s: s.edge * s.confidence, reverse=True)
    return result


def insights_to_boosts(insights: list[dict], zones: list) -> dict[str, float]:
    """Convertit les insights Inflexion en boost de probabilité par zone."""
    boosts: dict[str, list[float]] = {}

    for insight in insights:
        title = (insight.get("title", "") + " " + insight.get("summary", "")).lower()
        score = insight.get("score", 0)
        if score < 7:
            continue

        for zone in zones:
            hits = sum(1 for kw in zone.keywords if kw.lower() in title)
            if hits == 0:
                continue
            boost = 0.4 + score * 0.04
            boosts.setdefault(zone.id, []).append(boost)

    return {zid: sum(bs) / len(bs) for zid, bs in boosts.items()}
