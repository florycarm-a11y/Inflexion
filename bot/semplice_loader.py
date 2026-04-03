"""Charge les données SEMPLICE depuis InflexionHub ou le filesystem local."""

import json
import re
from dataclasses import dataclass
from pathlib import Path

import httpx

RISK_DIMS = ["Social", "Économique", "Militaire", "Politique", "Légal", "Information", "Cyber", "Environnemental"]
OPP_DIMS = ["Capital humain", "Croissance", "Sécurité", "Gouvernance", "Attract. juridique", "Innovation", "Maturité tech", "Durabilité"]

RISK_WEIGHTS = [0.12, 0.15, 0.16, 0.14, 0.10, 0.12, 0.11, 0.10]  # S E M P L I C Ee
OPP_WEIGHTS = [0.12, 0.17, 0.07, 0.14, 0.13, 0.15, 0.12, 0.10]   # So Eo Mo Po Lo Io Co Eeo


@dataclass
class Zone:
    id: str
    name: str
    scores: list[float]       # 8 risk scores (1-7)
    composite: float           # weighted risk composite
    opp: list[float]           # 8 opportunity scores (1-7)
    opp_composite: float       # weighted opportunity composite
    keywords: list[str]        # mots-clés pour matching Polymarket
    region: str = ""
    href: str = ""


# Mots-clés de matching par zone SEMPLICE → marchés Polymarket
ZONE_KEYWORDS: dict[str, list[str]] = {
    "ormuz": ["iran", "hormuz", "ormuz", "strait", "persian gulf", "golfe persique", "détroit", "oil tanker", "pétrolier"],
    "sahel": ["sahel", "mali", "niger", "burkina", "faso", "wagner", "junta", "coup", "afrique ouest", "west africa"],
    "ukraine": ["ukraine", "russia", "kyiv", "kiev", "crimea", "donbas", "zelensky", "zelenskyy", "putin", "nato expansion"],
    "iran": ["iran", "tehran", "téhéran", "khamenei", "nuclear", "nucléaire", "jcpoa", "sanctions iran", "raisi"],
    "cuba": ["cuba", "havana", "havane", "castro", "embargo cuba"],
    "chine": ["china", "chine", "beijing", "pékin", "xi jinping", "taiwan", "south china sea", "mer de chine", "prc"],
    "madagascar": ["madagascar", "antananarivo", "malagasy"],
    "turquie": ["turkey", "turquie", "türkiye", "erdogan", "ankara", "istanbul", "bosphorus"],
    "inde": ["india", "inde", "modi", "new delhi", "mumbai", "hindu", "kashmir"],
    "bresil": ["brazil", "brésil", "brasil", "lula", "brasilia", "bolsonaro", "amazon"],
    "tamil-nadu": ["tamil nadu", "chennai", "dravidian", "south india"],
    "arctique": ["arctic", "arctique", "greenland", "groenland", "svalbard", "north pole", "pôle nord", "northwest passage"],
    "ile-maurice": ["mauritius", "maurice", "port louis"],
    "singapour": ["singapore", "singapour", "asean hub"],
    "rep-tcheque": ["czech", "tchèque", "prague", "czechia"],
    "mexique": ["mexico", "mexican", "mexique", "amlo", "sheinbaum", "cartel", "border wall", "usmca"],
    "vietnam": ["vietnam", "hanoi", "ho chi minh", "saigon", "mekong"],
    "ethiopie": ["ethiopia", "éthiopie", "addis ababa", "tigray", "abiy ahmed"],
}


def _parse_js_config(js_text: str) -> list[dict]:
    """Parse le fichier semplice-zones-config.js en données structurées."""
    # Extraire le contenu du tableau SEMPLICE_ZONES
    match = re.search(r"SEMPLICE_ZONES\s*=\s*(\[[\s\S]*?\]);", js_text)
    if not match:
        raise ValueError("SEMPLICE_ZONES non trouvé dans le fichier config")

    raw = match.group(1)
    # Convertir la syntaxe JS → JSON valide
    raw = re.sub(r"//.*", "", raw)                    # supprimer commentaires
    raw = re.sub(r"(\w+)\s*:", r'"\1":', raw)         # clés sans quotes → quotes
    raw = re.sub(r",\s*([}\]])", r"\1", raw)          # trailing commas
    raw = raw.replace("'", '"')                        # single → double quotes

    return json.loads(raw)


def load_from_local(project_root: str = ".") -> list[Zone]:
    """Charge SEMPLICE depuis le filesystem local (dev)."""
    config_path = Path(project_root) / "semplice-zones-config.js"
    if not config_path.exists():
        raise FileNotFoundError(f"{config_path} introuvable")

    zones_data = _parse_js_config(config_path.read_text(encoding="utf-8"))
    return _build_zones(zones_data)


async def load_from_remote(base_url: str = "https://inflexionhub.com") -> list[Zone]:
    """Charge SEMPLICE depuis InflexionHub (production)."""
    url = f"{base_url}/semplice-zones-config.js"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    zones_data = _parse_js_config(resp.text)
    return _build_zones(zones_data)


def _build_zones(zones_data: list[dict]) -> list[Zone]:
    zones = []
    for z in zones_data:
        zone_id = z.get("id", "")
        zones.append(Zone(
            id=zone_id,
            name=z.get("name", zone_id),
            scores=z.get("scores", [0] * 8),
            composite=z.get("composite", 0),
            opp=z.get("opp", [0] * 8),
            opp_composite=z.get("oppComposite", 0),
            keywords=ZONE_KEYWORDS.get(zone_id, [zone_id]),
            region=z.get("region", ""),
            href=z.get("href", ""),
        ))
    return zones


async def load_signals(base_url: str = "https://inflexionhub.com") -> list[dict]:
    """Charge les signaux de veille continue (watchlist détections)."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{base_url}/data/signals.json")
        if resp.status_code == 200:
            return resp.json()
    return []


async def load_insights(base_url: str = "https://inflexionhub.com") -> list[dict]:
    """Charge les insights filtrés (articles scorés ≥6/10)."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{base_url}/data/insights.json")
        if resp.status_code == 200:
            data = resp.json()
            return data if isinstance(data, list) else data.get("articles", [])
    return []
