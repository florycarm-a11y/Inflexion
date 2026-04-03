"""
Bot Polymarket × SEMPLICE v2.1

Pipeline :
  1. Charger les scores SEMPLICE (18 zones, 8 dimensions risque + 8 opportunité)
  2. Charger les insights et signaux Inflexion (veille continue)
  3. Scanner les marchés géopolitiques Polymarket (Gamma API)
  4. Matcher marchés ↔ zones SEMPLICE (mots-clés + Claude Haiku si disponible)
  5. Estimer les probabilités calibrées (taux de base × multiplicateur SEMPLICE × horizon)
  6. Calculer le sizing (Kelly/2) et vérifier les limites de risque
  7. Exécuter les ordres (CLOB API) ou afficher en dry run

Commandes :
  python main.py --mock                    # Simulation avec marchés fictifs
  python main.py --mock --backtest         # Backtest sur événements historiques
  python main.py --compare                 # Comparer backtest avec/sans intelligence
  python main.py --mock --portfolio        # Voir le portfolio
  python main.py --local                   # SEMPLICE local + Polymarket réel
  python main.py --live --max-position 25  # Trading réel (attention !)
"""

import asyncio
import argparse
import logging
from datetime import datetime, timezone
from pathlib import Path

from config import Config
from semplice_loader import load_from_local, load_from_remote, load_signals, load_insights
from market_scanner import fetch_markets, match_markets_to_zones
from signal_engine import generate_signals, deduplicate_signals, insights_to_boosts
from risk_manager import size_positions, format_order_summary
from trader import execute_orders
from tracker import record_orders, format_portfolio
from inflexion_intel import (
    load_history_local, load_history_remote, load_signals_full,
    build_intel_report, format_intel_summary,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("inflexion-bot")

BANNER = """
╔══════════════════════════════════════════════════════════╗
║          INFLEXION × POLYMARKET — SEMPLICE Bot          ║
║                                                          ║
║   Intelligence géopolitique → Trading prédictif          ║
║   Framework SEMPLICE v2.1 · 18 zones · 8 dimensions     ║
║   Signal Engine v2 — Calibration par taux de base       ║
╚══════════════════════════════════════════════════════════╝
"""


async def run(cfg: Config, local: bool = False, mock: bool = False):
    print(BANNER)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    logger.info("Démarrage — %s | dry_run=%s | mock=%s", now, cfg.dry_run, mock)

    # 1. Charger SEMPLICE
    logger.info("Chargement des scores SEMPLICE...")
    if local or mock:
        zones = load_from_local("/Users/floryanleblanc/Documents/GitHub/Inflexion")
    else:
        zones = await load_from_remote(cfg.inflexion_url)
    logger.info("  → %d zones chargées", len(zones))

    for z in sorted(zones, key=lambda z: z.composite, reverse=True)[:5]:
        logger.info("    %-15s Risque=%.1f  Opp=%.1f", z.name, z.composite, z.opp_composite)

    # 2. Charger insights et signaux Inflexion
    if mock:
        insights, signals_data = [], []
        logger.info("Mode mock — insights et signaux ignorés")
    else:
        logger.info("Chargement des insights Inflexion...")
        insights = await load_insights(cfg.inflexion_url)
        signals_data = await load_signals(cfg.inflexion_url)
        logger.info("  → %d insights, %d signaux", len(insights), len(signals_data))

    insight_boosts = insights_to_boosts(insights, zones)
    if insight_boosts:
        logger.info("  → Boosts actifs : %s", ", ".join(f"{k}={v:.2f}" for k, v in insight_boosts.items()))

    # 2b. Intelligence Inflexion (vélocité, signatures, watchlist)
    logger.info("Construction du rapport d'intelligence Inflexion...")
    if local or mock:
        history_data = load_history_local("/Users/floryanleblanc/Documents/GitHub/Inflexion")
        signals_full = {}
        signals_path = Path("/Users/floryanleblanc/Documents/GitHub/Inflexion/data/signals.json")
        if signals_path.exists():
            import json
            signals_full = json.loads(signals_path.read_text(encoding="utf-8"))
    else:
        history_data = await load_history_remote(cfg.inflexion_url)
        signals_full = await load_signals_full(cfg.inflexion_url)

    intel_report = build_intel_report(zones, history_data, signals_full)
    active_zones = sum(1 for z in intel_report.zones.values() if z.combined_multiplier > 1.0)
    logger.info("  → %d zones avec intelligence active", active_zones)

    if active_zones > 0:
        print(format_intel_summary(intel_report))

    # 3. Scanner Polymarket
    if mock:
        from mock_markets import MOCK_MARKETS
        markets = MOCK_MARKETS
        logger.info("Mode mock — %d marchés simulés chargés", len(markets))
    else:
        logger.info("Scan des marchés Polymarket (géopolitique, politique, finance)...")
        markets = await fetch_markets(cfg)
        logger.info("  → %d marchés ouverts trouvés", len(markets))

    # 4. Matching marchés ↔ zones (mots-clés + AI si disponible)
    logger.info("Matching marchés ↔ zones SEMPLICE...")

    # Essayer le matching AI d'abord
    ai_matched = []
    if cfg.anthropic_key and not mock:
        from ai_matcher import ai_match_markets
        ai_matched = await ai_match_markets(markets, zones, cfg)

    # Compléter avec le matching par mots-clés pour les marchés non matchés par l'AI
    ai_cids = {mm.market.condition_id for mm in ai_matched}
    remaining = [m for m in markets if m.condition_id not in ai_cids]
    kw_matched = match_markets_to_zones(remaining, zones)

    matched = ai_matched + kw_matched
    matched.sort(key=lambda m: m.match_score, reverse=True)

    logger.info("  → %d matchés (%d AI + %d mots-clés)", len(matched), len(ai_matched), len(kw_matched))

    for mm in matched[:10]:
        logger.info("    [%.2f] %-15s ← %s", mm.match_score, mm.zone.name, mm.market.question[:55])

    if not matched:
        logger.warning("Aucun marché matché — vérifier les tags ou les mots-clés")
        return

    # 5. Générer les signaux (Signal Engine v2 — calibré)
    logger.info("Génération des signaux calibrés (edge min=%.0f%%)...", cfg.min_edge_pct)
    trading_signals = generate_signals(
        matched,
        min_edge_pct=cfg.min_edge_pct,
        signals_from_insights=insight_boosts,
        intel_report=intel_report,
    )
    logger.info("  → %d signaux avec edge suffisant", len(trading_signals))

    # 5b. Dédoublonnage (marchés similaires = même événement, dates différentes)
    before_dedup = len(trading_signals)
    trading_signals = deduplicate_signals(trading_signals, max_per_group=3)
    if len(trading_signals) < before_dedup:
        logger.info("  → Dédup: %d → %d signaux (max 3/groupe)", before_dedup, len(trading_signals))

    if not trading_signals:
        logger.info("Pas de signal actionnable — le marché price correctement les risques SEMPLICE")
        return

    # 6. Position sizing
    logger.info("Calcul du sizing (Kelly/2, max=$%.0f/pos, max=$%.0f total)...",
                cfg.max_position_usd, cfg.max_total_exposure_usd)
    orders = size_positions(trading_signals, cfg)

    # 7. Afficher le résumé
    print(format_order_summary(orders))

    if not orders:
        return

    # 8. Exécuter (ou dry run) + tracker
    if cfg.dry_run:
        logger.info("MODE DRY RUN — pour trader réellement, définir DRY_RUN=false")
    else:
        logger.warning("EXÉCUTION RÉELLE — soumission des ordres au CLOB Polymarket")

    results = execute_orders(orders, cfg)

    # Enregistrer les positions
    record_orders(orders)

    submitted = sum(1 for r in results if r["status"] in ("submitted", "dry_run"))
    errors = sum(1 for r in results if r["status"] == "error")
    logger.info("Terminé : %d ordres soumis, %d erreurs", submitted, errors)


def run_compare_cmd(min_edge: float = 5.0):
    """Compare le backtest avec et sans intelligence Inflexion, côte à côte."""
    import json
    from backtester import run_backtest, format_comparison_report
    from semplice_loader import load_from_local

    print(BANNER)
    logger.info("Mode COMPARE — baseline vs intelligence Inflexion")

    project_root = "/Users/floryanleblanc/Documents/GitHub/Inflexion"
    zones = load_from_local(project_root)

    # 1. Baseline — sans intelligence
    logger.info("Exécution du backtest BASELINE (sans intelligence)...")
    baseline_results = run_backtest(zones, min_edge=min_edge)

    # 2. Avec intelligence
    logger.info("Construction du rapport d'intelligence Inflexion...")
    history_data = load_history_local(project_root)
    signals_path = Path(project_root) / "data" / "signals.json"
    signals_full = json.loads(signals_path.read_text(encoding="utf-8")) if signals_path.exists() else {}
    intel_report = build_intel_report(zones, history_data, signals_full)

    active = sum(1 for z in intel_report.zones.values() if z.combined_multiplier > 1.0)
    logger.info("  → Intelligence: %d zones actives", active)

    logger.info("Exécution du backtest AVEC intelligence...")
    intel_results = run_backtest(zones, min_edge=min_edge, intel_report=intel_report)

    # 3. Rapport comparatif
    print(format_comparison_report(baseline_results, intel_results))


def run_backtest_cmd(min_edge: float = 5.0):
    """Exécute le backtest sur les événements historiques."""
    import json
    from backtester import run_backtest, format_backtest_report, save_backtest_results
    from semplice_loader import load_from_local

    print(BANNER)
    logger.info("Mode BACKTEST — validation sur événements historiques")

    project_root = "/Users/floryanleblanc/Documents/GitHub/Inflexion"
    zones = load_from_local(project_root)

    # Charger l'intelligence Inflexion
    history_data = load_history_local(project_root)
    signals_path = Path(project_root) / "data" / "signals.json"
    signals_full = json.loads(signals_path.read_text(encoding="utf-8")) if signals_path.exists() else {}
    intel_report = build_intel_report(zones, history_data, signals_full)

    active = sum(1 for z in intel_report.zones.values() if z.combined_multiplier > 1.0)
    logger.info("  → Intelligence: %d zones actives", active)
    if active > 0:
        print(format_intel_summary(intel_report))

    results = run_backtest(zones, min_edge=min_edge, intel_report=intel_report)
    print(format_backtest_report(results))
    out = save_backtest_results(results)
    logger.info("Résultats sauvegardés → %s", out)


def show_portfolio_cmd():
    """Affiche le portfolio actuel."""
    print(format_portfolio())


def main():
    parser = argparse.ArgumentParser(description="Bot Polymarket × SEMPLICE v2.1")
    parser.add_argument("--local", action="store_true", help="Charger SEMPLICE depuis le filesystem local")
    parser.add_argument("--mock", action="store_true", help="Mode simulation avec marchés fictifs")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Mode simulation (défaut)")
    parser.add_argument("--live", action="store_true", help="Mode trading réel (attention !)")
    parser.add_argument("--backtest", action="store_true", help="Backtest sur événements historiques")
    parser.add_argument("--compare", action="store_true", help="Comparer backtest avec/sans intelligence")
    parser.add_argument("--portfolio", action="store_true", help="Afficher le portfolio")
    parser.add_argument("--min-edge", type=float, help="Edge minimum en %% (défaut: 8)")
    parser.add_argument("--max-position", type=float, help="Taille max par position en USD")
    parser.add_argument("--max-exposure", type=float, help="Exposition totale max en USD")
    args = parser.parse_args()

    cfg = Config()

    if args.live:
        cfg.dry_run = False
    if args.min_edge:
        cfg.min_edge_pct = args.min_edge
    if args.max_position:
        cfg.max_position_usd = args.max_position
    if args.max_exposure:
        cfg.max_total_exposure_usd = args.max_exposure

    if args.compare:
        run_compare_cmd(min_edge=cfg.min_edge_pct)
    elif args.backtest:
        run_backtest_cmd(min_edge=cfg.min_edge_pct)
    elif args.portfolio:
        show_portfolio_cmd()
    else:
        asyncio.run(run(cfg, local=args.local, mock=args.mock))


if __name__ == "__main__":
    main()
