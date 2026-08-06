/**
 * AtRepRenderer — Renderizador de la pestaña "AtRep" (Atracción / Repulsión).
 *
 * Misma interfaz visual que Lab_Con1: header, resumen global, scores individuales,
 * detalles de conjuntos, intersecciones descriptivas, selector de conjuntos.
 *
 * Basado en core/AtRep.md — Procesos Puntuales Espaciales.
 * ADVERTENCIA: Las métricas son puramente descriptivas de patrones pasados.
 * En eventos independientes (ruleta), NO implican causalidad ni predicción.
 */

import { AtRepEngine, SUBCONJUNTOS, UNIVERSO_RULETA } from './atRepEngine.js';
import { rouletteSettingsStore } from './rouletteSettingsStore.js';
import { createAtRepViewModel, LABELS, TONE } from './src/viewmodels/atRepViewModel.js';

// ─── Zoom persistence for AtRep ────────────────────────────
const LS_KEY_ZOOM_ATREP = 'orion_atrep_panel_zoom';
function getSavedZoom() {
  try {
    const z = localStorage.getItem(LS_KEY_ZOOM_ATREP);
    if (z) { const val = parseFloat(z); if (val >= 0.5 && val <= 1.5) return val; }
  } catch (_) {}
  return 1.0;
}
function saveZoom(z) {
  try { localStorage.setItem(LS_KEY_ZOOM_ATREP, z.toString()); } catch (_) {}
}

export class AtRepRenderer {
  /**
   * @param {string} containerId — ID del contenedor (ej. 'view-at-rep')
   * @param {object} domainTracker — Instancia del Domain Tracker
   */
  constructor(containerId, domainTracker) {
    this.containerId = containerId;
    this.tracker = domainTracker;
    this.engine = new AtRepEngine(domainTracker);
    this._selectedSetNames = new Set();
    this._initialized = false;
    this._vm = null; // ViewModel se construye en cada update()
  }

  init() {
    if (this._initialized) return;
    this._setupDefaultSets();
    this._initialized = true;
  }

  _setupDefaultSets() {
    // Por defecto: todas las apuestas externas (suertes sencillas, docenas, columnas)
    const defaults = ['Rojo', 'Negro', 'Par', 'Impar', 'Falta', 'Pasa',
      'Docena1', 'Docena2', 'Docena3',
      'Columna1', 'Columna2', 'Columna3'];
    defaults.forEach(n => this._selectedSetNames.add(n));
  }

  toggleSet(setName) {
    if (this._selectedSetNames.has(setName)) {
      this._selectedSetNames.delete(setName);
    } else {
      this._selectedSetNames.add(setName);
    }
  }

  get activeSets() {
    return Array.from(this._selectedSetNames);
  }

  update() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`[AtRepRenderer] Contenedor #${this.containerId} no encontrado`);
      return;
    }
    container.innerHTML = '';
    container.appendChild(this._buildLayout());

    // ─── Zoom slider listener ─────────────────────────────
    const zoomSlider = document.getElementById('atrep-zoom-slider');
    const zoomValue = document.getElementById('atrep-zoom-value');
    const zoomContent = document.getElementById('atrep-zoomable-content');
    if (zoomSlider && zoomValue && zoomContent) {
      zoomSlider.addEventListener('input', (e) => {
        const zoomPct = e.target.value;
        zoomValue.textContent = zoomPct + '%';
        const zoomFloat = parseInt(zoomPct) / 100;
        zoomContent.style.zoom = zoomFloat;
        saveZoom(zoomFloat);
      });
    }
  }

  // ── Construcción del layout ──────────────────────────────

  _buildLayout() {
    const currentZoom = getSavedZoom();
    const root = document.createElement('div');
    root.style.cssText = 'padding:16px;font-family:monospace;color:#e2e8f0;min-height:100%;box-sizing:border-box;';

    // Refrescar engine con datos actuales
    this.engine.refresh();

    // Construir ViewModel serializable
    const settings = rouletteSettingsStore.getSnapshot();
    const maxWindow = settings?.atrasosMaxWindow ?? 100;
    this._vm = createAtRepViewModel(this.engine, this.activeSets, {
      disclaimer: null, // usa el default de LABELS
      pciTooltip: null
    });

    // Agregar metadatos de ventana que el VM no tiene
    this._vm._meta.maxWindowFromSettings = maxWindow;

    // ─── Zoom Control Bar ────────────────────────────────
    const controlBar = document.createElement('div');
    controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    controlBar.innerHTML = `
      <div></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:0.25rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
        <label for="atrep-zoom-slider" style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">Zoom:</label>
        <input type="range" id="atrep-zoom-slider" min="50" max="150" value="${Math.round(currentZoom * 100)}" style="width:80px;height:4px;accent-color:var(--color-gold);cursor:pointer;">
        <span id="atrep-zoom-value" style="font-size:0.7rem;color:var(--color-gold);font-family:var(--font-numbers);font-weight:bold;min-width:35px;text-align:right;">${Math.round(currentZoom * 100)}%</span>
      </div>
    `;
    root.appendChild(controlBar);

    // ─── Zoomable Content ─────────────────────────────────
    const zoomContent = document.createElement('div');
    zoomContent.id = 'atrep-zoomable-content';
    zoomContent.style.zoom = currentZoom;

    zoomContent.appendChild(this._createHeader());
    zoomContent.appendChild(this._createDisclaimer());
    zoomContent.appendChild(this._createGlobalSummary());
    zoomContent.appendChild(this._createScoreSection());
    zoomContent.appendChild(this._createSetDetails());
    zoomContent.appendChild(this._createIntersections());
    zoomContent.appendChild(this._createSetSelector());

    root.appendChild(zoomContent);
    return root;
  }

  // ── Header ───────────────────────────────────────────────

  _createHeader() {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;';
    header.innerHTML = `
      <h2 style="margin:0;font-size:1.3rem;font-weight:700;color:#fbbf24;letter-spacing:1px;">
        🧲 ${this._vm.title} <span style="font-size:0.75rem;color:#94a3b8;font-weight:400;">(${this._vm.subtitle})</span>
      </h2>
      <span style="font-size:0.7rem;color:#64748b;">${this._vm.referenceText}</span>
    `;
    return header;
  }

  // ── Disclaimer ───────────────────────────────────────────

  _createDisclaimer() {
    const el = document.createElement('div');
    el.style.cssText = `
      margin-bottom:12px;padding:6px 10px;border-radius:4px;
      background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);
      font-size:0.7rem;color:#fbbf24;line-height:1.4;
    `;
    el.setAttribute('role', 'note');
    el.setAttribute('aria-label', this._vm.disclaimer);
    el.textContent = '⚠️ ' + this._vm.disclaimer;
    return el;
  }

  // ── Resumen Global ───────────────────────────────────────

  _createGlobalSummary() {
    const vm = this._vm;
    const cards = vm.summaryCards;

    const summaryEl = document.createElement('div');
    summaryEl.style.cssText = `
      display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
      gap:10px;margin-bottom:16px;
    `;

    const accentFor = (tone) => {
      switch (tone) {
        case TONE.ATTRACTION: return '#34d399';
        case TONE.REPULSION: return '#ef4444';
        case TONE.SUCCESS: return '#34d399';
        case TONE.WARNING: return '#fbbf24';
        default: return '#fbbf24';
      }
    };

    cards.forEach(card => {
      const accent = accentFor(card.tone);

      const cardEl = document.createElement('div');
      cardEl.style.cssText = `
        background:linear-gradient(145deg,#1e293b,#0f172a);
        border:1px solid #334155;border-radius:8px;padding:10px 14px;
        text-align:center;
      `;
      cardEl.setAttribute('role', 'region');
      cardEl.setAttribute('aria-label', `${card.label}: ${card.value ?? card.items?.length ?? 0}`);

      let valueHtml = '';
      if (card.items) {
        if (card.items.length > 0) {
          valueHtml = card.items.map(s =>
            `<span style="color:${accent};font-weight:700;">${s.label}</span> <span style="color:#64748b;font-size:0.65rem;">(${s.pciFormatted})</span>`
          ).join(', ');
        } else {
          valueHtml = '<span style="color:#64748b;">—</span>';
        }
      } else {
        valueHtml = typeof card.value === 'number'
          ? card.value.toLocaleString()
          : card.value;
      }

      cardEl.innerHTML = `
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${card.label}</div>
        <div style="font-size:1.5rem;font-weight:700;color:${accent};margin:4px 0;">${valueHtml}</div>
        ${card.detail ? `<div style="font-size:0.65rem;color:#64748b;">${card.detail}</div>` : ''}
      `;
      summaryEl.appendChild(cardEl);
    });

    return summaryEl;
  }

  // ── Scores Individuales (formato Plenos) ──────────────────

  _circleStyle(pci, tone) {
    if (pci === null) {
      return { bg: '#1e293b', color: '#475569', shadow: 'none' };
    }
    if (tone === TONE.ATTRACTION) {
      const intensity = Math.min(Math.max((pci - 1.05) / 0.3, 0), 1);
      return {
        bg: `rgba(52,211,153,${0.2 + intensity * 0.55})`,
        color: intensity > 0.6 ? '#064e3b' : '#34d399',
        shadow: `0 0 6px rgba(52,211,153,${0.15 + intensity * 0.4})`
      };
    }
    if (tone === TONE.REPULSION) {
      const intensity = Math.min(Math.max((1.05 - pci) / 0.3, 0), 1);
      return {
        bg: `rgba(239,68,68,${0.2 + intensity * 0.55})`,
        color: intensity > 0.6 ? '#450a0a' : '#ef4444',
        shadow: `0 0 6px rgba(239,68,68,${0.15 + intensity * 0.4})`
      };
    }
    // CSR / neutral
    return { bg: '#334155', color: '#64748b', shadow: 'none' };
  }

  _formatPci(val) {
    if (val === null || val === undefined) return '—';
    return val.toFixed(2);
  }

  _createScoreSection() {
    const vm = this._vm;
    const scores = vm.scoreGrid;

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;">
      🧲 ${LABELS.SCORES_SECTION}
    </h3>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';

    scores.forEach(score => {
      const tone = score.tone;
      const indTone = this._toneForPci(score.individualPci);
      const indStyle = this._circleStyle(score.individualPci, indTone);

      // Card background tint based on overall tone
      let cardBg, cardBorder;
      if (score.pci === null) {
        cardBg = '#1e293b';
        cardBorder = '#1e293b';
      } else if (tone === TONE.ATTRACTION) {
        cardBg = 'rgba(52,211,153,0.06)';
        cardBorder = 'rgba(52,211,153,0.25)';
      } else if (tone === TONE.REPULSION) {
        cardBg = 'rgba(239,68,68,0.06)';
        cardBorder = 'rgba(239,68,68,0.25)';
      } else {
        cardBg = '#1e293b';
        cardBorder = '#334155';
      }

      const card = document.createElement('div');
      card.style.cssText = `
        display:flex;align-items:center;background:${cardBg};
        border:1px solid ${cardBorder};border-radius:8px;
        padding:3px 8px;gap:6px;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);
      `;

      const indFormatted = this._formatPci(score.individualPci);

      card.innerHTML = `
        <span style="font-weight:600;font-size:0.85rem;
          text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${score.label}</span>
        <div style="display:flex;align-items:center;gap:4px;margin-left:auto;">
          <div title="PCI individual: ${indFormatted}" style="
            background:${indStyle.bg};color:${indStyle.color};
            box-shadow:${indStyle.shadow};
            border-radius:50%;width:28px;height:28px;
            display:flex;align-items:center;justify-content:center;
            font-size:0.6rem;font-weight:bold;flex-shrink:0;line-height:1;
          ">${indFormatted}</div>
        </div>
      `;

      card.title = score.ariaLabel;
      grid.appendChild(card);
    });

    section.appendChild(grid);

    // Leyenda
    const legend = document.createElement('div');
    legend.style.cssText = 'margin-top:6px;font-size:0.65rem;color:#64748b;display:flex;gap:12px;flex-wrap:wrap;';
    legend.innerHTML = `
      <span style="display:flex;align-items:center;gap:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#34d399;display:inline-block;"></span> PCI &gt; 1.05 = Atracción</span>
      <span style="display:flex;align-items:center;gap:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block;"></span> PCI &lt; 0.95 = Repulsión</span>
      <span style="display:flex;align-items:center;gap:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#64748b;display:inline-block;"></span> 0.95 ≤ PCI ≤ 1.05 = CSR</span>
      <span style="margin-left:auto;color:#64748b;">1<sup>er</sup> círculo: individual · 2<sup>º</sup> círculo: grupal</span>
    `;
    section.appendChild(legend);

    return section;
  }

  _toneForPci(pci) {
    if (pci === null || pci === undefined) return null;
    if (pci > 1.05) return TONE.ATTRACTION;
    if (pci < 0.95) return TONE.REPULSION;
    return TONE.CSR;
  }

  // ── Detalles de Conjuntos ────────────────────────────────

  _createSetDetails() {
    const vm = this._vm;
    const setDetails = vm.setDetails;

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#34d399;text-transform:uppercase;letter-spacing:1px;">
      📊 ${LABELS.SET_DETAILS}
    </h3>`;

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.7rem;';

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#1e293b;border-bottom:2px solid #334155;">
        <th style="padding:6px 8px;text-align:left;color:#94a3b8;">Conjunto</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Ocurrencias</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Media Obs.</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Media Esp.</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">PCI</th>
        <th style="padding:6px 8px;text-align:center;color:#94a3b8;">${LABELS.LECTURA_DESCRIPTIVA}</th>
      </tr>`;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    setDetails.forEach(d => {
      const tr = document.createElement('tr');
      const isAttr = d.tone === TONE.ATTRACTION;
      const isRep = d.tone === TONE.REPULSION;
      const bgColor = isAttr ? 'rgba(52,211,153,0.08)' : isRep ? 'rgba(239,68,68,0.08)' : '';
      tr.style.cssText = `border-bottom:1px solid #1e293b;${bgColor ? `background:${bgColor}` : ''}`;

      const pciColor = isAttr ? '#34d399' : isRep ? '#ef4444' : '#64748b';

      tr.innerHTML = `
        <td style="padding:5px 8px;font-weight:600;">${d.label}</td>
        <td style="padding:5px 8px;text-align:right;color:#94a3b8;">${d.occurrences}</td>
        <td style="padding:5px 8px;text-align:right;color:#94a3b8;">${d.meanDistFormatted}</td>
        <td style="padding:5px 8px;text-align:right;color:#94a3b8;">${d.expectedDistFormatted}</td>
        <td style="padding:5px 8px;text-align:right;color:${pciColor};font-weight:700;">${d.pciFormatted}</td>
        <td style="padding:5px 8px;text-align:center;font-size:0.65rem;color:${pciColor};">${d.verdict}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);

    // Leyenda
    const legend = document.createElement('div');
    legend.style.cssText = 'margin-top:6px;font-size:0.65rem;color:#64748b;display:flex;gap:12px;flex-wrap:wrap;';
    legend.innerHTML = `
      <span>🟢 <span style="color:#34d399;">PCI > 1.05</span> = Atracción (Media obs. &lt; Media esp.)</span>
      <span>🔴 <span style="color:#ef4444;">PCI < 0.95</span> = Repulsión (Media obs. &gt; Media esp.)</span>
      <span>⚪ <span style="color:#94a3b8;">PCI ≈ 1</span> = CSR (compatible con independencia)</span>
    `;
    section.appendChild(legend);

    return section;
  }

  // ── Intersecciones Descriptivas ──────────────────────────

  _createIntersections() {
    const vm = this._vm;

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';

    if (!vm.hasIntersections) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = 'color:#64748b;font-size:0.75rem;font-style:italic;margin-bottom:16px;';
      emptyMsg.textContent = LABELS.NO_INTERSECCIONES;
      section.appendChild(emptyMsg);
      return section;
    }

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#a78bfa;text-transform:uppercase;letter-spacing:1px;">
      ⚡ ${LABELS.INTERSECCIONES}
    </h3>`;

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.7rem;';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#1e293b;border-bottom:2px solid #334155;">
        <th style="padding:6px 8px;text-align:left;color:#94a3b8;">Intersección</th>
        <th style="padding:6px 8px;text-align:left;color:#94a3b8;">Números</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Cobertura</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">PCI Prom.</th>
        <th style="padding:6px 8px;text-align:center;color:#94a3b8;">${LABELS.LECTURA_DESCRIPTIVA}</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    vm.intersections.forEach(inter => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom:1px solid #1e293b;';

      const isAttr = inter.tone === TONE.ATTRACTION;
      const isRep = inter.tone === TONE.REPULSION;
      const pciColor = isAttr ? '#34d399' : isRep ? '#ef4444' : '#64748b';

      tr.innerHTML = `
        <td style="padding:5px 8px;font-weight:600;color:#a78bfa;">${inter.label}</td>
        <td style="padding:5px 8px;color:#94a3b8;">${inter.numbersDisplay}</td>
        <td style="padding:5px 8px;text-align:right;color:#fbbf24;">${inter.count}</td>
        <td style="padding:5px 8px;text-align:right;color:${pciColor};font-weight:700;">${inter.avgPciFormatted}</td>
        <td style="padding:5px 8px;text-align:center;font-size:0.65rem;color:${pciColor};">${inter.verdict}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    return section;
  }

  // ── Selector de Conjuntos ────────────────────────────────

  _createSetSelector() {
    const vm = this._vm;

    const section = document.createElement('div');
    section.style.cssText = 'margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;';

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
      🔘 ${LABELS.SELECTOR_TITLE}
    </h3>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';

    vm.setSelector.forEach(set => {
      const btn = document.createElement('button');
      btn.textContent = set.label;
      btn.style.cssText = `
        padding:4px 10px;border-radius:4px;cursor:pointer;
        font-size:0.7rem;font-family:monospace;transition:all 0.15s;
        background:${set.selected ? '#3b82f6' : '#1e293b'};
        color:${set.selected ? '#fff' : '#94a3b8'};
        border:1px solid ${set.selected ? '#3b82f6' : '#334155'};
      `;
      btn.setAttribute('aria-pressed', String(set.selected));
      btn.setAttribute('aria-label', `${set.label}: ${set.selected ? 'seleccionado' : 'no seleccionado'}`);

      btn.addEventListener('click', () => {
        this.toggleSet(set.name);
        this.update();
      });

      grid.appendChild(btn);
    });

    section.appendChild(grid);
    return section;
  }
}
