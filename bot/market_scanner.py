"""Scanne les marchés Polymarket et les matche aux zones SEMPLICE."""

import json
import logging
import os
import re
import subprocess
from dataclasses import dataclass
from urllib.parse import urlencode, urlparse

import httpx

from config import Config
from semplice_loader import Zone

logger = logging.getLogger("inflexion-bot")
_HEADERS = {"User-Agent": "InflexionBot/1.0"}

# --- Filtrage anti faux-positifs ---

# Patterns de marchés non-géopolitiques à ignorer entièrement
_SKIP_PATTERNS: list[re.Pattern] = [re.compile(p, re.IGNORECASE) for p in [
    r"nobel\s*prize", r"grammy", r"oscar", r"emmy",
    r"super\s*bowl", r"\bNFL\b", r"\bNBA\b", r"\bMLB\b", r"premier\s*league",
    r"\bGTA\b", r"video\s*game", r"\bmovie\b", r"\bTV\s*show\b",
    r"\balbum\b", r"\bsong\b",
    r"weather\s+in\b", r"\btemperature\b",
    r"\bcelebrity\b", r"\bdating\b", r"\bmarried\b",
    r"sports?\s+outcome", r"\bboxing\b", r"\bUFC\b", r"\bMMA\b",
    r"\bWorld\s*Series\b", r"\bStanley\s*Cup\b", r"\bWorld\s*Cup\b",
    r"\btennis\b", r"\bgolf\b", r"\bFormula\s*1\b", r"\bF1\b",
    r"\bnobel\b", r"\bprimary\s+election\b",
    # Marchés boursiers/financiers domestiques sans angle géopolitique
    r"\bS&P\s*500\b.*(?:losing|winning|streak|record|close|open|rally)",
    r"\b(?:Dow|Nasdaq|Russell)\b.*(?:streak|record|close|rally)",
    # Indices de luxe / collectibles
    r"\b(?:Patek|Rolex|Hermès)\s+Index\b",
    # Politique intérieure US (primaires, midterms, runoffs locaux)
    r"\b(?:Republican|Democrat(?:ic)?)\s+(?:Primary|Runoff|Caucus|Nomination)\b",
    r"\b(?:Texas|Florida|Ohio|Georgia|Arizona|Michigan|Pennsylvania)\s+(?:Senate|Governor|Primary|Runoff)\b",
]]

# Signaux positifs (géopolitique, politique, économie, finance)
_GEO_POSITIVE = re.compile(
    r"\b(?:sanctions?|war|election|president|GDP|inflation|tariff|military"
    r"|ceasefire|treaty|embargo|coup|crisis|invasion|nuclear|missile"
    r"|government|minister|parliament|congress|senate|diplomacy"
    r"|geopoliti|sovereignty|occupation|blockade|offensive|drone strike"
    r"|central\s*bank|interest\s*rate|recession|trade\s*war|currency"
    r"|oil\s*price|energy\s*crisis|nato|OPEC)\b",
    re.IGNORECASE,
)

# Signaux négatifs (divertissement, sport, culture pop)
_GEO_NEGATIVE = re.compile(
    r"\b(?:Nobel\s*Prize|Oscar|Grammy|Super\s*Bowl|GTA|album|movie"
    r"|dating|reality\s*TV|box\s*office|streaming|concert|tour"
    r"|championship|playoff|touchdown|home\s*run|slam\s*dunk)\b",
    re.IGNORECASE,
)

# Contexte US domestique (sans angle international → pas géopolitique pour nous)
_US_DOMESTIC = re.compile(
    r"\b(?:Republican|Democrat(?:ic)?|GOP|Senate\s+race|House\s+race"
    r"|midterm|primary\s+runoff|gubernatorial|state\s+legislature"
    r"|S&P\s*500|Dow\s*Jones|Nasdaq\s+composite|Russell\s+2000)\b",
    re.IGNORECASE,
)

# Mots-clés qui rendent un marché US internationalement pertinent
_US_INTERNATIONAL = re.compile(
    r"\b(?:tariff|sanctions?|trade\s*war|NATO|China|Russia|Iran|Ukraine"
    r"|foreign\s+policy|military|missile|nuclear|embargo|invasion"
    r"|diplomacy|geopoliti|BRICS|OPEC)\b",
    re.IGNORECASE,
)

# Liste de noms de pays/régions pour détecter un contexte géopolitique
_COUNTRY_NAMES = re.compile(
    r"\b(?:China|Russia|Iran|Ukraine|Taiwan|India|Brazil|Turkey|Cuba|Mexico"
    r"|Vietnam|Ethiopia|Madagascar|Singapore|Greenland|Arctic|Sahel|Mali"
    r"|Niger|Burkina|Israel|Palestine|Gaza|Syria|Iraq|Afghanistan|Pakistan"
    r"|North\s*Korea|South\s*Korea|Japan|Saudi|Egypt|Libya|Venezuela"
    r"|United\s*States|U\.?S\.?A\.?|EU|Europe|NATO|BRICS)\b",
    re.IGNORECASE,
)


def _is_geopolitical(question: str) -> bool:
    """Vérifie si la question est probablement géopolitique/politique/économique.

    Retourne False pour les marchés clairement hors-sujet (divertissement, sport,
    culture pop, marchés boursiers domestiques sans dimension géopolitique).
    """
    has_negative = bool(_GEO_NEGATIVE.search(question))
    has_positive = bool(_GEO_POSITIVE.search(question))
    has_country = bool(_COUNTRY_NAMES.search(question))

    if has_negative and not has_positive and not has_country:
        return False

    # Si aucun signal positif ni nom de pays/région, probablement pas géopolitique
    if not has_positive and not has_country:
        return False

    # Filtre US-domestique : si le marché a un contexte purement américain
    # (S&P 500, primaire républicaine, etc.) sans angle international, on skip
    if bool(_US_DOMESTIC.search(question)) and not bool(_US_INTERNATIONAL.search(question)):
        return False

    return True


_USE_CURL = os.environ.get("POLY_USE_CURL", "0") == "1"

# --- DNS bypass pour contourner le blocage OpenDNS/Cisco Umbrella ---
# Si le DNS local bloque gamma-api.polymarket.com, on résout via DoH
# et on force l'IP réelle dans les requêtes.
_DNS_OVERRIDE = os.environ.get("POLY_DNS_OVERRIDE", "")  # ex: "172.64.153.51"
_PROXY = os.environ.get("POLY_PROXY", "")  # ex: "socks5://127.0.0.1:1080"
_GAMMA_HOST = "gamma-api.polymarket.com"

_resolved_ip: str | None = None


def _resolve_via_doh() -> str | None:
    """Résout l'IP réelle via DNS-over-HTTPS (Google) pour contourner un blocage DNS local."""
    try:
        result = subprocess.run(
            ["curl", "-s", "--max-time", "5",
             f"https://dns.google/resolve?name={_GAMMA_HOST}&type=A"],
            capture_output=True, text=True, timeout=8,
        )
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout)
            for answer in data.get("Answer", []):
                if answer.get("type") == 1:  # A record
                    ip = answer["data"]
                    logger.info("DoH: %s → %s", _GAMMA_HOST, ip)
                    return ip
    except Exception as e:
        logger.debug("DoH resolution échouée: %s", e)
    return None


def _get_resolved_ip() -> str | None:
    """Retourne l'IP résolue (cache après premier appel)."""
    global _resolved_ip
    if _DNS_OVERRIDE:
        return _DNS_OVERRIDE
    if _resolved_ip is not None:
        return _resolved_ip if _resolved_ip else None
    _resolved_ip = _resolve_via_doh() or ""
    return _resolved_ip if _resolved_ip else None


def _needs_dns_bypass(url: str) -> bool:
    """Vérifie si l'URL cible le host bloqué."""
    return _GAMMA_HOST in url


async def _fetch_json(url: str, params: dict | None = None) -> list | dict | None:
    """Fetch JSON avec contournement DNS et fallback curl."""
    if params:
        url = f"{url}?{urlencode(params)}"

    needs_bypass = _needs_dns_bypass(url)
    resolved_ip = _get_resolved_ip() if needs_bypass else None

    if _USE_CURL or (needs_bypass and resolved_ip):
        try:
            cmd = ["curl", "-s", "--max-time", "15"]
            if resolved_ip and needs_bypass:
                cmd += ["--resolve", f"{_GAMMA_HOST}:443:{resolved_ip}"]
            if _PROXY:
                cmd += ["--proxy", _PROXY]
            cmd.append(url)
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=20,
            )
            if result.returncode == 0 and result.stdout.strip():
                return json.loads(result.stdout)
            logger.warning("curl: code=%d, stderr=%s", result.returncode,
                           result.stderr[:200] if result.stderr else "")
        except Exception as e:
            logger.warning("curl fallback échoué: %s", e)
            if _USE_CURL:
                return None

    # httpx path — proxy ou transport custom si bypass nécessaire
    client_kwargs: dict = {"timeout": 20, "verify": True, "headers": _HEADERS}
    if _PROXY:
        client_kwargs["proxy"] = _PROXY
    if needs_bypass and resolved_ip and not _PROXY:
        # Force la résolution DNS dans httpx via transport custom
        transport = httpx.AsyncHTTPTransport(
            verify=True,
            local_address=None,
        )
        # httpx ne supporte pas --resolve nativement, on réécrit l'URL
        # avec l'IP et on passe le Host header
        parsed = urlparse(url)
        rewritten = url.replace(f"https://{_GAMMA_HOST}", f"https://{resolved_ip}")
        headers = {**_HEADERS, "Host": _GAMMA_HOST}
        async with httpx.AsyncClient(timeout=20, verify=False, headers=headers) as client:
            try:
                resp = await client.get(rewritten)
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("httpx (IP directe): status=%d", resp.status_code)
            except Exception as e:
                logger.warning("httpx (IP directe) échoué: %s", e)
        return None

    async with httpx.AsyncClient(**client_kwargs) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
            logger.warning("httpx: status=%d", resp.status_code)
        except Exception as e:
            logger.warning("httpx échoué: %s", e)
    return None


@dataclass
class PolyMarket:
    """Un marché Polymarket avec ses tokens YES/NO."""
    condition_id: str
    question: str
    slug: str
    end_date: str
    active: bool
    closed: bool
    tokens: list[dict]       # [{token_id, outcome, price}]
    volume: float
    liquidity: float
    tags: list[str]
    image: str = ""
    description: str = ""


@dataclass
class MatchedMarket:
    """Marché Polymarket associé à une zone SEMPLICE."""
    market: PolyMarket
    zone: Zone
    match_score: float        # 0-1, confiance du matching
    matched_keywords: list[str]


async def fetch_markets(cfg: Config) -> list[PolyMarket]:
    """Récupère les marchés ouverts depuis la Gamma API par tags cibles."""
    markets: list[PolyMarket] = []
    seen_ids: set[str] = set()

    for tag_id in cfg.target_tags:
        params = {
            "tag_id": str(tag_id),
            "closed": "false",
            "active": "true",
            "order": "liquidity",
            "ascending": "false",
            "limit": "100",
        }
        data = await _fetch_json(f"{cfg.gamma_url}/markets", params)
        if not data:
            continue

        for m in (data if isinstance(data, list) else []):
            # Gamma API retourne du camelCase
            cid = m.get("conditionId", "") or m.get("condition_id", "")
            if not cid or cid in seen_ids:
                continue
            seen_ids.add(cid)

            # Tokens : construire depuis outcomePrices + clobTokenIds + outcomes
            tokens = []
            outcomes = m.get("outcomes", [])
            if isinstance(outcomes, str):
                outcomes = json.loads(outcomes) if outcomes else []
            prices_raw = m.get("outcomePrices", [])
            if isinstance(prices_raw, str):
                prices_raw = json.loads(prices_raw) if prices_raw else []
            clob_ids_raw = m.get("clobTokenIds", "")
            if isinstance(clob_ids_raw, str) and clob_ids_raw.startswith("["):
                clob_ids = json.loads(clob_ids_raw)
            elif isinstance(clob_ids_raw, str):
                clob_ids = clob_ids_raw.split(",") if clob_ids_raw else []
            else:
                clob_ids = clob_ids_raw or []

            for idx, outcome in enumerate(outcomes):
                price = float(prices_raw[idx]) if idx < len(prices_raw) else 0.0
                token_id = clob_ids[idx].strip() if idx < len(clob_ids) else ""
                tokens.append({"token_id": token_id, "outcome": outcome, "price": price})

            # Fallback : ancien format avec tokens array
            if not tokens:
                for t in m.get("tokens", []):
                    tokens.append({
                        "token_id": t.get("token_id", ""),
                        "outcome": t.get("outcome", ""),
                        "price": float(t.get("price", 0)),
                    })

            end_date = m.get("endDateIso", "") or m.get("endDate", "") or m.get("end_date_iso", "")

            # Tags depuis events[].tags ou tags direct
            tags = []
            for ev in (m.get("events") or []):
                tags.extend(ev.get("tags", "").split(",") if isinstance(ev.get("tags"), str) else [])

            markets.append(PolyMarket(
                condition_id=cid,
                question=m.get("question", ""),
                slug=m.get("slug", ""),
                end_date=end_date,
                active=m.get("active", False),
                closed=m.get("closed", False),
                tokens=tokens,
                volume=float(m.get("volumeNum", 0) or m.get("volume", 0) or 0),
                liquidity=float(m.get("liquidityNum", 0) or m.get("liquidity", 0) or 0),
                tags=tags,
                image=m.get("image", ""),
                description=m.get("description", ""),
            ))

    return markets


# Keywords courts ou génériques qui nécessitent un match exact (word boundary)
# même s'ils font > 3 caractères — évite "modi" ∈ "commodity", "amazon" ∈ Amazon Inc, etc.
_BOUNDARY_KEYWORDS = frozenset([
    "modi", "coup", "amazon", "oil", "gas", "war", "prc", "lula", "amlo",
    "inde", "cuba", "niger", "mali", "china", "japan", "india", "brazil",
])


# Noms courts de pays/zones qui sont fiables même en match unique
_TRUSTED_SHORT_NAMES = frozenset([
    "cuba", "iran", "mali", "inde", "peru", "iraq", "laos", "chad", "fiji",
])


def _kw_matches(keyword: str, text: str) -> bool:
    """Vérifie si un keyword matche dans le texte, avec word boundaries pour les courts/génériques."""
    kw_lower = keyword.lower()
    if len(kw_lower) <= 3 or kw_lower in _BOUNDARY_KEYWORDS:
        return bool(re.search(r"\b" + re.escape(kw_lower) + r"\b", text))
    return kw_lower in text


def match_markets_to_zones(markets: list[PolyMarket], zones: list[Zone]) -> list[MatchedMarket]:
    """Match les marchés Polymarket aux zones SEMPLICE par mots-clés."""
    matched: list[MatchedMarket] = []

    for market in markets:
        text = f"{market.question} {market.description}".lower()
        full_text = f"{market.question} {market.description}"

        # 1. Blacklist : ignorer les marchés non-géopolitiques
        if any(pat.search(full_text) for pat in _SKIP_PATTERNS):
            logger.debug("Skip (blacklist): %s", market.question[:80])
            continue

        # 2. Filtre géopolitique
        if not _is_geopolitical(full_text):
            logger.debug("Skip (non-géo): %s", market.question[:80])
            continue

        best_zone = None
        best_score = 0.0
        best_keywords: list[str] = []

        for zone in zones:
            hits = [kw for kw in zone.keywords if _kw_matches(kw, text)]
            if not hits:
                continue

            # Qualité minimum : 2 hits OU 1 hit avec keyword >= 5 chars
            # OU 1 hit qui est un nom de pays/zone reconnu (cuba, iran, mali, etc.)
            max_hit_len = max(len(kw) for kw in hits)
            has_zone_name = any(kw.lower() in _TRUSTED_SHORT_NAMES for kw in hits)
            if len(hits) < 2 and max_hit_len < 5 and not has_zone_name:
                continue

            # Score = nombre de keywords matchés / total, pondéré par spécificité
            score = len(hits) / len(zone.keywords)
            # Bonus si le nom de la zone apparaît directement
            if zone.name.lower() in text or zone.id.lower() in text:
                score = min(score + 0.3, 1.0)

            if score > best_score:
                best_score = score
                best_zone = zone
                best_keywords = hits

        # Seuil minimum de score (0.10 = au moins ~1 keyword sur 10)
        if best_zone and best_score >= 0.10:
            matched.append(MatchedMarket(
                market=market,
                zone=best_zone,
                match_score=best_score,
                matched_keywords=best_keywords,
            ))

    # Trier par confiance de matching décroissante
    matched.sort(key=lambda m: m.match_score, reverse=True)
    return matched
