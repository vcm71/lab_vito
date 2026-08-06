import { rouletteSettingsStore } from './rouletteSettingsStore.js';

// ─── Orden por defecto de los widgets ────────────────────────────────────────
const DEFAULT_ORDER = ['leyenda', 'suertes', 'docenas', 'columnas', 'seisenas', 'plenos', 'series'];
const LS_KEY      = 'orion_stwin_widget_order';
const LS_KEY_SIZE = 'orion_stwin_panel_size';
const LS_KEY_ZOOM = 'orion_stwin_panel_zoom';

function getSavedOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (Array.isArray(saved) && saved.length === DEFAULT_ORDER.length) return saved;
  } catch (_) {}
  return [...DEFAULT_ORDER];
}
function saveOrder(order) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(order)); } catch (_) {}
}

function getSavedZoom() {
  try {
    const z = localStorage.getItem(LS_KEY_ZOOM);
    if (z) return parseFloat(z);
  } catch (_) {}
  return 1;
}
function saveZoom(z) {
  try { localStorage.setItem(LS_KEY_ZOOM, z.toString()); } catch (_) {}
}

function getSavedSize() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY_SIZE));
    if (s && s.w && s.h) return s;
  } catch (_) {}
  return null;
}
function savePanelSize(w, h) {
  try { localStorage.setItem(LS_KEY_SIZE, JSON.stringify({ w, h })); } catch (_) {}
}

// ─── Handle de resize del panel completo ─────────────────────────────────────
function initPanelResize(panel) {
  panel.style.position  = 'relative';
  panel.style.overflow  = 'hidden';
  panel.style.boxSizing = 'border-box';
  panel.style.minWidth  = '260px';
  panel.style.minHeight = '200px';
  panel.style.transition = 'none';
  const saved = getSavedSize();
  if (saved) { panel.style.width = saved.w + 'px'; panel.style.height = saved.h + 'px'; }
  const handle = document.createElement('div');
  handle.id = 'stwin-resize-handle';
  handle.title = 'Arrastrar para redimensionar';
  handle.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="13" y1="1" x2="1" y2="13" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="13" y1="6" x2="6" y2="13" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="13" y1="11" x2="11" y2="13" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  handle.style.cssText = `position:absolute;bottom:4px;right:4px;width:18px;height:18px;cursor:se-resize;display:flex;align-items:center;justify-content:center;opacity:0.45;transition:opacity 0.2s;z-index:10;`;
  panel.appendChild(handle);
  handle.addEventListener('mouseenter', () => handle.style.opacity = '1');
  handle.addEventListener('mouseleave', () => handle.style.opacity = '0.45');
  let startX, startY, startW, startH;
  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX; startY = e.clientY;
    startW = panel.offsetWidth; startH = panel.offsetHeight;
    handle.style.opacity = '1';
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
    function onMouseMove(ev) {
      panel.style.width = Math.max(260, startW + (ev.clientX - startX)) + 'px';
      panel.style.height = Math.max(200, startH + (ev.clientY - startY)) + 'px';
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      handle.style.opacity = '0.45';
      savePanelSize(panel.offsetWidth, panel.offsetHeight);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

// ─── Núcleo Win-Win (inline, replica la lógica de WinWinEngine) ──────────────
function calcularDistancias(giros, nums) {
  // Encuentra índices donde un número de la serie aparece
  const targetSet = new Set(nums.map(n => n.toString()));
  const idxs = [];
  giros.forEach((g, i) => {
    if (targetSet.has(g.toString())) idxs.push(i);
  });
  const res = [];
  for (let i = 1; i < idxs.length; i++) res.push(idxs[i] - idxs[i - 1]);
  return res;
}

function calcularAtraso(giros, nums) {
  const targetSet = new Set(nums.map(n => n.toString()));
  const idx = giros.map(g => targetSet.has(g.toString())).lastIndexOf(true);
  return idx === -1 ? giros.length : giros.length - 1 - idx;
}

function getWinWinLevel(dists, threshold = 5) {
  // Clasifica la racha: WIN si últimas 2 distancias ≤ threshold,
  // WIN-WIN(N) si últimas N+2 distancias ≤ threshold
  for (let n = Math.min(dists.length, 10); n >= 2; n--) {
    if (dists.slice(-n).every(d => d <= threshold)) {
      return n >= 3 ? `WIN-WIN(${n - 2})` : `WIN`;
    }
  }
  return null;
}

// ─── Análisis Win-Win para un conjunto de números objetivo ───────────────────
function analyzeWinWinForBet(giros, numbers, threshold = 5) {
  const dists = calcularDistancias(giros, numbers.map(n => n.toString()));
  const atraso = calcularAtraso(giros, numbers.map(n => n.toString()));
  const level = getWinWinLevel(dists, threshold);
  // Total de aciertos en la ventana
  const targetSet = new Set(numbers.map(n => n.toString()));
  const wins = giros.filter(g => targetSet.has(g.toString())).length;
  return {
    wins,
    total: giros.length,
    atraso,
    level,         // "WIN" | "WIN-WIN(N)" | null
    dists: dists.slice(-5),  // últimas 5 distancias
    isActive: atraso <= threshold && level !== null
  };
}

// ─── Estilos visuales según nivel Win-Win ────────────────────────────────────
function getLevelStyle(level) {
  if (!level) return { bg: '#374151', color: '#6b7280', glow: 'none', label: 'Inactivo', order: 0, levelClass: '' };
  if (level === 'WIN') return { bg: '#0ea5e9', color: '#f0f9ff', glow: 'none', label: level, order: 1, levelClass: '' };
  if (level === 'WIN-WIN(1)') return { bg: '#16a34a', color: '#f0fdf4', glow: 'none', label: level, order: 2, levelClass: '' };
  if (level === 'WIN-WIN(2)') return { bg: '#22c55e', color: '#052e16', glow: 'none', label: level, order: 3, levelClass: '' };
  if (level === 'WIN-WIN(3)') return { bg: '#d97706', color: '#fefce8', glow: 'none', label: level, order: 4, levelClass: 'level-ww-mid' };
  if (level === 'WIN-WIN(4)') return { bg: '#ea580c', color: '#fff7ed', glow: 'none', label: level, order: 5, levelClass: 'level-ww-mid' };
  if (level === 'WIN-WIN(5)') return { bg: '#dc2626', color: '#fef2f2', glow: 'none', label: level, order: 6, levelClass: 'level-ww-high' };
  // WIN-WIN(6) a WIN-WIN(8) — tonos más intensos
  const n = parseInt(level.replace(/\D/g, '')) || 6;
  if (n >= 8) return { bg: '#b91c1c', color: '#fef2f2', glow: 'none', label: level, order: 8, levelClass: 'level-ww-high' };
  if (n >= 6) return { bg: '#e11d48', color: '#fff1f2', glow: 'none', label: level, order: 7, levelClass: 'level-ww-high' };
  return { bg: '#be123c', color: '#fff1f2', glow: 'none', label: level, order: 8, levelClass: 'level-ww-high' };
}

function getExpectedWins(numbers, totalSpins) {
  // Probabilidad teórica para ruleta americana (38 números)
  return (numbers.length / 38) * totalSpins;
}

// ─── Componentes visuales ────────────────────────────────────────────────────
function renderWinWinCircle(level, size = 32) {
  const style = getLevelStyle(level);
  const shortLabel = level ? level.replace('WIN-WIN(', 'WW').replace(')', '') : '—';
  return `
    <span class="stwin-level-badge ${style.levelClass}" title="Nivel: ${level || 'Sin racha activa'}" style="
      background:${style.bg};
      color:${style.color};
    ">${shortLabel}</span>
  `;
}

function renderDistancePill(dist, index, threshold = 5) {
  const isClose = dist <= threshold;
  return `
    <span class="stwin-distance ${isClose ? 'is-short' : 'is-long'}" style="opacity:${1 - (index * 0.12)};" title="Distancia #${index + 1}: ${dist} giros${isClose ? ' (racha)' : ''}">${dist}</span>`;
}

function renderHitCircle(wins, total, expected) {
  const ratio = expected > 0 ? wins / expected : 0;
  let bg, color;
  if (ratio >= 1.3)      { bg = '#22c55e'; color = '#022c22'; }
  else if (ratio >= 1.0) { bg = '#10b981'; color = '#022c22'; }
  else if (ratio >= 0.7) { bg = '#f59e0b'; color = '#451a03'; }
  else                    { bg = '#ef4444'; color = '#fff';    }
  return `
    <span class="stwin-stat-badge" title="${wins} aciertos en ${total} giros (esperado: ${expected.toFixed(1)})" style="
      background:${bg};color:${color};">
      <span class="stwin-stat-icon">🎯</span>${wins}
    </span>`;
}

function renderAtrasoBadge(atraso) {
  let color = '#6b7280';
  if (atraso <= 2) color = '#22c55e';
  else if (atraso <= 5) color = '#f59e0b';
  else color = '#ef4444';
  return `<span class="stwin-atraso-text" style="color:${color};">⌛${atraso}</span>`;
}

function renderDistancesRow(dists, threshold = 5) {
  if (!dists || dists.length === 0) {
    return `<span class="stwin-empty-dists">Sin distancias</span>`;
  }
  return dists.map((d, i) => renderDistancePill(d, i, threshold)).join('');
}

function getWinWinTone(level) {
  if (!level) return { label: 'Inactivo', accent: 'rgba(55,65,81,0.6)', glow: 'none' };
  if (level === 'WIN') return { label: 'Racha mínima', accent: 'rgba(14,165,233,0.7)', glow: '0 0 8px rgba(14,165,233,0.2)' };
  if (level.startsWith('WIN-WIN')) {
    const n = parseInt(level.replace(/\D/g, '')) || 1;
    if (n >= 5) return { label: '¡Racha extrema!', accent: 'rgba(239,68,68,0.8)', glow: '0 0 12px rgba(239,68,68,0.3)' };
    if (n >= 3) return { label: 'Racha fuerte', accent: 'rgba(245,158,11,0.8)', glow: '0 0 10px rgba(245,158,11,0.25)' };
    return { label: 'Racha activa', accent: 'rgba(16,185,129,0.7)', glow: '0 0 8px rgba(16,185,129,0.2)' };
  }
  return { label: 'Inactivo', accent: 'rgba(55,65,81,0.6)', glow: 'none' };
}

function renderMiniBar(wins, expected, accent) {
  const scale = Math.max(wins, expected * 2, 1);
  const winBar = Math.min(100, Math.max(0, (wins / scale) * 100));
  const expBar = Math.min(100, Math.max(0, (expected / scale) * 100));
  return `
    <div class="stwin-progress" style="margin-top:6px;">
      <div class="stwin-progress-track">
        <div class="stwin-progress-fill" style="width:${winBar}%;background:linear-gradient(90deg,${accent} 0%,rgba(255,255,255,0.12) 100%);"></div>
        <div class="stwin-progress-expected" style="left:${Math.max(0, expBar - 1)}%;"></div>
      </div>
      <div class="stwin-progress-labels">
        <span>${wins} hits</span>
        <span>esp ${expected.toFixed(1)}</span>
      </div>
    </div>`;
}

function metricCardHtml(item, theme, threshold = 5) {
  const tone = getWinWinTone(item.level);
  const cardAccent = tone.accent;
  const borderColor = item.level ? theme.border || 'rgba(34,197,94,0.22)' : 'rgba(75,85,99,0.25)';
  const expected = getExpectedWins(item.numbers, item.total);
  return `
    <div class="stwin-card ${item.level ? '' : 'is-inactive'}" style="border-color:${borderColor};">
      <div style="display:flex;align-items:center;gap:6px;">
        ${renderWinWinCircle(item.level, 30)}
        <span class="stwin-card-title">${item.name}</span>
        <div style="display:flex;align-items:center;gap:4px;">
          ${renderHitCircle(item.wins, item.total, expected)}
          ${renderAtrasoBadge(item.atraso)}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
        <span class="stwin-card-label">distancias</span>
        <span class="stwin-card-meta" style="margin-left:auto;color:${tone.accent};">${tone.label}</span>
      </div>
      <div class="stwin-distances">
        ${renderDistancesRow(item.dists, threshold)}
      </div>
      ${renderMiniBar(item.wins, expected, tone.glow !== 'none' ? tone.accent : 'rgba(55,65,81,0.6)')}
    </div>`;
}

// ─── HTML de los badges individuales (plenos) ────────────────────────────────
function badgeHtml(item, threshold = 5) {
  const levelStyle = getLevelStyle(item.level);
  const border = item.level ? 'rgba(34,197,94,0.5)' : item.border;
  return `
    <span class="stwin-badge-pleno" style="background:${item.bg};border:1px solid ${border};opacity:${item.level ? 1 : 0.5};">
      <span style="font-weight:600;margin-right:6px;font-size:0.88rem;text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${item.name}</span>
      ${renderWinWinCircle(item.level, 24)}
    </span>`;
}

// ─── Definición de cada widget ────────────────────────────────────────────────
function buildWidgets(giros, thresholds) {
  const evenMoney = thresholds.suertes ?? 5;
  const docenasColumns = thresholds.docenasColumns ?? 5;
  const sectors = thresholds.sectors ?? 5;
  const plenos = 5; // Seisenas y Plenos usan fallback 5 (mejora1)

  const red   = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];
  const black = ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"];
  const isNum = (num) => num !== "0" && num !== "00";

  const NUM = (n) => [n];
  const NUMS = (...ns) => ns;
  const RANGE = (a, b) => Array.from({length: b - a + 1}, (_, i) => String(a + i));

  // Helpers que pasan threshold específico del grupo
  const wwEvenMoney = (g, nums) => analyzeWinWinForBet(g, nums, evenMoney);
  const wwDocenasColumns = (g, nums) => analyzeWinWinForBet(g, nums, docenasColumns);
  const wwSectors = (g, nums) => analyzeWinWinForBet(g, nums, sectors);
  const wwPlenos = (g, nums) => analyzeWinWinForBet(g, nums, plenos);

  return {
    leyenda: {
      id: 'leyenda',
      title: '🔔 Leyenda Win-Win',
      icon: '🔔',
      content: `
        <div class="stwin-legend">
          <span class="stwin-legend-item">
            <span class="stwin-legend-dot" style="background:#0ea5e9;"></span> WIN
          </span>
          <span class="stwin-legend-item">
            <span class="stwin-legend-dot" style="background:#16a34a;"></span> WIN-WIN(1-2)
          </span>
          <span class="stwin-legend-item">
            <span class="stwin-legend-dot" style="background:#d97706;"></span> WIN-WIN(3-4)
          </span>
          <span class="stwin-legend-item">
            <span class="stwin-legend-dot" style="background:#dc2626;"></span> WIN-WIN(5+)
          </span>
          <span class="stwin-legend-item">
            <span class="stwin-legend-dot" style="background:#374151;"></span> Inactivo
          </span>
          <span class="stwin-legend-note">Dist. ≤${evenMoney} (suertes) / ≤${docenasColumns} (doc·col) / ≤${sectors} (sectores)</span>
        </div>`,
      accent: 'rgba(255,255,255,0.06)',
      borderColor: 'rgba(255,255,255,0.1)'
    },

    suertes: {
      id: 'suertes',
      title: 'Suertes Sencillas — Win-Win',
      icon: '🎯',
      content: `
        <div class="stwin-section-header">
          <span class="stwin-section-title">Nivel de racha corta</span>
          <span class="stwin-section-sub">Distancias ≤${evenMoney} · Suertes Sencillas</span>
          <div class="stwin-section-meta">
            <span>🎯 Hits</span>
            <span class="stwin-pipe">|</span>
            <span>⌛ Atraso</span>
          </div>
        </div>
        <div class="stwin-grid">${[
        { name:'Rojo',     numbers: red,   ...wwEvenMoney(giros, red) },
        { name:'Negro',    numbers: black, ...wwEvenMoney(giros, black) },
        { name:'Par',      numbers: Array.from({length:36}, (_,i) => String(i+1)).filter(n => parseInt(n)%2===0), ...wwEvenMoney(giros, Array.from({length:36}, (_,i) => String(i+1)).filter(n => parseInt(n)%2===0)) },
        { name:'Impar',    numbers: Array.from({length:36}, (_,i) => String(i+1)).filter(n => parseInt(n)%2!==0), ...wwEvenMoney(giros, Array.from({length:36}, (_,i) => String(i+1)).filter(n => parseInt(n)%2!==0)) },
        { name:'Falta (1-18)',  numbers: RANGE(1,18), ...wwEvenMoney(giros, RANGE(1,18)) },
        { name:'Pasa (19-36)', numbers: RANGE(19,36), ...wwEvenMoney(giros, RANGE(19,36)) },
      ].map(item => metricCardHtml(item, { accent:'rgba(34,197,94,0.08)', border:'rgba(34,197,94,0.25)' }, evenMoney)).join('')}</div>`,
      accent: 'rgba(34,197,94,0.06)',
      borderColor: 'rgba(34,197,94,0.2)'
    },

    docenas: {
      id: 'docenas',
      title: 'Docenas — Win-Win',
      icon: '🔢',
      content: `
        <div class="stwin-section-header">
          <span class="stwin-section-title">Rachas por docena</span>
          <span class="stwin-section-sub">Distancias ≤${docenasColumns} · Docenas y Columnas</span>
          <div class="stwin-section-meta">
            <span>🎯 Hits</span>
            <span class="stwin-pipe">|</span>
            <span>⌛ Atraso</span>
          </div>
        </div>
        <div class="stwin-grid">${[
        { name:'1ª Docena', numbers: RANGE(1,12), ...wwDocenasColumns(giros, RANGE(1,12)) },
        { name:'2ª Docena', numbers: RANGE(13,24), ...wwDocenasColumns(giros, RANGE(13,24)) },
        { name:'3ª Docena', numbers: RANGE(25,36), ...wwDocenasColumns(giros, RANGE(25,36)) },
      ].map(item => metricCardHtml(item, { accent:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.25)' }, docenasColumns)).join('')}</div>`,
      accent: 'rgba(168,85,247,0.06)',
      borderColor: 'rgba(168,85,247,0.2)'
    },

    columnas: {
      id: 'columnas',
      title: 'Columnas — Win-Win',
      icon: '🏛️',
      content: `
        <div class="stwin-section-header">
          <span class="stwin-section-title">Rachas por columna</span>
          <div class="stwin-section-meta">
            <span>🎯 Hits</span>
            <span class="stwin-pipe">|</span>
            <span>⌛ Atraso</span>
          </div>
        </div>
        <div class="stwin-grid">${[
        { name:'Columna 1', numbers: Array.from({length:12}, (_,i) => String(3*i+1)), ...wwDocenasColumns(giros, Array.from({length:12}, (_,i) => String(3*i+1))) },
        { name:'Columna 2', numbers: Array.from({length:12}, (_,i) => String(3*i+2)), ...wwDocenasColumns(giros, Array.from({length:12}, (_,i) => String(3*i+2))) },
        { name:'Columna 3', numbers: Array.from({length:12}, (_,i) => String(3*(i+1))), ...wwDocenasColumns(giros, Array.from({length:12}, (_,i) => String(3*(i+1)))) },
      ].map(item => metricCardHtml(item, { accent:'rgba(14,165,233,0.08)', border:'rgba(14,165,233,0.25)' }, docenasColumns)).join('')}</div>`,
      accent: 'rgba(14,165,233,0.06)',
      borderColor: 'rgba(14,165,233,0.2)'
    },

    seisenas: {
      id: 'seisenas',
      title: 'Seisenas — Win-Win',
      icon: '🎲',
      content: `
        <div class="stwin-section-header">
          <span class="stwin-section-title">Rachas por seisena</span>
          <div class="stwin-section-meta">
            <span>🎯 Hits</span>
            <span class="stwin-pipe">|</span>
            <span>⌛ Atraso</span>
          </div>
        </div>
        <div class="stwin-grid">${[
        { name:'S1 (1-6)',   numbers: RANGE(1,6),   ...wwPlenos(giros, RANGE(1,6)) },
        { name:'S2 (7-12)',  numbers: RANGE(7,12),  ...wwPlenos(giros, RANGE(7,12)) },
        { name:'S3 (13-18)', numbers: RANGE(13,18), ...wwPlenos(giros, RANGE(13,18)) },
        { name:'S4 (19-24)', numbers: RANGE(19,24), ...wwPlenos(giros, RANGE(19,24)) },
        { name:'S5 (25-30)', numbers: RANGE(25,30), ...wwPlenos(giros, RANGE(25,30)) },
        { name:'S6 (31-36)', numbers: RANGE(31,36), ...wwPlenos(giros, RANGE(31,36)) },
      ].map(item => metricCardHtml(item, { accent:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.25)' }, plenos)).join('')}</div>`,
      accent: 'rgba(234,179,8,0.06)',
      borderColor: 'rgba(234,179,8,0.2)'
    },

    plenos: {
      id: 'plenos',
      title: 'Plenos — Win-Win',
      icon: '🎯',
      content: `<div class="stwin-grid" style="display:flex;flex-wrap:wrap;gap:5px;">${(() => {
        const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        const items = [
          { name:'00', bg:'rgba(34,197,94,0.15)', border:'rgba(34,197,94,0.4)' },
          { name:'0',  bg:'rgba(34,197,94,0.15)', border:'rgba(34,197,94,0.4)' },
        ];
        for (let i = 1; i <= 36; i++) {
          const isRed = REDS.includes(i);
          items.push({
            name: String(i),
            bg: isRed ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
            border: isRed ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'
          });
        }
        return items.map(d => {
          const wwRes = analyzeWinWinForBet(giros, [d.name], plenos);
          return badgeHtml({ ...d, ...wwRes }, plenos);
        }).join('');
      })()}</div>`,
      accent: 'rgba(34,197,94,0.06)',
      borderColor: 'rgba(34,197,94,0.25)'
    },

    series: {
      id: 'series',
      title: 'Series / Sectores — Win-Win',
      icon: '🌀',
      content: `
        <div class="stwin-section-header">
          <span class="stwin-section-title">Rachas por sector</span>
          <span class="stwin-section-sub">Distancias ≤${sectors} · Sectores personalizados</span>
          <div class="stwin-section-meta">
            <span>🎯 Hits</span>
            <span class="stwin-pipe">|</span>
            <span>⌛ Atraso</span>
          </div>
        </div>
        <div class="stwin-grid">${[
        ['S1',  ["1","27","2","26","7"]],
        ['S11', ["12","19","11","17","34"]],
        ['S14', ["15","24","16","14","28"]],
        ['S5',  ["32","5","31","33","23"]],
        ['S0',  ["00","10","0","30","20"]],
        ['S3',  ["3","4","6","8","9","13","18"]],
        ['S21', ["21","22","25","29","35","36"]],
      ].map(([name, nums]) => {
        const wwRes = analyzeWinWinForBet(giros, nums, sectors);
        const tone = getWinWinTone(wwRes.level);
        const expected = getExpectedWins(nums, giros.length);
        return `
          <div class="stwin-card ${wwRes.level ? '' : 'is-inactive'}" style="border-color:rgba(168,85,247,0.25);">
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:9px;height:9px;border-radius:50%;background:${tone.accent};flex-shrink:0;"></div>
              <span class="stwin-card-title">${name}</span>
              <span class="stwin-card-meta" style="color:${tone.accent};">${tone.label}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${renderWinWinCircle(wwRes.level, 28)}
              <div class="stwin-distances">
                ${renderDistancesRow(wwRes.dists, sectors)}
              </div>
              <div style="margin-left:auto;display:flex;align-items:center;gap:3px;">
                ${renderHitCircle(wwRes.wins, wwRes.total, expected)}
                ${renderAtrasoBadge(wwRes.atraso)}
              </div>
            </div>
            ${renderMiniBar(wwRes.wins, expected, tone.glow !== 'none' ? tone.accent : 'rgba(55,65,81,0.6)')}
          </div>`;
      }).join('')}</div>`,
      accent: 'rgba(168,85,247,0.06)',
      borderColor: 'rgba(168,85,247,0.2)'
    },
  };
}

// ─── Crear el elemento DOM del widget ────────────────────────────────────────
function createWidgetEl(def) {
  const el = document.createElement('div');
  el.dataset.widgetId = def.id;
  el.draggable = true;
  el.style.cssText = `
    background: rgba(255,255,255,0.03);
    border: 1px solid ${def.borderColor};
    border-radius: 12px;
    overflow: hidden;
    cursor: default;
    user-select: none;
  `;
  el.innerHTML = `
    <div class="stwin-widget-header" style="
      display:flex;align-items:center;gap:8px;
      padding:8px 12px;
      background:${def.accent};
      border-bottom:1px solid ${def.borderColor};
      cursor:grab;
    ">
      <span style="font-size:1.1rem;">${def.icon}</span>
      <span class="stwin-widget-title">${def.title}</span>
      <span style="color:#555;line-height:1;cursor:grab;" title="Arrastrar">⠿</span>
    </div>
    <div class="stwin-widget-body" style="padding:10px 12px;">
      ${def.content}
    </div>
  `;
  return el;
}

// ─── Drag & drop ─────────────────────────────────────────────────────────────
function initDragDrop(grid) {
  let dragSrc = null;
  grid.addEventListener('dragstart', e => {
    dragSrc = e.target.closest('[data-widget-id]');
    if (!dragSrc) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrc.dataset.widgetId);
    const captured = dragSrc;
    setTimeout(() => { if (captured) { captured.style.opacity = '0.4'; captured.style.transform = 'scale(0.97)'; } }, 0);
  });
  grid.addEventListener('dragend', () => {
    if (dragSrc) { dragSrc.style.opacity = '1'; dragSrc.style.transform = 'scale(1)'; dragSrc = null; }
    grid.querySelectorAll('[data-widget-id]').forEach(el => el.style.boxShadow = '');
    persistOrder(grid);
  });
  grid.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('[data-widget-id]');
    if (target && target !== dragSrc) target.style.boxShadow = '0 0 0 2px #22c55e';
  });
  grid.addEventListener('dragleave', e => {
    const target = e.target.closest('[data-widget-id]');
    if (target) target.style.boxShadow = '';
  });
  grid.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('[data-widget-id]');
    if (!target || !dragSrc || target === dragSrc) return;
    target.style.boxShadow = '';
    const els = [...grid.querySelectorAll('[data-widget-id]')];
    const srcIdx = els.indexOf(dragSrc);
    const tgtIdx = els.indexOf(target);
    if (srcIdx < tgtIdx) grid.insertBefore(dragSrc, target.nextSibling);
    else grid.insertBefore(dragSrc, target);
  });
}

function persistOrder(grid) {
  const order = [...grid.querySelectorAll('[data-widget-id]')].map(el => el.dataset.widgetId);
  saveOrder(order);
}

// ─── Estilos globales (una vez) ──────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('stwin-styles')) return;
  const style = document.createElement('style');
  style.id = 'stwin-styles';
  style.textContent = `
    /* ─── Layout ─────────────────────────────────────────── */
    .stwin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 10px;
    }
    .stwin-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 8px;
      padding: 6px 10px;
      border-radius: 10px;
      background: transparent;
      border: 0;
      border-bottom: 1px solid rgba(148,163,184,0.18);
    }
    .stwin-section-header .stwin-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #d1d5db;
    }
    .stwin-section-header .stwin-section-meta {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
    }

    /* ─── Tarjetas (metric-card) ──────────────────────────── */
    .stwin-card {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1 1 190px;
      min-width: 170px;
      background: #1e293b;
      border: 1px solid rgba(148,163,184,0.16);
      border-radius: 10px;
      padding: 7px 8px 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15);
      transition: opacity 0.2s, border-color 0.2s;
      opacity: 1;
    }
    .stwin-card.is-inactive {
      opacity: 0.55;
    }
    .stwin-card:hover {
      border-color: rgba(148,163,184,0.35);
      opacity: 1;
    }

    .stwin-card-title {
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.02em;
      flex: 1;
      line-height: 1.25;
      color: #f1f5f9;
    }
    .stwin-card-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .stwin-card-meta {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
    }
    .stwin-card-status {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      line-height: 1;
    }

    /* ─── Badge de nivel Win-Win ──────────────────────────── */
    .stwin-level-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18);
      font-size: 10px;
      font-weight: 800;
      line-height: 1;
      transition: all 0.2s ease;
      flex-shrink: 0;
      box-shadow: none;
    }
    .stwin-level-badge.level-ww-high {
      box-shadow: 0 0 8px rgba(239,68,68,0.28);
    }
    .stwin-level-badge.level-ww-mid {
      box-shadow: 0 0 6px rgba(245,158,11,0.22);
    }

    /* ─── Stats (hits / atraso) ───────────────────────────── */
    .stwin-stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 22px;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      box-shadow: none;
    }
    .stwin-stat-icon {
      font-size: 10px;
      opacity: 0.8;
    }
    .stwin-atraso-text {
      font-size: 10px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .stwin-empty-dists {
      color: #4b5563;
      font-size: 0.6rem;
      font-style: italic;
    }

    /* ─── Distancias ──────────────────────────────────────── */
    .stwin-distances {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      min-height: 24px;
    }
    .stwin-distance {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 5px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 800;
      line-height: 1;
      box-shadow: none;
    }
    .stwin-distance.is-short {
      background: #16a34a;
      color: #f0fdf4;
    }
    .stwin-distance.is-long {
      background: #dc2626;
      color: #fff1f2;
    }

    /* ─── Barra de progreso hits vs esperado ──────────────── */
    .stwin-progress {
      position: relative;
      height: 7px;
      border-radius: 999px;
      background: #334155;
      overflow: visible;
      margin-top: 6px;
    }
    .stwin-progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      border-radius: inherit;
      transition: width 0.3s ease;
    }
    .stwin-progress-expected {
      position: absolute;
      top: -3px;
      bottom: -3px;
      width: 2px;
      background: #facc15;
      box-shadow: 0 0 4px rgba(250,204,21,0.5);
      border-radius: 2px;
      pointer-events: none;
    }
    .stwin-progress-labels {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-top: 3px;
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ─── Plenos (badge individual) ────────────────────────── */
    .stwin-badge-pleno {
      display: inline-flex;
      align-items: center;
      border-radius: 8px;
      padding: 3px 5px 3px 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: opacity 0.2s;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }

    /* ─── Leyenda ─────────────────────────────────────────── */
    .stwin-legend {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #a0aec0;
    }
    .stwin-legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .stwin-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .stwin-legend-note {
      margin-left: auto;
      color: #5a6577;
      font-size: 10px;
    }

    /* ─── Controles zoom ──────────────────────────────────── */
    .stwin-zoom-control {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.03);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .stwin-zoom-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
    }

    /* ─── Drag & drop ─────────────────────────────────────── */
    #stwin-drag-grid [data-widget-id]:active { cursor: grabbing; }
    .stwin-widget-header:hover { filter: brightness(1.1); }
    #stwin-resize-handle:hover svg line { stroke: #22c55e; }

    /* ─── Responsive ──────────────────────────────────────── */
    @media (max-width: 900px) {
      .stwin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .stwin-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .stwin-legend { gap: 6px; font-size: 10px; }
      .stwin-card { min-width: 0; }
    }

    /* ─── Accesibilidad ───────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .stwin-card,
      .stwin-level-badge,
      .stwin-progress-fill {
        transition: none !important;
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function renderStWinTab(tracker) {
  const container = document.getElementById('stwin-table-container');
  if (!container) return;

  injectStyles();

  const spins = tracker.getSpins();
  const settings = rouletteSettingsStore.getSnapshot();
  const maxWindow = settings?.atrasosMaxWindow ?? 100;
  const windowSpins = spins.length > 0 ? spins.slice(-maxWindow) : [];

  // Leer thresholds configurables desde Ajustes (tres grupos + fallback)
  const mt = settings?.moduleThresholds || {};
  const thresholds = {
    suertes:       mt.winwinEvenMoney?.distanceMax ?? 5,
    docenasColumns: mt.winwinDozensColumns?.distanceMax ?? 5,
    sectors:       mt.winwinSectors?.distanceMax ?? 5,
  };

  // Convertir giros a array plano de strings
  const giros = windowSpins.map(s => String(s.number));

  const widgetDefs = buildWidgets(giros, thresholds);
  const order = getSavedOrder();
  const currentZoom = getSavedZoom();

  container.innerHTML = '';

  // Barra de control
  const controlBar = document.createElement('div');
  controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
  controlBar.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:0.25rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
      <label for="stwin-zoom-slider" style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">Zoom:</label>
      <input type="range" id="stwin-zoom-slider" min="50" max="150" value="${Math.round(currentZoom * 100)}" style="width:80px;height:4px;accent-color:#22c55e;cursor:pointer;">
      <span id="stwin-zoom-value" style="font-size:0.7rem;color:#22c55e;font-family:var(--font-numbers);font-weight:bold;min-width:35px;text-align:right;">${Math.round(currentZoom * 100)}%</span>
    </div>
    <div style="display:flex;gap:6px;">
      <span style="font-size:0.65rem;color:#6b7280;display:flex;align-items:center;gap:4px;">
        <span style="color:#94a3b8;font-weight:400;">Total:</span>
        <span style="color:#fbbf24;font-weight:800;">${spins.length}</span>
      </span>
      <span style="font-size:0.65rem;color:#6b7280;display:flex;align-items:center;gap:4px;margin-right:8px;">
        <span style="color:#94a3b8;font-weight:400;">Muestra:</span>
        <span style="color:#34d399;font-weight:800;">${giros.length}</span>
        <span style="color:#64748b;font-size:0.6rem;">(ventana ${maxWindow})</span>
      </span>
      <button id="btn-refresh-stwin" style="
        background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);
        border-radius:6px;color:#22c55e;font-size:0.72rem;padding:3px 12px;cursor:pointer;
        transition:all 0.2s;font-weight:600;
      " title="Actualizar desde Ajustes">🔄 Actualizar</button>
      <button id="btn-reset-stwin-order" style="
        background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);
        border-radius:6px;color:#888;font-size:0.72rem;padding:3px 10px;cursor:pointer;
        transition:all 0.2s;
      " title="Restablecer orden">↺ Rest. orden</button>
    </div>
  `;
  container.appendChild(controlBar);

  const grid = document.createElement('div');
  grid.id = 'stwin-drag-grid';
  grid.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
  grid.style.zoom = currentZoom;
  container.appendChild(grid);

  order.forEach(id => { if (widgetDefs[id]) grid.appendChild(createWidgetEl(widgetDefs[id])); });
  Object.keys(widgetDefs).forEach(id => { if (!order.includes(id)) grid.appendChild(createWidgetEl(widgetDefs[id])); });

  initDragDrop(grid);

  const panel = container.closest('.panel') || container.parentElement;
  if (panel) {
    panel.style.background = 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)';
    if (!panel.querySelector('#stwin-resize-handle')) initPanelResize(panel);
  }

  // Event listeners
  const zoomSlider = document.getElementById('stwin-zoom-slider');
  const zoomValue = document.getElementById('stwin-zoom-value');
  if (zoomSlider && zoomValue) {
    zoomSlider.addEventListener('input', () => {
      const val = parseFloat(zoomSlider.value);
      zoomValue.textContent = val + '%';
      grid.style.zoom = val / 100;
      saveZoom(val / 100);
    });
  }

  document.getElementById('btn-refresh-stwin')?.addEventListener('click', () => renderStWinTab(tracker));
  document.getElementById('btn-reset-stwin-order')?.addEventListener('click', () => { saveOrder(DEFAULT_ORDER); renderStWinTab(tracker); });
}
