/**
 * ConjuntosRenderer — Renderizador de la pestaña "Conjuntos".
 * Misma interfaz visual que Lab_Con, pero usando la teoría de conjuntos basada en atrasos.
 * 
 * Referencia: LabEngine y Atrasos como fuente de datos.
 * Muestra el análisis de conjuntos ponderados por atrasos.
 */
import { LabEngine, SUBCONJUNTOS, UNIVERSO_RULETA } from './labEngine.js';
import { rouletteSettingsStore } from './rouletteSettingsStore.js';

// ─── Zoom persistence for Conjuntos ─────────────────────────
const LS_KEY_ZOOM_LC1 = 'orion_conjuntos_panel_zoom';
function getSavedZoom() {
  try {
    const z = localStorage.getItem(LS_KEY_ZOOM_LC1);
    if (z) { const val = parseFloat(z); if (val >= 0.5 && val <= 1.5) return val; }
  } catch (_) {}
  return 1.0;
}
function saveZoom(z) {
  try { localStorage.setItem(LS_KEY_ZOOM_LC1, z.toString()); } catch (_) {}
}

export class ConjuntosRenderer {
  /**
   * @param {string} containerId — ID del contenedor donde se montará la UI (ej. 'view-conjuntos')
   * @param {object} domainTracker — Instancia del Domain Tracker
   */
  constructor(containerId, domainTracker) {
    this.containerId = containerId;
    this.tracker = domainTracker;
    this.engine = new LabEngine(domainTracker);
    this.selectedSets = [];
    this._selectedSetNames = new Set();
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._setupDefaultSets();
    this._initialized = true;
  }

  /**
   * Arma la lógica de selección de conjuntos y renderiza
   */
  _setupDefaultSets() {
    // Por defecto seleccionar todos los conjuntos de apuestas externas
    const defaultSets = [
      'Rojo', 'Negro', 'Par', 'Impar',
      '1a Docena', '2a Docena', '3a Docena',
      'Columna 1', 'Columna 2', 'Columna 3'
    ];
    this._setSelected(defaultSets);
  }

  _setSelected(setNames) {
    this.selectedSets = setNames;
    this._selectedSetNames = new Set(setNames);
  }

  toggleSet(setName) {
    if (this._selectedSetNames.has(setName)) {
      this._selectedSetNames.delete(setName);
    } else {
      this._selectedSetNames.add(setName);
    }
    this.selectedSets = Array.from(this._selectedSetNames);
  }

  update() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`[ConjuntosRenderer] Contenedor #${this.containerId} no encontrado`);
      return;
    }
    container.innerHTML = '';
    container.appendChild(this._buildLayout());

    // ─── Zoom slider listener ─────────────────────────────
    const zoomSlider = document.getElementById('conjuntos-zoom-slider');
    const zoomValue = document.getElementById('conjuntos-zoom-value');
    const zoomContent = document.getElementById('conjuntos-zoomable-content');
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

  _buildLayout() {
    const currentZoom = getSavedZoom();
    const root = document.createElement('div');
    root.style.cssText = 'padding:16px;font-family:monospace;color:#e2e8f0;min-height:100%;box-sizing:border-box;';

    // ─── Zoom Control Bar ────────────────────────────────
    const controlBar = document.createElement('div');
    controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    controlBar.innerHTML = `
      <div></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:0.25rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
        <label for="conjuntos-zoom-slider" style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">Zoom:</label>
        <input type="range" id="conjuntos-zoom-slider" min="50" max="150" value="${Math.round(currentZoom * 100)}" style="width:80px;height:4px;accent-color:var(--color-gold);cursor:pointer;">
        <span id="conjuntos-zoom-value" style="font-size:0.7rem;color:var(--color-gold);font-family:var(--font-numbers);font-weight:bold;min-width:35px;text-align:right;">${Math.round(currentZoom * 100)}%</span>
      </div>
    `;
    root.appendChild(controlBar);

    // ─── Zoomable Content ─────────────────────────────────
    const zoomContent = document.createElement('div');
    zoomContent.id = 'conjuntos-zoomable-content';
    zoomContent.style.zoom = currentZoom;

    zoomContent.appendChild(this._createHeader());
    zoomContent.appendChild(this._createGlobalSummary());
    zoomContent.appendChild(this._createScoreSection());
    zoomContent.appendChild(this._createSetDetails());
    zoomContent.appendChild(this._createIntersections());
    zoomContent.appendChild(this._createSetSelector());

    root.appendChild(zoomContent);
    return root;
  }

  _createHeader() {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;';
    header.innerHTML = `
      <h2 style="margin:0;font-size:1.3rem;font-weight:700;color:#fbbf24;letter-spacing:1px;">
        🎯 Conjuntos <span style="font-size:0.75rem;color:#94a3b8;font-weight:400;">(Atrasos Data)</span>
      </h2>
      <span style="font-size:0.7rem;color:#64748b;">Fuente: Atrasos · Conjuntos ponderados por retraso</span>
    `;
    return header;
  }

  _createGlobalSummary() {
    const spins = (this.tracker && typeof this.tracker.getSpins === 'function')
      ? this.tracker.getSpins() : [];
    const totalSpins = spins.length;

    const settings = rouletteSettingsStore.getSnapshot();
    const maxWindow = settings?.atrasosMaxWindow ?? 100;
    const muestraActiva = Math.min(totalSpins, maxWindow);

    // Números con mayor score Atrasos
    const scores = this.engine.resolverScoresIndividuales(this.selectedSets);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topNums = sorted.slice(0, 5).filter(([, v]) => v > 0);

    const activeCount = this.selectedSets.filter(s => {
      const stats = this.engine._getSetStats(s);
      return stats.isActive;
    }).length;

    const summary = document.createElement('div');
    summary.style.cssText = `
      display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
      gap:10px;margin-bottom:16px;
    `;

    const makeCard = (label, value, sub, accentColor = '#fbbf24') => {
      const card = document.createElement('div');
      card.style.cssText = `
        background:linear-gradient(145deg,#1e293b,#0f172a);
        border:1px solid #334155;border-radius:8px;padding:10px 14px;
        text-align:center;
      `;
      card.innerHTML = `
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${label}</div>
        <div style="font-size:1.5rem;font-weight:700;color:${accentColor};margin:4px 0;">${value}</div>
        ${sub ? `<div style="font-size:0.65rem;color:#64748b;">${sub}</div>` : ''}
      `;
      return card;
    };

    summary.appendChild(makeCard('Total Spins', totalSpins, ''));
    summary.appendChild(makeCard('Muestra Activa', muestraActiva, `ventana: ${maxWindow}`, '#34d399'));
    summary.appendChild(makeCard('Conjuntos Activos', this.selectedSets.length, `${activeCount} en racha`));
    summary.appendChild(makeCard(
      'Top Números',
      topNums.length > 0 ? topNums.map(([n]) => n).join(', ') : '—',
      topNums.length > 0 ? `Score: ${topNums[0][1].toFixed(3)}` : ''
    ));

    return summary;
  }

  _createScoreSection() {
    const scores = this.engine.resolverScoresIndividuales(this.selectedSets);
    const topThreshold = Math.max(...Object.values(scores), 0.001);

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;">
      🧬 Scores Individuales (Atrasos)
    </h3>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;';

    UNIVERSO_RULETA.forEach(num => {
      const score = scores[num];
      const pct = topThreshold > 0 ? score / topThreshold : 0;
      const intensity = Math.min(Math.floor(pct * 220), 220);

      const chip = document.createElement('div');
      const isActive = score > 0;
      chip.style.cssText = `
        width:32px;height:32px;display:flex;align-items:center;justify-content:center;
        border-radius:4px;font-size:0.65rem;font-weight:600;
        background:${isActive ? `rgba(251,191,36,${0.2 + pct * 0.6})` : '#1e293b'};
        color:${isActive ? '#fbbf24' : '#475569'};
        border:${isActive ? '1px solid rgba(251,191,36,0.3)' : '1px solid #1e293b'};
      `;
      chip.textContent = num === '00' ? '00' : num;
      chip.title = `${num}: ${score.toFixed(4)}`;
      grid.appendChild(chip);
    });

    section.appendChild(grid);
    return section;
  }

  _createSetDetails() {
    const details = this.engine.getSetDetails(this.selectedSets);

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#34d399;text-transform:uppercase;letter-spacing:1px;">
      📊 Detalles de Conjuntos (Atrasos)
    </h3>`;

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.7rem;';

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#1e293b;border-bottom:2px solid #334155;">
        <th style="padding:6px 8px;text-align:left;color:#94a3b8;">Conjunto</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Racha</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Atraso</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Giros</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Peso WW</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Prob.</th>
      </tr>`;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    details.forEach(d => {
      const tr = document.createElement('tr');
      tr.style.cssText = `border-bottom:1px solid #1e293b;${
        d.isActive ? 'background:rgba(52,211,153,0.08);' : ''
      }`;

      const levelDisplay = d.level || '—';
      const levelColor = d.isActive ? '#34d399' : '#64748b';

      tr.innerHTML = `
        <td style="padding:5px 8px;font-weight:600;">${d.name}</td>
        <td style="padding:5px 8px;text-align:right;color:${levelColor};">${levelDisplay}</td>
        <td style="padding:5px 8px;text-align:right;color:${d.isActive ? '#34d399' : '#94a3b8'};">${d.actualDelay}</td>
        <td style="padding:5px 8px;text-align:right;color:#94a3b8;">${d.distsCount}</td>
        <td style="padding:5px 8px;text-align:right;color:#fbbf24;font-weight:700;">${d.weight.toFixed(4)}</td>
        <td style="padding:5px 8px;text-align:right;color:#64748b;">${(d.hitProbability * 100).toFixed(1)}%</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);

    // Leyenda
    const legend = document.createElement('div');
    legend.style.cssText = 'margin-top:6px;font-size:0.65rem;color:#64748b;display:flex;gap:12px;';
    legend.innerHTML = `
      <span>🟢 <span style="color:#34d399;">Racha activa</span> (últimos giros ≤ threshold)</span>
      <span>⚪ <span style="color:#94a3b8;">Sin racha</span></span>
    `;
    section.appendChild(legend);

    return section;
  }

  _createIntersections() {
    const intersections = this.engine.buscarInterseccionesOptimas(this.selectedSets, 5);

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';

    if (intersections.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = 'color:#64748b;font-size:0.75rem;font-style:italic;margin-bottom:16px;';
      emptyMsg.textContent = 'No se encontraron intersecciones con peso suficiente. Agrega más conjuntos.';
      section.appendChild(emptyMsg);
      return section;
    }

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#a78bfa;text-transform:uppercase;letter-spacing:1px;">
      ⚡ Intersecciones Óptimas (Atrasos)
    </h3>`;

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.7rem;';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#1e293b;border-bottom:2px solid #334155;">
        <th style="padding:6px 8px;text-align:left;color:#94a3b8;">Combinación</th>
        <th style="padding:6px 8px;text-align:left;color:#94a3b8;">Números</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Cobertura</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Peso Total</th>
        <th style="padding:6px 8px;text-align:right;color:#94a3b8;">Eficiencia</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    intersections.forEach(inter => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom:1px solid #1e293b;';
      tr.innerHTML = `
        <td style="padding:5px 8px;font-weight:600;color:#a78bfa;">${inter.combinacion}</td>
        <td style="padding:5px 8px;color:#94a3b8;">${inter.numeros.slice(0, 6).join(', ')}${inter.numeros.length > 6 ? '...' : ''}</td>
        <td style="padding:5px 8px;text-align:right;color:#fbbf24;">${inter.tamano_cobertura}</td>
        <td style="padding:5px 8px;text-align:right;color:#34d399;">${inter.peso_retraso.toFixed(4)}</td>
        <td style="padding:5px 8px;text-align:right;color:#a78bfa;font-weight:700;">${inter.eficiencia_ratio.toFixed(4)}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    return section;
  }

  _createSetSelector() {
    const section = document.createElement('div');
    section.style.cssText = 'margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;';

    section.innerHTML = `<h3 style="margin:0 0 8px 0;font-size:0.85rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
      🔘 Seleccionar Conjuntos
    </h3>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';

    Object.keys(SUBCONJUNTOS).forEach(name => {
      const btn = document.createElement('button');
      const isSelected = this._selectedSetNames.has(name);
      btn.textContent = name;
      btn.style.cssText = `
        padding:4px 10px;border-radius:4px;cursor:pointer;
        font-size:0.7rem;font-family:monospace;transition:all 0.15s;
        background:${isSelected ? '#3b82f6' : '#1e293b'};
        color:${isSelected ? '#fff' : '#94a3b8'};
        border:1px solid ${isSelected ? '#3b82f6' : '#334155'};
      `;

      btn.addEventListener('click', () => {
        this.toggleSet(name);
        this.update();
      });

      grid.appendChild(btn);
    });

    section.appendChild(grid);
    return section;
  }
}
