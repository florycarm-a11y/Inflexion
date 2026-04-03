"""Exécution des ordres sur Polymarket CLOB."""

import logging

from config import Config
from risk_manager import Order

logger = logging.getLogger("inflexion-bot")

BUY = "BUY"


def _import_clob():
    """Import lazy du client CLOB (évite l'erreur si non installé en dev)."""
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import OrderArgs, OrderType
    return ClobClient, OrderArgs, OrderType


def create_clob_client(cfg: Config):
    """Initialise le client CLOB avec authentification L2."""
    ClobClient, _, _ = _import_clob()
    client = ClobClient(
        cfg.clob_url,
        key=cfg.private_key,
        chain_id=cfg.chain_id,
        signature_type=cfg.signature_type,
        funder=cfg.wallet_address,
    )
    # Dériver ou récupérer les credentials API L2
    creds = client.create_or_derive_api_creds()
    client.set_api_creds(creds)
    logger.info("Client CLOB initialisé (wallet=%s)", cfg.wallet_address[:10] + "...")
    return client


def execute_orders(orders: list[Order], cfg: Config) -> list[dict]:
    """
    Soumet les ordres au CLOB Polymarket.

    En mode dry_run, affiche les ordres sans les soumettre.
    """
    results = []

    if cfg.dry_run:
        logger.info("MODE DRY RUN — aucun ordre réel soumis")
        for o in orders:
            result = {
                "status": "dry_run",
                "token_id": o.token_id,
                "side": o.side,
                "price": o.price,
                "size": o.size,
                "question": o.signal.market.market.question[:60],
            }
            results.append(result)
            logger.info("  [DRY] %s %s @ %.2f — $%.2f", o.side, o.signal.direction.value, o.price, o.size)
        return results

    # Mode réel
    _, OrderArgs, OrderType = _import_clob()
    client = create_clob_client(cfg)

    if not client.get_ok():
        logger.error("CLOB API indisponible")
        return [{"status": "error", "message": "CLOB API unreachable"}]

    for o in orders:
        try:
            order_args = OrderArgs(
                token_id=o.token_id,
                price=o.price,
                size=o.size,
                side=BUY,
            )
            signed_order = client.create_order(order_args)
            resp = client.post_order(signed_order, OrderType.GTC)

            result = {
                "status": "submitted",
                "response": resp,
                "token_id": o.token_id,
                "price": o.price,
                "size": o.size,
            }
            results.append(result)
            logger.info("ORDRE SOUMIS: %s @ %.2f — $%.2f → %s", o.signal.direction.value, o.price, o.size, resp)

        except Exception as e:
            result = {"status": "error", "error": str(e), "token_id": o.token_id}
            results.append(result)
            logger.error("ERREUR ordre %s: %s", o.token_id[:10], e)

    return results
