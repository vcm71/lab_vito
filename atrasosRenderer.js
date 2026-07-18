import { rouletteSettingsStore } from './rouletteSettingsStore.js';

// ─── Orden por defecto de los widgets ────────────────────────────────────────
const DEFAULT_ORDER = ['leyenda', 'suertes', 'docenas', 'columnas', 'seisenas', 'ceros', 'series'];
const LS_KEY      = 'orion_atrasos_widget_order';
const LS_KEY_SIZE = 'orion_atrasos_panel_size';
const LS_KEY_ZOOM = 'orion_atrasos_panel_zoom';

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
  // Preparar el panel para resize
  panel.style.position   = 'relative';
  panel.style.overflow   = 'hidden';
  panel.style.boxSizing  = 'border-box';
  panel.style.minWidth   = '260px';
  panel.style.minHeight  = '200px';
  panel.style.transition = 'none'; // evitar saltos durante resize

  // Restaurar tamaño guardado
  const saved = getSavedSize();
  if (saved) {
    panel.style.width  = saved.w + 'px';
    panel.style.height = saved.h + 'px';
  }

  // Crear handle visual (esquina inf-der)
  const handle = document.createElement('div');
  handle.id = 'atrasos-resize-handle';
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
function buildGetDelayStats(spins, maxWindow = 0) {
  return (checkFn) => {
    if (spins.length === 0) {
      return { atraso: 0, maxHist: 0 };
    }

    let currentDelay = 0;
    for (let i = spins.length - 1; i >= 0; i--) {
      if (checkFn(String(spins[i].number))) break;
      currentDelay++;
    }

    let maxDelay = 0;
    const windowSize = Number.isFinite(maxWindow) ? Math.max(0, Math.floor(maxWindow)) : 0;
    const windowSpins = windowSize > 0 ? spins.slice(-windowSize) : spins;
    let windowDelay = 0;

    for (const spin of windowSpins) {
      if (checkFn(String(spin.number))) {
        if (windowDelay > maxDelay) maxDelay = windowDelay;
        windowDelay = 0;
      } else {
        windowDelay++;
      }
    }

    if (windowDelay > maxDelay) maxDelay = windowDelay;

    return {
      atraso: currentDelay,
      maxHist: maxDelay
    };
  };
}

// ─── Estilo del círculo según alertas ─────────────────────────────────────────
const CRITICAL_THRESHOLD = 9;

function getCircleStyle(atraso, limit, criticalThreshold = CRITICAL_THRESHOLD) {
  if (atraso >= criticalThreshold) {
    return { bg: '#ef4444', color: '#fff', shadow: '0 0 8px rgba(239,68,68,0.8)', animation: 'pulse-red 1s infinite' };
  }
  if (atraso >= limit) {
    return { bg: '#f97316', color: '#fff', shadow: '0 0 6px rgba(249,115,22,0.7)', animation: 'none' };
  }
  return { bg: 'var(--color-gold)', color: '#000', shadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)', animation: 'none' };
}

function getHistoryCircleStyle() {
  return {
    bg: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
    color: '#000',
    shadow: '0 0 6px rgba(34,197,94,0.55)',
    animation: 'none'
  };
}

function renderCircle(value, style, title) {
  return `
    <div title="${title}" style="
      background:${style.bg};
      color:${style.color};
      box-shadow:${style.shadow};
      animation:${style.animation};
      border-radius:50%;
      width:${style.size || 28}px;
      height:${style.size || 28}px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:${style.fontSize || '0.72rem'};
      font-weight:bold;
      transition:background 0.3s ease,box-shadow 0.3s ease;
      flex-shrink:0;
      line-height:1;
    ">
      ${value}
    </div>`;
}

// ─── HTML de un badge individual ──────────────────────────────────────────────
function badgeHtml(item) {
  let circleStyle;
  if (item.isExternal) {
    const cs = getCircleStyle(item.atraso, item.limit, item.criticalThreshold);
    circleStyle = cs;
  } else {
    circleStyle = {
      bg: 'var(--color-gold)',
      color: '#000',
      shadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)',
      animation: 'none'
    };
  }
  return `
    <div style="display:flex;align-items:center;background:${item.bg};border:1px solid ${item.border};border-radius:8px;padding:4px 6px 4px 10px;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
      <span style="font-weight:600;margin-right:8px;font-size:0.95rem;text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${item.name}</span>
      <div style="display:flex;align-items:center;gap:6px;margin-left:auto;">
        ${renderCircle(item.atraso, circleStyle, 'Atraso actual')}
        ${renderCircle(item.maxHist, getHistoryCircleStyle(), 'Máximo histórico')}
      </div>
    </div>`;
}

function getSeriesTone(atraso, maxHist) {
  if (atraso >= maxHist && atraso > 0) {
    return {
      label: 'Tensión actual',
      accent: 'rgba(168,85,247,0.85)',
      glow: '0 0 10px rgba(168,85,247,0.35)'
    };
  }

  if (maxHist > 0 && atraso / maxHist >= 0.75) {
    return {
      label: 'Cerca del máximo',
      accent: 'rgba(245,158,11,0.85)',
      glow: '0 0 10px rgba(245,158,11,0.35)'
    };
  }

  return {
    label: 'Estable',
    accent: 'rgba(34,197,94,0.85)',
    glow: '0 0 10px rgba(34,197,94,0.25)'
  };
}

function renderMiniBar(current, maxHist, accent) {
  const scale = Math.max(current, maxHist, 1);
  const currentPct = Math.min(100, Math.max(0, (current / scale) * 100));
  const maxPct = Math.min(100, Math.max(0, (maxHist / scale) * 100));

  return `
    <div style="margin-top:8px;">
      <div style="height:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;position:relative;">
        <div style="position:absolute;inset:0 auto 0 0;width:${currentPct}%;background:linear-gradient(90deg, ${accent} 0%, rgba(255,255,255,0.16) 100%);box-shadow:0 0 12px ${accent};"></div>
        <div style="position:absolute;top:-3px;bottom:-3px;left:${Math.max(0, maxPct - 1)}%;width:2px;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,0.85);border-radius:2px;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:8px;margin-top:5px;font-size:0.62rem;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.06em;">
        <span>Actual ${current}</span>
        <span>Máx ${maxHist}</span>
      </div>
    </div>`;
}

function seriesLabHtml(item) {
  const tone = getSeriesTone(item.atraso, item.maxHist);
  const cardAccent = tone.accent.replace('0.85', '0.18').replace('0.25', '0.18');

  return `
    <div style="
      display:flex;
      flex-direction:column;
      gap:5px;
      flex:1 1 180px;
      min-width:180px;
      background:linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
      border:1px solid rgba(168,85,247,0.22);
      border-radius:11px;
      padding:8px 8px 7px;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
    ">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:9px;height:9px;border-radius:50%;background:${tone.accent};box-shadow:${tone.glow};flex-shrink:0;"></div>
        <span style="font-weight:700;font-size:0.84rem;letter-spacing:0.02em;">${item.name}</span>
        <span style="margin-left:auto;font-size:0.56rem;color:#b3a7d6;text-transform:uppercase;letter-spacing:0.08em;">${tone.label}</span>
      </div>

      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:999px;background:${cardAccent};border:1px solid rgba(168,85,247,0.18);">
          <span style="font-size:0.58rem;color:#d9ccff;text-transform:uppercase;letter-spacing:0.08em;">Actual</span>
          ${renderCircle(item.atraso, {
            bg: tone.accent,
            color: '#fff',
            shadow: tone.glow,
            animation: 'none',
            size: 28,
            fontSize: '0.72rem'
          }, 'Atraso actual')}
        </div>

        <div style="display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.16);">
          <span style="font-size:0.58rem;color:#b8f4c9;text-transform:uppercase;letter-spacing:0.08em;">Máx</span>
          ${renderCircle(item.maxHist, {
            bg: 'linear-gradient(180deg, #34d399 0%, #16a34a 100%)',
            color: '#07130b',
            shadow: '0 0 8px rgba(34,197,94,0.5)',
            animation: 'none',
            size: 28,
            fontSize: '0.72rem'
          }, 'Máximo histórico')}
        </div>
      </div>

      ${renderMiniBar(item.atraso, item.maxHist, tone.accent)}
    </div>`;
}

function labMetricCardHtml(item, theme) {
  const tone = getSeriesTone(item.atraso, item.maxHist);
  const currentCircleStyle = item.isExternal
    ? getCircleStyle(item.atraso, item.limit, item.criticalThreshold)
    : {
        bg: 'var(--color-gold)',
        color: '#000',
        shadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)',
        animation: 'none'
      };
  const label = item.atraso >= item.maxHist && item.atraso > 0
    ? 'Tensión actual'
    : (item.maxHist > 0 && item.atraso / item.maxHist >= 0.75 ? 'Cerca del máximo' : 'Estable');
  const accent = theme.accent || tone.accent;
  const glow = theme.glow || tone.glow;
  const cardAccent = accent.replace('0.85', '0.18').replace('0.25', '0.18');
  const maxCircleBg = theme.maxBg || 'linear-gradient(180deg, #34d399 0%, #16a34a 100%)';
  const maxCircleColor = theme.maxColor || '#07130b';
  const maxCircleShadow = theme.maxShadow || '0 0 8px rgba(34,197,94,0.5)';

  return `
    <div style="
      display:flex;
      flex-direction:column;
      gap:5px;
      flex:1 1 180px;
      min-width:180px;
      background:linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
      border:1px solid ${theme.border || 'rgba(168,85,247,0.22)'};
      border-radius:11px;
      padding:8px 8px 7px;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
    ">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:9px;height:9px;border-radius:50%;background:${accent};box-shadow:${glow};flex-shrink:0;"></div>
        <span style="font-weight:700;font-size:0.84rem;letter-spacing:0.02em;">${item.name}</span>
        <span style="margin-left:auto;font-size:0.56rem;color:#b3a7d6;text-transform:uppercase;letter-spacing:0.08em;">${label}</span>
      </div>

      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:999px;background:${cardAccent};border:1px solid ${theme.border || 'rgba(168,85,247,0.18)'};">
          <span style="font-size:0.58rem;color:#d9ccff;text-transform:uppercase;letter-spacing:0.08em;">Actual</span>
          ${renderCircle(item.atraso, {
            bg: currentCircleStyle.bg,
            color: currentCircleStyle.color,
            shadow: currentCircleStyle.shadow,
            animation: currentCircleStyle.animation,
            size: 28,
            fontSize: '0.72rem'
          }, 'Atraso actual')}
        </div>

        <div style="display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.16);">
          <span style="font-size:0.58rem;color:#b8f4c9;text-transform:uppercase;letter-spacing:0.08em;">Máx</span>
          ${renderCircle(item.maxHist, {
            bg: maxCircleBg,
            color: maxCircleColor,
            shadow: maxCircleShadow,
            animation: 'none',
            size: 28,
            fontSize: '0.72rem'
          }, 'Máximo histórico')}
        </div>
      </div>

      ${renderMiniBar(item.atraso, item.maxHist, accent)}
    </div>`;
}

// ─── Definición de cada widget ────────────────────────────────────────────────
function buildWidgets(getDelayStats, settings) {
  const LIMIT_COLOR   = settings.atrasosLimit ?? 5;
  const LIMIT_PARITY  = settings.atrasosLimit ?? 5;
  const LIMIT_HIGHLOW = settings.atrasosLimit ?? 5;
  const LIMIT_DOZEN   = settings.atrasosLimit ?? 5;
  const LIMIT_COLUMN  = settings.atrasosLimit ?? 5;
  const CRITICAL_LIMIT = settings.atrasosCritical ?? 9;
  const MAX_WINDOW     = settings.atrasosMaxWindow ?? 0;

  const red   = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];
  const black = ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"];

  const isNum = (num) => num !== "0" && num !== "00";

  return {
    leyenda: {
      id: 'leyenda',
      title: '🔔 Leyenda de Alertas',
      icon: '🔔',
      content: `
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:0.8rem;color:#aaa;">
          <span style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#f97316;display:inline-block;"></span> Límite alcanzado
          </span>
          <span style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Crítico (≥${CRITICAL_LIMIT})
          </span>
          <span style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#22c55e;display:inline-block;"></span> Máximo
          </span>
          <span style="margin-left:auto;color:#555;font-size:0.72rem;">Solo apuestas externas</span>
        </div>`,
      accent: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.12)'
    },

    suertes: {
      id: 'suertes',
      title: 'Suertes Sencillas',
      icon: '🎯',
      content: `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;border:1px solid rgba(239,68,68,0.16);border-radius:10px;background:linear-gradient(180deg, rgba(239,68,68,0.08) 0%, rgba(255,255,255,0.02) 100%);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.76rem;color:#ffd9d9;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Laboratorio de apuestas externas</span>
            <span style="font-size:0.68rem;color:#c89b9b;">Bloques más compactos para lectura rápida en pantallas angostas</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.65rem;color:#d0a6a6;text-transform:uppercase;letter-spacing:0.08em;">
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:rgba(239,68,68,0.85);display:inline-block;"></span> Actual</span>
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;"></span> Máx</span>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'Rojo',        ...getDelayStats(n => red.includes(n)),   theme:{ accent:'rgba(239,68,68,0.85)', glow:'0 0 10px rgba(239,68,68,0.35)', border:'rgba(239,68,68,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Rojo',        ...getDelayStats(n => red.includes(n)),   isExternal:true, limit:LIMIT_COLOR, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(239,68,68,0.85)', glow:'0 0 10px rgba(239,68,68,0.35)', border:'rgba(239,68,68,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Negro',       ...getDelayStats(n => black.includes(n)),  isExternal:true, limit:LIMIT_COLOR, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(38,38,38,0.92)', glow:'0 0 10px rgba(255,255,255,0.14)', border:'rgba(255,255,255,0.18)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Par',         ...getDelayStats(n => isNum(n) && parseInt(n)%2===0),  isExternal:true, limit:LIMIT_PARITY, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(59,130,246,0.85)', glow:'0 0 10px rgba(59,130,246,0.35)', border:'rgba(59,130,246,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Impar',       ...getDelayStats(n => isNum(n) && parseInt(n)%2!==0), isExternal:true, limit:LIMIT_PARITY, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(96,165,250,0.85)', glow:'0 0 10px rgba(96,165,250,0.35)', border:'rgba(96,165,250,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Falta (1-18)',...getDelayStats(n => isNum(n) && parseInt(n)>=1  && parseInt(n)<=18), isExternal:true, limit:LIMIT_HIGHLOW, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(234,179,8,0.85)', glow:'0 0 10px rgba(234,179,8,0.35)', border:'rgba(234,179,8,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Pasa (19-36)',...getDelayStats(n => isNum(n) && parseInt(n)>=19 && parseInt(n)<=36), isExternal:true, limit:LIMIT_HIGHLOW, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(251,191,36,0.85)', glow:'0 0 10px rgba(251,191,36,0.35)', border:'rgba(251,191,36,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
      ].map(item => labMetricCardHtml(item, item.theme)).join('')}</div>`,
      accent: 'rgba(239,68,68,0.08)',
      borderColor: 'rgba(239,68,68,0.25)'
    },

    docenas: {
      id: 'docenas',
      title: 'Docenas',
      icon: '🔢',
      content: `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;border:1px solid rgba(168,85,247,0.16);border-radius:10px;background:linear-gradient(180deg, rgba(168,85,247,0.08) 0%, rgba(255,255,255,0.02) 100%);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.76rem;color:#d8c8ff;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Laboratorio de docenas</span>
            <span style="font-size:0.68rem;color:#9f8bc8;">Lectura comparativa de atrasos y máximos por bloque</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.65rem;color:#a99bd0;text-transform:uppercase;letter-spacing:0.08em;">
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:rgba(168,85,247,0.85);display:inline-block;"></span> Actual</span>
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;"></span> Máx</span>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">${[
        { name:'1ª Docena', ...getDelayStats(n => isNum(n) && parseInt(n)>=1  && parseInt(n)<=12), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(168,85,247,0.85)', glow:'0 0 10px rgba(168,85,247,0.35)', border:'rgba(168,85,247,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'2ª Docena', ...getDelayStats(n => isNum(n) && parseInt(n)>=13 && parseInt(n)<=24), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(245,158,11,0.85)', glow:'0 0 10px rgba(245,158,11,0.35)', border:'rgba(245,158,11,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'3ª Docena', ...getDelayStats(n => isNum(n) && parseInt(n)>=25 && parseInt(n)<=36), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(239,68,68,0.85)', glow:'0 0 10px rgba(239,68,68,0.35)', border:'rgba(239,68,68,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
      ].map(item => labMetricCardHtml(item, item.theme)).join('')}</div>`,
      accent: 'rgba(168,85,247,0.08)',
      borderColor: 'rgba(168,85,247,0.25)'
    },

    columnas: {
      id: 'columnas',
      title: 'Columnas',
      icon: '🏛️',
      content: `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;border:1px solid rgba(14,165,233,0.16);border-radius:10px;background:linear-gradient(180deg, rgba(14,165,233,0.08) 0%, rgba(255,255,255,0.02) 100%);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.76rem;color:#cdefff;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Laboratorio de columnas</span>
            <span style="font-size:0.68rem;color:#8db7cf;">Comparación visual de ritmo y presión por columna</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.65rem;color:#8fb7d2;text-transform:uppercase;letter-spacing:0.08em;">
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:rgba(14,165,233,0.85);display:inline-block;"></span> Actual</span>
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;"></span> Máx</span>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">${[
        { name:'Columna 1', ...getDelayStats(n => isNum(n) && parseInt(n)%3===1), isExternal:true, limit:LIMIT_COLUMN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(14,165,233,0.85)', glow:'0 0 10px rgba(14,165,233,0.35)', border:'rgba(14,165,233,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Columna 2', ...getDelayStats(n => isNum(n) && parseInt(n)%3===2), isExternal:true, limit:LIMIT_COLUMN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(59,130,246,0.85)', glow:'0 0 10px rgba(59,130,246,0.35)', border:'rgba(59,130,246,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'Columna 3', ...getDelayStats(n => isNum(n) && parseInt(n)%3===0), isExternal:true, limit:LIMIT_COLUMN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(34,197,94,0.85)', glow:'0 0 10px rgba(34,197,94,0.35)', border:'rgba(34,197,94,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
      ].map(item => labMetricCardHtml(item, item.theme)).join('')}</div>`,
      accent: 'rgba(14,165,233,0.08)',
      borderColor: 'rgba(14,165,233,0.25)'
    },

    seisenas: {
      id: 'seisenas',
      title: 'Seisenas',
      icon: '🎲',
      content: `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;border:1px solid rgba(234,179,8,0.16);border-radius:10px;background:linear-gradient(180deg, rgba(234,179,8,0.08) 0%, rgba(255,255,255,0.02) 100%);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.76rem;color:#fff0c8;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Laboratorio de seisenas</span>
            <span style="font-size:0.68rem;color:#c7b58a;">Vista compacta para bloques de 6 números</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.65rem;color:#cfbf93;text-transform:uppercase;letter-spacing:0.08em;">
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:rgba(234,179,8,0.85);display:inline-block;"></span> Actual</span>
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;"></span> Máx</span>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'S1 (1-6)',   ...getDelayStats(n => ["1","2","3","4","5","6"].includes(n)),       isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(234,179,8,0.85)', glow:'0 0 10px rgba(234,179,8,0.35)', border:'rgba(234,179,8,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'S2 (7-12)',  ...getDelayStats(n => ["7","8","9","10","11","12"].includes(n)),    isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(245,158,11,0.85)', glow:'0 0 10px rgba(245,158,11,0.35)', border:'rgba(245,158,11,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'S3 (13-18)', ...getDelayStats(n => ["13","14","15","16","17","18"].includes(n)), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(239,68,68,0.85)', glow:'0 0 10px rgba(239,68,68,0.35)', border:'rgba(239,68,68,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'S4 (19-24)', ...getDelayStats(n => ["19","20","21","22","23","24"].includes(n)), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(14,165,233,0.85)', glow:'0 0 10px rgba(14,165,233,0.35)', border:'rgba(14,165,233,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'S5 (25-30)', ...getDelayStats(n => ["25","26","27","28","29","30"].includes(n)), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(168,85,247,0.85)', glow:'0 0 10px rgba(168,85,247,0.35)', border:'rgba(168,85,247,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
        { name:'S6 (31-36)', ...getDelayStats(n => ["31","32","33","34","35","36"].includes(n)), isExternal:true, limit:LIMIT_DOZEN, criticalThreshold:CRITICAL_LIMIT, theme:{ accent:'rgba(34,197,94,0.85)', glow:'0 0 10px rgba(34,197,94,0.35)', border:'rgba(34,197,94,0.22)', maxBg:'linear-gradient(180deg, #34d399 0%, #16a34a 100%)', maxColor:'#07130b', maxShadow:'0 0 8px rgba(34,197,94,0.5)' } },
      ].map(item => labMetricCardHtml(item, item.theme)).join('')}</div>`,
      accent: 'rgba(234,179,8,0.08)',
      borderColor: 'rgba(234,179,8,0.25)'
    },

    ceros: {
      id: 'ceros',
      title: 'Ceros',
      icon: '🟢',
      content: `<div style="display:flex;flex-wrap:wrap;gap:8px;">${[
        { name:'00', ...getDelayStats(n => n==='00'), bg:'rgba(34,197,94,0.2)', border:'rgba(34,197,94,0.5)', isExternal:false },
        { name:'0',  ...getDelayStats(n => n==='0'),  bg:'rgba(34,197,94,0.2)', border:'rgba(34,197,94,0.5)', isExternal:false },
      ].map(badgeHtml).join('')}</div>`,
      accent: 'rgba(34,197,94,0.08)',
      borderColor: 'rgba(34,197,94,0.3)'
    },

    series: {
      id: 'series',
      title: 'Series / Sectores',
      icon: '🌀',
      content: `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;border:1px solid rgba(168,85,247,0.16);border-radius:10px;background:linear-gradient(180deg, rgba(168,85,247,0.08) 0%, rgba(255,255,255,0.02) 100%);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.76rem;color:#d8c8ff;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Laboratorio analítico</span>
            <span style="font-size:0.68rem;color:#9f8bc8;">Comparación visual entre atraso actual y máximo histórico</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.65rem;color:#a99bd0;text-transform:uppercase;letter-spacing:0.08em;">
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:rgba(168,85,247,0.85);display:inline-block;"></span> Actual</span>
            <span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;"></span> Máx</span>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">${[
        { name:'S1',  ...getDelayStats(n => ["1","27","2","26","7"].includes(n)),              bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
        { name:'S11', ...getDelayStats(n => ["12","19","11","17","34"].includes(n)),            bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
        { name:'S14', ...getDelayStats(n => ["15","24","16","14","28"].includes(n)),            bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
        { name:'S5',  ...getDelayStats(n => ["32","5","31","33","23"].includes(n)),             bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
        { name:'S0',  ...getDelayStats(n => ["00","10","0","30","20"].includes(n)),             bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
        { name:'S3',  ...getDelayStats(n => ["3","4","6","8","9","13","18"].includes(n)),       bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
        { name:'S21', ...getDelayStats(n => ["21","22","25","29","35","36"].includes(n)),       bg:'rgba(168,85,247,0.1)', border:'rgba(168,85,247,0.3)', isExternal:false },
      ].map(seriesLabHtml).join('')}</div>`,
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
  if (document.getElementById('atraso-alert-styles')) return;
  const style = document.createElement('style');
  style.id = 'atraso-alert-styles';
  style.textContent = `
    @keyframes pulse-red {
      0%,100% { transform:scale(1);   box-shadow:0 0 8px rgba(239,68,68,0.8); }
      50%      { transform:scale(1.2); box-shadow:0 0 16px rgba(239,68,68,1);  }
    }
    #atrasos-drag-grid [data-widget-id]:active { cursor: grabbing; }
    #atrasos-drag-grid .widget-header:hover { filter: brightness(1.1); }
    #atrasos-resize-handle:hover svg line { stroke: var(--color-gold, #f59e0b); }
    #atrasos-drag-grid [data-widget-id="series"] .widget-body {
      background: linear-gradient(180deg, rgba(18,10,34,0.45) 0%, rgba(10,8,20,0.18) 100%);
    }
  `;
  document.head.appendChild(style);
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function renderAtrasosTab(tracker) {
  const container = document.getElementById('atrasos-table-container');
  if (!container) return;

  injectStyles();

  const spins    = tracker.getSpins();
  const settings = rouletteSettingsStore.getSnapshot();
  const getDelayStats = buildGetDelayStats(spins, settings.atrasosMaxWindow ?? 0);
  const widgetDefs = buildWidgets(getDelayStats, settings);
  const order    = getSavedOrder();

  // ── Wrapper principal ──────────────────────────────────────────────────────
  container.innerHTML = '';

  const currentZoom = getSavedZoom();

  // Control bar (zoom and reset buttons)
  const controlBar = document.createElement('div');
  controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
  controlBar.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:0.25rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
      <label for="atrasos-zoom-slider" style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">Zoom:</label>
      <input type="range" id="atrasos-zoom-slider" min="50" max="150" value="${Math.round(currentZoom * 100)}" style="width:80px;height:4px;accent-color:var(--color-gold);cursor:pointer;">
      <span id="atrasos-zoom-value" style="font-size:0.7rem;color:var(--color-gold);font-family:var(--font-numbers);font-weight:bold;min-width:35px;text-align:right;">${Math.round(currentZoom * 100)}%</span>
    </div>
      <div style="display:flex;gap:6px;" id="atrasos-action-buttons">
        <button id="btn-refresh-atrasos" style="
          background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);
          border-radius:6px;color:var(--color-gold,#f59e0b);font-size:0.72rem;padding:3px 12px;cursor:pointer;
          transition:all 0.2s;font-weight:600;
        " title="Actualizar parámetros desde Ajustes">🔄 Actualizar</button>
        <button id="btn-reset-widget-order" style="
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);
          border-radius:6px;color:#888;font-size:0.72rem;padding:3px 10px;cursor:pointer;
          transition:all 0.2s;
        " title="Restablecer orden de paneles">↺ Restablecer orden</button>
      </div>
  `;
  container.appendChild(controlBar);

  // Grid de widgets
  const grid = document.createElement('div');
  grid.id = 'atrasos-drag-grid';
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
  if (panel && !panel.querySelector('#atrasos-resize-handle')) {
    initPanelResize(panel);
  }

  // Botón de actualizar parámetros (recarga de página)
  const btnRefresh = document.getElementById('btn-refresh-atrasos');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Reset order button
  const btnReset = document.getElementById('btn-reset-widget-order');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      localStorage.removeItem(LS_KEY);
      renderAtrasosTab(tracker);
    });
  }

  // Añadir botón reset tamaño junto al de orden
  const actionButtonsContainer = controlBar.querySelector('#atrasos-action-buttons');
  if (!document.getElementById('btn-reset-panel-size') && actionButtonsContainer) {
    const btnSize = document.createElement('button');
    btnSize.id = 'btn-reset-panel-size';
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
      document.getElementById('atrasos-zoom-slider').value = 100;
      document.getElementById('atrasos-zoom-value').textContent = '100%';
      grid.style.zoom = 1;
    });
    actionButtonsContainer.insertBefore(btnSize, actionButtonsContainer.firstChild);
  }

  // Listener para el slider de zoom
  const zoomSlider = document.getElementById('atrasos-zoom-slider');
  const zoomValue = document.getElementById('atrasos-zoom-value');
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
