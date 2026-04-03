"""Configuration du bot Polymarket-SEMPLICE."""

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    # Polymarket
    clob_url: str = "https://clob.polymarket.com"
    gamma_url: str = "https://gamma-api.polymarket.com"
    private_key: str = field(default_factory=lambda: os.getenv("POLY_PRIVATE_KEY", ""))
    wallet_address: str = field(default_factory=lambda: os.getenv("POLY_WALLET_ADDRESS", ""))
    signature_type: int = field(default_factory=lambda: int(os.getenv("POLY_SIGNATURE_TYPE", "0")))
    chain_id: int = 137  # Polygon

    # Inflexion
    inflexion_url: str = field(
        default_factory=lambda: os.getenv("INFLEXION_BASE_URL", "https://inflexionhub.com")
    )

    # Anthropic (matching sémantique)
    anthropic_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))

    # Trading
    max_position_usd: float = field(
        default_factory=lambda: float(os.getenv("MAX_POSITION_USD", "50"))
    )
    max_total_exposure_usd: float = field(
        default_factory=lambda: float(os.getenv("MAX_TOTAL_EXPOSURE_USD", "500"))
    )
    min_edge_pct: float = field(
        default_factory=lambda: float(os.getenv("MIN_EDGE_PERCENT", "8"))
    )
    dry_run: bool = field(
        default_factory=lambda: os.getenv("DRY_RUN", "true").lower() == "true"
    )

    # Gamma API tags
    geo_tag_id: int = 100265
    politics_tag_id: int = 2
    finance_tag_id: int = 120

    # Polymarket categories à scanner
    @property
    def target_tags(self) -> list[int]:
        return [self.geo_tag_id, self.politics_tag_id, self.finance_tag_id]
