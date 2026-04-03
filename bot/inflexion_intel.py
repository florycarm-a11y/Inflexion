"""
Intelligence Inflexion — Couche d'intégration profonde.

Ce module consomme les 3 couches de données que le bot ignorait :
1. VÉLOCITÉ SEMPLICE — momentum par dimension depuis semplice-history.json
2. SIGNAUX WATCHLIST — priorités, weak signals, cross-signals, sentiment
3. SIGNATURES DE RISQUE — patterns composites SIG1-SIG8 du validateur

Ces données sont fusionnées en un IntelReport qui ajuste les probabilités
du signal engine de façon calibrée.
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import httpx

from semplice_loader import Zone

logger = logging.getLogger("inflexion-bot")

DIM_LABELS = ["S", "E", "M", "P", "L", "I", "C", "Ee"]


# ═══════════════════════════════════════════════════════════════
# 1. VÉLOCITÉ SEMPLICE — momentum par dimension
# ═══════════════════════════════════════════════════════════════

@dataclass
class ZoneVelocity:
    """Vélocité de chaque dimension sur les N derniers mois."""
    zone_id: str
    dim_velocity: list[float]     # 8 vélocités (delta/mois), positif = escalation
    composite_velocity: float     # vélocité du composite
    months_span: float            # période mesurée
    recent_events: list[dict]     # événements récents (type, delta, dim)
    escalation_count: int         # nombre d'escalations récentes
    deescalation_count: int


def compute_velocity(history: dict, zone_id: str) -> ZoneVelocity | None:
    """Calcule la vélocité dimensionnelle depuis semplice-history.json."""
    zone_data = history.get("zones", {}).get(zone_id)
    if not zone_data:
        return None

    snapshots = zone_data.get("snapshots", [])
    if len(snapshots) < 2:
        return None

    # Prendre les 2 snapshots les plus récents
    latest = snapshots[-1]
    previous = snapshots[-2]

    try:
        d1 = datetime.strptime(previous["date"][:10], "%Y-%m-%d")
        d2 = datetime.strptime(latest["date"][:10], "%Y-%m-%d")
        months = max((d2 - d1).days / 30.44, 0.5)
    except (ValueError, KeyError):
        months = 6.0

    s_old = previous.get("scores", [0] * 8)
    s_new = latest.get("scores", [0] * 8)

    dim_vel = [(n - o) / months for n, o in zip(s_new, s_old)]
    comp_vel = (latest.get("composite", 0) - previous.get("composite", 0)) / months

    # Événements récents (12 derniers mois)
    events = zone_data.get("events", [])
    cutoff = datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year - 1)
    recent = []
    esc_count = 0
    deesc_count = 0
    for ev in events:
        try:
            ev_date = datetime.strptime(ev["date"][:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if ev_date >= cutoff:
                recent.append(ev)
                if ev.get("type") == "escalation":
                    esc_count += 1
                elif ev.get("type") == "deescalation":
                    deesc_count += 1
        except (ValueError, KeyError):
            continue

    return ZoneVelocity(
        zone_id=zone_id,
        dim_velocity=dim_vel,
        composite_velocity=comp_vel,
        months_span=months,
        recent_events=recent,
        escalation_count=esc_count,
        deescalation_count=deesc_count,
    )


# ═══════════════════════════════════════════════════════════════
# 2. SIGNATURES DE RISQUE SIG1-SIG8
# ═══════════════════════════════════════════════════════════════

@dataclass
class SignatureMatch:
    sig_id: str
    label: str
    match_pct: float   # 0-100, pourcentage de critères remplis
    is_match: bool      # True si match_pct >= 75%


# Signatures définies dans le validateur SEMPLICE
# Indices : S=0, E=1, M=2, P=3, L=4, I=5, C=6, Ee=7
SIGNATURES = [
    {
        "id": "SIG1", "label": "Invasion/War",
        # M≥5.5 C≥5.5 I≥5.0 S≥4.0 — cible Ukraine, Ormuz ; exclut Iran (C=4.8)
        "conditions": [(2, 5.5), (6, 5.5), (5, 5.0), (0, 4.0)],
        "event_types": ["conflict", "blockade"],
    },
    {
        "id": "SIG2", "label": "Coup d'État",
        # M≥4.5 P≥5.5 — cible Sahel, Éthiopie ; exclut Cuba (M=3.3), Madagascar (P=5.5 borderline)
        "conditions": [(2, 4.5), (3, 5.5)],
        "event_types": ["regime_change"],
    },
    {
        "id": "SIG3", "label": "Revolution/Uprising",
        # S≥5.5 P≥5.0 I≥4.5 — cible Sahel ; exclut Ukraine (plus guerre que révolution)
        "conditions": [(0, 5.5), (3, 5.0), (5, 4.5)],
        "event_types": ["regime_change", "crisis"],
    },
    {
        "id": "SIG4", "label": "Financial Crisis",
        # E≥5.5 L≥4.5 — cible Ormuz, Cuba, Ukraine ; exclut zones modérées
        "conditions": [(1, 5.5), (4, 4.5)],
        "event_types": ["crisis", "economic"],
    },
    {
        "id": "SIG5", "label": "Climate Catastrophe",
        # Ee≥5.0 S≥4.0 E≥4.0 — plus sélectif, cible Sahel, Madagascar
        "conditions": [(7, 5.0), (0, 4.0), (1, 4.0)],
        "event_types": ["crisis", "generic"],
    },
    {
        "id": "SIG6", "label": "Cyber War",
        # C≥5.5 M≥4.5 I≥5.0 — cible Ukraine, Ormuz ; exclut Chine (C=5.0 borderline)
        "conditions": [(6, 5.5), (2, 4.5), (5, 5.0)],
        "event_types": ["conflict", "sanctions"],
    },
    {
        "id": "SIG7", "label": "State Capture",
        # P≥5.0 L≥5.0 I≥4.5 — cible Ormuz, Sahel, Cuba, Iran ; exclut Turquie (L=4.5 borderline)
        "conditions": [(3, 5.0), (4, 5.0), (5, 4.5)],
        "event_types": ["regime_stability", "sanctions"],
    },
    {
        "id": "SIG8", "label": "Fragile State",
        "conditions": [(i, 4.5) for i in range(8)],
        "event_types": ["crisis", "regime_change", "conflict"],
    },
]


def detect_signatures(scores: list[float]) -> list[SignatureMatch]:
    """Détecte les signatures de risque SEMPLICE actives pour une zone."""
    results = []
    for sig in SIGNATURES:
        conditions = sig["conditions"]
        matched = sum(1 for dim_idx, threshold in conditions if scores[dim_idx] >= threshold)
        pct = (matched / len(conditions)) * 100
        results.append(SignatureMatch(
            sig_id=sig["id"],
            label=sig["label"],
            match_pct=pct,
            is_match=pct >= 75,
        ))
    return results


def signature_boost_for_event(
    signatures: list[SignatureMatch],
    event_type: str,
) -> float:
    """
    Calcule un multiplicateur de confiance basé sur les signatures actives.

    Si une signature active correspond au type d'événement du marché,
    le signal est renforcé (multiplicateur > 1). Sinon, neutre.
    """
    boost = 1.0
    for sig in signatures:
        if not sig.is_match:
            continue
        # Trouver la définition de la signature
        sig_def = next((s for s in SIGNATURES if s["id"] == sig.sig_id), None)
        if not sig_def:
            continue
        if event_type in sig_def["event_types"]:
            # Boost proportionnel au match : 75%→+15%, 100%→+30%
            boost += (sig.match_pct - 50) / 100 * 0.6
    return min(boost, 2.0)


# ═══════════════════════════════════════════════════════════════
# 3. SIGNAUX WATCHLIST (priorité, weak signals, sentiment)
# ═══════════════════════════════════════════════════════════════

@dataclass
class WatchlistIntel:
    """Intelligence extraite de signals.json."""
    # Par zone / watchId
    active_watches: dict[str, dict] = field(default_factory=dict)  # watchId → {priority, count, articles}
    # Weak signals thématiques
    weak_signals: list[dict] = field(default_factory=list)
    # Cross-signals entre catégories
    cross_signals: list[dict] = field(default_factory=list)
    # Sentiment global
    sentiment_score: float = 0.0
    sentiment_label: str = "neutre"
    # Alertes
    alerts_urgent: int = 0
    alerts_total: int = 0


def parse_signals(signals_data: dict) -> WatchlistIntel:
    """Parse signals.json en intelligence structurée."""
    intel = WatchlistIntel()

    # Summary
    summary = signals_data.get("summary", {})
    intel.alerts_urgent = summary.get("alerts_urgentes", 0)
    intel.alerts_total = summary.get("watchlist_active", 0)

    # Sentiment
    ctx = signals_data.get("context", {})
    sentiment = ctx.get("sentiment", {})
    intel.sentiment_score = sentiment.get("score", 0)
    intel.sentiment_label = sentiment.get("tendance", "neutre")

    # Watchlist items
    for w in signals_data.get("watchlist", []):
        watch_id = w.get("watchId", "")
        intel.active_watches[watch_id] = {
            "priority": w.get("priority", "medium"),
            "count": w.get("count", 0),
            "label": w.get("label", ""),
            "category": w.get("category", ""),
            "articles": [a.get("title", "") if isinstance(a, dict) else a
                         for a in w.get("articles", [])[:5]],
        }

    # Weak signals
    intel.weak_signals = signals_data.get("weak_signals", [])

    # Cross signals
    intel.cross_signals = signals_data.get("cross_signals", [])

    return intel


def watchlist_boost_for_zone(
    intel: WatchlistIntel,
    zone_id: str,
    zone_keywords: list[str],
) -> tuple[float, str]:
    """
    Calcule un ajustement de probabilité basé sur l'activité watchlist.

    Retourne : (multiplicateur, raison)
    - critical + count élevé → ×1.4
    - high + articles pertinents → ×1.2
    - weak signal confirmé → ×1.15
    - sentiment baissier global → ×1.05 sur les événements négatifs
    """
    boost = 1.0
    reasons = []

    # 1. Watches directes par zone_id
    watch = intel.active_watches.get(zone_id)
    if watch:
        priority = watch["priority"]
        count = watch["count"]
        if priority == "critical":
            boost *= 1.3 + min(count / 20, 0.2)  # 1.3 → 1.5
            reasons.append(f"watch:{zone_id}=critical({count})")
        elif priority == "high":
            boost *= 1.1 + min(count / 30, 0.15)
            reasons.append(f"watch:{zone_id}=high({count})")

    # 2. Watches thématiques qui matchent les keywords de la zone
    for wid, w in intel.active_watches.items():
        if wid == zone_id:
            continue
        # Vérifier si les articles de la watch mentionnent la zone
        articles_text = " ".join(w.get("articles", [])).lower()
        kw_hits = sum(1 for kw in zone_keywords if kw.lower() in articles_text)
        if kw_hits >= 2:
            if w["priority"] == "critical":
                boost *= 1.1
                reasons.append(f"cross-watch:{wid}→{zone_id}")

    # 3. Weak signals pertinents
    for ws in intel.weak_signals:
        desc = (ws.get("description", "") + " " + ws.get("theme", "")).lower()
        kw_hits = sum(1 for kw in zone_keywords if kw.lower() in desc)
        if kw_hits >= 1:
            force = ws.get("force", "emergent")
            if force == "confirmé":
                boost *= 1.12
                reasons.append(f"weak_signal:confirmé({ws.get('theme', '')[:25]})")
            elif force == "rupture":
                boost *= 1.25
                reasons.append(f"weak_signal:rupture({ws.get('theme', '')[:25]})")

    # 4. Sentiment global (léger ajustement)
    if intel.sentiment_score < -0.2:
        boost *= 1.03  # sentiment baissier → légère hausse des probabilités de risque
        reasons.append(f"sentiment={intel.sentiment_score:.2f}")

    reason = " | ".join(reasons) if reasons else "aucun signal actif"
    return min(boost, 2.5), reason


# ═══════════════════════════════════════════════════════════════
# 4. RAPPORT D'INTELLIGENCE FUSIONNÉ
# ═══════════════════════════════════════════════════════════════

@dataclass
class ZoneIntel:
    """Intelligence complète pour une zone SEMPLICE."""
    zone_id: str
    velocity: ZoneVelocity | None
    signatures: list[SignatureMatch]
    watchlist_boost: float
    watchlist_reason: str
    # Multiplicateur combiné
    combined_multiplier: float
    reasoning: str


@dataclass
class IntelReport:
    """Rapport d'intelligence global pour la session de trading."""
    zones: dict[str, ZoneIntel]
    watchlist: WatchlistIntel
    generated_at: str


def build_intel_report(
    zones: list[Zone],
    history_data: dict,
    signals_data: dict,
) -> IntelReport:
    """
    Construit le rapport d'intelligence complet en fusionnant toutes les sources.

    Ce rapport est ensuite consommé par le signal engine pour ajuster
    les probabilités de chaque marché.
    """
    watchlist = parse_signals(signals_data)
    zone_intels: dict[str, ZoneIntel] = {}

    for zone in zones:
        # 1. Vélocité
        vel = compute_velocity(history_data, zone.id)

        # 2. Signatures
        sigs = detect_signatures(zone.scores)
        active_sigs = [s for s in sigs if s.is_match]

        # 3. Watchlist
        wl_boost, wl_reason = watchlist_boost_for_zone(watchlist, zone.id, zone.keywords)

        # 4. Combinaison
        combined = 1.0
        reasons = []

        # Vélocité → ajustement
        if vel:
            if vel.composite_velocity > 0.15:
                vel_mult = 1.0 + min(vel.composite_velocity * 0.8, 0.4)
                combined *= vel_mult
                reasons.append(f"vélocité=+{vel.composite_velocity:.2f}/mois(×{vel_mult:.2f})")
            elif vel.composite_velocity < -0.1:
                vel_mult = max(1.0 + vel.composite_velocity * 0.5, 0.7)
                combined *= vel_mult
                reasons.append(f"vélocité={vel.composite_velocity:.2f}/mois(×{vel_mult:.2f})")

            # Ratio escalation/deescalation
            if vel.escalation_count > vel.deescalation_count + 2:
                combined *= 1.1
                reasons.append(f"escalations:{vel.escalation_count}vs{vel.deescalation_count}")

        # Signatures actives → ajustement
        if active_sigs:
            sig_labels = [s.label for s in active_sigs]
            combined *= 1.0 + min(len(active_sigs) * 0.05, 0.25)
            reasons.append(f"signatures:[{','.join(sig_labels)}]")

        # Watchlist
        if wl_boost > 1.0:
            combined *= wl_boost
            reasons.append(f"watchlist(×{wl_boost:.2f}):{wl_reason}")

        zone_intels[zone.id] = ZoneIntel(
            zone_id=zone.id,
            velocity=vel,
            signatures=sigs,
            watchlist_boost=wl_boost,
            watchlist_reason=wl_reason,
            combined_multiplier=min(combined, 2.0),
            reasoning=" | ".join(reasons) if reasons else "baseline",
        )

    return IntelReport(
        zones=zone_intels,
        watchlist=watchlist,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


# ═══════════════════════════════════════════════════════════════
# 5. CHARGEMENT DES DONNÉES
# ═══════════════════════════════════════════════════════════════

def load_history_local(project_root: str = ".") -> dict:
    """Charge semplice-history.json depuis le filesystem local."""
    path = Path(project_root) / "data" / "semplice-history.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


async def load_history_remote(base_url: str) -> dict:
    """Charge semplice-history.json depuis InflexionHub."""
    try:
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.get(f"{base_url}/data/semplice-history.json")
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning("Chargement semplice-history.json échoué: %s", e)
    return {}


async def load_signals_full(base_url: str) -> dict:
    """Charge signals.json complet (pas juste les articles)."""
    try:
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.get(f"{base_url}/data/signals.json")
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning("Chargement signals.json échoué: %s", e)
    return {}


def format_intel_summary(report: IntelReport) -> str:
    """Résumé formaté du rapport d'intelligence."""
    lines = [
        "",
        "╔══════════════════════════════════════════════════════════════╗",
        "║              INFLEXION INTELLIGENCE REPORT                  ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        f"  Sentiment global : {report.watchlist.sentiment_score:+.2f} ({report.watchlist.sentiment_label})",
        f"  Alertes urgentes : {report.watchlist.alerts_urgent}",
        f"  Weak signals     : {len(report.watchlist.weak_signals)}",
        f"  Cross-signals    : {len(report.watchlist.cross_signals)}",
        "",
    ]

    # Top zones par multiplicateur
    sorted_zones = sorted(report.zones.values(), key=lambda z: z.combined_multiplier, reverse=True)
    lines.append("  ZONES AVEC INTELLIGENCE ACTIVE :")
    lines.append(f"  {'─'*56}")

    for zi in sorted_zones:
        if zi.combined_multiplier <= 1.0:
            continue
        vel_str = ""
        if zi.velocity:
            vel_str = f"Δ={zi.velocity.composite_velocity:+.2f}/m"

        sigs_active = [s for s in zi.signatures if s.is_match]
        sig_str = f"SIG:[{','.join(s.sig_id for s in sigs_active)}]" if sigs_active else ""

        lines.append(
            f"  {zi.zone_id:15s} ×{zi.combined_multiplier:.2f}  {vel_str:12s} {sig_str}"
        )
        if zi.reasoning != "baseline":
            lines.append(f"    └ {zi.reasoning[:75]}")

    # Weak signals
    if report.watchlist.weak_signals:
        lines.append(f"\n  WEAK SIGNALS ({len(report.watchlist.weak_signals)}) :")
        for ws in report.watchlist.weak_signals[:3]:
            force = ws.get("force", "?")
            theme = ws.get("theme", "?")[:50]
            lines.append(f"    [{force:9s}] {theme}")

    lines.append(f"\n{'═'*64}")
    return "\n".join(lines)
