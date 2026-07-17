(function () {
  var prototypeRadarAnchor = 'prototypes/identity-v2/expertise.html#radar-title';

  function riskColor(score) {
    if (score >= 5.5) return '#DC2626';
    if (score >= 4) return '#F59E0B';
    if (score >= 2.5) return '#C8955A';
    return '#006650';
  }

  function opportunityColor(score) {
    if (score >= 5) return '#006650';
    if (score >= 3.5) return '#33B894';
    if (score >= 2) return '#C8955A';
    return '#DC2626';
  }

  function contrastRatio(hexA, hexB) {
    function luminance(hex) {
      var channels = hex.replace('#', '').match(/.{2}/g).map(function (value) {
        var channel = parseInt(value, 16) / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    var light = Math.max(luminance(hexA), luminance(hexB));
    var dark = Math.min(luminance(hexA), luminance(hexB));
    return (light + 0.05) / (dark + 0.05);
  }

  function scoreBadge(value, color, label) {
    var badge = document.createElement('span');
    badge.className = 'v2-score';
    badge.style.setProperty('--score-color', color);
    badge.textContent = value.toFixed(1);
    badge.setAttribute('aria-label', label + ' : ' + value.toFixed(1) + ' sur 7');
    return badge;
  }

  function textCell(text, className) {
    var cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
  }

  function dominantDimension(zone) {
    var index = zone.scores.reduce(function (best, value, current) {
      return value > zone.scores[best] ? current : best;
    }, 0);
    return SEMPLICE_DIM_SHORT[index] + ' · ' + SEMPLICE_DIM_LABELS[index];
  }

  function renderEvaluations() {
    var tbody = document.getElementById('evaluation-table-body');
    var count = document.getElementById('evaluation-count');
    if (!tbody || typeof SEMPLICE_ZONES === 'undefined') return;

    var zones = SEMPLICE_ZONES.slice().sort(function (a, b) {
      return b.composite - a.composite;
    });

    zones.forEach(function (zone) {
      var row = document.createElement('tr');
      row.style.setProperty('--series-color', zone.color);
      row.appendChild(textCell(zone.name));

      var risk = document.createElement('td');
      risk.appendChild(scoreBadge(zone.composite, riskColor(zone.composite), 'Risque'));
      row.appendChild(risk);
      row.appendChild(textCell(zone.level, 'v2-level'));

      var opportunity = document.createElement('td');
      if (zone.oppComposite == null) {
        opportunity.textContent = '—';
      } else {
        opportunity.appendChild(scoreBadge(zone.oppComposite, opportunityColor(zone.oppComposite), 'Opportunité'));
      }
      row.appendChild(opportunity);
      row.appendChild(textCell(zone.oppLevel || 'Indisponible', 'v2-level'));
      row.appendChild(textCell(dominantDimension(zone), 'v2-dominant'));

      var analysis = document.createElement('td');
      if (zone.href && zone.href !== '#') {
        var link = document.createElement('a');
        link.href = zone.href;
        link.textContent = 'Lire →';
        link.setAttribute('aria-label', 'Lire l’analyse : ' + zone.name);
        analysis.appendChild(link);
      } else {
        analysis.textContent = '—';
      }
      row.appendChild(analysis);
      tbody.appendChild(row);
    });

    if (count) count.textContent = String(zones.length).padStart(2, '0');
  }

  function renderRadarData() {
    var tbody = document.getElementById('radar-data-body');
    var caption = document.getElementById('radar-data-caption');
    if (!tbody) return;

    var activeModeButton = document.querySelector('#radar-mode button[aria-pressed="true"]');
    var modeText = activeModeButton ? activeModeButton.textContent : 'Risque';
    var mode = modeText.indexOf('Opportunité') >= 0 ? 'opportunity' : modeText.indexOf('Combiné') >= 0 ? 'combined' : 'risk';
    var activeNames = Array.from(document.querySelectorAll('#radar-controls button[aria-pressed="true"]')).map(function (button) {
      return button.textContent;
    });
    var activeZones = SEMPLICE_ZONES.filter(function (zone) { return activeNames.indexOf(zone.name) >= 0; });

    tbody.replaceChildren();
    activeZones.forEach(function (zone) {
      var row = document.createElement('tr');
      row.appendChild(textCell(zone.name));
      zone.scores.forEach(function (riskValue, index) {
        var opportunityValue = zone.opp ? zone.opp[index] : null;
        var value = mode === 'combined'
          ? 'R ' + riskValue + ' / O ' + (opportunityValue == null ? '—' : opportunityValue)
          : mode === 'opportunity'
            ? (opportunityValue == null ? '—' : String(opportunityValue))
            : String(riskValue);
        row.appendChild(textCell(value));
      });
      tbody.appendChild(row);
    });

    if (!activeZones.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 9;
      emptyCell.textContent = 'Sélectionnez au moins une zone dans les contrôles du radar.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    }

    if (caption) {
      caption.textContent = 'Valeurs dimensionnelles des séries actives en lecture ' + (mode === 'combined' ? 'combinée' : mode === 'opportunity' ? 'opportunité' : 'risque');
    }
  }

  function syncGeneratedRadarUi() {
    ['radar-mode', 'radar-controls'].forEach(function (id) {
      var container = document.getElementById(id);
      if (!container) return;
      container.querySelectorAll('button').forEach(function (button) {
        button.type = 'button';
        button.setAttribute('aria-controls', 'semplice-radar radar-legend');
        button.setAttribute('aria-pressed', String(button.style.color.toLowerCase() === 'white'));
        if (id === 'radar-controls') {
          var zone = SEMPLICE_ZONES.find(function (item) { return item.name === button.textContent; });
          if (zone) button.dataset.foreground = contrastRatio(zone.color, '#FFFFFF') >= 4.5 ? 'light' : 'dark';
        }
      });
    });

    var legend = document.getElementById('radar-legend');
    if (legend) {
      legend.querySelectorAll('a').forEach(function (link) {
        if (link.getAttribute('href') === '#') link.href = prototypeRadarAnchor;
      });
    }
    renderRadarData();
  }

  function observeGeneratedRadarUi() {
    ['radar-mode', 'radar-controls', 'radar-legend'].forEach(function (id) {
      var container = document.getElementById(id);
      if (!container) return;
      new MutationObserver(syncGeneratedRadarUi).observe(container, { childList: true });
    });
  }

  renderEvaluations();
  syncGeneratedRadarUi();
  observeGeneratedRadarUi();
})();
