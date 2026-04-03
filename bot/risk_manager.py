"""Gestion du risque : position sizing, limites d'exposition, Kelly criterion."""

from dataclasses import dataclass

from config import Config
from signal_engine import Signal, Direction


@dataclass
class Order:
    """Ordre prêt à être soumis au CLOB."""
    token_id: str
    side: str              # "BUY"
    price: float           # prix limit (0-1)
    size: float            # montant en USD
    signal: Signal
    kelly_fraction: float


def kelly_size(prob: float, price: float) -> float:
    """
    Calcule la fraction de Kelly pour le sizing optimal.

    f* = (p * b - q) / b
    où p = probabilité estimée, q = 1 - p, b = odds = (1/price) - 1
    """
    if price <= 0 or price >= 1:
        return 0.0
    b = (1 / price) - 1  # payout odds
    q = 1 - prob
    f = (prob * b - q) / b
    return max(0.0, f)


def size_positions(signals: list[Signal], cfg: Config) -> list[Order]:
    """
    Calcule le sizing pour chaque signal en respectant les limites de risque.

    Utilise un demi-Kelly pour être conservateur (Kelly/2).
    """
    orders: list[Order] = []
    total_exposure = 0.0

    for sig in signals:
        if total_exposure >= cfg.max_total_exposure_usd:
            break

        # Déterminer le token et le prix
        if sig.direction == Direction.BUY_YES:
            token = next((t for t in sig.market.market.tokens if t["outcome"] == "Yes"), None)
        elif sig.direction == Direction.BUY_NO:
            token = next((t for t in sig.market.market.tokens if t["outcome"] == "No"), None)
        else:
            continue

        if not token:
            continue

        price = token["price"]
        if price <= 0.01 or price >= 0.99:
            continue

        # Kelly sizing (demi-Kelly = conservateur)
        kf = kelly_size(sig.semplice_prob if sig.direction == Direction.BUY_YES else 1 - sig.semplice_prob, price)
        half_kelly = kf * 0.5

        if half_kelly <= 0.01:
            continue

        # Appliquer les limites
        raw_size = half_kelly * cfg.max_total_exposure_usd
        position_size = min(raw_size, cfg.max_position_usd)
        position_size = min(position_size, cfg.max_total_exposure_usd - total_exposure)

        if position_size < 1.0:  # minimum 1 USD
            continue

        total_exposure += position_size

        orders.append(Order(
            token_id=token["token_id"],
            side="BUY",
            price=round(price, 2),
            size=round(position_size, 2),
            signal=sig,
            kelly_fraction=half_kelly,
        ))

    return orders


def format_order_summary(orders: list[Order]) -> str:
    """Résumé lisible des ordres générés."""
    if not orders:
        return "Aucun ordre généré (pas d'edge suffisant)."

    lines = [f"{'='*70}", f"  ORDRES GÉNÉRÉS ({len(orders)})", f"{'='*70}"]
    total = 0.0

    for i, o in enumerate(orders, 1):
        sig = o.signal
        zone = sig.market.zone
        lines.append(f"\n  [{i}] {sig.market.market.question[:60]}...")
        lines.append(f"      Zone SEMPLICE : {zone.name} (Risque={zone.composite:.1f} | Opp={zone.opp_composite:.1f})")
        lines.append(f"      Direction     : {sig.direction.value}")
        lines.append(f"      Prix Poly     : {sig.poly_price:.2f} → Prob SEMPLICE : {sig.semplice_prob:.2f}")
        lines.append(f"      Edge          : {sig.edge:.1f}%  |  Confiance : {sig.confidence:.2f}")
        lines.append(f"      Sizing        : ${o.size:.2f} @ {o.price:.2f} (Kelly/2={o.kelly_fraction:.3f})")
        lines.append(f"      Raisonnement  : {sig.reasoning}")
        total += o.size

    lines.append(f"\n{'─'*70}")
    lines.append(f"  Exposition totale : ${total:.2f}")
    lines.append(f"{'='*70}")
    return "\n".join(lines)
