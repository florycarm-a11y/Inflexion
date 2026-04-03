"""Marchés Polymarket simulés pour tester le pipeline sans accès réseau.

Basés sur des marchés réels Polymarket (géopolitique, politique, finance).
Les prix YES reflètent des probabilités de marché typiques.
"""

from market_scanner import PolyMarket

MOCK_MARKETS: list[PolyMarket] = [
    # -- Ormuz / Iran --
    PolyMarket(
        condition_id="mock-ormuz-1",
        question="Will Iran close the Strait of Hormuz before 2027?",
        slug="iran-close-strait-hormuz-2027",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-ormuz-yes", "outcome": "Yes", "price": 0.12},
            {"token_id": "tok-ormuz-no", "outcome": "No", "price": 0.88},
        ],
        volume=850_000, liquidity=120_000,
        tags=["Geopolitics"],
    ),
    PolyMarket(
        condition_id="mock-iran-nuke-1",
        question="Will Iran test a nuclear weapon in 2026?",
        slug="iran-nuclear-weapon-2026",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-iran-nuke-yes", "outcome": "Yes", "price": 0.08},
            {"token_id": "tok-iran-nuke-no", "outcome": "No", "price": 0.92},
        ],
        volume=2_100_000, liquidity=340_000,
        tags=["Geopolitics"],
    ),
    # -- Ukraine --
    PolyMarket(
        condition_id="mock-ukraine-1",
        question="Will there be a ceasefire in Ukraine before October 2026?",
        slug="ukraine-ceasefire-oct-2026",
        end_date="2026-10-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-ukr-cease-yes", "outcome": "Yes", "price": 0.22},
            {"token_id": "tok-ukr-cease-no", "outcome": "No", "price": 0.78},
        ],
        volume=5_400_000, liquidity=890_000,
        tags=["Geopolitics", "Politics"],
    ),
    PolyMarket(
        condition_id="mock-ukraine-2",
        question="Will Russia launch a major offensive in Eastern Ukraine in Q2 2026?",
        slug="russia-offensive-ukraine-q2-2026",
        end_date="2026-07-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-ukr-off-yes", "outcome": "Yes", "price": 0.45},
            {"token_id": "tok-ukr-off-no", "outcome": "No", "price": 0.55},
        ],
        volume=1_200_000, liquidity=200_000,
        tags=["Geopolitics"],
    ),
    # -- Chine / Taiwan --
    PolyMarket(
        condition_id="mock-china-tw-1",
        question="Will China impose a blockade on Taiwan before 2028?",
        slug="china-blockade-taiwan-2028",
        end_date="2028-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-tw-block-yes", "outcome": "Yes", "price": 0.06},
            {"token_id": "tok-tw-block-no", "outcome": "No", "price": 0.94},
        ],
        volume=3_800_000, liquidity=520_000,
        tags=["Geopolitics"],
    ),
    PolyMarket(
        condition_id="mock-china-sanctions",
        question="Will the US impose new sanctions on China in 2026?",
        slug="us-sanctions-china-2026",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-cn-sanc-yes", "outcome": "Yes", "price": 0.72},
            {"token_id": "tok-cn-sanc-no", "outcome": "No", "price": 0.28},
        ],
        volume=1_500_000, liquidity=300_000,
        tags=["Geopolitics", "Finance"],
    ),
    # -- Turquie --
    PolyMarket(
        condition_id="mock-turkey-1",
        question="Will Erdogan still be president of Turkey at end of 2026?",
        slug="erdogan-president-2026",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-erdo-yes", "outcome": "Yes", "price": 0.85},
            {"token_id": "tok-erdo-no", "outcome": "No", "price": 0.15},
        ],
        volume=420_000, liquidity=80_000,
        tags=["Politics"],
    ),
    # -- Arctique --
    PolyMarket(
        condition_id="mock-arctic-1",
        question="Will the US acquire or gain control of Greenland by 2028?",
        slug="us-greenland-2028",
        end_date="2028-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-green-yes", "outcome": "Yes", "price": 0.09},
            {"token_id": "tok-green-no", "outcome": "No", "price": 0.91},
        ],
        volume=980_000, liquidity=150_000,
        tags=["Geopolitics", "Politics"],
    ),
    # -- Sahel --
    PolyMarket(
        condition_id="mock-sahel-1",
        question="Will there be a coup in a Sahel country (Mali, Niger, Burkina Faso) in 2026?",
        slug="sahel-coup-2026",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-sahel-coup-yes", "outcome": "Yes", "price": 0.35},
            {"token_id": "tok-sahel-coup-no", "outcome": "No", "price": 0.65},
        ],
        volume=180_000, liquidity=30_000,
        tags=["Geopolitics"],
    ),
    # -- Brésil --
    PolyMarket(
        condition_id="mock-brazil-1",
        question="Will Brazil's GDP growth exceed 3% in 2026?",
        slug="brazil-gdp-3pct-2026",
        end_date="2027-03-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-br-gdp-yes", "outcome": "Yes", "price": 0.38},
            {"token_id": "tok-br-gdp-no", "outcome": "No", "price": 0.62},
        ],
        volume=320_000, liquidity=55_000,
        tags=["Finance"],
    ),
    # -- Cuba --
    PolyMarket(
        condition_id="mock-cuba-1",
        question="Will the US lift the embargo on Cuba before 2028?",
        slug="us-lift-embargo-cuba-2028",
        end_date="2028-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-cuba-emb-yes", "outcome": "Yes", "price": 0.04},
            {"token_id": "tok-cuba-emb-no", "outcome": "No", "price": 0.96},
        ],
        volume=95_000, liquidity=15_000,
        tags=["Geopolitics", "Politics"],
    ),
    # -- Mexique --
    PolyMarket(
        condition_id="mock-mexico-1",
        question="Will the US impose 25% tariffs on all Mexican imports in 2026?",
        slug="us-tariffs-mexico-2026",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-mex-tar-yes", "outcome": "Yes", "price": 0.55},
            {"token_id": "tok-mex-tar-no", "outcome": "No", "price": 0.45},
        ],
        volume=1_800_000, liquidity=280_000,
        tags=["Finance", "Politics"],
    ),
    # -- Inde --
    PolyMarket(
        condition_id="mock-india-1",
        question="Will India become the 3rd largest economy by GDP in 2026?",
        slug="india-3rd-largest-gdp-2026",
        end_date="2027-01-01",
        active=True, closed=False,
        tokens=[
            {"token_id": "tok-ind-gdp-yes", "outcome": "Yes", "price": 0.62},
            {"token_id": "tok-ind-gdp-no", "outcome": "No", "price": 0.38},
        ],
        volume=450_000, liquidity=70_000,
        tags=["Finance"],
    ),
]
