"""
Backtester — Valide la stratégie SEMPLICE sur des événements historiques.

Utilise des événements géopolitiques réels dont l'issue est connue
pour tester si le signal engine aurait généré les bons signaux.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from market_scanner import PolyMarket, MatchedMarket
from semplice_loader import Zone, RISK_WEIGHTS
from signal_engine import estimate_probability, classify_event, EventType


@dataclass
class BacktestEvent:
    """Événement historique avec issue connue."""
    id: str
    question: str                # question de marché formulée
    zone_id: str                 # zone SEMPLICE associée
    entry_date: str              # date d'ouverture du marché (pour calculer l'horizon)
    end_date: str                # date de résolution
    outcome: bool                # True = YES a gagné
    poly_price_at_open: float    # prix YES quand le marché était ouvert
    description: str = ""


@dataclass
class BacktestResult:
    event: BacktestEvent
    semplice_prob: float
    event_type: EventType
    base_rate: float
    multiplier: float
    edge: float                  # edge au moment de l'ouverture
    would_have_bet: str          # BUY_YES, BUY_NO, SKIP
    correct: bool                # le signal aurait-il été profitable ?
    pnl_pct: float               # P&L en % si on avait agi sur le signal
    reasoning: str


# ─── Événements historiques connus ──────────────────────────────────
HISTORICAL_EVENTS: list[BacktestEvent] = [
    BacktestEvent(
        id="ukraine-invasion-2022",
        question="Will Russia invade Ukraine in 2022?",
        zone_id="ukraine",
        entry_date="2022-01-15",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.20,
        description="Invasion à grande échelle le 24 février 2022",
    ),
    BacktestEvent(
        id="ukraine-ceasefire-2023",
        question="Will there be a ceasefire in Ukraine before end of 2023?",
        zone_id="ukraine",
        entry_date="2023-01-01",
        end_date="2023-12-31",
        outcome=False,
        poly_price_at_open=0.15,
        description="Aucun cessez-le-feu réalisé en 2023",
    ),
    BacktestEvent(
        id="iran-nuclear-2024",
        question="Will Iran test a nuclear weapon in 2024?",
        zone_id="iran",
        entry_date="2024-01-01",
        end_date="2024-12-31",
        outcome=False,
        poly_price_at_open=0.05,
        description="Pas de test nucléaire iranien en 2024",
    ),
    BacktestEvent(
        id="erdogan-reelection-2023",
        question="Will Erdogan still be president of Turkey after the 2023 election?",
        zone_id="turquie",
        entry_date="2023-01-01",
        end_date="2023-06-01",
        outcome=True,
        poly_price_at_open=0.55,
        description="Erdogan réélu au second tour (52.18%)",
    ),
    BacktestEvent(
        id="niger-coup-2023",
        question="Will there be a coup in a Sahel country in 2023?",
        zone_id="sahel",
        entry_date="2023-01-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.25,
        description="Coup d'État au Niger le 26 juillet 2023",
    ),
    BacktestEvent(
        id="china-taiwan-blockade-2024",
        question="Will China impose a blockade on Taiwan in 2024?",
        zone_id="chine",
        entry_date="2024-01-01",
        end_date="2024-12-31",
        outcome=False,
        poly_price_at_open=0.04,
        description="Pas de blocus chinois sur Taiwan en 2024",
    ),
    BacktestEvent(
        id="greenland-us-2025",
        question="Will the US acquire or gain control of Greenland by 2025?",
        zone_id="arctique",
        entry_date="2025-01-01",
        end_date="2025-12-31",
        outcome=False,
        poly_price_at_open=0.07,
        description="Pas d'acquisition du Groenland",
    ),
    BacktestEvent(
        id="us-china-sanctions-2023",
        question="Will the US impose new sanctions on China in 2023?",
        zone_id="chine",
        entry_date="2023-01-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.60,
        description="Restrictions étendues sur les semiconducteurs (octobre 2023)",
    ),
    BacktestEvent(
        id="cuba-embargo-2024",
        question="Will the US lift the embargo on Cuba before 2025?",
        zone_id="cuba",
        entry_date="2024-01-01",
        end_date="2024-12-31",
        outcome=False,
        poly_price_at_open=0.03,
        description="Embargo maintenu",
    ),
    BacktestEvent(
        id="ormuz-closure-2024",
        question="Will Iran close the Strait of Hormuz in 2024?",
        zone_id="ormuz",
        entry_date="2024-01-01",
        end_date="2024-12-31",
        outcome=False,
        poly_price_at_open=0.08,
        description="Détroit resté ouvert malgré tensions",
    ),
    BacktestEvent(
        id="mexico-tariffs-2025",
        question="Will the US impose 25% tariffs on Mexican imports in 2025?",
        zone_id="mexique",
        entry_date="2024-11-15",
        end_date="2025-12-31",
        outcome=True,
        poly_price_at_open=0.35,
        description="Tarifs de 25% annoncés en mars 2025",
    ),
    BacktestEvent(
        id="brazil-gdp-2023",
        question="Will Brazil's GDP growth exceed 3% in 2023?",
        zone_id="bresil",
        entry_date="2023-01-01",
        end_date="2024-03-01",
        outcome=False,
        poly_price_at_open=0.40,
        description="PIB brésilien +2.9% en 2023 (juste sous 3%)",
    ),
    BacktestEvent(
        id="wagner-mutiny-russia-2023",
        question="Will there be a military coup or armed uprising in Russia in 2023?",
        zone_id="ukraine",
        entry_date="2023-01-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.03,
        description="Mutinerie de Wagner le 24 juin 2023 — marche sur Moscou avortée",
    ),
    BacktestEvent(
        id="sahel-coup-mali-2021",
        question="Will there be a second coup in Mali in 2021?",
        zone_id="sahel",
        entry_date="2021-01-01",
        end_date="2021-12-31",
        outcome=True,
        poly_price_at_open=0.30,
        description="Second coup d'État au Mali le 24 mai 2021 (Assimi Goïta)",
    ),
    BacktestEvent(
        id="sri-lanka-crisis-2022",
        question="Will Sri Lanka's president resign or flee due to economic crisis in 2022?",
        zone_id="inde",
        entry_date="2022-01-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.10,
        description="Gotabaya Rajapaksa fuit le pays le 13 juillet 2022",
    ),
    BacktestEvent(
        id="russia-debt-default-2022",
        question="Will Russia default on its foreign debt in 2022?",
        zone_id="ukraine",
        entry_date="2022-03-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.45,
        description="Défaut de paiement russe sur dette souveraine en juin 2022",
    ),
    BacktestEvent(
        id="finland-nato-2023",
        question="Will Finland join NATO in 2023?",
        zone_id="arctique",
        entry_date="2022-06-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.70,
        description="Finlande admise dans l'OTAN le 4 avril 2023",
    ),
    BacktestEvent(
        id="sweden-nato-2024",
        question="Will Sweden join NATO before mid-2024?",
        zone_id="arctique",
        entry_date="2023-07-01",
        end_date="2024-06-30",
        outcome=True,
        poly_price_at_open=0.55,
        description="Suède admise dans l'OTAN le 7 mars 2024",
    ),
    BacktestEvent(
        id="saudi-iran-deal-2023",
        question="Will Saudi Arabia and Iran restore diplomatic relations in 2023?",
        zone_id="ormuz",
        entry_date="2023-01-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.08,
        description="Accord de normalisation Arabie Saoudite-Iran via la Chine, mars 2023",
    ),
    BacktestEvent(
        id="us-china-chip-sanctions-2022",
        question="Will the US impose major semiconductor export restrictions on China in 2022?",
        zone_id="chine",
        entry_date="2022-01-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.25,
        description="Restrictions massives sur les puces IA (octobre 2022, Bureau of Industry and Security)",
    ),
    BacktestEvent(
        id="ethiopia-tigray-ceasefire-2022",
        question="Will there be a ceasefire in the Tigray war before end of 2022?",
        zone_id="ethiopie",
        entry_date="2022-06-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.15,
        description="Accord de cessation des hostilités signé à Pretoria le 2 novembre 2022",
    ),
    BacktestEvent(
        id="argentina-milei-2023",
        question="Will a non-traditional candidate win Argentina's presidential election in 2023?",
        zone_id="bresil",
        entry_date="2023-06-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.35,
        description="Javier Milei élu président le 19 novembre 2023 (55.7%)",
    ),

    # ── MILITARY_STRIKE ──────────────────────────────────────────────
    BacktestEvent(
        id="us-strike-soleimani-2020",
        question="Will the US launch a military strike on an Iranian target in January 2020?",
        zone_id="iran",
        entry_date="2020-01-01",
        end_date="2020-01-31",
        outcome=True,
        poly_price_at_open=0.15,
        description="Frappe de drone américain sur Qassem Soleimani à Bagdad, 3 janvier 2020",
    ),
    BacktestEvent(
        id="israel-strike-iran-2024",
        question="Will Israel launch a military strike on Iranian territory in 2024?",
        zone_id="iran",
        entry_date="2024-01-01",
        end_date="2024-12-31",
        outcome=True,
        poly_price_at_open=0.20,
        description="Frappes israéliennes sur installations militaires iraniennes, octobre 2024",
    ),
    BacktestEvent(
        id="saudi-aramco-attack-2019",
        question="Will there be a military strike on Saudi oil infrastructure in 2019?",
        zone_id="ormuz",
        entry_date="2019-01-01",
        end_date="2019-12-31",
        outcome=True,
        poly_price_at_open=0.10,
        description="Attaque drone/missile sur Abqaiq et Khurais (Aramco), 14 septembre 2019",
    ),

    # ── MARITIME ──────────────────────────────────────────────────────
    BacktestEvent(
        id="houthi-red-sea-2024",
        question="Will Houthi attacks disrupt shipping in the Red Sea in 2024?",
        zone_id="ormuz",
        entry_date="2023-12-01",
        end_date="2024-06-30",
        outcome=True,
        poly_price_at_open=0.40,
        description="Attaques Houthis sur navires commerciaux → déroutage massif via Cap de Bonne-Espérance",
    ),
    BacktestEvent(
        id="china-taiwan-military-exercises-2022",
        question="Will China conduct major military exercises around Taiwan in 2022?",
        zone_id="chine",
        entry_date="2022-07-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.30,
        description="Exercices militaires massifs après la visite de Pelosi à Taiwan, août 2022",
    ),

    # ── CYBER_ATTACK ──────────────────────────────────────────────────
    BacktestEvent(
        id="russia-whispergate-ukraine-2022",
        question="Will there be a major cyberattack on Ukraine's infrastructure in early 2022?",
        zone_id="ukraine",
        entry_date="2022-01-01",
        end_date="2022-03-31",
        outcome=True,
        poly_price_at_open=0.35,
        description="WhisperGate + HermeticWiper sur infrastructure ukrainienne, janvier-février 2022",
    ),

    # ── PROTEST ───────────────────────────────────────────────────────
    BacktestEvent(
        id="iran-mahsa-protests-2022",
        question="Will mass protests in Iran threaten regime stability in 2022?",
        zone_id="iran",
        entry_date="2022-09-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.20,
        description="Mouvement Mahsa Amini → manifestations nationales massives, 500+ morts",
    ),
    BacktestEvent(
        id="brazil-bolsonaro-protests-2023",
        question="Will there be an insurrection or major political protest in Brazil in January 2023?",
        zone_id="bresil",
        entry_date="2023-01-01",
        end_date="2023-01-31",
        outcome=True,
        poly_price_at_open=0.15,
        description="Invasion du Congrès, Planalto et STF par des bolsonaristes, 8 janvier 2023",
    ),

    # ── ENERGY ────────────────────────────────────────────────────────
    BacktestEvent(
        id="nordstream-sabotage-2022",
        question="Will the Nord Stream pipeline be damaged or sabotaged in 2022?",
        zone_id="arctique",
        entry_date="2022-06-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.05,
        description="Sabotage des pipelines Nord Stream 1 et 2 en mer Baltique, 26 septembre 2022",
    ),
    BacktestEvent(
        id="opec-production-cut-2023",
        question="Will OPEC+ announce major production cuts in 2023?",
        zone_id="ormuz",
        entry_date="2023-01-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.50,
        description="Coupes surprises de 1.66 Mb/j en avril + extension saoudienne volontaire",
    ),

    # ── ELECTION ──────────────────────────────────────────────────────
    BacktestEvent(
        id="india-modi-reelection-2024",
        question="Will Narendra Modi win India's general election in 2024?",
        zone_id="inde",
        entry_date="2024-01-01",
        end_date="2024-06-30",
        outcome=True,
        poly_price_at_open=0.85,
        description="BJP coalition NDA remporte 293 sièges, Modi réélu PM pour 3e mandat",
    ),
    BacktestEvent(
        id="mexico-sheinbaum-2024",
        question="Will Claudia Sheinbaum win Mexico's presidential election in 2024?",
        zone_id="mexique",
        entry_date="2024-01-01",
        end_date="2024-07-01",
        outcome=True,
        poly_price_at_open=0.70,
        description="Sheinbaum élue avec 59.8%, première femme présidente du Mexique",
    ),

    # ── RECOGNITION ───────────────────────────────────────────────────
    BacktestEvent(
        id="israel-uae-abraham-accords-2020",
        question="Will Israel and a Gulf state establish diplomatic relations in 2020?",
        zone_id="ormuz",
        entry_date="2020-01-01",
        end_date="2020-12-31",
        outcome=True,
        poly_price_at_open=0.08,
        description="Accords d'Abraham : normalisation Israël-EAU signée le 15 septembre 2020",
    ),

    # ── ASSASSINATION ─────────────────────────────────────────────────
    BacktestEvent(
        id="shinzo-abe-assassination-2022",
        question="Will a major political assassination occur in a G7 country in 2022?",
        zone_id="inde",
        entry_date="2022-01-01",
        end_date="2022-12-31",
        outcome=True,
        poly_price_at_open=0.03,
        description="Assassinat de Shinzo Abe à Nara, Japon, 8 juillet 2022",
    ),

    # ── HUMANITARIAN ──────────────────────────────────────────────────
    BacktestEvent(
        id="sudan-humanitarian-crisis-2023",
        question="Will Sudan face a major humanitarian crisis due to civil conflict in 2023?",
        zone_id="sahel",
        entry_date="2023-04-01",
        end_date="2023-12-31",
        outcome=True,
        poly_price_at_open=0.45,
        description="Guerre RSF-armée → 7.7M déplacés, famine au Darfour",
    ),

    # ── INTERVENTION ──────────────────────────────────────────────────
    BacktestEvent(
        id="ecowas-niger-intervention-2023",
        question="Will ECOWAS launch a military intervention in Niger in 2023?",
        zone_id="sahel",
        entry_date="2023-08-01",
        end_date="2023-12-31",
        outcome=False,
        poly_price_at_open=0.30,
        description="ECOWAS menace mais n'intervient finalement pas militairement",
    ),
]


def run_backtest(zones: list[Zone], min_edge: float = 5.0, intel_report=None) -> list[BacktestResult]:
    """Exécute le backtest sur tous les événements historiques."""
    zone_map = {z.id: z for z in zones}
    results: list[BacktestResult] = []

    for event in HISTORICAL_EVENTS:
        zone = zone_map.get(event.zone_id)
        if not zone:
            continue

        # Construire un marché fictif pour le signal engine
        mock_market = PolyMarket(
            condition_id=event.id,
            question=event.question,
            slug=event.id,
            end_date=event.end_date,
            active=False, closed=True,
            tokens=[
                {"token_id": f"{event.id}-yes", "outcome": "Yes", "price": event.poly_price_at_open},
                {"token_id": f"{event.id}-no", "outcome": "No", "price": 1 - event.poly_price_at_open},
            ],
            volume=0, liquidity=0,
            tags=[],
        )

        matched = MatchedMarket(
            market=mock_market,
            zone=zone,
            match_score=1.0,
            matched_keywords=[],
        )

        zone_intel = None
        if intel_report:
            zone_intel = intel_report.zones.get(event.zone_id)

        prob, reasoning, event_type, base_rate, mult, horizon = estimate_probability(
            matched, reference_date=event.entry_date, zone_intel=zone_intel
        )

        # Déterminer le signal
        edge_yes = prob - event.poly_price_at_open
        edge_pct = abs(edge_yes) * 100

        if edge_pct < min_edge:
            would_bet = "SKIP"
        elif edge_yes > 0:
            would_bet = "BUY_YES"
        else:
            would_bet = "BUY_NO"

        # Calculer le P&L hypothétique
        if would_bet == "BUY_YES":
            if event.outcome:
                pnl = (1 / event.poly_price_at_open - 1) * 100  # profit en %
            else:
                pnl = -100  # perte totale
        elif would_bet == "BUY_NO":
            no_price = 1 - event.poly_price_at_open
            if not event.outcome:
                pnl = (1 / no_price - 1) * 100
            else:
                pnl = -100
        else:
            pnl = 0.0

        correct = (
            (would_bet == "BUY_YES" and event.outcome)
            or (would_bet == "BUY_NO" and not event.outcome)
            or would_bet == "SKIP"
        )

        results.append(BacktestResult(
            event=event,
            semplice_prob=prob,
            event_type=event_type,
            base_rate=base_rate,
            multiplier=mult,
            edge=edge_pct,
            would_have_bet=would_bet,
            correct=correct,
            pnl_pct=pnl,
            reasoning=reasoning,
        ))

    return results


def format_backtest_report(results: list[BacktestResult]) -> str:
    """Génère un rapport de backtest formaté."""
    lines = [
        "",
        "╔══════════════════════════════════════════════════════════════╗",
        "║              BACKTEST — SEMPLICE Signal Engine v2           ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
    ]

    bets = [r for r in results if r.would_have_bet != "SKIP"]
    wins = [r for r in bets if r.correct]
    skips = [r for r in results if r.would_have_bet == "SKIP"]

    for r in results:
        outcome_str = "✓ YES" if r.event.outcome else "✗ NO"
        signal_str = f"{'→':>2} {r.would_have_bet}"
        correct_str = "✓" if r.correct else "✗"
        pnl_str = f"{r.pnl_pct:+.0f}%" if r.would_have_bet != "SKIP" else "  —"

        lines.append(f"  {correct_str} {r.event.question[:55]:<55}")
        lines.append(f"    Zone: {r.event.zone_id:<12} Type: {r.event_type.value:<18} Issue: {outcome_str}")
        lines.append(f"    SEMPLICE P={r.semplice_prob:.1%}  Poly={r.event.poly_price_at_open:.1%}  "
                      f"Edge={r.edge:.0f}%  {signal_str:<12} P&L={pnl_str}")
        lines.append(f"    Base={r.base_rate:.1%} × Mult={r.multiplier:.2f} | {r.reasoning[:70]}")
        lines.append("")

    # Résumé
    lines.append(f"{'═'*64}")
    lines.append(f"  RÉSUMÉ")
    lines.append(f"{'─'*64}")
    lines.append(f"  Événements testés    : {len(results)}")
    lines.append(f"  Signaux générés      : {len(bets)} ({len(skips)} skips)")
    if bets:
        lines.append(f"  Signaux corrects     : {len(wins)}/{len(bets)} ({len(wins)/len(bets):.0%})")
        avg_pnl = sum(r.pnl_pct for r in bets) / len(bets)
        lines.append(f"  P&L moyen par trade  : {avg_pnl:+.0f}%")
        total_pnl = sum(r.pnl_pct for r in bets)
        lines.append(f"  P&L cumulé           : {total_pnl:+.0f}%")

    # Calibration check
    lines.append(f"{'─'*64}")
    lines.append(f"  CALIBRATION")
    prob_ranges = [(0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)]
    for lo, hi in prob_ranges:
        in_range = [r for r in results if lo <= r.semplice_prob < hi]
        if in_range:
            actual_rate = sum(1 for r in in_range if r.event.outcome) / len(in_range)
            lines.append(f"    P∈[{lo:.0%},{hi:.0%}): prédit={sum(r.semplice_prob for r in in_range)/len(in_range):.0%}  "
                          f"réel={actual_rate:.0%}  n={len(in_range)}")

    lines.append(f"{'═'*64}")
    return "\n".join(lines)


def format_comparison_report(baseline: list[BacktestResult], intel: list[BacktestResult]) -> str:
    """Rapport comparatif cote a cote : baseline (sans intel) vs avec intelligence."""
    SEP = 96
    lines = [
        "",
        "╔" + "═" * SEP + "╗",
        "║" + "COMPARAISON — Baseline vs Intelligence Inflexion".center(SEP) + "║",
        "╚" + "═" * SEP + "╝",
        "",
    ]

    # En-tete du tableau detail
    hdr = (
        f"  {'Événement':<30}  "
        f"{'P(base)':>7} {'Signal':>8} {'P&L':>5}  "
        f"{'P(intel)':>8} {'Signal':>8} {'P&L':>5}  "
        f"{'Delta':>6}"
    )
    lines.append(hdr)
    lines.append("  " + "─" * (SEP - 2))

    intel_map = {r.event.id: r for r in intel}

    for b in baseline:
        i = intel_map.get(b.event.id)
        if not i:
            continue

        q = b.event.question[:28]
        outcome_mark = " ✓" if b.event.outcome else " ✗"

        b_pnl_s = f"{b.pnl_pct:+.0f}%" if b.would_have_bet != "SKIP" else "  —"
        i_pnl_s = f"{i.pnl_pct:+.0f}%" if i.would_have_bet != "SKIP" else "  —"
        delta_p = i.semplice_prob - b.semplice_prob
        delta_s = f"{delta_p:+.0%}"

        row = (
            f"  {q:<28}{outcome_mark}  "
            f"{b.semplice_prob:>6.0%} {b.would_have_bet:>8} {b_pnl_s:>5}  "
            f"{i.semplice_prob:>7.0%} {i.would_have_bet:>8} {i_pnl_s:>5}  "
            f"{delta_s:>6}"
        )
        lines.append(row)

    # Resume comparatif
    b_bets = [r for r in baseline if r.would_have_bet != "SKIP"]
    i_bets = [r for r in intel if r.would_have_bet != "SKIP"]
    b_wins = [r for r in b_bets if r.correct]
    i_wins = [r for r in i_bets if r.correct]
    b_skips = len(baseline) - len(b_bets)
    i_skips = len(intel) - len(i_bets)

    lines.append("")
    lines.append("  " + "═" * (SEP - 2))
    lines.append(f"  {'RÉSUMÉ COMPARATIF':^{SEP - 2}}")
    lines.append("  " + "─" * (SEP - 2))
    lines.append(f"  {'Métrique':<30} {'Baseline':>20} {'+ Intel':>20}")
    lines.append("  " + "─" * (SEP - 2))
    lines.append(f"  {'Événements testés':<30} {len(baseline):>20} {len(intel):>20}")
    lines.append(f"  {'Signaux générés':<30} {len(b_bets):>20} {len(i_bets):>20}")
    lines.append(f"  {'Skips':<30} {b_skips:>20} {i_skips:>20}")

    if b_bets:
        b_wr = f"{len(b_wins)}/{len(b_bets)} ({len(b_wins)/len(b_bets):.0%})"
    else:
        b_wr = "—"
    if i_bets:
        i_wr = f"{len(i_wins)}/{len(i_bets)} ({len(i_wins)/len(i_bets):.0%})"
    else:
        i_wr = "—"
    lines.append(f"  {'Win rate':<30} {b_wr:>20} {i_wr:>20}")

    b_pnl = sum(r.pnl_pct for r in b_bets) if b_bets else 0
    i_pnl = sum(r.pnl_pct for r in i_bets) if i_bets else 0
    b_avg = b_pnl / len(b_bets) if b_bets else 0
    i_avg = i_pnl / len(i_bets) if i_bets else 0

    lines.append(f"  {'P&L moyen par trade':<30} {b_avg:>+19.0f}% {i_avg:>+19.0f}%")
    lines.append(f"  {'P&L cumulé':<30} {b_pnl:>+19.0f}% {i_pnl:>+19.0f}%")

    lines.append("  " + "─" * (SEP - 2))
    delta_pnl = i_pnl - b_pnl
    delta_label = "avantage" if delta_pnl > 0 else "désavantage" if delta_pnl < 0 else "neutre"
    lines.append(f"  Delta P&L (Intel - Baseline) : {delta_pnl:+.0f}% ({delta_label})")
    lines.append("  " + "═" * (SEP - 2))

    return "\n".join(lines)


def save_backtest_results(results: list[BacktestResult]) -> Path:
    """Sérialise les résultats de backtest en JSON pour le dashboard."""
    out_dir = Path(__file__).parent / "data"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "backtest-results.json"

    bets = [r for r in results if r.would_have_bet != "SKIP"]
    wins = [r for r in bets if r.correct]
    total_pnl = sum(r.pnl_pct for r in bets) if bets else 0
    win_rate = len(wins) / len(bets) * 100 if bets else 0

    payload = {
        "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "summary": {
            "events_tested": len(results),
            "signals_generated": len(bets),
            "skips": len(results) - len(bets),
            "win_rate": round(win_rate, 1),
            "total_pnl_pct": round(total_pnl, 1),
            "avg_pnl_pct": round(total_pnl / len(bets), 1) if bets else 0,
        },
        "results": [
            {
                "event_id": r.event.id,
                "question": r.event.question,
                "zone": r.event.zone_id,
                "event_type": r.event_type.value,
                "semplice_prob": round(r.semplice_prob, 4),
                "poly_price": r.event.poly_price_at_open,
                "edge": round(r.edge, 1),
                "signal": r.would_have_bet,
                "correct": r.correct,
                "pnl_pct": round(r.pnl_pct, 1),
                "reasoning": r.reasoning,
            }
            for r in results
        ],
    }

    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path
