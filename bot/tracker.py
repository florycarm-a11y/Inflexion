"""
Position tracker — Suivi des positions ouvertes et P&L.

Persiste les positions dans un fichier JSON local.
"""

import json
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path

from risk_manager import Order

logger = logging.getLogger("inflexion-bot")

POSITIONS_FILE = Path(__file__).parent / "data" / "positions.json"


@dataclass
class Position:
    """Position ouverte sur un marché Polymarket."""
    id: str                      # condition_id du marché
    question: str
    zone_id: str
    zone_name: str
    direction: str               # BUY_YES / BUY_NO
    token_id: str
    entry_price: float           # prix d'entrée
    size_usd: float              # montant investi
    shares: float                # nombre de shares achetées
    semplice_prob: float         # probabilité estimée à l'entrée
    edge_at_entry: float         # edge en % à l'entrée
    event_type: str
    opened_at: str               # ISO timestamp
    status: str = "open"         # open / closed / expired
    exit_price: float = 0.0
    pnl_usd: float = 0.0
    closed_at: str = ""


def load_positions() -> list[Position]:
    """Charge les positions depuis le fichier JSON."""
    if not POSITIONS_FILE.exists():
        return []
    data = json.loads(POSITIONS_FILE.read_text())
    return [Position(**p) for p in data]


def save_positions(positions: list[Position]):
    """Sauvegarde les positions dans le fichier JSON."""
    POSITIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    POSITIONS_FILE.write_text(
        json.dumps([asdict(p) for p in positions], indent=2, ensure_ascii=False)
    )


def record_orders(orders: list[Order]) -> list[Position]:
    """Enregistre de nouveaux ordres comme positions ouvertes."""
    positions = load_positions()
    now = datetime.now(timezone.utc).isoformat()

    for o in orders:
        sig = o.signal
        shares = o.size / o.price if o.price > 0 else 0

        pos = Position(
            id=sig.market.market.condition_id,
            question=sig.market.market.question,
            zone_id=sig.market.zone.id,
            zone_name=sig.market.zone.name,
            direction=sig.direction.value,
            token_id=o.token_id,
            entry_price=o.price,
            size_usd=o.size,
            shares=round(shares, 4),
            semplice_prob=round(sig.semplice_prob, 4),
            edge_at_entry=round(sig.edge, 2),
            event_type=sig.event_type.value,
            opened_at=now,
        )
        positions.append(pos)
        logger.info("Position enregistrée: %s (%s) $%.2f", pos.question[:40], pos.direction, pos.size_usd)

    save_positions(positions)
    return positions


def update_positions(current_prices: dict[str, float]) -> list[Position]:
    """Met à jour les positions avec les prix actuels et calcule le P&L."""
    positions = load_positions()

    for pos in positions:
        if pos.status != "open":
            continue

        current = current_prices.get(pos.token_id)
        if current is None:
            continue

        # P&L non réalisé
        if pos.direction == "BUY_YES":
            pos.pnl_usd = round(pos.shares * current - pos.size_usd, 2)
        else:
            pos.pnl_usd = round(pos.shares * current - pos.size_usd, 2)

    save_positions(positions)
    return positions


def close_position(condition_id: str, exit_price: float) -> Position | None:
    """Ferme une position et calcule le P&L final."""
    positions = load_positions()
    now = datetime.now(timezone.utc).isoformat()

    for pos in positions:
        if pos.id == condition_id and pos.status == "open":
            pos.status = "closed"
            pos.exit_price = exit_price
            pos.closed_at = now
            pos.pnl_usd = round(pos.shares * exit_price - pos.size_usd, 2)
            save_positions(positions)
            logger.info("Position fermée: %s — P&L=$%.2f", pos.question[:40], pos.pnl_usd)
            return pos

    return None


def format_portfolio(positions: list[Position] | None = None) -> str:
    """Affiche le portfolio actuel."""
    if positions is None:
        positions = load_positions()

    if not positions:
        return "Aucune position enregistrée."

    open_pos = [p for p in positions if p.status == "open"]
    closed_pos = [p for p in positions if p.status == "closed"]

    lines = [
        "",
        "╔══════════════════════════════════════════════════════════════╗",
        "║                    PORTFOLIO TRACKER                        ║",
        "╚══════════════════════════════════════════════════════════════╝",
    ]

    if open_pos:
        lines.append(f"\n  POSITIONS OUVERTES ({len(open_pos)})")
        lines.append(f"  {'─'*58}")
        total_invested = 0
        total_pnl = 0

        for p in open_pos:
            lines.append(f"  {p.question[:50]}")
            lines.append(f"    {p.direction} | Zone: {p.zone_name} | Type: {p.event_type}")
            lines.append(f"    Entrée: ${p.size_usd:.2f} @ {p.entry_price:.2f} | "
                          f"SEMPLICE P={p.semplice_prob:.1%} | Edge={p.edge_at_entry:.0f}%")
            if p.pnl_usd != 0:
                lines.append(f"    P&L: ${p.pnl_usd:+.2f}")
            total_invested += p.size_usd
            total_pnl += p.pnl_usd

        lines.append(f"\n  Total investi: ${total_invested:.2f} | P&L: ${total_pnl:+.2f}")

    if closed_pos:
        lines.append(f"\n  POSITIONS FERMÉES ({len(closed_pos)})")
        lines.append(f"  {'─'*58}")
        total_pnl_closed = 0

        for p in closed_pos:
            pnl_pct = (p.pnl_usd / p.size_usd * 100) if p.size_usd > 0 else 0
            lines.append(f"  {'✓' if p.pnl_usd > 0 else '✗'} {p.question[:45]} → ${p.pnl_usd:+.2f} ({pnl_pct:+.0f}%)")
            total_pnl_closed += p.pnl_usd

        lines.append(f"\n  P&L réalisé: ${total_pnl_closed:+.2f}")

    lines.append(f"\n{'═'*64}")
    return "\n".join(lines)
