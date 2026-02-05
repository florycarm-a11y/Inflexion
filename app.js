// Inflexion — v4.3 — Expanded content + 2 new analyses + layout fix
// Updated: 5 février 2026

const categoryTrends = {
    geopolitics: 'Le risk-off domine. Les tarifs Groenland ont déclenché le pire sell-off depuis octobre sur le S&P 500 (−2,1%). Le TACO pattern (Trump Always Chickens Out) se confirme avec la pause du 22 janvier, mais le taux effectif moyen des tarifs US atteint 10,1% — plus haut depuis 1946. La nomination de Warsh à la Fed ajoute une couche d\'incertitude monétaire. En parallèle, la guerre des puces IA s\'intensifie : les USA contrôlent 74% de la puissance de calcul IA mondiale vs 14% pour la Chine, et les restrictions d\'export Nvidia restent imprévisibles. Le WEF classe la confrontation géoéconomique comme risque #1 mondial. Positionnement : long gold, short duration, sous-pondération Europe.',
    markets: 'Régime de volatilité élevée dominé par deux forces : risque tarifaire et boom IA. Le VIX repasse au-dessus de 20. Le Magnificent 7 pèse >30% du S&P 500 — sans ces 7 titres, l\'indice serait négatif YTD. Nvidia ($57Mds de CA au Q3, +62% YoY) reste le seul pilier haussier crédible. Côté emploi, « hiring recession » confirmée : seulement 584 000 créations de postes en 2025, pire année hors récession depuis 2003. Mais les offres mentionnant l\'IA sont à +134% vs 2020 (Indeed). 89% des DRH prévoient que l\'IA transformera les postes en 2026. Le FMI avertit : l\'IA frappe le marché du travail « comme un tsunami ». Les banques mondiales pourraient supprimer 200 000 postes en 3-5 ans (Bloomberg Intelligence). Positionnement : barbell IA + couvertures défensives.',
    crypto: 'Crypto winter confirmé. Le BTC a chuté à $72 884, −40% depuis le pic d\'octobre 2025. Les ETF BTC spot perdent $1,7Md de sorties en deux semaines. La corrélation BTC-Nasdaq reste élevée — le bitcoin est un actif risk-on, pas un refuge. Paradoxe : les protocoles générant des revenus (DeFi) chutent aussi. Les stablecoins émergent comme la vraie allocation défensive en crypto — le narratif « digital gold » est invalidé. L\'or surperforme le BTC de 34 points YTD.',
    commodities: 'L\'or est en régime parabolique : $5 136/oz, +64% sur un an, meilleure performance depuis 1979. Les banques centrales achètent 585 tonnes/trimestre (J.P. Morgan). Goldman Sachs relève son objectif à $5 400, UBS vise $6 200. L\'argent franchit $100/oz pour la première fois. Le pétrole WTI tient au-dessus de $78 sur la prime géopolitique Venezuela/Iran. Seul le gaz naturel et les céréales sont en repli. Biais : long métaux précieux, neutre énergie.',
    etf: 'Les flux reflètent la rotation en cours. Les ETF IA/semi-conducteurs (SMH, BOTZ) captent les plus gros flux, portés par Nvidia et Broadcom — le SMH surperforme le SPY de 10 points sur un mois. Les ETF or (GLD, IAU) enregistrent leurs meilleurs flux depuis 2020 sur le flight-to-quality. Les ETF obligataires courts (SHY, BIL) profitent de l\'incertitude Warsh. À l\'inverse, les ETF Nasdaq (QQQ) et crypto subissent des sorties. Rotation value/growth et défensif en cours.'
};

const newsDatabase = {
    geopolitics: [
        { source: 'NBC News', url: 'https://www.nbcnews.com/business/economy/trump-denmark-european-tariffs-greenland-deal-rcna254551', title: 'Tarifs Groenland : Trump impose 10% sur 8 pays européens, escalade à 25% en juin', description: 'Tarifs conditionnés au soutien européen pour l\'acquisition du Groenland. Danemark, France, Allemagne, UK, Norvège, Suède, Pays-Bas et Finlande visés. Le Dow lâche 870 points, le S&P efface ses gains 2026.', tags: ['geopolitics', 'trade'], time: '17 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-20/wall-street-s-calm-shattered-by-greenland-and-japan-shocks', title: 'Wall Street : le calme brisé par le choc Groenland — S&P 500 −2,1%', description: 'Pire séance depuis octobre. Gold franchit $4 660/oz. Le risque tarifaire redevient le driver dominant des marchés mondiaux.', tags: ['geopolitics', 'markets'], time: '20 jan.', impact: 'high' },
        { source: 'NBC News', url: 'https://www.nbcnews.com/business/economy/eu-trade-deal-trump-greenland-tariff-rcna255199', title: 'L\'UE suspend l\'accord commercial avec Washington en représailles', description: 'Le Parlement européen gèle la ratification de l\'accord commercial été 2025. Un paquet de rétorsions de $110Mds est à l\'étude. Bernd Lange : « Nous n\'avons plus d\'alternative. »', tags: ['geopolitics', 'trade'], time: '21 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-30/trump-picks-a-reinvented-kevin-warsh-to-lead-the-federal-reserve', title: 'Trump nomme Kevin Warsh à la Fed : lecture hawkish, dollar et yields en hausse', description: 'Warsh promet un « changement de régime » : réduction du bilan, focus inflation, productivité IA. Le marché lit hawkish. Treasury yields en hausse.', tags: ['geopolitics', 'politics'], time: '30 jan.', impact: 'high' },
        { source: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/dispatches/eight-ways-ai-will-shape-geopolitics-in-2026/', title: 'Guerre des puces IA : les USA contrôlent 74% du compute mondial, la Chine accélère', description: 'Les restrictions d\'export Nvidia restent imprévisibles (H200 autorisé puis restreint). Huawei vise 50% du marché chinois des puces IA en 2026. La gouvernance mondiale de l\'IA entre dans sa première phase globale avec les initiatives de l\'ONU.', tags: ['geopolitics', 'politics'], time: '28 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/24/trump-tariff-canada-china.html', title: 'Trump menace le Canada d\'un tarif de 100% en cas d\'accord commercial avec la Chine', description: 'Le président américain avertit : « Si le Canada fait un deal avec la Chine, il sera immédiatement frappé d\'un tarif de 100%. » Ottawa réaffirme ne pas poursuivre d\'accord de libre-échange avec Pékin, mais les tensions USMCA s\'intensifient avant la révision de juillet 2026.', tags: ['geopolitics', 'trade'], time: '24 jan.', impact: 'high' },
        { source: 'Foreign Policy', url: 'https://foreignpolicy.com/2026/01/02/top-10-risks-2026-ukraine-trump/', title: 'Top 10 risques géopolitiques 2026 : Trump, Ukraine et la rébellion Gen Z', description: 'Foreign Policy identifie les dix risques majeurs de l\'année : escalade tarifaire américaine, confrontation USA-Chine, retrait des institutions multilatérales, fragmentation du commerce mondial. Le retrait de l\'OMS et des Accords de Paris accélère la transformation systémique.', tags: ['geopolitics', 'politics'], time: '2 jan.', impact: 'high' },
        { source: 'CFR', url: 'https://www.cfr.org/articles/visualizing-2026-five-foreign-policy-trends-watch', title: 'Council on Foreign Relations : cinq tendances géopolitiques clés pour 2026', description: 'Le CFR identifie cinq forces qui façonnent 2026 : bipolarité USA-Chine, érosion de l\'ordre multilatéral, weaponisation des minéraux critiques, fragmentation des chaînes d\'approvisionnement, et montée des « électrostats » (Chine) vs « pétrostats » (USA).', tags: ['geopolitics', 'politics'], time: '3 jan.', impact: 'high' }
    ],
    markets: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/02/03/musk-xai-spacex-biggest-merger-ever.html', title: 'SpaceX + xAI : la plus grande fusion de l\'histoire à $1 250 milliards', description: 'SpaceX acquiert xAI pour créer une entité valorisée $1,25T — la plus grande fusion jamais réalisée. Objectif : data centers orbitaux alimentés par l\'énergie solaire pour répondre à la demande IA explosive. IPO prévue mi-2026 à $1,5T de valorisation.', tags: ['markets'], time: '4 fév.', impact: 'high' },
        { source: 'HBR', url: 'https://hbr.org/2026/01/companies-are-laying-off-workers-because-of-ais-potential-not-its-performance', title: 'HBR : les entreprises licencient pour le potentiel de l\'IA, pas ses performances', description: 'Les licenciements liés à l\'IA ont été multipliés par 12 en deux ans (55 000 en 2025). Forrester alerte : 55% des employeurs regrettent ces coupes. Beaucoup licencient pour des capacités IA qui n\'existent pas encore — le « AI-washing » des restructurations.', tags: ['markets'], time: '4 fév.', impact: 'high' },
        { source: 'Fortune', url: 'https://fortune.com/2026/02/02/ai-labor-market-yale-budget-lab-ai-washing/', title: 'Yale Budget Lab : l\'IA ne bouleverse pas (encore) le marché du travail', description: 'Si l\'IA transformait vraiment l\'emploi, les données le montreraient. Le rapport Yale suggère que les entreprises utilisent l\'IA comme prétexte pour des licenciements financièrement motivés — une forme d\'« AI-washing » pour transformer une mauvaise nouvelle en bonne.', tags: ['markets'], time: '2 fév.', impact: 'high' },
        { source: 'Nvidia', url: 'https://nvidianews.nvidia.com/news/rubin-platform-ai-supercomputer', title: 'Nvidia Rubin : 6 nouvelles puces, réduction 10x des coûts d\'inférence', description: 'La plateforme Vera Rubin arrive au S2 2026. Réduction 10x des coûts d\'inférence, 4x moins de GPU pour l\'entraînement des modèles MoE. AWS, Google Cloud, Microsoft, CoreWeave parmi les premiers déployeurs. Pipeline de $500Mds confirmé.', tags: ['markets'], time: '3 fév.', impact: 'high' },
        { source: 'Testing Catalog', url: 'https://www.testingcatalog.com/anthropic-is-about-to-drop-sonnet-5-during-super-bowl-week/', title: 'Anthropic s\'apprête à lancer Claude Sonnet 5 pendant la semaine du Super Bowl', description: 'Anthropic prépare le lancement de Claude Sonnet 5, son nouveau modèle frontier. La course aux LLM s\'intensifie : OpenAI, Google, Anthropic et xAI se disputent le marché enterprise de l\'IA générative. Les benchmarks promettent des gains significatifs sur le raisonnement et le code.', tags: ['markets'], time: '3 fév.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-20/asian-stocks-set-to-fall-as-global-selloff-deepens-markets-wrap', title: 'Sell-off global : le S&P 500 efface ses gains 2026, VIX au plus haut depuis novembre', description: 'Les tarifs Groenland déclenchent une vague de ventes sur toutes les classes d\'actifs risqués. Le VIX passe au-dessus de 20. Les flux se dirigent vers l\'or, les Treasuries et le yen.', tags: ['markets'], time: '20 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2025/11/19/nvidia-nvda-earnings-report-q3-2026.html', title: 'Nvidia Q3 : $57Mds de CA (+62% YoY), guidance Q4 à $65Mds — le seul pilier du marché', description: 'Data center : $43Mds en compute, $8,2Mds en networking. Backlog de $500Mds sur Blackwell/Rubin. L\'IA reste le dernier rempart haussier des indices.', tags: ['markets'], time: '19 nov. 2025', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-18/wall-street-s-hot-2026-trades-from-ai-dispersion-to-tech-tails', title: 'Hot trades 2026 : dispersion IA, rotation tech, stratégies tail-risk', description: 'Wall Street se positionne sur la dispersion au sein du Magnificent 7. Les fonds systématiques parient sur l\'écart croissant entre les gagnants IA (Nvidia, Alphabet) et les retardataires. Le consensus vise un S&P range-bound hors tech.', tags: ['markets'], time: '18 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/20/ai-impacting-labor-market-like-a-tsunami-as-layoff-fears-mount.html', title: 'Le FMI alerte : l\'IA frappe le marché du travail « comme un tsunami »', description: 'Kristalina Georgieva à Davos : la plupart des pays et entreprises ne sont pas préparés. Les craintes de perte d\'emploi liées à l\'IA passent de 28% (2024) à 40% (2026). Les offres mentionnant l\'IA sont à +134% vs 2020.', tags: ['markets'], time: '20 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2025-01-09/wall-street-expected-to-shed-200-000-jobs-as-ai-erodes-roles', title: 'Wall Street va supprimer 200 000 postes en 3-5 ans sous l\'effet de l\'IA', description: 'Bloomberg Intelligence estime que les banques mondiales réduiront massivement leurs effectifs. Citi déploie l\'IA agentique sur 40 000 développeurs. Wells Fargo réarchitecture toute l\'organisation autour de l\'IA.', tags: ['markets'], time: '9 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/10/hiring-recession.html', title: '« Hiring recession » aux USA : 584 000 emplois créés en 2025, pire année hors récession depuis 2003', description: 'La reprise est attendue au S2 2026 grâce aux baisses d\'impôts et taux. 89% des DRH s\'attendent à ce que l\'IA transforme les postes cette année. La demande d\'ingénieurs IA explose pendant que les postes traditionnels stagnent.', tags: ['markets'], time: '10 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/22/nvidia-huang-blue-collar-jobs-salaries-skilled-trades.html', title: 'Jensen Huang : « La plus grande construction d\'infrastructure de l\'histoire » — skilled trades à 6 chiffres', description: 'Le CEO de Nvidia prédit des salaires « nearly doubling » pour les électriciens, plombiers et techniciens réseau impliqués dans la construction de data centers. Le boom IA redistribue la valeur au-delà des cols blancs.', tags: ['markets'], time: '22 jan.', impact: 'medium' },
        { source: 'FMI', url: 'https://www.imf.org/en/blogs/articles/2026/01/14/new-skills-and-ai-are-reshaping-the-future-of-work', title: 'FMI : les nouvelles compétences et l\'IA redéfinissent l\'avenir du travail', description: 'Près de 40% des emplois mondiaux sont exposés à l\'IA. Les offres exigeant des compétences IA paient 3% de plus. La Finlande, l\'Irlande et le Danemark en tête du « Skill Readiness Index ». Le FMI appelle à une refonte des systèmes éducatifs.', tags: ['markets'], time: '14 jan.', impact: 'high' },
        { source: 'BCG', url: 'https://www.bcg.com/publications/2025/geopolitical-forces-shaping-business-in-2026', title: 'BCG : les forces géopolitiques qui façonnent le business en 2026', description: 'Boston Consulting Group analyse la fragmentation du commerce mondial, la weaponisation des dépendances économiques, et l\'émergence de nouveaux blocs. Les entreprises doivent intégrer le risque géopolitique comme variable permanente de leur stratégie.', tags: ['markets'], time: '18 déc. 2025', impact: 'medium' }
    ],
    crypto: [
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-08/stablecoin-transactions-rose-to-record-33-trillion-led-by-usdc', title: 'Stablecoins : record de $33 000 milliards de transactions en 2025', description: 'USDC mène avec $18,3T de transactions, USDT suit avec $13,3T. Le marché stablecoin a crû de 50% en 2025. USDT + USDC représentent 90% du marché. Les stablecoins comptent pour 70% du volume DeFi — la vraie allocation défensive en crypto.', tags: ['crypto'], time: '4 fév.', impact: 'high' },
        { source: 'CoinDesk', url: 'https://www.coindesk.com/markets/2026/02/02/bitcoin-s-crash-exposes-painful-truth-crypto-market-still-dances-to-btc-s-tune', title: 'Oubliez le « digital gold » : les traders fuient vers les stablecoins', description: 'Malgré l\'expansion du marché crypto et l\'adoption institutionnelle, l\'action des prix 2026 démontre que le marché évolue toujours au rythme du BTC. Les protocoles générant des revenus chutent malgré leurs cash flows. Les stablecoins émergent comme la vraie allocation défensive en crypto.', tags: ['crypto'], time: '4 fév.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/02/03/bitcoin-price-today.html', title: 'Bitcoin à $73 000 — plus bas de 16 mois, −40% depuis le pic d\'octobre', description: 'BTC touche $72 884, −16% YTD. Rotation massive hors des actifs risk-on. Le BTC sort du top 10 mondial par capitalisation. Corrélation avec le Nasdaq toujours élevée, corrélation avec l\'or nulle.', tags: ['crypto'], time: '3 fév.', impact: 'high' },
        { source: 'CoinShares', url: 'https://coinshares.com/us/insights/research-data/fund-flows-02-02-26/', title: 'Flux ETF crypto : $1,7Md de sorties en deux semaines, sentiment en capitulation', description: 'BTC : −$1,32Md. ETH : −$308M. Les flux YTD basculent en négatif. Short BTC : +$14,5M d\'inflows. Le crypto winter se confirme face à la surperformance de l\'or et des actifs défensifs.', tags: ['crypto'], time: '2 fév.', impact: 'high' }
    ],
    commodities: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/26/gold-races-to-5100-record-peak-on-safe-haven-demand.html', title: 'Or : record absolu à $5 110/oz — +64% sur un an, meilleure performance depuis 1979', description: 'Goldman relève son objectif à $5 400. Achats banques centrales : 60 tonnes/mois vs 17 tonnes pré-2022. UBS vise $6 200 sur les 3 premiers trimestres.', tags: ['commodities'], time: '26 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/12/gold-record-haven-powell-venezuela-iran.html', title: 'Or à $4 600 : enquête Powell + Venezuela + Iran = triple catalyseur safe-haven', description: 'Convergence de trois flashpoints géopolitiques. L\'or franchit $4 600 sur l\'enquête contre le président de la Fed, l\'opération au Venezuela et les tensions iraniennes.', tags: ['commodities'], time: '12 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/23/gold-prices-ease-on-profit-taking-after-nearing-5000-mark.html', title: 'Argent au-dessus de $100/oz pour la première fois — le métal blanc entre en territoire historique', description: 'L\'argent profite du double moteur refuge + demande industrielle (photovoltaïque, électronique). Le ratio or/argent se compresse. Objectif analystes : $120/oz.', tags: ['commodities'], time: '23 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/27/gold-silver-rise-to-near-record-highs-on-safe-haven-demand.html', title: 'Métaux précieux : +18% YTD en janvier, la meilleure ouverture d\'année depuis 2008', description: 'Les ETF or captent des flux records. MKS PAMP : « L\'or est un trade séculaire, pas un blow-off top. »', tags: ['commodities'], time: '27 jan.', impact: 'medium' },
        { source: 'World Gold Council', url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2025', title: 'World Gold Council : 863 tonnes achetées par les banques centrales en 2025', description: 'La Pologne premier acheteur mondial (102t). Achats « opaques » non déclarés : 57% du total. La part de l\'or dans les réserves de change mondiales remonte aux niveaux des années 1990. Le WGC anticipe une demande structurellement élevée en 2026.', tags: ['commodities'], time: '30 jan.', impact: 'high' },
        { source: 'J.P. Morgan', url: 'https://www.jpmorgan.com/insights/global-research/commodities/gold-prices', title: 'J.P. Morgan : objectif or à $5 400, achats banques centrales à 755 tonnes en 2026', description: 'La part des banques centrales dans la demande totale est passée de 12% (2015-2019) à 25% (2024). J.P. Morgan qualifie la dynamique de « structurelle et non cyclique ». Les ETF or enregistrent les meilleurs flux depuis 2020.', tags: ['commodities'], time: '28 jan.', impact: 'high' }
    ],
    etf: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2025/11/19/nvidia-nvda-earnings-report-q3-2026.html', title: 'ETF IA (SMH, BOTZ) : Nvidia tire les fonds semi-conducteurs — SMH +10% sur un mois vs SPY −2%', description: 'Les ETF exposés à l\'IA surperforment massivement le marché. NVDA ($57Mds Q3), AMD et AVGO constituent le moteur. Attention : Nvidia pèse >20% du SMH — risque de concentration.', tags: ['etf'], time: '20 nov. 2025', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/26/gold-races-to-5100-record-peak-on-safe-haven-demand.html', title: 'ETF Or (GLD, IAU) : afflux records — le flight-to-quality en action', description: 'Les ETF adossés à l\'or physique enregistrent leurs plus gros flux entrants depuis mars 2020. Goldman note que les achats institutionnels sont devenus « sticky » — positions structurelles.', tags: ['etf'], time: '26 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-30/trump-picks-kevin-warsh-as-fed-chair-wall-street-reacts', title: 'ETF obligataires (SHY, BIL) : la duration courte capte le flight-to-quality', description: 'La nomination Warsh et l\'incertitude tarifaire poussent les capitaux vers les Treasuries court terme. Flux entrants records pour SHY et BIL.', tags: ['etf'], time: '30 jan.', impact: 'medium' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-18/wall-street-s-hot-2026-trades-from-ai-dispersion-to-tech-tails', title: 'ETF thématiques IA : la dispersion du Magnificent 7 crée des opportunités', description: 'Les ETF qui séparent les gagnants IA (Nvidia, Alphabet) des retardataires captent des flux croissants. Les stratégies tail-risk et long/short IA gagnent en popularité chez les institutionnels.', tags: ['etf'], time: '18 jan.', impact: 'medium' },
        { source: 'ING', url: 'https://think.ing.com/articles/golds-bull-run-to-continue-in-2026/', title: 'ING : le bull run de l\'or va se poursuivre en 2026 — implications pour les ETF', description: 'ING anticipe que les achats des banques centrales resteront structurels. Les ETF adossés à l\'or physique (GLD, IAU) bénéficient d\'un repositionnement institutionnel durable. La dédollarisation des réserves mondiales est le moteur de fond.', tags: ['etf'], time: '15 jan.', impact: 'medium' }
    ]
};

const marketData = [
    { name: 'S&P 500', price: 5842, change: -2.10 },
    { name: 'Nasdaq 100', price: 20456, change: -2.40 },
    { name: 'Or (XAU)', price: 5136, change: 2.30 },
    { name: 'Nvidia', price: 236.50, change: 4.10 },
    { name: 'Pétrole WTI', price: 78.32, change: 1.20 },
    { name: 'Dollar Index', price: 103.45, change: -0.68 }
];

const commodityData = [
    { name: 'Or', price: '$5 136', change: '+2.3%', up: true },
    { name: 'Argent', price: '$102.40', change: '+1.9%', up: true },
    { name: 'Pétrole WTI', price: '$78.32', change: '+1.2%', up: true },
    { name: 'Pétrole Brent', price: '$82.10', change: '+0.9%', up: true },
    { name: 'Gaz naturel', price: '$3.12', change: '-1.8%', up: false },
    { name: 'Cuivre', price: '$4.15', change: '+0.7%', up: true },
    { name: 'Blé', price: '$645', change: '-0.5%', up: false }
];

const etfTableData = [
    { ticker: 'SMH', name: 'VanEck Semiconductor', provider: 'VanEck', flow: '+$1.4B' },
    { ticker: 'GLD', name: 'SPDR Gold Trust', provider: 'SPDR', flow: '+$2.8B' },
    { ticker: 'SHY', name: 'iShares 1-3Y Treasury', provider: 'iShares', flow: '+$1.2B' },
    { ticker: 'SPY', name: 'S&P 500 ETF', provider: 'SPDR', flow: '+$1.9B' },
    { ticker: 'BOTZ', name: 'Global X Robotics & AI', provider: 'Global X', flow: '+$680M' },
    { ticker: 'QQQ', name: 'NASDAQ 100 ETF', provider: 'Invesco', flow: '-$420M' }
];

const breakingNews = [
    'xAI rejoint SpaceX : Musk fusionne IA et aerospatiale (SpaceX)',
    'Anthropic lance Claude Sonnet 5 pendant la semaine du Super Bowl',
    'Crypto : les traders fuient vers les stablecoins -- le « digital gold » invalide (CoinDesk)',
    'Or : record absolu a $5 110/oz -- banques centrales : 863 tonnes en 2025 (WGC)',
    'FMI : l\'IA frappe le marche du travail comme un tsunami -- 40% des emplois exposes',
    'Trump menace le Canada d\'un tarif de 100% en cas de deal avec la Chine',
    'Kevin Warsh nomme a la Fed -- lecture hawkish du marche',
    'Nvidia Q3 : $57Mds de CA, le seul pilier haussier des indices',
    'Wall Street : 200 000 postes menaces par l\'IA en 3-5 ans (Bloomberg Intelligence)',
    'Guerre des puces : USA controlent 74% du compute IA mondial (Atlantic Council)'
];

// --- Core functions ---

function setCurrentDate() {
    var el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function initTicker() {
    var el = document.getElementById('ticker-content');
    if (!el) return;
    var h = breakingNews.map(function(t) { return '<span class="ticker-item">' + t + '</span>'; }).join('<span class="ticker-separator">|</span>');
    el.innerHTML = h + h;
}

function initSearch() {
    var f = document.getElementById('search-form');
    if (!f) return;
    f.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = document.getElementById('search-input').value.trim().toLowerCase();
        if (!q) return;
        var r = [];
        Object.keys(newsDatabase).forEach(function(k) {
            newsDatabase[k].forEach(function(a) {
                if (a.title.toLowerCase().indexOf(q) !== -1 || a.description.toLowerCase().indexOf(q) !== -1) r.push(a);
            });
        });
        showSearchResults(r, q);
    });
}

function showSearchResults(results, query) {
    var c = document.getElementById('search-results');
    if (!c) { c = document.createElement('div'); c.id = 'search-results'; var m = document.querySelector('.main-content .container'); if (m) m.insertBefore(c, m.firstChild); }
    if (!results.length) { c.innerHTML = '<div class="search-results-header"><h2>Aucun résultat pour « ' + query + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div>'; return; }
    c.innerHTML = '<div class="search-results-header"><h2>' + results.length + ' résultat' + (results.length > 1 ? 's' : '') + ' pour « ' + query + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div><div class="news-grid">' + results.map(cardHTML).join('') + '</div>';
    c.scrollIntoView({ behavior: 'smooth' });
}

var tagLabels = { geopolitics: 'Géopolitique', markets: 'Marchés', crypto: 'Crypto', commodities: 'Mat. Premières', etf: 'ETF', conflicts: 'Conflits', trade: 'Commerce', politics: 'Politique' };

function cardHTML(n) {
    var tags = (n.tags || []).map(function(t) { return '<span class="tag ' + t + '">' + (tagLabels[t] || t) + '</span>'; }).join('');
    var dot = n.impact === 'high' ? '<span class="impact-dot"></span>' : '';
    return '<article class="news-card"><div class="news-source"><a href="' + n.url + '" target="_blank" rel="noopener" class="source-name">' + n.source + '</a><span class="news-time">' + n.time + '</span>' + dot + '</div><h3 class="news-title"><a href="' + n.url + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">' + n.title + '</a></h3><p class="news-description">' + n.description + '</p><div class="news-footer"><div class="news-tags">' + tags + '</div><a href="' + n.url + '" target="_blank" rel="noopener" class="news-link">Lire</a></div></article>';
}

function initCommon() { setCurrentDate(); initTicker(); initSearch(); }

// --- Home ---

function initHomePage() {
    initCommon();
    var ts = document.getElementById('top-stories');
    if (ts) {
        var f = [newsDatabase.markets[0], newsDatabase.markets[1], newsDatabase.commodities[0]];
        ts.innerHTML = '<div class="top-stories-grid">' + f.map(function(n, i) {
            return '<article class="top-story' + (i === 0 ? ' top-story-main' : '') + '"><a href="' + n.url + '" target="_blank" rel="noopener" class="source-name">' + n.source + '</a><h3><a href="' + n.url + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">' + n.title + '</a></h3><p>' + n.description + '</p><span class="news-time">' + n.time + '</span></article>';
        }).join('') + '</div>';
    }
    var ln = document.getElementById('latest-news');
    if (ln) {
        var all = [];
        Object.keys(newsDatabase).forEach(function(k) { all = all.concat(newsDatabase[k]); });
        all.sort(function(a, b) { return (a.impact === 'high' ? 0 : 1) - (b.impact === 'high' ? 0 : 1); });
        ln.innerHTML = all.slice(0, 10).map(function(n) {
            var dot = n.impact === 'high' ? '<span class="impact-dot"></span>' : '';
            return '<article class="news-list-item"><div class="news-list-source"><a href="' + n.url + '" target="_blank" rel="noopener" class="source-name">' + n.source + '</a><span class="news-time">' + n.time + '</span>' + dot + '</div><h3><a href="' + n.url + '" target="_blank" rel="noopener">' + n.title + '</a></h3><p>' + n.description + '</p></article>';
        }).join('');
    }
    var mt = document.getElementById('market-table');
    if (mt) mt.innerHTML = marketData.map(function(m) {
        var cls = m.change > 0 ? 'positive' : 'negative';
        return '<div class="market-row"><span class="market-row-name">' + m.name + '</span><span class="market-row-price">$' + m.price.toLocaleString('fr-FR') + '</span><span class="market-row-change ' + cls + '">' + (m.change > 0 ? '+' : '') + m.change.toFixed(2) + '%</span></div>';
    }).join('');

    // Initialize divergence chart
    initDivergenceChart();
}

// --- Divergence Chart: Gold vs Bitcoin YTD ---

function initDivergenceChart() {
    var ctx = document.getElementById('divergenceChart');
    if (!ctx || typeof Chart === 'undefined') return;

    // YTD 2026 data points (weekly)
    var labels = ['1 jan', '8 jan', '15 jan', '22 jan', '29 jan', '5 fév'];
    var goldData = [0, 3.2, 7.8, 12.4, 15.1, 18.2];      // Or: +18.2% YTD
    var btcData = [0, -2.1, -8.5, -12.3, -14.8, -16.4];  // BTC: -16.4% YTD

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Or (XAU/USD)',
                    data: goldData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: 'Bitcoin (BTC/USD)',
                    data: btcData,
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#f7931a',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 26, 0.95)',
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 12 },
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            var value = context.parsed.y;
                            return context.dataset.label + ': ' + (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#64748b'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)'
                    },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#64748b',
                        callback: function(value) {
                            return (value >= 0 ? '+' : '') + value + '%';
                        }
                    }
                }
            }
        }
    });
}

// --- Category pages ---

function initCategoryPage(cat) {
    initCommon();
    var th = document.getElementById('category-trend');
    if (th && categoryTrends[cat]) th.innerHTML = '<p class="analysis-excerpt" style="margin-bottom:2rem;padding:1.25rem;background:var(--bg-secondary);border-left:4px solid var(--pink);border-radius:0 4px 4px 0">' + categoryTrends[cat] + '</p>';
    var c = document.getElementById('page-news');
    if (!c) return;
    var articles = newsDatabase[cat] || [];
    c.innerHTML = articles.map(cardHTML).join('');
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var f = btn.getAttribute('data-filter');
            var list = f === 'all' ? articles : articles.filter(function(a) { return a.tags.indexOf(f) !== -1; });
            c.innerHTML = list.length ? list.map(cardHTML).join('') : '<p class="no-results">Aucun article dans cette catégorie.</p>';
        });
    });
    if (cat === 'commodities') renderTable('commodity-table', ['Matière première', 'Prix', 'Variation'], commodityData, function(r) { return '<td>' + r.name + '</td><td>' + r.price + '</td><td class="' + (r.up ? 'positive' : 'negative') + '">' + r.change + '</td>'; });
    if (cat === 'etf') renderTable('etf-table', ['Ticker', 'Nom', 'Fournisseur', 'Flux'], etfTableData, function(r) { return '<td><strong>' + r.ticker + '</strong></td><td>' + r.name + '</td><td>' + r.provider + '</td><td class="' + (r.flow[0] === '+' ? 'positive' : 'negative') + '">' + r.flow + '</td>'; });
}

function renderTable(id, headers, data, rowFn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<table class="data-table"><thead><tr>' + headers.map(function(h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + data.map(function(r) { return '<tr>' + rowFn(r) + '</tr>'; }).join('') + '</tbody></table>';
}
