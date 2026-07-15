(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const COLORS = {
    now: "#FF2D00",
    near: "#C42300",
    mid: "#8A1800",
    far: "#521000",
    archive: "#3E5C3A",
    meta: "#6E6A62"
  };

  // Pondérations de base SEMPLICE v2.1 documentées dans expertise.html.
  const DIMENSION_WEIGHTS = {
    S: 0.12,
    E: 0.15,
    M: 0.16,
    P: 0.14,
    L: 0.10,
    I: 0.12,
    C: 0.11,
    Ee: 0.10
  };

  const DATA_URLS = {
    ormuz: "../data/semplice/evaluations-test-v2/ormuz-v2.json",
    chine: "../data/semplice/evaluations-test-v2/mer-de-chine-v2.json",
    vietnam: "../data/semplice/evaluations-test-v2/vietnam-v2.json",
    history: "../data/semplice-history.json",
    briefing: "../data/daily-briefing.json",
    signals: "../data/signals.json",
    sentiment: "../data/sentiment.json"
  };

  const EVALUATION_SOURCE_KEY_BY_ZONE = {
    ormuz: "ormuz",
    "mer-de-chine": "chine",
    vietnam: "vietnam"
  };

  // Copie datée et fidèle des champs utilisés dans les JSON du dépôt.
  const DATA_SNAPSHOT = {
    ormuz: {
      meta: { date: "2026-03-13", version: "2.1", analyst: "Inflexion Intelligence" },
      zone: { id: "ormuz", name: "Détroit d'Ormuz (Iran)", region: "moyen-orient" },
      composite: 6.2,
      classification: "Critique",
      dimensions: {
        S: { label: "Social", scoreFinal: 4.4 },
        E: { label: "Économique", scoreFinal: 5.7 },
        M: { label: "Militaire", scoreFinal: 6.2 },
        P: { label: "Politique", scoreFinal: 6.7 },
        L: { label: "Légal", scoreFinal: 6.9 },
        I: { label: "Information", scoreFinal: 6.9 },
        C: { label: "Cyber", scoreFinal: 6.5 },
        Ee: { label: "Environnemental", scoreFinal: 5.2 }
      },
      peakAmplification: {
        dimensionsTrigger: ["M", "P", "L", "I", "C"],
        facteur: 0.20,
        cap: 0.3,
        compositeAvantPeak: 6.2,
        compositeApresAmp: 6.2
      },
      scenarios: [
        {
          label: "Continuité guerre + chaos successoral",
          probabilite: 0.45,
          impact: "Composite → 6.8-7.0. Ormuz bloqué 6-12 mois. Effondrement régime islamique. Partition possible.",
          horizon: "6-18 mois"
        },
        {
          label: "Accord diplomatique + transition négociée",
          probabilite: 0.25,
          impact: "Composite → 4.5-5.0. Levée progressive sanctions. Reconstruction. Diaspora de retour.",
          horizon: "12-36 mois"
        },
        {
          label: "Fragmentation IRGC + guerre civile",
          probabilite: 0.20,
          impact: "Composite → 7.0. Worst-case régional : Liban 1975, mais en version nucléaire latente.",
          horizon: "3-12 mois"
        },
        {
          label: "Normalisation partielle sans changement régime",
          probabilite: 0.10,
          impact: "Composite → 5.5-6.0. Statu quo avec réouverture partielle Ormuz sous pression internationale.",
          horizon: "3-6 mois"
        }
      ]
    },
    chine: {
      meta: { date: "2026-03-13", version: "2.1", analyst: "Inflexion Intelligence" },
      zone: { id: "mer-de-chine", name: "Mer de Chine méridionale (Chine)", region: "asie" },
      composite: 4.8,
      classification: "Élevé",
      dimensions: {
        S: { label: "Social", scoreFinal: 3.5 },
        E: { label: "Économique", scoreFinal: 3.6 },
        M: { label: "Militaire", scoreFinal: 4.7 },
        P: { label: "Politique", scoreFinal: 5.0 },
        L: { label: "Légal", scoreFinal: 3.9 },
        I: { label: "Information", scoreFinal: 6.9 },
        C: { label: "Cyber", scoreFinal: 5.0 },
        Ee: { label: "Environnemental", scoreFinal: 3.9 }
      },
      peakAmplification: {
        dimensionsTrigger: ["I", "C", "P"],
        facteur: 0.20,
        cap: 0.3,
        compositeAvantPeak: 4.75,
        compositeApresAmp: 4.8
      },
      scenarios: [
        {
          label: "Statut quo tendu (guerre de zone grise continue)",
          probabilite: 0.50,
          impact: "Composite stable ~4.8-5.0. Exercices Taiwan 3x/an. Cyber opérations continues. Tension MCS persistante mais pas de guerre.",
          horizon: "12-24 mois"
        },
        {
          label: "Escalade Taiwan (incident armé limité)",
          probabilite: 0.20,
          impact: "Composite → 6.0-6.5. Blocus partiel, frappes limités. Sanctions massives. Crise économique mondiale (MCS = 30% commerce mondial).",
          horizon: "6-24 mois"
        },
        {
          label: "Détente pragmatique (Xi-successeur ouverture)",
          probabilite: 0.15,
          impact: "Composite → 3.5-4.0. Reprises diplomatiques. Investissements accélérés. Opportunité composite → 6.0.",
          horizon: "24-60 mois"
        },
        {
          label: "Conflit Taiwan ouvert",
          probabilite: 0.15,
          impact: "Composite → 6.5-7.0. Sanctions totales. Découplage complet. Récession mondiale -4%. Crise chaînes approvisionnement globales.",
          horizon: "12-60 mois"
        }
      ]
    },
    vietnam: {
      meta: { date: "2026-03-16", version: "2.1", analyst: "Inflexion Intelligence" },
      zone: { id: "vietnam", name: "Vietnam", region: "asie-pacifique" },
      composite: 3.8,
      classification: "Modere",
      dimensions: {
        S: { label: "Social", scoreFinal: 3.0 },
        E: { label: "Economique", scoreFinal: 2.9 },
        M: { label: "Militaire", scoreFinal: 3.9 },
        P: { label: "Politique", scoreFinal: 3.7 },
        L: { label: "Legal", scoreFinal: 3.7 },
        I: { label: "Information", scoreFinal: 5.5 },
        C: { label: "Cyber", scoreFinal: 4.1 },
        Ee: { label: "Environnemental", scoreFinal: 3.7 }
      },
      scenarios: {
        base: {
          label: "Croissance sous controle autoritaire",
          horizon: "12 mois",
          probability: "65%",
          description: "Le PCV maintient la trajectoire de croissance 6-7%, attire les IDE (China+1 strategy), gere les tensions Mer de Chine par la diplomatie bambou. Anti-corruption continue sans destabiliser. Score stable."
        },
        upside: {
          label: "Acceleration du decouplage Chine",
          horizon: "12 mois",
          probability: "20%",
          description: "Escalade commerciale US-Chine accelere le shift supply chain vers le Vietnam. IDE record (>25 Mrd$), croissance 8%+, upgrade notation souveraine (investment grade). E ameliore, Eo ameliore."
        },
        downside: {
          label: "Escalade Mer de Chine du Sud",
          horizon: "12 mois",
          probability: "15%",
          description: "Incident maritime majeur (collision, saisie navire peche). Paralysie diplomatie bambou. Deterioration M (+1.0), impact E (IDE en suspens), I (repression renforcee)."
        }
      }
    },
    briefing: {
      date: "2026-04-16",
      sources_count: 25,
      risk_radar: [
        {
          risque: "Escalade ukrainienne — disruption énergétique européenne",
          severite: "urgent",
          probabilite: "moyenne",
          horizon: "court_terme"
        },
        {
          risque: "Correction crypto sous 70 000 $ — liquidation cascade",
          severite: "attention",
          probabilite: "moyenne",
          horizon: "court_terme"
        },
        {
          risque: "Repli tech si TSMC déçoit — fin du rally Nasdaq",
          severite: "attention",
          probabilite: "faible",
          horizon: "court_terme"
        }
      ]
    },
    signals: {
      date: "2026-04-13",
      weak_signals: [
        { theme: "Hongrie pivot géopolitique anti-Russie", force: "confirmé" },
        { theme: "Blocus Ormuz et choc énergétique global", force: "confirmé" },
        { theme: "Sécurité critique des infrastructures énergétiques", force: "emergent" },
        { theme: "Crypto : régulation bancaire post-incidents", force: "emergent" },
        { theme: "Menaces physiques contre figures tech/IA", force: "emergent" }
      ]
    },
    sentiment: {
      date: "2026-04-16",
      categories: {
        geopolitique: { score: -0.72, confidence: 0.92, tendance: "baissier" },
        marches: { score: 0.58, confidence: 0.85, tendance: "haussier" },
        crypto: { score: 0.64, confidence: 0.79, tendance: "haussier" },
        matieres_premieres: { score: -0.51, confidence: 0.88, tendance: "baissier" },
        ai_tech: { score: 0.41, confidence: 0.72, tendance: "mixte" }
      }
    },
    history: {
      zones: {
        ormuz: {
          snapshots: [
            { date: "2024-01-01", composite: 3.5 },
            { date: "2024-10-01", composite: 4.2 },
            { date: "2025-06-01", composite: 4.3 },
            { date: "2026-03-13", composite: 6.2 }
          ]
        },
        chine: {
          snapshots: [
            { date: "2024-01-01", composite: 3.0 },
            { date: "2024-10-01", composite: 3.4 },
            { date: "2026-03-13", composite: 4.8 }
          ]
        },
        vietnam: {
          snapshots: [
            { date: "2023-01-01", composite: 3.4 },
            { date: "2024-01-01", composite: 3.8 },
            { date: "2025-06-01", composite: 3.8 },
            { date: "2026-03-16", composite: 3.8 }
          ]
        }
      }
    }
  };

  const state = {
    data: null,
    scenarios: [],
    frame: 0,
    loadedSources: 0,
    activeNodeId: null,
    tooltipPinned: false
  };

  function parseProbability(value) {
    if (typeof value === "number") return value > 1 ? value / 100 : value;
    if (typeof value !== "string") return null;
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (!Number.isFinite(parsed)) return null;
    return value.includes("%") || parsed > 1 ? parsed / 100 : parsed;
  }

  function horizonMaximum(horizon) {
    if (!horizon) return null;
    const values = String(horizon).match(/\d+(?:[.,]\d+)?/g);
    if (!values || values.length === 0) return null;
    return Math.max(...values.map((value) => Number.parseFloat(value.replace(",", "."))));
  }

  function normalizeStringList(value) {
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  }

  function normalizeDimensions(dimensions) {
    if (!dimensions || typeof dimensions !== "object") return [];
    return Object.entries(dimensions).map(([code, dimension]) => ({
      code,
      label: dimension.label || code,
      score: Number.isFinite(dimension.scoreFinal) ? dimension.scoreFinal : null,
      poidsBase: DIMENSION_WEIGHTS[code] ?? null
    }));
  }

  function normalizeChildren(children, parentId, source, depth = 0) {
    if (!children) return [];
    const entries = Array.isArray(children) ? children.map((item, index) => [String(index), item]) : Object.entries(children);

    return entries.map(([key, raw], index) => {
      const id = raw.id
        ? slug(raw.id)
        : `${parentId}-s${index + 1}-${slug(key || raw.label || "scenario")}`;
      const probability = parseProbability(raw.probabilite ?? raw.probability ?? raw.probability_pct);
      const childSource = {
        fichier: source.fichier,
        date: raw.date || source.date,
        version: raw.version || source.version,
        analyste: raw.analyste || raw.analyst || source.analyste
      };
      const normalizedChildren = normalizeChildren(raw.enfants || raw.children, id, childSource, depth + 1);

      return {
        id,
        parentId,
        type: raw.type || (depth > 0 ? "sous-scenario" : "scenario"),
        profondeur: depth + 1,
        label: raw.label || raw.titre || null,
        probabilite: probability,
        confiance: parseProbability(raw.confiance ?? raw.confidence),
        statut: raw.statut ?? raw.status ?? null,
        stade: raw.stade ?? raw.stade_materialisation ?? raw.materializationStage ?? null,
        horizon: raw.horizon ?? null,
        horizonMois: Number.isFinite(raw.horizonMois) ? raw.horizonMois : horizonMaximum(raw.horizon),
        note: raw.impact || raw.description || null,
        declencheurs: normalizeStringList(raw.declencheurs ?? raw.triggers),
        pointBascule: raw.point_bascule ?? raw.pointBascule ?? raw.tippingPoint ?? null,
        source: childSource,
        feuilles: countLeaves(normalizedChildren),
        enfants: normalizedChildren
      };
    });
  }

  function normalizeEvaluation(raw, file) {
    const zoneId = slug(raw.zone?.id || raw.zone?.name || raw.zone || file);
    const source = {
      fichier: file,
      date: raw.meta?.date || null,
      version: raw.meta?.version || null,
      analyste: raw.meta?.analyst || raw.meta?.analyste || null
    };
    const children = normalizeChildren(raw.scenarios, zoneId, source);
    const knownProbabilities = children.map((child) => child.probabilite).filter(Number.isFinite);
    const dimensions = normalizeDimensions(raw.dimensions);
    const amplifiedDimensions = normalizeStringList(raw.peakAmplification?.dimensionsTrigger);

    return {
      id: zoneId,
      parentId: "root",
      type: "zone",
      profondeur: 0,
      label: raw.zone?.name || raw.zone || null,
      region: raw.zone?.region || null,
      probabilite: knownProbabilities.length === children.length
        ? knownProbabilities.reduce((sum, value) => sum + value, 0)
        : null,
      confiance: null,
      statut: raw.classification ?? null,
      stade: null,
      horizon: null,
      horizonMois: Number.isFinite(raw.horizonMois) ? raw.horizonMois : maximumHorizon(children),
      composite: Number.isFinite(raw.composite) ? raw.composite : null,
      dimensions,
      ponderations: Object.fromEntries(dimensions.map((dimension) => [dimension.code, dimension.poidsBase])),
      amplificationPic: raw.peakAmplification
        ? {
            dimensions: amplifiedDimensions,
            facteur: raw.peakAmplification.facteur ?? null,
            cap: raw.peakAmplification.cap ?? null,
            avant: raw.peakAmplification.compositeAvantPeak ?? null,
            apres: raw.peakAmplification.compositeApresAmp ?? null
          }
        : null,
      declencheurs: [],
      pointBascule: null,
      source,
      feuilles: countLeaves(children),
      enfants: children
    };
  }

  function evaluationFilename(raw, key) {
    const explicit = raw.source?.fichier ?? raw.meta?.fichier ?? raw.meta?.file ?? null;
    if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
    if (typeof key === "string" && key.endsWith(".json")) return key.split("/").pop();

    const sourceKey = typeof key === "string" && DATA_URLS[key]
      ? key
      : EVALUATION_SOURCE_KEY_BY_ZONE[slug(raw.zone?.id)];
    return sourceKey ? DATA_URLS[sourceKey].split("/").pop() : null;
  }

  function normalizeEvaluations(evaluations) {
    let entries;
    if (Array.isArray(evaluations)) {
      entries = evaluations.map((raw) => [null, raw]);
    } else if (evaluations && typeof evaluations === "object" && "zone" in evaluations && "scenarios" in evaluations) {
      entries = [[null, evaluations]];
    } else if (evaluations && typeof evaluations === "object") {
      entries = Object.entries(evaluations);
    } else {
      throw new TypeError("setEvaluations attend une évaluation brute, un tableau ou un objet d’évaluations brutes.");
    }

    return entries.map(([key, raw]) => {
      const isEvaluation = raw
        && typeof raw === "object"
        && !Array.isArray(raw)
        && "zone" in raw
        && "scenarios" in raw;
      if (!isEvaluation) throw new TypeError("Chaque évaluation SEMPLICE doit être un objet JSON avec zone et scenarios.");
      return normalizeEvaluation(raw, evaluationFilename(raw, key));
    });
  }

  function maximumHorizon(nodes) {
    const values = nodes.flatMap((node) => [node.horizonMois, maximumHorizon(node.enfants || [])]).filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
  }

  function countLeaves(nodes) {
    if (!nodes?.length) return 1;
    return nodes.reduce((total, node) => total + countLeaves(node.enfants || []), 0);
  }

  function slug(value) {
    return String(value || "sans-id")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function loadSources() {
    const entries = Object.entries(DATA_URLS);
    const results = await Promise.all(entries.map(async ([key, url]) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return [key, await response.json(), true];
      } catch (_error) {
        return [key, DATA_SNAPSHOT[key], false];
      }
    }));

    const data = {};
    let loadedSources = 0;
    results.forEach(([key, value, live]) => {
      data[key] = value;
      if (live) loadedSources += 1;
    });

    state.loadedSources = loadedSources;
    state.data = data;
    state.scenarios = normalizeEvaluations({
      ormuz: data.ormuz,
      chine: data.chine,
      vietnam: data.vietnam
    });
  }

  function render() {
    renderHeader();
    renderScenarios();
    renderStreams();
    renderArchives();
    scheduleTree();
  }

  function renderHeader() {
    const allNodes = flattenScenarios(state.scenarios);
    const leaves = allNodes.filter((node) => node.type !== "zone" && (node.enfants || []).length === 0);
    const completeDistributions = state.scenarios.filter((zone) => closeToOne(zone.probabilite)).length;
    const versions = unique(state.scenarios.map((zone) => zone.source?.version).filter(Boolean));
    const dates = unique(state.scenarios.map((zone) => zone.source?.date).filter(Boolean));
    const status = document.getElementById("data-status");

    const sourceCount = Object.keys(DATA_URLS).length;
    const allSourcesLive = state.loadedSources === sourceCount;
    status.textContent = allSourcesLive
      ? `DONNÉES DU REPO · ${state.loadedSources}/${sourceCount} FLUX`
      : `INSTANTANÉ EMBARQUÉ · ${state.loadedSources}/${sourceCount} FLUX LIVE`;
    status.dataset.short = allSourcesLive
      ? `REPO ${state.loadedSources}/${sourceCount}`
      : `INSTANTANÉ ${state.loadedSources}/${sourceCount}`;
    document.getElementById("model-version").textContent = `VERSION ${versions.join(" / ") || "—"}`;
    document.getElementById("zone-count").textContent = String(state.scenarios.length).padStart(2, "0");
    document.getElementById("scenario-count").textContent = String(leaves.length).padStart(2, "0");
    document.getElementById("probability-total").textContent = `${completeDistributions}/${state.scenarios.length}`;
    document.getElementById("model-source").textContent = `ÉVALUATIONS ${dates.join(" / ") || "—"} · ${completeDistributions} DISTRIBUTIONS À 100 %`;
    document.getElementById("footer-provenance").textContent = `SEMPLICE ${versions.join(" / ") || "—"} · ${dates.join(" / ") || "—"}`;
  }

  function renderScenarios() {
    const grid = document.getElementById("scenario-grid");
    grid.replaceChildren();

    state.scenarios.forEach((zone, zoneIndex) => {
      const group = element("section", "scenario-group");
      group.setAttribute("aria-labelledby", `title-${zone.id}`);

      const zoneCard = element("article", "module module--zone");
      zoneCard.dataset.treeNode = zone.id;
      zoneCard.dataset.tooltipNode = zone.id;
      zoneCard.tabIndex = 0;
      zoneCard.setAttribute("aria-label", cardAriaLabel(zone));
      zoneCard.setAttribute("aria-describedby", "tree-tooltip");
      zoneCard.append(
        moduleHead(`ZONE/${String(zoneIndex + 1).padStart(2, "0")}`, formatDate(zone.source.date)),
        heading("h2", zone.label || "DONNÉE NON DISPONIBLE", `title-${zone.id}`),
        zoneMetrics(zone),
        sourceLine(`${zone.source.fichier || "NON RENSEIGNÉ"} · DISTRIBUTION ${formatProbability(zone.probabilite)}`)
      );

      const stack = element("div", "scenario-stack");
      zone.enfants.forEach((scenario, index) => renderScenarioBranch(stack, scenario, index, 0));
      group.append(zoneCard, stack);
      grid.append(group);
    });
  }

  function renderScenarioBranch(container, scenario, index, depth) {
    const card = element("article", "module module--scenario");
    card.dataset.treeNode = scenario.id;
    card.dataset.treeParent = scenario.parentId;
    card.dataset.tooltipNode = scenario.id;
    card.tabIndex = 0;
    card.setAttribute("aria-label", cardAriaLabel(scenario));
    card.setAttribute("aria-describedby", "tree-tooltip");
    card.style.setProperty("--scenario-depth", String(depth));
    card.style.setProperty("--subtree-leaves", String(scenario.feuilles || countLeaves(scenario.enfants)));
    const branchCode = depth > 0 ? "SUB" : "SCN";
    card.append(
      moduleHead(`${branchCode}/${String(index + 1).padStart(2, "0")}`, `SOURCE ${formatDate(scenario.source.date)}`),
      heading("h3", scenario.label || "DONNÉE NON DISPONIBLE", `title-${scenario.id}`),
      scenarioMetrics(scenario)
    );

    if (scenario.note) {
      const note = element("p", "scenario__note");
      note.textContent = scenario.note;
      card.append(note);
    }

    card.append(sourceLine(scenarioFooter(scenario)));
    container.append(card);
    scenario.enfants.forEach((child, childIndex) => renderScenarioBranch(container, child, childIndex, depth + 1));
  }

  function zoneMetrics(zone) {
    const wrapper = element("div", "zone-score");
    const score = metricBlock(zone.composite ?? "—", "SCORE COMPOSITE");
    score.dataset.tooltipHover = zone.id;
    wrapper.append(
      score,
      metricBlock(zone.statut || "—", "CLASSIFICATION")
    );
    return wrapper;
  }

  function metricBlock(value, label) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = String(value);
    span.textContent = label;
    paragraph.append(strong, span);
    return paragraph;
  }

  function scenarioMetrics(scenario) {
    const metrics = element("p", "scenario__metrics");
    metrics.append(
      metricPair("P", formatProbability(scenario.probabilite)),
      metricPair("H", scenario.horizon || "NON RENSEIGNÉ"),
      metricPair("C", scenario.confiance === null ? "NON RENSEIGNÉ" : formatProbability(scenario.confiance))
    );
    return metrics;
  }

  function scenarioFooter(scenario) {
    const status = scenario.statut || "NON RENSEIGNÉ";
    const stage = scenario.stade || "NON RENSEIGNÉ";
    const triggers = scenario.declencheurs?.length ? `${scenario.declencheurs.length}` : "NON RENSEIGNÉS";
    return `STATUT ${status} · STADE ${stage} · DÉCLENCHEURS ${triggers}`;
  }

  function metricPair(label, value) {
    const span = document.createElement("span");
    const strong = document.createElement("strong");
    span.append(`${label} `);
    strong.textContent = value;
    span.append(strong);
    return span;
  }

  function renderStreams() {
    const risks = state.data.briefing?.risk_radar || [];
    document.getElementById("risk-date").textContent = `DATE ${formatDate(state.data.briefing?.date)}`;
    document.getElementById("risk-source-count").textContent = Number.isFinite(state.data.briefing?.sources_count)
      ? `${state.data.briefing.sources_count} SOURCES DANS LE BRIEFING`
      : "SOURCES — NON RENSEIGNÉES";
    renderRows(document.getElementById("risk-list"), risks, (risk) => ({
      title: risk.risque,
      meta: [risk.severite, risk.probabilite, risk.horizon].filter(Boolean).join(" · ")
    }));

    const signals = state.data.signals?.weak_signals || [];
    const sentimentEntries = Object.entries(state.data.sentiment?.categories || {});
    document.getElementById("signal-date").textContent = `DATES ${formatDate(state.data.signals?.date)} / ${formatDate(state.data.sentiment?.date)}`;
    renderRows(document.getElementById("signal-list"), signals, (signal) => ({
      title: signal.theme || signal.title,
      meta: signal.force || "FORCE —"
    }));

    const sentimentList = document.getElementById("sentiment-list");
    sentimentList.replaceChildren();
    sentimentEntries.forEach(([category, value]) => {
      const row = element("p", "sentiment-row");
      const label = document.createElement("span");
      const metrics = document.createElement("span");
      label.textContent = category.replaceAll("_", " ");
      metrics.textContent = `${formatSigned(value.score)} · C ${formatProbability(value.confidence)} · ${value.tendance || "—"}`;
      row.append(label, metrics);
      sentimentList.append(row);
    });
  }

  function renderRows(container, rows, mapRow) {
    container.replaceChildren();
    if (rows.length === 0) {
      const missing = element("p", "scenario__missing");
      missing.textContent = "DONNÉE NON DISPONIBLE";
      container.append(missing);
      return;
    }

    rows.forEach((item, index) => {
      const values = mapRow(item);
      const row = element("div", "stream-row");
      const count = element("span", "stream-row__index");
      const title = element("p", "stream-row__title");
      const meta = element("p", "stream-row__meta");
      count.textContent = String(index + 1).padStart(2, "0");
      title.textContent = values.title || "DONNÉE NON DISPONIBLE";
      meta.textContent = values.meta || "—";
      row.append(count, title, meta);
      container.append(row);
    });
  }

  function renderArchives() {
    const names = new Map(state.scenarios.map((zone) => [zone.id, zone.label]));
    const keyToZone = { ormuz: "ormuz", chine: "mer-de-chine", vietnam: "vietnam" };
    const grid = document.getElementById("archive-grid");
    const root = document.querySelector(".archives__header");
    root.dataset.treeNode = "archive-root";
    grid.replaceChildren();

    Object.entries(state.data.history?.zones || {})
      .filter(([key]) => Object.hasOwn(keyToZone, key))
      .forEach(([key, history]) => {
        const zoneId = keyToZone[key];
        const card = element("article", "archive-card");
        const snapshots = history.snapshots || [];
        const last = snapshots.at(-1);
        const date = element("p", "archive-card__date");
        const title = heading("h3", names.get(zoneId) || zoneId, `archive-${zoneId}`);
        const series = element("div", "archive-card__series");
        card.dataset.archiveNode = `archive-${zoneId}`;
        date.textContent = last ? `DERNIER ${formatDate(last.date)}` : "DATE —";

        snapshots.forEach((snapshot) => {
          const line = document.createElement("p");
          const label = document.createElement("span");
          const value = document.createElement("strong");
          label.textContent = formatDate(snapshot.date);
          value.textContent = Number.isFinite(snapshot.composite) ? snapshot.composite.toFixed(1) : "—";
          line.append(label, value);
          series.append(line);
        });

        card.append(date, title, series);
        grid.append(card);
      });
  }

  function scheduleTree() {
    if (state.frame) return;
    state.frame = requestAnimationFrame(() => {
      state.frame = 0;
      renderTree();
    });
  }

  function renderTree() {
    const instrument = document.getElementById("instrument");
    const svg = document.getElementById("delta-tree");
    const instrumentRect = instrument.getBoundingClientRect();
    const width = instrument.clientWidth;
    const height = instrument.scrollHeight;
    const geometry = measureGeometry(instrument, instrumentRect);
    const fragment = document.createDocumentFragment();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));

    const rootRect = geometry.nodes.get("root");
    const rootCenters = weightedCenters(state.scenarios);
    state.scenarios.forEach((zone, index) => {
      const zoneRect = geometry.nodes.get(zone.id);
      if (!rootRect || !zoneRect) return;
      const rootPoint = rootBranchAnchor(rootRect, rootCenters.get(zone.id));
      const zonePoint = pointFromRect(zoneRect, "top");
      const railX = geometry.mobile
        ? Math.max(7, 34 - index * 13)
        : clamp(rootRect.left - 12 - index * 12, 8, rootRect.left - 8);
      drawRootCurve(fragment, rootPoint, zonePoint, railX, zone, `Σ ${formatProbability(zone.probabilite)} · MAX ${formatMonths(zone.horizonMois)}`, geometry.mobile);
      drawScenarioEdges(fragment, zone, geometry);
    });

    drawArchiveTree(fragment, geometry);
    svg.replaceChildren(fragment);
    if (state.activeNodeId) activateTreeNode(state.activeNodeId);
  }

  function measureGeometry(instrument, referenceRect) {
    const nodes = new Map();
    instrument.querySelectorAll("[data-tree-node]").forEach((elementNode) => {
      nodes.set(elementNode.dataset.treeNode, localRect(elementNode, referenceRect));
    });
    const archives = [...instrument.querySelectorAll("[data-archive-node]")].map((elementNode) => localRect(elementNode, referenceRect));
    return {
      nodes,
      archives,
      mobile: window.matchMedia("(max-width: 700px)").matches,
      compactLabels: instrument.clientWidth < 1100
    };
  }

  function localRect(elementNode, referenceRect) {
    const rect = elementNode.getBoundingClientRect();
    const left = rect.left - referenceRect.left;
    const top = rect.top - referenceRect.top;
    return {
      left,
      top,
      right: left + rect.width,
      bottom: top + rect.height,
      width: rect.width,
      height: rect.height
    };
  }

  function drawScenarioEdges(svg, parent, geometry) {
    const parentRect = geometry.nodes.get(parent.id);
    if (!parentRect) return;
    const orderedChildren = [...parent.enfants]
      .filter((child) => geometry.nodes.has(child.id))
      .sort((first, second) => geometry.nodes.get(first.id).top - geometry.nodes.get(second.id).top);
    const ports = geometry.mobile
      ? bottomPorts(parentRect, orderedChildren)
      : parent.type === "zone"
        ? sidePorts(parentRect, orderedChildren)
        : bottomPorts(parentRect, orderedChildren);

    orderedChildren.forEach((child, index) => {
      const childRect = geometry.nodes.get(child.id);
      if (!childRect) return;
      const label = branchLabel(child, geometry.compactLabels);
      const start = ports.get(child.id);
      const end = pointFromRect(childRect, "left");

      if (parent.type === "zone" && !geometry.mobile) {
        drawHorizontalCurve(svg, start, end, child, label, geometry.mobile);
      } else if (geometry.mobile) {
        const railX = clamp(end.x - 12 - index * 7, 10, end.x - 8);
        drawRailCurve(svg, start, end, railX, child, label, geometry.mobile);
      } else {
        drawNestedCurve(svg, start, end, child, label, geometry.mobile);
      }

      drawScenarioEdges(svg, child, geometry);
    });
  }

  function weightedCenters(children) {
    const total = children.reduce((sum, child) => sum + Math.max(1, child.feuilles || 1), 0);
    let accumulated = 0;
    return new Map(children.map((child) => {
      const weight = Math.max(1, child.feuilles || 1);
      const center = (accumulated + weight / 2) / Math.max(1, total);
      accumulated += weight;
      return [child.id, center];
    }));
  }

  function sidePorts(rect, children) {
    const centers = weightedCenters(children);
    const inset = Math.min(46, rect.height * 0.22);
    const span = Math.max(1, rect.height - inset * 2);
    return new Map(children.map((child) => [child.id, {
      x: rect.right,
      y: rect.top + inset + centers.get(child.id) * span
    }]));
  }

  function bottomPorts(rect, children) {
    const centers = weightedCenters(children);
    const inset = Math.min(42, rect.width * 0.12);
    const span = Math.max(1, rect.width - inset * 2);
    return new Map(children.map((child) => [child.id, {
      x: rect.left + inset + (1 - centers.get(child.id)) * span,
      y: rect.bottom
    }]));
  }

  function drawRootCurve(svg, start, end, railX, node, label, mobile) {
    const color = colorForHorizon(node.horizonMois);
    const strokeWidth = widthForProbability(node.probabilite);
    const direction = end.y >= start.y ? 1 : -1;
    const deltaY = Math.abs(end.y - start.y);
    const radius = Math.min(mobile ? 24 : 34, deltaY / 4);
    const firstY = start.y + direction * radius * 2;
    const lastY = end.y - direction * radius * 2;
    let d;

    if ((lastY - firstY) * direction <= 0) {
      d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + direction * radius)}, ${round(end.x)} ${round(end.y - direction * radius)}, ${round(end.x)} ${round(end.y)}`;
    } else {
      const railDelta = lastY - firstY;
      d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + direction * radius)}, ${round(railX)} ${round(start.y + direction * radius)}, ${round(railX)} ${round(firstY)} C ${round(railX)} ${round(firstY + railDelta / 3)}, ${round(railX)} ${round(firstY + railDelta * 2 / 3)}, ${round(railX)} ${round(lastY)} C ${round(railX)} ${round(end.y - direction * radius)}, ${round(end.x)} ${round(end.y - direction * radius)}, ${round(end.x)} ${round(end.y)}`;
    }
    appendInteractiveEdge(svg, node, d, color, strokeWidth);
    drawTick(svg, start.x, start.y, color, strokeWidth, node.id, mobile, false);
    drawTick(svg, end.x, end.y, color, strokeWidth, node.id, mobile);
    drawIndicators(svg, end.x + 8, end.y - 19, node, mobile);
    drawLabel(svg, end.x + 10, end.y - 34, label, node);
  }

  function drawHorizontalCurve(svg, start, end, node, label, mobile) {
    const color = colorForHorizon(node.horizonMois);
    const strokeWidth = widthForProbability(node.probabilite);
    let d;
    let labelX;
    let labelY;
    let indicatorX;
    let indicatorY;

    if (mobile) {
      const railX = 24;
      const midY = start.y + (end.y - start.y) * 0.5;
      const pull = clamp(Math.abs(start.x - railX) * 0.44, 30, 150);
      d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x - pull)} ${round(start.y)}, ${railX} ${round(start.y)}, ${railX} ${round(midY)} C ${railX} ${round(end.y)}, ${round(end.x - 22)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
      labelX = railX + 9;
      labelY = end.y - 8;
      indicatorX = railX + 3;
      indicatorY = end.y - 18;
    } else {
      const deltaX = Math.max(1, end.x - start.x);
      const pull = clamp(deltaX * curveFactor(node), 32, 180);
      d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x + pull)} ${round(start.y)}, ${round(end.x - pull)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
      labelX = start.x + 8;
      labelY = end.y - 8;
      indicatorX = end.x - Math.min(54, deltaX * 0.28);
      indicatorY = end.y - 15;
    }

    appendInteractiveEdge(svg, node, d, color, strokeWidth);
    drawTick(svg, end.x, end.y, color, strokeWidth, node.id, mobile);
    drawIndicators(svg, indicatorX, indicatorY, node, mobile);
    drawLabel(svg, labelX, labelY, label, node);
  }

  function drawRailCurve(svg, start, end, railX, node, label, mobile) {
    const color = colorForHorizon(node.horizonMois);
    const strokeWidth = widthForProbability(node.probabilite);
    const direction = end.y >= start.y ? 1 : -1;
    const deltaY = Math.abs(end.y - start.y);
    const radius = Math.min(clamp(30 - (node.profondeur || 0) * 3, 14, 30), deltaY / 4);
    const firstY = start.y + direction * radius * 2;
    const lastY = end.y - direction * radius * 2;
    let d;

    if ((lastY - firstY) * direction <= 0) {
      d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + direction * radius)}, ${round(end.x - radius)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
    } else {
      const railDelta = lastY - firstY;
      d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + direction * radius)}, ${round(railX)} ${round(start.y + direction * radius)}, ${round(railX)} ${round(firstY)} C ${round(railX)} ${round(firstY + railDelta / 3)}, ${round(railX)} ${round(firstY + railDelta * 2 / 3)}, ${round(railX)} ${round(lastY)} C ${round(railX)} ${round(end.y - direction * radius)}, ${round(end.x - radius)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
    }

    appendInteractiveEdge(svg, node, d, color, strokeWidth);
    drawTick(svg, end.x, end.y, color, strokeWidth, node.id, mobile);
    drawIndicators(svg, railX + 2, end.y - 18, node, mobile);
    drawLabel(svg, railX + 8, end.y - 8, label, node);
  }

  function drawNestedCurve(svg, start, end, node, label, mobile) {
    const color = colorForHorizon(node.horizonMois);
    const strokeWidth = widthForProbability(node.probabilite);
    const deltaY = Math.max(1, end.y - start.y);
    const deltaX = Math.abs(end.x - start.x);
    const factor = curveFactor(node);
    const verticalPull = clamp(deltaY * factor, 24, mobile ? 72 : 110);
    const horizontalPull = clamp(deltaX * factor, 20, mobile ? 52 : 90);
    const d = `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + verticalPull)}, ${round(end.x - horizontalPull)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
    appendInteractiveEdge(svg, node, d, color, strokeWidth);
    drawTick(svg, end.x, end.y, color, strokeWidth, node.id, mobile);
    drawIndicators(svg, end.x - 18, end.y - 16, node, mobile);
    drawLabel(svg, Math.max(28, end.x - 124), end.y - 8, label, node);
  }

  function drawArchiveTree(svg, geometry) {
    const rootRect = geometry.nodes.get("archive-root");
    if (!rootRect) return;
    const start = pointFromRect(rootRect, geometry.mobile ? "bottom-branch" : "right");

    geometry.archives.forEach((cardRect) => {
      const end = pointFromRect(cardRect, "left");
      const deltaX = Math.abs(end.x - start.x);
      const deltaY = Math.abs(end.y - start.y);
      const d = geometry.mobile
        ? `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + deltaY * 0.42)}, ${round(end.x - 24)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`
        : `M ${round(start.x)} ${round(start.y)} C ${round(start.x + deltaX * 0.38)} ${round(start.y)}, ${round(end.x - deltaX * 0.38)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
      svg.append(svgElement("path", { d, stroke: COLORS.archive, "stroke-width": 2, class: "tree-edge tree-edge--static" }));
      drawTick(svg, end.x, end.y, COLORS.archive, 2, null, geometry.mobile);
    });
  }

  function pointFromRect(rect, side) {
    if (side === "bottom") return { x: rect.left + rect.width * 0.72, y: rect.bottom };
    if (side === "bottom-branch") return { x: rect.left + Math.min(42, rect.width * 0.18), y: rect.bottom };
    if (side === "top") return { x: rect.left + Math.min(42, rect.width * 0.18), y: rect.top };
    if (side === "left") return { x: rect.left, y: rect.top + Math.min(46, rect.height * 0.28) };
    return { x: rect.right, y: rect.top + Math.min(46, rect.height * 0.28) };
  }

  function rootBranchAnchor(rect, center = 0.5) {
    return {
      x: rect.left + rect.width * (0.24 + clamp(center, 0, 1) * 0.52),
      y: rect.bottom
    };
  }

  function curveFactor(node) {
    return Math.max(0.22, 0.44 - (node.profondeur || 0) * 0.06);
  }

  function widthForProbability(value) {
    return Number.isFinite(value) ? round(1.25 + Math.max(0, Math.min(1, value)) * 10) : 1.25;
  }

  function colorForHorizon(months) {
    if (!Number.isFinite(months)) return COLORS.now;
    if (months <= 6) return COLORS.now;
    if (months <= 18) return COLORS.near;
    if (months <= 36) return COLORS.mid;
    return COLORS.far;
  }

  function appendInteractiveEdge(svg, node, d, color, strokeWidth) {
    svg.append(svgElement("path", {
      d,
      stroke: "transparent",
      "stroke-width": Math.max(18, strokeWidth + 10),
      class: "tree-edge-hit",
      "data-tree-id": node.id
    }));
    svg.append(svgElement("path", {
      d,
      stroke: color,
      "stroke-width": strokeWidth,
      class: "tree-edge",
      "data-tree-id": node.id,
      "data-base-width": strokeWidth,
      "data-has-triggers": node.declencheurs?.length ? "true" : "false",
      "aria-label": branchAriaLabel(node),
      style: `--active-width:${round(strokeWidth + 3)}px`
    }));
  }

  function drawTick(svg, x, y, color, strokeWidth, nodeId = null, mobile = false, interactive = true) {
    const size = Math.max(5, Math.min(mobile ? 11 : 9, strokeWidth + 2));
    const attributes = {
      x: round(x - size / 2),
      y: round(y - size / 2),
      width: round(size),
      height: round(size),
      fill: color
    };
    if (nodeId) {
      attributes.class = "tree-node";
      attributes["data-tree-id"] = nodeId;
    }
    svg.append(svgElement("rect", attributes));

    if (nodeId && interactive) {
      svg.append(svgElement("circle", {
        cx: round(x),
        cy: round(y),
        r: mobile ? 22 : 12,
        fill: "transparent",
        class: "tree-hit-target",
        "data-tree-id": nodeId,
        "aria-label": branchAriaLabel(findTreeNode(nodeId))
      }));
    }
  }

  function drawIndicators(svg, x, y, node, mobile) {
    if (node.declencheurs?.length) {
      svg.append(svgElement("circle", {
        cx: round(x),
        cy: round(y),
        r: mobile ? 4.5 : 4,
        fill: "#F4F1EA",
        stroke: COLORS.meta,
        "stroke-width": 1.25,
        class: "tree-trigger-marker",
        "data-tree-id": node.id
      }));
    }

    const tickCount = stageTickCount(node.stade);
    for (let index = 0; index < tickCount; index += 1) {
      const tickX = x + (node.declencheurs?.length ? 10 : 0) + index * 4;
      svg.append(svgElement("line", {
        x1: round(tickX),
        y1: round(y - (mobile ? 4 : 3)),
        x2: round(tickX),
        y2: round(y + (mobile ? 4 : 3)),
        stroke: COLORS.meta,
        "stroke-width": 1.5,
        class: "tree-stage-marker",
        "data-tree-id": node.id
      }));
    }
  }

  function stageTickCount(stage) {
    const value = slug(stage);
    if (value === "emergent") return 1;
    if (value === "en-cours") return 2;
    if (value === "materialise") return 3;
    return 0;
  }

  function drawLabel(svg, x, y, value, node = null) {
    const depth = Math.max(0, Math.min(3, node?.profondeur || 0));
    const text = svgElement("text", {
      x: round(x),
      y: round(y),
      class: `tree-label tree-label--depth-${depth}`
    });
    text.textContent = value;
    svg.append(text);
  }

  function svgElement(tag, attributes) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function flattenScenarios(nodes) {
    return nodes.flatMap((node) => [node, ...flattenScenarios(node.enfants || [])]);
  }

  function formatProbability(value) {
    return Number.isFinite(value) ? `${Math.round(value * 100)} %` : "NON RENSEIGNÉE";
  }

  function formatMonths(value) {
    return Number.isFinite(value) ? `${value} M` : "NON RENSEIGNÉ";
  }

  function compactHorizon(value) {
    return value ? String(value).replace(/mois/gi, "M") : "NON RENSEIGNÉ";
  }

  function branchLabel(node, compact = false) {
    const probability = formatProbability(node.probabilite);
    const stage = node.stade ? ` · ${String(node.stade).toUpperCase()}` : "";
    const horizon = node.horizon ? compactHorizon(node.horizon) : formatMonths(node.horizonMois);
    if (compact && Number.isFinite(node.probabilite) && Number.isFinite(node.horizonMois)) {
      return `P${Math.round(node.probabilite * 100)} · H${node.horizonMois}M${stage}`;
    }
    return `P = ${probability} · H = ${horizon}${stage}`;
  }

  function branchAriaLabel(node) {
    if (!node) return "Trajectoire SEMPLICE";
    const parts = [
      node.label || "Donnée non disponible",
      `${node.type === "zone" ? "distribution" : "probabilité"} ${formatProbability(node.probabilite)}`,
      `horizon ${node.horizon || formatMonths(node.horizonMois)}`
    ];
    if (node.statut) parts.push(`statut ${node.statut}`);
    if (node.stade) parts.push(`stade ${node.stade}`);
    if (node.declencheurs?.length) parts.push(`${node.declencheurs.length} déclencheur${node.declencheurs.length > 1 ? "s" : ""}`);
    return parts.join(". ");
  }

  function cardAriaLabel(node) {
    const parts = [branchAriaLabel(node)];
    if (Number.isFinite(node.composite)) parts.push(`score composite ${node.composite.toFixed(1)} sur 7`);
    if (node.dimensions?.length) {
      parts.push(node.dimensions.map((dimension) => {
        const score = Number.isFinite(dimension.score) ? `${dimension.score.toFixed(1)} sur 7` : "non renseigné";
        return `${dimension.label} ${score}`;
      }).join(". "));
    }
    return parts.join(". ");
  }

  function formatDate(value) {
    return value ? String(value).replaceAll("-", ".") : "—";
  }

  function formatSigned(value) {
    if (!Number.isFinite(value)) return "—";
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
  }

  function closeToOne(value) {
    return Number.isFinite(value) && Math.abs(value - 1) < 0.001;
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function element(tag, className) {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }

  function heading(tag, text, id) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (id) node.id = id;
    return node;
  }

  function moduleHead(code, meta) {
    const head = element("div", "module__head");
    const codeNode = element("p", "module__code");
    const metaNode = element("p", "module__meta");
    codeNode.textContent = code;
    metaNode.textContent = meta;
    head.append(codeNode, metaNode);
    return head;
  }

  function sourceLine(text) {
    const node = element("p", "module__source");
    node.textContent = text;
    return node;
  }

  function findTreeNode(id) {
    return flattenScenarios(state.scenarios).find((node) => node.id === id) || null;
  }

  function activateTreeNode(id) {
    document.querySelectorAll("[data-tree-id].is-active").forEach((node) => {
      node.classList.remove("is-active");
    });
    state.activeNodeId = id;
    if (!id) return;
    document.querySelectorAll(`[data-tree-id="${id}"]`).forEach((node) => node.classList.add("is-active"));
  }

  function showTooltip(node, clientX, clientY, anchorElement = null, pin = false) {
    const tooltip = document.getElementById("tree-tooltip");
    if (!tooltip || !node) return;
    if (pin) state.tooltipPinned = true;
    document.getElementById("tree-tooltip-code").textContent = tooltipCode(node);
    document.getElementById("tree-tooltip-title").textContent = node.label || "DONNÉE NON DISPONIBLE";
    renderTooltipData(node);
    renderTooltipDetails(node);
    tooltip.hidden = false;
    tooltip.dataset.treeId = node.id;
    activateTreeNode(node.id);
    const liveStatus = document.getElementById("tree-live-status");
    if (liveStatus) liveStatus.textContent = branchAriaLabel(node);

    if (anchorElement && (!Number.isFinite(clientX) || !Number.isFinite(clientY))) {
      const rect = anchorElement.getBoundingClientRect();
      clientX = rect.right;
      clientY = rect.top + Math.min(48, rect.height * 0.25);
    }
    positionTooltip(tooltip, clientX, clientY);
  }

  function renderTooltipData(node) {
    const list = document.getElementById("tree-tooltip-data");
    list.replaceChildren();
    const rows = [
      [node.type === "zone" ? "DISTRIBUTION" : "PROBABILITÉ", formatProbability(node.probabilite)],
      ["HORIZON", node.horizon || formatMonths(node.horizonMois)],
      ["CONFIANCE", formatProbability(node.confiance)],
      ["STATUT", node.statut || "NON RENSEIGNÉ"],
      ["STADE", node.stade || "NON RENSEIGNÉ"]
    ];
    if (node.type === "zone") rows.unshift(["COMPOSITE", Number.isFinite(node.composite) ? `${node.composite.toFixed(1)} / 7` : "NON RENSEIGNÉ"]);

    rows.forEach(([term, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = value;
      list.append(dt, dd);
    });
  }

  function renderTooltipDetails(node) {
    const details = document.getElementById("tree-tooltip-details");
    details.replaceChildren();
    appendTooltipDetail(details, "DÉCLENCHEURS", node.declencheurs?.length ? node.declencheurs.join(" · ") : "NON RENSEIGNÉS");
    appendTooltipDetail(details, "POINT DE BASCULE", node.pointBascule || "NON RENSEIGNÉ");

    if (node.dimensions?.length) {
      renderDimensionBars(details, node.dimensions);
      const dimensions = node.dimensions.map((dimension) => {
        const score = Number.isFinite(dimension.score) ? dimension.score.toFixed(1) : "—";
        const weight = Number.isFinite(dimension.poidsBase) ? formatProbability(dimension.poidsBase) : "—";
        return `${dimension.code} ${score}/7 · W ${weight}`;
      });
      appendTooltipDetail(details, "8 DIMENSIONS / POIDS DE BASE", dimensions.join(" · "));
      const amplified = node.amplificationPic?.dimensions?.length
        ? node.amplificationPic.dimensions.join(" · ")
        : "AUCUNE DONNÉE SÉRIALISÉE";
      appendTooltipDetail(details, "AXES AMPLIFIÉS", amplified);
    }

    if (node.note) appendTooltipDetail(details, "TRAJECTOIRE", node.note);
    const source = [node.source?.fichier, node.source?.date, node.source?.version && `V${node.source.version}`].filter(Boolean).join(" · ");
    appendTooltipDetail(details, "SOURCE", source || "NON RENSEIGNÉE");
  }

  function renderDimensionBars(container, dimensions) {
    const figure = element("figure", "dimension-bars");
    const caption = element("figcaption", "dimension-bars__title");
    caption.textContent = "PROFIL SEMPLICE · ÉCHELLE 1—7";
    figure.append(caption);

    dimensions.forEach((dimension) => {
      const row = element("div", "dimension-bar");
      const code = element("span", "dimension-bar__code");
      const track = element("span", "dimension-bar__track");
      const fill = element("span", "dimension-bar__fill");
      const value = element("span", "dimension-bar__value");
      const score = Number.isFinite(dimension.score) ? clamp(dimension.score, 0, 7) : null;
      code.textContent = dimension.code;
      code.title = dimension.label;
      fill.style.width = `${score === null ? 0 : round(score / 7 * 100)}%`;
      value.textContent = score === null ? "—" : score.toFixed(1);
      track.append(fill);
      row.append(code, track, value);
      figure.append(row);
    });

    container.append(figure);
  }

  function appendTooltipDetail(container, label, value) {
    const row = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${label} — `;
    row.append(strong, value);
    container.append(row);
  }

  function tooltipCode(node) {
    if (node.type === "zone") return "ZONE SEMPLICE · SURVOL DU SCORE = 8 DIMENSIONS";
    if (node.type === "sous-scenario") return "SOUS-SCÉNARIO · MÉTADONNÉES SOURCE";
    return "SCÉNARIO · MÉTADONNÉES SOURCE";
  }

  function positionTooltip(tooltip, clientX, clientY) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    const gap = 16;
    const rect = tooltip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - gap, Math.max(gap, clientX + gap));
    const top = Math.min(window.innerHeight - rect.height - gap, Math.max(gap, clientY + gap));
    tooltip.style.left = `${round(left)}px`;
    tooltip.style.top = `${round(top)}px`;
  }

  function hideTooltip(force = false) {
    if (state.tooltipPinned && !force) return;
    if (force) state.tooltipPinned = false;
    const tooltip = document.getElementById("tree-tooltip");
    if (tooltip) {
      tooltip.hidden = true;
      tooltip.removeAttribute("data-tree-id");
    }
    activateTreeNode(null);
  }

  function installInteractions() {
    const svg = document.getElementById("delta-tree");
    svg.addEventListener("pointerover", (event) => {
      if (state.tooltipPinned || event.pointerType !== "mouse") return;
      const target = event.target.closest?.("[data-tree-id]");
      if (!target) return;
      showTooltip(findTreeNode(target.dataset.treeId), event.clientX, event.clientY);
    });
    svg.addEventListener("pointermove", (event) => {
      if (state.tooltipPinned || event.pointerType !== "mouse") return;
      const tooltip = document.getElementById("tree-tooltip");
      if (!tooltip.hidden) positionTooltip(tooltip, event.clientX, event.clientY);
    });
    svg.addEventListener("pointerout", (event) => {
      if (event.pointerType !== "mouse") return;
      const from = event.target.closest?.("[data-tree-id]");
      const to = event.relatedTarget?.closest?.("[data-tree-id]");
      if (from && from.dataset.treeId !== to?.dataset.treeId) hideTooltip();
    });
    svg.addEventListener("click", (event) => {
      const target = event.target.closest?.("[data-tree-id]");
      if (!target) return;
      event.stopPropagation();
      const id = target.dataset.treeId;
      if (state.tooltipPinned && state.activeNodeId === id) {
        hideTooltip(true);
        return;
      }
      showTooltip(findTreeNode(id), event.clientX, event.clientY, null, true);
    });

    document.addEventListener("focusin", (event) => {
      const card = event.target.closest?.("[data-tooltip-node]");
      if (!card) return;
      state.tooltipPinned = false;
      showTooltip(findTreeNode(card.dataset.tooltipNode), null, null, card);
    });
    document.addEventListener("focusout", (event) => {
      if (event.target.closest?.("[data-tooltip-node]")) hideTooltip();
    });
    document.addEventListener("pointerover", (event) => {
      if (state.tooltipPinned || event.pointerType !== "mouse") return;
      const score = event.target.closest?.("[data-tooltip-hover]");
      if (!score) return;
      showTooltip(findTreeNode(score.dataset.tooltipHover), event.clientX, event.clientY);
    });
    document.addEventListener("pointerout", (event) => {
      if (event.pointerType !== "mouse") return;
      const score = event.target.closest?.("[data-tooltip-hover]");
      const nextScore = event.relatedTarget?.closest?.("[data-tooltip-hover]");
      if (score && score !== nextScore) hideTooltip();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest?.("#tree-tooltip")) return;
      const card = event.target.closest?.("[data-tooltip-node]");
      if (card) {
        const id = card.dataset.tooltipNode;
        if (state.tooltipPinned && state.activeNodeId === id) {
          hideTooltip(true);
          return;
        }
        showTooltip(findTreeNode(id), event.clientX, event.clientY, card, true);
        return;
      }
      hideTooltip(true);
    });
    document.addEventListener("keydown", (event) => {
      const card = event.target.closest?.("[data-tooltip-node]");
      if (card && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        showTooltip(findTreeNode(card.dataset.tooltipNode), null, null, card, true);
      }
      if (event.key === "Escape") hideTooltip(true);
    });
  }

  function installObservers() {
    window.addEventListener("resize", scheduleTree, { passive: true });
    window.addEventListener("orientationchange", scheduleTree, { passive: true });

    if (document.fonts?.ready) document.fonts.ready.then(scheduleTree);

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(scheduleTree);
      ["#model-root", "#scenario-grid", "#risk-radar", "#signal-matrix", "#archives", ".topbar", ".intro"].forEach((selector) => {
        const node = document.querySelector(selector);
        if (node) resizeObserver.observe(node);
      });
    }

    if ("MutationObserver" in window) {
      const mutationObserver = new MutationObserver(scheduleTree);
      ["scenario-grid", "risk-list", "signal-list", "sentiment-list", "archive-grid"].forEach((id) => {
        const node = document.getElementById(id);
        if (node) mutationObserver.observe(node, { childList: true, subtree: true, characterData: true });
      });
    }
  }

  function prepareScenarioTree(nodes, parentId = "root", depth = 0, inheritedSource = {}) {
    const collection = Array.isArray(nodes) ? nodes : Object.values(nodes || {});
    return collection.map((raw, index) => {
      const type = raw.type || (depth === 0 ? "zone" : depth === 1 ? "scenario" : "sous-scenario");
      const id = slug(raw.id || `${parentId}-${type}-${index + 1}`);
      const source = {
        fichier: raw.source?.fichier || inheritedSource.fichier || null,
        date: raw.source?.date || inheritedSource.date || null,
        version: raw.source?.version || inheritedSource.version || null,
        analyste: raw.source?.analyste || raw.source?.analyst || inheritedSource.analyste || null
      };
      const children = prepareScenarioTree(raw.enfants || raw.children || [], id, depth + 1, source);
      const knownProbabilities = children.map((child) => child.probabilite).filter(Number.isFinite);
      const probability = parseProbability(raw.probabilite ?? raw.probability);
      const dimensions = Array.isArray(raw.dimensions)
        ? raw.dimensions
        : normalizeDimensions(raw.dimensions);
      const node = {
        ...raw,
        id,
        parentId,
        type,
        profondeur: depth,
        label: raw.label || raw.titre || null,
        probabilite: Number.isFinite(probability)
          ? probability
          : type === "zone" && knownProbabilities.length === children.length && children.length
            ? knownProbabilities.reduce((sum, value) => sum + value, 0)
            : null,
        confiance: parseProbability(raw.confiance ?? raw.confidence),
        statut: raw.statut ?? raw.status ?? null,
        stade: raw.stade ?? raw.stade_materialisation ?? raw.materializationStage ?? null,
        horizon: raw.horizon ?? null,
        horizonMois: Number.isFinite(raw.horizonMois)
          ? raw.horizonMois
          : horizonMaximum(raw.horizon) ?? maximumHorizon(children),
        note: raw.note || raw.impact || raw.description || null,
        declencheurs: normalizeStringList(raw.declencheurs ?? raw.triggers),
        pointBascule: raw.pointBascule ?? raw.point_bascule ?? raw.tippingPoint ?? null,
        dimensions,
        ponderations: raw.ponderations || Object.fromEntries(dimensions.map((dimension) => [dimension.code, dimension.poidsBase ?? null])),
        amplificationPic: raw.amplificationPic || (raw.peakAmplification
          ? {
              dimensions: normalizeStringList(raw.peakAmplification.dimensionsTrigger),
              facteur: raw.peakAmplification.facteur ?? null,
              cap: raw.peakAmplification.cap ?? null,
              avant: raw.peakAmplification.compositeAvantPeak ?? null,
              apres: raw.peakAmplification.compositeApresAmp ?? null
            }
          : null),
        source,
        feuilles: countLeaves(children),
        enfants: children
      };
      return node;
    });
  }

  function applyScenarioState(nextScenarios) {
    hideTooltip(true);
    state.scenarios = nextScenarios;
    renderHeader();
    renderScenarios();
    renderArchives();
    scheduleTree();
    exposeApi();
  }

  function setScenarios(nextScenarios) {
    if (!Array.isArray(nextScenarios)) throw new TypeError("setScenarios attend un tableau scenarios[].");
    applyScenarioState(prepareScenarioTree(nextScenarios));
  }

  function setEvaluations(evaluations) {
    applyScenarioState(normalizeEvaluations(evaluations));
  }

  function exposeApi() {
    window.InflexionDeltaV2 = {
      scenarios: state.scenarios,
      setScenarios,
      setEvaluations,
      rebuild: scheduleTree,
      reload: init,
      getNode: findTreeNode,
      methodology: {
        echelle: [1, 7],
        dimensions: Object.keys(DIMENSION_WEIGHTS),
        ponderationsBase: { ...DIMENSION_WEIGHTS }
      }
    };
  }

  async function init() {
    await loadSources();
    render();
    exposeApi();
  }

  installObservers();
  installInteractions();
  init().catch((error) => {
    document.getElementById("data-status").textContent = "DONNÉES NON DISPONIBLES";
    console.error("Delta computationnel", error);
  });
})();
