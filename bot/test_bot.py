"""Tests unitaires pour le bot Polymarket × SEMPLICE."""

import pytest
from dataclasses import dataclass

from signal_engine import (
    classify_event, EventType, _semplice_multiplier, _question_root,
    deduplicate_signals, estimate_probability, generate_signals,
    detect_active_conflicts, Signal, Direction,
)
from market_scanner import (
    _is_geopolitical, _kw_matches, _SKIP_PATTERNS,
    PolyMarket, MatchedMarket, match_markets_to_zones,
)
from risk_manager import kelly_size
from semplice_loader import Zone


# ─── Fixtures ──────────────────────────────────────────────────────

def _zone(name="TestZone", zone_id="test", composite=4.0,
          scores=None, opp=None, keywords=None):
    return Zone(
        id=zone_id, name=name,
        scores=scores or [4.0]*8,
        composite=composite,
        opp=opp or [4.0]*8,
        opp_composite=4.0,
        keywords=keywords or ["test"],
    )


def _market(question="Test?", condition_id="cid1", tokens=None,
            volume=10000, liquidity=10000, end_date="2027-01-01"):
    if tokens is None:
        tokens = [
            {"token_id": "t1", "outcome": "Yes", "price": 0.50},
            {"token_id": "t2", "outcome": "No", "price": 0.50},
        ]
    return PolyMarket(
        condition_id=condition_id, question=question, slug="test",
        end_date=end_date, active=True, closed=False,
        tokens=tokens, volume=volume, liquidity=liquidity,
        tags=[], image="", description="",
    )


def _matched(question="Test?", zone=None, score=0.5, **kw):
    z = zone or _zone()
    return MatchedMarket(
        market=_market(question=question, **kw),
        zone=z, match_score=score, matched_keywords=["test"],
    )


# ═══════════════════════════════════════════════════════════════════
#  1. classify_event — 26 types et polarité
# ═══════════════════════════════════════════════════════════════════

class TestClassifyEvent:
    # ── Militaire ──
    def test_nuclear(self):
        t, neg = classify_event("Iran Nuke before 2027?")
        assert t == EventType.NUCLEAR
        assert neg is True

    def test_nuclear_enrichment(self):
        t, _ = classify_event("Iran agrees to end enrichment of uranium by April 30?")
        assert t == EventType.NUCLEAR

    def test_blockade(self):
        t, _ = classify_event("Will China blockade Taiwan by June 30?")
        assert t == EventType.BLOCKADE

    def test_maritime_shipping(self):
        t, neg = classify_event("Will 4-5 ships be successfully targeted by Iran by April 30?")
        assert t == EventType.MARITIME
        assert neg is True

    def test_maritime_escort(self):
        t, _ = classify_event("US escorts commercial ship through Hormuz by April 15?")
        assert t == EventType.MARITIME

    def test_cyber_attack(self):
        t, neg = classify_event("Will Russia launch a cyber attack on NATO infrastructure?")
        assert t == EventType.CYBER_ATTACK
        assert neg is True

    def test_territorial_capture(self):
        t, neg = classify_event("Will Russia capture Havrylivka by April 30?")
        assert t == EventType.TERRITORIAL
        assert neg is True

    def test_territorial_enter(self):
        t, _ = classify_event("Will Russia enter Novyi Donbas by April 30?")
        assert t == EventType.TERRITORIAL

    def test_territorial_reenter(self):
        t, _ = classify_event("Will Ukraine re-enter Rodynske by April 30?")
        assert t == EventType.TERRITORIAL

    def test_military_strike(self):
        t, neg = classify_event("Will Iran strike UAE again in March?")
        assert t == EventType.MILITARY_STRIKE
        assert neg is True

    def test_military_strike_pipeline(self):
        t, _ = classify_event("Will Iran strike East-West Crude Oil Pipeline by April 30?")
        assert t == EventType.MILITARY_STRIKE

    def test_military_strike_not_labor(self):
        t, _ = classify_event("Will there be a general strike in France?")
        assert t != EventType.MILITARY_STRIKE

    def test_conflict_military_action(self):
        t, neg = classify_event("Will Iran conduct a military action against Israel?")
        assert t == EventType.CONFLICT
        assert neg is True

    def test_conflict_clash(self):
        t, _ = classify_event("China x Taiwan military clash before 2027?")
        assert t == EventType.CONFLICT

    def test_intervention_anti_cartel(self):
        t, neg = classify_event("Will a U.S. anti-cartel operation outside of the US occur?")
        assert t == EventType.INTERVENTION
        assert neg is True

    # ── Résolution ──
    def test_ceasefire(self):
        t, neg = classify_event("Russia x Ukraine ceasefire by June 30, 2027?")
        assert t == EventType.CEASEFIRE
        assert neg is False

    def test_ceasefire_ends(self):
        t, _ = classify_event("Military action against Iran ends by April 20?")
        assert t == EventType.CEASEFIRE

    def test_ceasefire_trump_end(self):
        t, _ = classify_event("Trump announces end of military operations against Iran?")
        assert t == EventType.CEASEFIRE

    def test_deal_peace(self):
        t, neg = classify_event("US-Iran peace deal signed by December 2026?")
        assert t == EventType.DEAL_PEACE
        assert neg is False

    def test_deal_peace_treaty(self):
        t, _ = classify_event("Ukraine-Russia treaty signed by 2027?")
        assert t == EventType.DEAL_PEACE

    # ── Politique ──
    def test_assassination(self):
        t, neg = classify_event("Will there be an assassination attempt on the president?")
        assert t == EventType.ASSASSINATION
        assert neg is True

    def test_regime_change_purge(self):
        t, neg = classify_event("Will Xi Jinping purge Wang Yi in 2026?")
        assert t == EventType.REGIME_CHANGE
        assert neg is True

    def test_regime_change_leadership(self):
        t, _ = classify_event("Iran leadership change by December 31?")
        assert t == EventType.REGIME_CHANGE

    def test_regime_stability(self):
        t, neg = classify_event("Will Kadyrov remain in power by June 2026?")
        assert t == EventType.REGIME_STABILITY
        assert neg is False

    def test_regime_stability_erdogan(self):
        t, _ = classify_event("Will Erdogan still be president after 2023 elections?")
        assert t == EventType.REGIME_STABILITY

    def test_regime_head_of_state(self):
        t, _ = classify_event("Will Reza Pahlavi be head of state in Iran end of 2026?")
        assert t == EventType.REGIME_STABILITY

    def test_regime_out_as_head(self):
        t, _ = classify_event("Kadyrov out as Head of the Chechen Republic by June 30?")
        assert t == EventType.REGIME_STABILITY

    def test_election_seats(self):
        t, neg = classify_event("Will the CPI win the most seats in 2026 Tamil Nadu election?")
        assert t == EventType.ELECTION
        assert neg is False

    def test_election_qualify(self):
        t, _ = classify_event("Will Fernando Haddad qualify for Brazil's presidential runoff?")
        assert t == EventType.ELECTION

    def test_election_hold_most(self):
        t, _ = classify_event("Will PT hold the most seats in next Brazilian election?")
        assert t == EventType.ELECTION

    def test_protest(self):
        t, neg = classify_event("Will mass protests erupt in Tehran?")
        assert t == EventType.PROTEST
        assert neg is True

    def test_secession(self):
        t, neg = classify_event("Will Scotland declare independence before 2028?")
        assert t == EventType.SECESSION
        assert neg is True

    def test_secession_leave_canada(self):
        t, _ = classify_event("Will Quebec vote to leave Canada before 2028?")
        assert t == EventType.SECESSION

    # ── Diplomatique ──
    def test_diplomacy_visit(self):
        t, neg = classify_event("Will Donald Trump visit Turkey in 2026?")
        assert t == EventType.DIPLOMACY
        assert neg is False

    def test_diplomacy_meet(self):
        t, _ = classify_event("Will Trump and Putin meet next in Belarus?")
        assert t == EventType.DIPLOMACY

    def test_recognition_normalize(self):
        t, neg = classify_event("Israel and Indonesia normalize relations by June 30?")
        assert t == EventType.RECOGNITION
        assert neg is False

    def test_recognition_embassy(self):
        t, _ = classify_event("Will Israel reopen its embassy in Iran in 2026?")
        assert t == EventType.RECOGNITION

    def test_recognition_accords(self):
        t, _ = classify_event("Will Somaliland join the Abraham Accords before 2027?")
        assert t == EventType.RECOGNITION

    def test_alliance_nato(self):
        t, neg = classify_event("Will Finland join NATO in 2023?")
        assert t == EventType.ALLIANCE
        assert neg is False

    def test_alliance_rejoin(self):
        t, _ = classify_event("Will Russia rejoin the G7 before 2027?")
        assert t == EventType.ALLIANCE

    # ── Économique ──
    def test_sanctions(self):
        t, neg = classify_event("Will the US impose new sanctions on Russia?")
        assert t == EventType.SANCTIONS
        assert neg is True

    def test_sanctions_lift(self):
        t, neg = classify_event("Will the US lift sanctions on Cuba?")
        assert t == EventType.SANCTIONS
        assert neg is False

    def test_sanctions_chips(self):
        t, _ = classify_event("Will the US impose major semiconductor ban on China?")
        assert t == EventType.SANCTIONS

    def test_trade_deal(self):
        t, neg = classify_event("Will the EU sign a free trade agreement with India?")
        assert t == EventType.TRADE_DEAL
        assert neg is False

    def test_energy(self):
        t, neg = classify_event("Will OPEC cut oil supply by 2 million barrels?")
        assert t == EventType.ENERGY
        assert neg is True

    def test_crisis(self):
        t, _ = classify_event("Will Sri Lanka default on its debt?")
        assert t == EventType.CRISIS

    def test_economic(self):
        t, _ = classify_event("India becomes 3rd largest economy by 2027?")
        assert t == EventType.ECONOMIC

    def test_humanitarian(self):
        t, neg = classify_event("Will a major famine hit East Africa?")
        assert t == EventType.HUMANITARIAN
        assert neg is True

    def test_generic_fallback(self):
        t, _ = classify_event("Will something unusual happen in 2027?")
        assert t == EventType.GENERIC


# ═══════════════════════════════════════════════════════════════════
#  2. Filtrage géopolitique (market_scanner)
# ═══════════════════════════════════════════════════════════════════

class TestGeopoliticalFilter:
    def test_iran_nuclear_is_geo(self):
        assert _is_geopolitical("US-Iran nuclear deal by April 30?") is True

    def test_ukraine_capture_is_geo(self):
        assert _is_geopolitical("Will Russia capture Havrylivka?") is True

    def test_sp500_not_geo(self):
        assert _is_geopolitical("S&P 500 breaks its losing streak this week") is False

    def test_texas_primary_not_geo(self):
        assert _is_geopolitical("Texas Republican Senate Primary runoff results") is False

    def test_nobel_not_geo(self):
        assert _is_geopolitical("Nobel Prize in Physics awarded to Dr. Smith") is False

    def test_us_tariff_china_is_geo(self):
        assert _is_geopolitical("US tariff on China increased to 50%") is True

    def test_pure_domestic_filtered(self):
        assert _is_geopolitical("Republican Primary runoff in Georgia") is False

    def test_nba_not_geo(self):
        for pat in _SKIP_PATTERNS:
            if pat.search("NBA Finals 2026"):
                return  # correctly caught by blacklist
        pytest.fail("NBA should be caught by skip patterns")

    def test_gta_not_geo(self):
        for pat in _SKIP_PATTERNS:
            if pat.search("GTA 7 release date"):
                return
        pytest.fail("GTA should be caught by skip patterns")


class TestKwMatches:
    def test_short_keyword_boundary(self):
        assert _kw_matches("oil", "oil price rises") is True
        assert _kw_matches("oil", "topsoil quality") is False

    def test_inde_boundary(self):
        assert _kw_matches("inde", "l'inde est en croissance") is True
        assert _kw_matches("inde", "independence day celebrations") is False

    def test_modi_boundary(self):
        assert _kw_matches("modi", "modi visits france") is True
        assert _kw_matches("modi", "commodity prices soar") is False

    def test_long_keyword_substring(self):
        assert _kw_matches("ukraine", "ukraine conflict escalates") is True
        assert _kw_matches("ukraine", "this is about ukraine-related tensions") is True

    def test_china_boundary(self):
        assert _kw_matches("china", "china tariffs increase") is True
        assert _kw_matches("china", "chinaware antique sold") is False

    def test_niger_boundary(self):
        assert _kw_matches("niger", "niger coup d'état") is True
        assert _kw_matches("niger", "nigeria elections 2026") is False


# ═══════════════════════════════════════════════════════════════════
#  3. Matching marchés ↔ zones
# ═══════════════════════════════════════════════════════════════════

class TestMatchMarkets:
    def test_basic_match(self):
        zones = [_zone("Ukraine", "ukraine", keywords=["ukraine", "russia", "crimea", "donbas", "kyiv"])]
        markets = [_market("Will Russia capture Donbas by April 30?")]
        matched = match_markets_to_zones(markets, zones)
        assert len(matched) == 1
        assert matched[0].zone.id == "ukraine"

    def test_no_match_for_irrelevant(self):
        zones = [_zone("Ukraine", "ukraine", keywords=["ukraine", "russia", "crimea"])]
        markets = [_market("Will the Grammy go to Taylor Swift?")]
        matched = match_markets_to_zones(markets, zones)
        assert len(matched) == 0

    def test_trusted_short_name(self):
        zones = [_zone("Cuba", "cuba", keywords=["cuba", "havana", "embargo"])]
        markets = [_market("Will Cuba lift its travel restrictions? Cuba is in crisis.")]
        matched = match_markets_to_zones(markets, zones)
        assert len(matched) == 1


# ═══════════════════════════════════════════════════════════════════
#  4. Signal Engine — probabilités et multiplicateurs
# ═══════════════════════════════════════════════════════════════════

class TestSempliceMultiplier:
    def test_neutral_score(self):
        assert _semplice_multiplier(4.0) == pytest.approx(1.0)

    def test_high_score(self):
        m = _semplice_multiplier(7.0)
        assert 2.0 <= m <= 3.0

    def test_low_score(self):
        m = _semplice_multiplier(1.0)
        assert 0.15 <= m <= 0.5

    def test_monotonic(self):
        vals = [_semplice_multiplier(s) for s in range(1, 8)]
        assert all(a <= b for a, b in zip(vals, vals[1:]))


class TestEstimateProbability:
    def test_returns_bounded(self):
        mm = _matched("Will Russia capture Donbas?")
        prob, reasoning, etype, base, mult, horizon = estimate_probability(mm)
        assert 0.01 <= prob <= 0.98

    def test_territorial_type(self):
        mm = _matched("Will Russia capture Havrylivka?")
        _, _, etype, _, _, _ = estimate_probability(mm)
        assert etype == EventType.TERRITORIAL

    def test_election_type(self):
        mm = _matched("Will CPI win the most seats in Tamil Nadu election?")
        _, _, etype, _, _, _ = estimate_probability(mm)
        assert etype == EventType.ELECTION

    def test_higher_risk_higher_prob(self):
        z_low = _zone(scores=[2.0]*8, composite=2.0)
        z_high = _zone(scores=[6.0]*8, composite=6.0)
        mm_low = _matched("Will there be a new war?", zone=z_low)
        mm_high = _matched("Will there be a new war?", zone=z_high)
        p_low, *_ = estimate_probability(mm_low)
        p_high, *_ = estimate_probability(mm_high)
        assert p_high > p_low


# ═══════════════════════════════════════════════════════════════════
#  5. Dédoublonnage
# ═══════════════════════════════════════════════════════════════════

class TestDeduplication:
    def test_question_root_strips_dates(self):
        r1 = _question_root("Military action against Iran ends by April 20, 2026?")
        r2 = _question_root("Military action against Iran ends by April 28, 2026?")
        assert r1 == r2

    def test_question_root_different_questions(self):
        r1 = _question_root("Will Russia capture Havrylivka?")
        r2 = _question_root("Will Iran strike UAE?")
        assert r1 != r2

    def test_dedup_reduces_duplicates(self):
        z = _zone("Iran", "iran")
        signals = []
        for i in range(10):
            sig = Signal(
                market=_matched(f"Military action against Iran ends by April {10+i}?", zone=z),
                direction=Direction.BUY_NO,
                semplice_prob=0.10,
                poly_price=0.50,
                edge=40.0,
                confidence=0.7 - i*0.01,
                reasoning="test",
            )
            signals.append(sig)
        result = deduplicate_signals(signals, max_per_group=3)
        assert len(result) == 3

    def test_dedup_keeps_different_zones(self):
        z1 = _zone("Iran", "iran")
        z2 = _zone("Ukraine", "ukraine")
        signals = [
            Signal(
                market=_matched("Test question?", zone=z1),
                direction=Direction.BUY_YES,
                semplice_prob=0.6, poly_price=0.4, edge=20.0,
                confidence=0.8, reasoning="test",
            ),
            Signal(
                market=_matched("Test question?", zone=z2),
                direction=Direction.BUY_YES,
                semplice_prob=0.6, poly_price=0.4, edge=20.0,
                confidence=0.8, reasoning="test",
            ),
        ]
        result = deduplicate_signals(signals, max_per_group=3)
        assert len(result) == 2


# ═══════════════════════════════════════════════════════════════════
#  6. Risk Manager — Kelly sizing
# ═══════════════════════════════════════════════════════════════════

class TestKellySize:
    def test_fair_odds_no_edge(self):
        assert kelly_size(0.50, 0.50) == pytest.approx(0.0)

    def test_positive_edge(self):
        k = kelly_size(0.70, 0.50)
        assert k > 0

    def test_negative_edge(self):
        k = kelly_size(0.30, 0.50)
        assert k == 0.0

    def test_extreme_price_zero(self):
        assert kelly_size(0.50, 0.0) == 0.0

    def test_extreme_price_one(self):
        assert kelly_size(0.50, 1.0) == 0.0

    def test_kelly_bounded(self):
        k = kelly_size(0.99, 0.01)
        assert 0 <= k <= 1.0


# ═══════════════════════════════════════════════════════════════════
#  7. generate_signals — pipeline complet
# ═══════════════════════════════════════════════════════════════════

class TestGenerateSignals:
    def test_filters_low_edge(self):
        mm = _matched("Will Russia capture Donbas?",
                      tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.50},
                              {"token_id": "t2", "outcome": "No", "price": 0.50}])
        # Avec un score neutre (4.0), la prob sera proche du taux de base
        # → edge faible contre un prix de 0.50
        signals = generate_signals([mm], min_edge_pct=50.0)
        assert len(signals) == 0  # edge insuffisant

    def test_generates_signal_with_edge(self):
        z = _zone(scores=[6.5]*8, composite=6.5)
        mm = _matched("Will there be new sanctions on this zone?", zone=z,
                      tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.10},
                              {"token_id": "t2", "outcome": "No", "price": 0.90}])
        signals = generate_signals([mm], min_edge_pct=5.0)
        assert len(signals) >= 1


# ═══════════════════════════════════════════════════════════════════
#  8. Favori électoral — anchoring au consensus marché
# ═══════════════════════════════════════════════════════════════════

class TestElectionFavoriteAnchoring:
    def test_favorite_gets_boosted(self):
        """Quand le marché price > 65%, la prob doit être rehaussée vers le consensus."""
        z = _zone(scores=[4.0]*8, composite=4.0, opp=[4.0]*8)
        mm = _matched(
            "Will Modi win India's general election in 2024?", zone=z,
            tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.85},
                    {"token_id": "t2", "outcome": "No", "price": 0.15}],
            end_date="2024-06-30",
        )
        prob, _, etype, _, _, _ = estimate_probability(mm, reference_date="2024-01-01")
        assert etype == EventType.ELECTION
        # Sans anchoring, base_rate 45% × mult ~1.0 → prob ~22%
        # Avec anchoring, annual_prob rehaussée → prob finale ~44% (horizon 0.5 an)
        # L'important : prob bien plus haute qu'un modèle pur (~22%)
        assert prob > 0.35

    def test_non_favorite_not_boosted(self):
        """Quand le marché price < 65%, pas d'anchoring."""
        z = _zone(scores=[4.0]*8, composite=4.0, opp=[4.0]*8)
        mm = _matched(
            "Will the opposition win the election?", zone=z,
            tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.30},
                    {"token_id": "t2", "outcome": "No", "price": 0.70}],
            end_date="2025-06-30",
        )
        prob, _, etype, _, _, _ = estimate_probability(mm, reference_date="2025-01-01")
        assert etype == EventType.ELECTION
        # Prob doit rester proche du modèle SEMPLICE, pas être tirée vers 30%
        assert prob < 0.60

    def test_non_election_not_anchored(self):
        """L'anchoring ne s'applique qu'aux ELECTION, pas aux autres types."""
        z = _zone(scores=[4.0]*8, composite=4.0)
        mm = _matched(
            "Will Russia capture Donbas?", zone=z,
            tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.85},
                    {"token_id": "t2", "outcome": "No", "price": 0.15}],
            end_date="2025-12-31",
        )
        prob, _, etype, _, _, _ = estimate_probability(mm)
        assert etype == EventType.TERRITORIAL
        # Pas d'anchoring → prob déterminée uniquement par SEMPLICE
        assert prob < 0.60


# ═══════════════════════════════════════════════════════════════════
#  9. Horizon court — plancher 0.25 an
# ═══════════════════════════════════════════════════════════════════

class TestShortHorizonFloor:
    def test_short_horizon_not_diluted(self):
        """Un marché à 1 mois ne doit pas donner une prob quasi-nulle."""
        z = _zone(scores=[5.5]*8, composite=5.5)
        mm = _matched(
            "Will the US launch a military strike on Iran in January 2025?", zone=z,
            tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.15},
                    {"token_id": "t2", "outcome": "No", "price": 0.85}],
            end_date="2025-01-31",
        )
        prob, _, etype, _, _, _ = estimate_probability(mm, reference_date="2025-01-01")
        assert etype == EventType.MILITARY_STRIKE
        # Avec le plancher à 0.25 an, la prob ne doit pas descendre sous 3%
        assert prob >= 0.03

    def test_regime_stability_no_floor(self):
        """REGIME_STABILITY n'a pas de plancher d'horizon (probabilité décroissante)."""
        z = _zone(scores=[3.0]*8, composite=3.0, opp=[5.0]*8)
        mm = _matched(
            "Will Erdogan still be president after 1 month?", zone=z,
            tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.95},
                    {"token_id": "t2", "outcome": "No", "price": 0.05}],
            end_date="2025-02-01",
        )
        prob, _, etype, _, _, _ = estimate_probability(mm, reference_date="2025-01-01")
        assert etype == EventType.REGIME_STABILITY
        # Pour regime_stability, pas de floor → prob reste très haute sur horizon court
        assert prob > 0.80

    def test_long_horizon_unaffected(self):
        """Un marché à 1 an ne doit pas être affecté par le plancher."""
        z = _zone(scores=[5.0]*8, composite=5.0)
        mm_short = _matched(
            "Will the US launch a military strike in 2025?", zone=z,
            tokens=[{"token_id": "t1", "outcome": "Yes", "price": 0.15},
                    {"token_id": "t2", "outcome": "No", "price": 0.85}],
            end_date="2025-12-31",
        )
        prob_long, *_ = estimate_probability(mm_short, reference_date="2025-01-01")
        # 1 an > 0.25 an → pas de floor appliqué, prob réaliste
        assert 0.05 < prob_long < 0.60


# ═══════════════════════════════════════════════════════════════════
#  10. save_backtest_results — sérialisation JSON
# ═══════════════════════════════════════════════════════════════════

class TestSaveBacktestResults:
    def _make_result(self, event_id="test-event", outcome=True,
                     would_bet="BUY_YES", pnl=233.0):
        from backtester import BacktestResult, BacktestEvent
        event = BacktestEvent(
            id=event_id, question="Test?", zone_id="test",
            entry_date="2024-01-01", end_date="2024-12-31",
            outcome=outcome, poly_price_at_open=0.30,
        )
        correct = (would_bet == "BUY_YES" and outcome) or \
                  (would_bet == "BUY_NO" and not outcome) or \
                  would_bet == "SKIP"
        return BacktestResult(
            event=event, semplice_prob=0.55,
            event_type=EventType.CONFLICT, base_rate=0.06,
            multiplier=1.5, edge=25.0, would_have_bet=would_bet,
            correct=correct, pnl_pct=pnl, reasoning="test",
        )

    def test_creates_json_file(self, tmp_path, monkeypatch):
        """save_backtest_results crée un fichier JSON valide."""
        import json
        import backtester

        # Rediriger la sortie vers tmp_path
        monkeypatch.setattr(backtester, "Path",
                            lambda *a: tmp_path / a[-1] if a else tmp_path)

        from backtester import save_backtest_results
        result = self._make_result()

        out = save_backtest_results([result])
        assert out.exists()

        data = json.loads(out.read_text())
        assert "summary" in data
        assert "results" in data
        assert data["summary"]["events_tested"] == 1
        assert data["summary"]["win_rate"] == 100.0
        assert len(data["results"]) == 1
        assert data["results"][0]["event_id"] == "test-event"

    def test_skip_not_counted_in_bets(self):
        """Les SKIP ne comptent pas dans les métriques de trading."""
        import json
        from backtester import save_backtest_results

        result = self._make_result(would_bet="SKIP", pnl=0.0)
        out = save_backtest_results([result])
        data = json.loads(out.read_text())
        assert data["summary"]["signals_generated"] == 0
        assert data["summary"]["skips"] == 1


# ═══════════════════════════════════════════════════════════════════
#  11. Détection de conflit actif
# ═══════════════════════════════════════════════════════════════════

class TestDetectActiveConflicts:
    def test_no_conflict_returns_empty(self):
        """Pas de cluster militaire → pas de multiplicateur."""
        markets = [
            _matched("Will Brazil's GDP grow?"),
            _matched("Will Modi win the election?"),
        ]
        assert detect_active_conflicts(markets) == {}

    def test_small_cluster_ignored(self):
        """< 3 marchés militaires → pas de multiplicateur."""
        z = _zone("Iran", "iran")
        markets = [
            _matched("Will Iran strike Syria?", zone=z),
            _matched("Will sanctions be lifted?", zone=z),
        ]
        assert detect_active_conflicts(markets) == {}

    def test_medium_cluster_detected(self):
        """3-4 marchés militaires → multiplicateur ×2."""
        z = _zone("Iran", "iran")
        markets = [
            _matched("Will Iran strike Syria?", zone=z),
            _matched("Military action against Iran ends by April?", zone=z),
            _matched("Iran drone attack on target?", zone=z),
        ]
        result = detect_active_conflicts(markets)
        assert "iran" in result
        assert result["iran"] == 2.0

    def test_large_cluster_detected(self):
        """5+ marchés militaires → multiplicateur ×3."""
        z = _zone("Iran", "iran")
        markets = [
            _matched("Will Iran strike Syria?", zone=z),
            _matched("Military action ends by April 19?", zone=z),
            _matched("Military action ends by April 22?", zone=z),
            _matched("Iran drone attack on target?", zone=z),
            _matched("Iran missile strike on Ras Tanura?", zone=z),
        ]
        result = detect_active_conflicts(markets)
        assert result["iran"] == 3.0

    def test_major_cluster_detected(self):
        """8+ marchés militaires → multiplicateur ×5."""
        z = _zone("Iran", "iran")
        markets = [_matched(f"Military action ends on April {10+i}?", zone=z) for i in range(8)]
        result = detect_active_conflicts(markets)
        assert result["iran"] == 5.0

    def test_conflict_boosts_probability(self):
        """Le multiplicateur de conflit rehausse la probabilité estimée."""
        z = _zone("Iran", "iran", scores=[5.0]*8, composite=5.0)
        mm = _matched("Will Iran strike Syria?", zone=z, end_date="2026-12-31")
        prob_normal, *_ = estimate_probability(mm, conflict_multiplier=1.0)
        prob_conflict, *_ = estimate_probability(mm, conflict_multiplier=3.0)
        assert prob_conflict > prob_normal

    def test_different_zones_independent(self):
        """Chaque zone a son propre compteur de conflit."""
        z_iran = _zone("Iran", "iran")
        z_ukraine = _zone("Ukraine", "ukraine")
        markets = [
            _matched("Military action against Iran ends?", zone=z_iran),
            _matched("Iran strike on target?", zone=z_iran),
            _matched("Iran missile attack?", zone=z_iran),
            _matched("Will Brazil's GDP grow?", zone=z_ukraine),
        ]
        result = detect_active_conflicts(markets)
        assert "iran" in result
        assert "ukraine" not in result
