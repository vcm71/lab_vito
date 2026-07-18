// ataqueRenderer.js
// Renderiza la pestaña "Ataque" usando la lógica de WinWin (Máximos Históricos)
import { rouletteSettingsStore } from './rouletteSettingsStore.js';

// ─── Orden por defecto de los widgets ────────────────────────────────────────
const DEFAULT_ORDER = ['leyenda', 'suertes', 'docenas', 'columnas', 'seisenas', 'ceros', 'series'];
const LS_KEY      = 'orion_ataque_widget_order';
const LS_KEY_SIZE = 'orion_ataque_panel_size';
const LS_KEY_ZOOM = 'orion_ataque_panel_zoom';

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

// ─── Persistencia de Zoom ────────────────────────────────────────────────────
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

// ─── Persistencia de tamaño del panel ────────────────────────────────────────
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
  panel.style.position   = 'relative';
  panel.style.overflow   = 'hidden';
  panel.style.boxSizing  = 'border-box';
  panel.style.minWidth   = '260px';
  panel.style.minHeight  = '200px';
  panel.style.transition = 'none';

  const saved = getSavedSize();
  if (saved) {
    panel.style.width  = saved.w + 'px';
    panel.style.height = saved.h + 'px';
  }

  const handle = document.createElement('div');
  handle.id = 'ataque-resize-handle';
  handle.title = 'Arrastrar para redimensionar';
  handle.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="13" y1="1"  x2="1"  y2="13" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="13" y1="6"  x2="6"  y2="13" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="13" y1="11" x2="11" y2="13" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  handle.style.cssText = `
    position:absolute; bottom:4px; right:4px;
    width:18px; height:18px;
    cursor:se-resize;
    display:flex; align-items:center; justify-content:center;
    opacity:0.45;
    transition:opacity 0.2s;
    z-index:10;
  `;
  panel.appendChild(handle);

  handle.addEventListener('mouseenter', () => handle.style.opacity = '1');
  handle.addEventListener('mouseleave', () => handle.style.opacity = '0.45');

  let startX, startY, startW, startH;

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;

    handle.style.opacity = '1';
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(ev) {
      const newW = Math.max(260, startW + (ev.clientX - startX));
      const newH = Math.max(200, startH + (ev.clientY - startY));
      panel.style.width  = newW + 'px';
      panel.style.height = newH + 'px';
    }

    function onMouseUp(ev) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      handle.style.opacity = '0.45';
      savePanelSize(panel.offsetWidth, panel.offsetHeight);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  });
}

// ─── Lógica de atraso ─────────────────────────────────────────────────────────
function buildGetAtraso(spins) {
  return (checkFn) => {
    let delay = 0;
    for (let i = spins.length - 1; i >= 0; i--) {
      if (checkFn(String(spins[i].number))) break;
      delay++;
    }
    return spins.length === 0 ? 0 : delay;
  };
}

// ─── Estilo del círculo según alertas WINWIN ──────────────────────────────────
function getCircleStyle(atraso, limit, settings) {
  if (limit === 0) {
    return { bg: 'var(--color-gold)', color: '#000', shadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)', animation: 'none' };
  }
  const delta = atraso - limit;
  const redThresh = settings?.ataqueRed ?? 0;
  const orangeThresh = settings?.ataqueOrange ?? -2;

  if (delta >= redThresh) {
    // Rompiendo el máximo histórico o igualándolo
    return { bg: '#ef4444', color: '#fff', shadow: '0 0 8px rgba(239,68,68,0.8)', animation: 'pulse-red 1s infinite' };
  }
  if (delta >= orangeThresh) {
    // Acercándose al máximo histórico
    return { bg: '#f97316', color: '#fff', shadow: '0 0 6px rgba(249,115,22,0.7)', animation: 'none' };
  }
  return { bg: 'var(--color-gold)', color: '#000', shadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)', animation: 'none' };
}

// ─── HTML de un badge individual ──────────────────────────────────────────────
function badgeHtml(item, settings) {
  let circleStyle;
  if (item.isExternal) {
    const cs = getCircleStyle(item.atraso, item.limit, settings);
    circleStyle = `background:${cs.bg};color:${cs.color};box-shadow:${cs.shadow};animation:${cs.animation};`;
  } else {
    circleStyle = `background:var(--color-gold);color:#000;box-shadow:inset 0 -1px 2px rgba(0,0,0,0.4);`;
  }
  const limitText = item.limit > 0 ? `<span style="font-size: 0.65rem; margin-left: 4px; opacity: 0.8">Max: ${item.limit}</span>` : '';
  return `
    <div title="Máximo Histórico: ${item.limit || 0}" style="display:flex;align-items:center;background:${item.bg};border:1px solid ${item.border};border-radius:8px;padding:4px 6px 4px 10px;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
      <span style="font-weight:600;margin-right:8px;font-size:0.95rem;text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${item.name}</span>
      <div style="${circleStyle}border-radius:12px;padding:0 8px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:bold;transition:background 0.3s ease,box-shadow 0.3s ease; white-space:nowrap;">
        ${item.atraso} ${limitText}
      </div>
    </div>`;
}

// ─── Definición de cada widget ────────────────────────────────────────────────
function buildWidgets(getAtraso, maxes, settings) {
  const getMax = (type, key) => maxes?.[type]?.[key] || 0;
  const makeBadge = (item) => badgeHtml(item, settings);

  const red   = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];
  const black = ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"];
  const isNum = (num) => num !== "0" && num !== "00";

  return {
    leyenda: {
      id: 'leyenda',
      title: '🔔 Leyenda WinWin',
      icon: '🔔',
      content: `
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:0.8rem;color:#aaa;">
          <span style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#f97316;display:inline-block;"></span> A 2 giros del Máximo
          </span>
          <span style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Rompiendo Máximo
          </span>
          <span style="margin-left:auto;color:#555;font-size:0.72rem;">Alertas WinWin</span>
        </div>`,
      accent: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.12)'
    },

    suertes: {
      id: 'suertes',
      title: 'Suertes Sencillas (Ataque)',
      icon: '🎯',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'Rojo',        atraso: getAtraso(n => red.includes(n)),   bg:'rgba(239,68,68,0.15)',   border:'rgba(239,68,68,0.4)',   isExternal:true, limit:getMax('externals', 'Rojo') },
        { name:'Negro',       atraso: getAtraso(n => black.includes(n)), bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('externals', 'Negro') },
        { name:'Par',         atraso: getAtraso(n => isNum(n) && parseInt(n)%2===0),  bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.3)', isExternal:true, limit:getMax('externals', 'Par') },
        { name:'Impar',       atraso: getAtraso(n => isNum(n) && parseInt(n)%2!==0), bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.3)', isExternal:true, limit:getMax('externals', 'Impar') },
        { name:'Falta (1-18)',atraso: getAtraso(n => isNum(n) && parseInt(n)>=1  && parseInt(n)<=18), bg:'rgba(234,179,8,0.1)', border:'rgba(234,179,8,0.3)', isExternal:true, limit:getMax('externals', 'Falta') },
        { name:'Pasa (19-36)',atraso: getAtraso(n => isNum(n) && parseInt(n)>=19 && parseInt(n)<=36), bg:'rgba(234,179,8,0.1)', border:'rgba(234,179,8,0.3)', isExternal:true, limit:getMax('externals', 'Pasa') },
      ].map(makeBadge).join('')}</div>`,
      accent: 'rgba(239,68,68,0.08)',
      borderColor: 'rgba(239,68,68,0.25)'
    },

    docenas: {
      id: 'docenas',
      title: 'Docenas (Ataque)',
      icon: '🔢',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'1ª Docena', atraso: getAtraso(n => isNum(n) && parseInt(n)>=1  && parseInt(n)<=12), bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('dozens', 'D1') },
        { name:'2ª Docena', atraso: getAtraso(n => isNum(n) && parseInt(n)>=13 && parseInt(n)<=24), bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('dozens', 'D2') },
        { name:'3ª Docena', atraso: getAtraso(n => isNum(n) && parseInt(n)>=25 && parseInt(n)<=36), bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('dozens', 'D3') },
      ].map(makeBadge).join('')}</div>`,
      accent: 'rgba(168,85,247,0.08)',
      borderColor: 'rgba(168,85,247,0.25)'
    },

    columnas: {
      id: 'columnas',
      title: 'Columnas (Ataque)',
      icon: '🏛️',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'Columna 1', atraso: getAtraso(n => isNum(n) && parseInt(n)%3===1), bg:'rgba(14,165,233,0.1)', border:'rgba(14,165,233,0.3)', isExternal:true, limit:getMax('dozens', 'C1') },
        { name:'Columna 2', atraso: getAtraso(n => isNum(n) && parseInt(n)%3===2), bg:'rgba(14,165,233,0.1)', border:'rgba(14,165,233,0.3)', isExternal:true, limit:getMax('dozens', 'C2') },
        { name:'Columna 3', atraso: getAtraso(n => isNum(n) && parseInt(n)%3===0), bg:'rgba(14,165,233,0.1)', border:'rgba(14,165,233,0.3)', isExternal:true, limit:getMax('dozens', 'C3') },
      ].map(makeBadge).join('')}</div>`,
      accent: 'rgba(14,165,233,0.08)',
      borderColor: 'rgba(14,165,233,0.25)'
    },

    seisenas: {
      id: 'seisenas',
      title: 'Seisenas (Ataque)',
      icon: '🎲',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'S1 (1-6)',   atraso: getAtraso(n => ["1","2","3","4","5","6"].includes(n)),          bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('seisenas', 'S1') },
        { name:'S2 (7-12)',  atraso: getAtraso(n => ["7","8","9","10","11","12"].includes(n)),        bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('seisenas', 'S2') },
        { name:'S3 (13-18)', atraso: getAtraso(n => ["13","14","15","16","17","18"].includes(n)),     bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('seisenas', 'S3') },
        { name:'S4 (19-24)', atraso: getAtraso(n => ["19","20","21","22","23","24"].includes(n)),     bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('seisenas', 'S4') },
        { name:'S5 (25-30)', atraso: getAtraso(n => ["25","26","27","28","29","30"].includes(n)),     bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('seisenas', 'S5') },
        { name:'S6 (31-36)', atraso: getAtraso(n => ["31","32","33","34","35","36"].includes(n)),     bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.2)', isExternal:true, limit:getMax('seisenas', 'S6') },
      ].map(makeBadge).join('')}</div>`,
      accent: 'rgba(234,179,8,0.08)',
      borderColor: 'rgba(234,179,8,0.25)'
    },

    ceros: {
      id: 'ceros',
      title: 'Ceros',
      icon: '🟢',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'00', atraso: getAtraso(n => n==='00'), bg:'rgba(34,197,94,0.2)', border:'rgba(34,197,94,0.5)', isExternal:false },
        { name:'0',  atraso: getAtraso(n => n==='0'),  bg:'rgba(34,197,94,0.2)', border:'rgba(34,197,94,0.5)', isExternal:false },
      ].map(makeBadge).join('')}</div>`,
      accent: 'rgba(34,197,94,0.08)',
      borderColor: 'rgba(34,197,94,0.3)'
    },

    series: {
      id: 'series',
      title: 'Series / Sectores',
      icon: '🌀',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'S1',  atraso: getAtraso(n => ["1","27","2","26","7"].includes(n)),              bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S1') },
        { name:'S11', atraso: getAtraso(n => ["12","19","11","17","34"].includes(n)),            bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S11') },
        { name:'S14', atraso: getAtraso(n => ["15","24","16","14","28"].includes(n)),            bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S14') },
        { name:'S5',  atraso: getAtraso(n => ["32","5","31","33","23"].includes(n)),             bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S5') },
        { name:'S0',  atraso: getAtraso(n => ["00","10","0","30","20"].includes(n)),             bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S0') },
        { name:'S3',  atraso: getAtraso(n => ["3","4","6","8","9","13","18"].includes(n)),       bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S3') },
        { name:'S21', atraso: getAtraso(n => ["21","22","25","29","35","36"].includes(n)),       bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:true, limit:getMax('series', 'S21') },
      ].map(makeBadge).join('')}</div>`,
      accent: 'rgba(168,85,247,0.08)',
      borderColor: 'rgba(168,85,247,0.3)'
    }
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
    transition: box-shadow 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
    cursor: default;
    user-select: none;
  `;

  el.innerHTML = `
    <div class="widget-header" style="
      display:flex;align-items:center;gap:8px;
      padding:8px 12px;
      background:${def.accent};
      border-bottom:1px solid ${def.borderColor};
      cursor:grab;
    ">
      <span style="font-size:1.1rem;">${def.icon}</span>
      <span style="font-weight:700;font-size:0.82rem;text-transform:uppercase;letter-spacing:1px;color:#ddd;flex:1;">${def.title}</span>
      <span style="font-size:1.1rem;color:#555;line-height:1;cursor:grab;" title="Arrastrar">⠿</span>
    </div>
    <div class="widget-body" style="padding:10px 12px;">
      ${def.content}
    </div>
  `;
  return el;
}

// ─── Lógica drag & drop ───────────────────────────────────────────────────────
function initDragDrop(grid) {
  let dragSrc = null;

  grid.addEventListener('dragstart', e => {
    dragSrc = e.target.closest('[data-widget-id]');
    if (!dragSrc) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrc.dataset.widgetId);
    const captured = dragSrc;
    setTimeout(() => {
      if (captured) {
        captured.style.opacity = '0.4';
        captured.style.transform = 'scale(0.97)';
      }
    }, 0);
  });

  grid.addEventListener('dragend', () => {
    if (dragSrc) {
      dragSrc.style.opacity = '1';
      dragSrc.style.transform = 'scale(1)';
      dragSrc = null;
    }
    grid.querySelectorAll('[data-widget-id]').forEach(el => {
      el.style.boxShadow = '';
    });
    persistOrder(grid);
  });

  grid.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('[data-widget-id]');
    if (target && target !== dragSrc) {
      target.style.boxShadow = '0 0 0 2px var(--color-gold, #f59e0b)';
    }
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

    if (srcIdx < tgtIdx) {
      grid.insertBefore(dragSrc, target.nextSibling);
    } else {
      grid.insertBefore(dragSrc, target);
    }
  });
}

function persistOrder(grid) {
  const order = [...grid.querySelectorAll('[data-widget-id]')].map(el => el.dataset.widgetId);
  saveOrder(order);
}

// ─── Inyectar estilos globales una sola vez ───────────────────────────────────
function injectStyles() {
  if (document.getElementById('ataque-alert-styles')) return;
  const style = document.createElement('style');
  style.id = 'ataque-alert-styles';
  style.textContent = `
    @keyframes pulse-red {
      0%,100% { transform:scale(1);   box-shadow:0 0 8px rgba(239,68,68,0.8); }
      50%      { transform:scale(1.2); box-shadow:0 0 16px rgba(239,68,68,1);  }
    }
    #ataque-drag-grid [data-widget-id]:active { cursor: grabbing; }
    #ataque-drag-grid .widget-header:hover { filter: brightness(1.1); }
    #ataque-resize-handle:hover svg line { stroke: var(--color-gold, #f59e0b); }
  `;
  document.head.appendChild(style);
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function renderAtaqueTab(tracker) {
  const container = document.getElementById('ataque-table-container');
  if (!container) return;

  injectStyles();

  const spins    = tracker.getSpins();
  const maxes    = tracker.winWinEngine?.historicalMaxes || {};
  const settings = rouletteSettingsStore.getSnapshot();
  const getAtraso = buildGetAtraso(spins);
  const widgetDefs = buildWidgets(getAtraso, maxes, settings);
  const order    = getSavedOrder();

  // ── Wrapper principal ──────────────────────────────────────────────────────
  container.innerHTML = '';

  const currentZoom = getSavedZoom();

  // Control bar (zoom and reset buttons)
  const controlBar = document.createElement('div');
  controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
  controlBar.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:0.25rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
      <label for="ataque-zoom-slider" style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">Zoom:</label>
      <input type="range" id="ataque-zoom-slider" min="50" max="150" value="${Math.round(currentZoom * 100)}" style="width:80px;height:4px;accent-color:var(--color-gold);cursor:pointer;">
      <span id="ataque-zoom-value" style="font-size:0.7rem;color:var(--color-gold);font-family:var(--font-numbers);font-weight:bold;min-width:35px;text-align:right;">${Math.round(currentZoom * 100)}%</span>
    </div>
    <div style="display:flex;gap:6px;" id="ataque-action-buttons">
      <button id="btn-reset-ataque-order" style="
        background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);
        border-radius:6px;color:#888;font-size:0.72rem;padding:3px 10px;cursor:pointer;
        transition:all 0.2s;
      " title="Restablecer orden de paneles">↺ Restablecer orden</button>
    </div>
  `;
  container.appendChild(controlBar);

  // Grid de widgets
  const grid = document.createElement('div');
  grid.id = 'ataque-drag-grid';
  grid.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
  grid.style.zoom = currentZoom;
  container.appendChild(grid);

  // Renderizar en el orden guardado
  order.forEach(id => {
    if (widgetDefs[id]) {
      grid.appendChild(createWidgetEl(widgetDefs[id]));
    }
  });

  // Añadir widgets nuevos que no estén en el orden guardado
  Object.keys(widgetDefs).forEach(id => {
    if (!order.includes(id)) {
      grid.appendChild(createWidgetEl(widgetDefs[id]));
    }
  });

  initDragDrop(grid);

  // Resize del panel completo
  const panel = container.closest('.panel') || container.parentElement;
  if (panel && !panel.querySelector('#ataque-resize-handle')) {
    initPanelResize(panel);
  }

  // Reset order button
  const btnReset = document.getElementById('btn-reset-ataque-order');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      localStorage.removeItem(LS_KEY);
      renderAtaqueTab(tracker);
    });
  }

  // Añadir botón reset tamaño junto al de orden
  const actionButtonsContainer = controlBar.querySelector('#ataque-action-buttons');
  if (!document.getElementById('btn-reset-ataque-size') && actionButtonsContainer) {
    const btnSize = document.createElement('button');
    btnSize.id = 'btn-reset-ataque-size';
    btnSize.title = 'Restablecer tamaño del panel';
    btnSize.textContent = '⤢ Tamaño original';
    btnSize.style.cssText = `
      background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);
      border-radius:6px;color:#888;font-size:0.72rem;padding:3px 10px;cursor:pointer;
      transition:all 0.2s;
    `;
    btnSize.addEventListener('click', () => {
      localStorage.removeItem(LS_KEY_SIZE);
      const p = container.closest('.panel') || container.parentElement;
      if (p) { p.style.width = ''; p.style.height = ''; p.style.overflow = ''; }
      
      // Resetea también el zoom al tamaño original (100%)
      localStorage.removeItem(LS_KEY_ZOOM);
      document.getElementById('ataque-zoom-slider').value = 100;
      document.getElementById('ataque-zoom-value').textContent = '100%';
      grid.style.zoom = 1;
    });
    actionButtonsContainer.insertBefore(btnSize, actionButtonsContainer.firstChild);
  }

  // Listener para el slider de zoom
  const zoomSlider = document.getElementById('ataque-zoom-slider');
  const zoomValue = document.getElementById('ataque-zoom-value');
  if (zoomSlider && zoomValue) {
    zoomSlider.addEventListener('input', (e) => {
      const zoomPct = e.target.value;
      zoomValue.textContent = zoomPct + '%';
      const zoomFloat = parseInt(zoomPct) / 100;
      grid.style.zoom = zoomFloat;
      saveZoom(zoomFloat);
    });
  }
}
