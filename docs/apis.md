# APIs de la plateforme Inflexion

Quinze sources de données alimentent le pipeline (`scripts/fetch-data.mjs`) et les pages de marché.

## Avec clé d'API

| Service | Usage |
|---|---|
| Finnhub | cotations actions et ETF |
| GNews | flux d'actualité |
| FRED | séries macroéconomiques (Réserve fédérale) |
| Alpha Vantage | séries de marché |
| Messari | données crypto |
| Twelve Data | séries de marché |
| NewsAPI | flux d'actualité |

## Sans clé

| Service | Usage |
|---|---|
| CoinGecko | cours crypto |
| Alternative.me | indice Fear & Greed |
| DefiLlama | TVL DeFi |
| metals.dev | métaux précieux |
| Etherscan | données on-chain Ethereum |
| Mempool.space | données on-chain Bitcoin |
| ECB Data | taux de change (Banque centrale européenne) |
| World Bank | indicateurs de développement |

## Pièges connus

- **ETF vs indices** : Finnhub renvoie des prix d'**ETF** (SPY, QQQ), pas des niveaux d'indice. Ne pas présenter un cours de SPY comme la valeur du S&P 500.
- Le bot Polymarket utilise l'API Gamma, avec contournement DNS par DoH et clés en camelCase — voir les docstrings de `bot/`.
