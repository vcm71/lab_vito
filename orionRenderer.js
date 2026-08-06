/**
 * ORION RENDERER MODULE
 * Encapsula toda la lógica visual del Árbitro de Señales.
 */
import Chart from 'chart.js/auto';
import { AMERICAN_WHEEL_ORDER, RED_NUMBERS } from './src/utils/numberMeta.js';

let orionWheelChart = null;
let orionRotation = 0;

/**
 * Función principal de renderizado de la pestaña ORION
 */
export function renderOrionTab(tracker, orionEngine) {
  const container = document.getElementById('orion-signals-container');
  const banner = document.getElementById('orion-status-banner');
  if (!container) return;

  try {
    const spins = tracker.getSpins();
    const matrix = orionEngine.generateRiskMatrix();
    
    // 1. Visualizaciones Físicas
    if (spins.length > 0) {
      try { renderOrionWheel(tracker); } catch(e) { console.error("ORION: Error en Rueda:", e); }
      try { renderOrionHotZone(tracker, spins.length); } catch(e) { console.error("ORION: Error en Zona Caliente:", e); }
      try { renderOrionStrategyBoard(tracker, matrix); } catch(e) { console.error("ORION: Error en Tablero Estratégico:", e); }
    }

    // 2. Banner de Estado
    const state = orionEngine.analyzeRouletteState();
    if (banner) {
      banner.style.borderColor = state.alert ? '#ef4444' : `${state.color}66`;
      banner.style.background = state.alert 
        ? 'linear-gradient(90deg, #ef444433 0%, rgba(0,0,0,0.5) 100%)' 
        : `linear-gradient(90deg, ${state.color}11 0%, rgba(0,0,0,0.2) 100%)`;
      
      banner.style.animation = state.alert ? 'blink 1s infinite' : 'none';

      banner.innerHTML = `
        <div style="font-size: 1.5rem;">${state.icon}</div>
        <div>
          <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Estado del Cilindro</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: ${state.color};">${state.state}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted);">${state.detail || ''}</div>
        </div>
      `;
    }

    // 3. Matriz de Riesgo y Señales
    const sections = [
      { id: 'CRITICAL', label: '🚨 ALERTA CRÍTICA (ALTA CONFLUENCIA)', color: '#ef4444', data: matrix.CRITICAL },
      { id: 'STABLE', label: '💎 OPORTUNIDADES ESTABLES', color: '#3b82f6', data: matrix.STABLE },
      { id: 'SPECULATIVE', label: '🧪 ESCENARIOS ESPECULATIVOS', color: '#94a3b8', data: matrix.SPECULATIVE }
    ];

    let html = '';
    sections.forEach(sec => {
      if (sec.data.length === 0) return;

      html += `
        <div style="margin-top: 1.5rem; margin-bottom: 0.5rem;">
          <div style="font-size: 0.7rem; font-weight: 800; color: ${sec.color}; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 0.5rem;">
            <span>${sec.label}</span>
            <div style="flex: 1; height: 1px; background: linear-gradient(90deg, ${sec.color}66, transparent);"></div>
          </div>
        </div>
      `;

      sec.data.forEach(sig => {
        html += `
          <div class="stat-card" style="border-left: 4px solid ${sec.color}; padding: 0.85rem; background: rgba(255,255,255,0.02); margin-bottom: 0.75rem; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="font-size: 1.1rem; font-weight: 900; color: var(--color-gold);">${sig.name}</div>
              <div style="font-size: 1.2rem; font-weight: 900; color: ${sec.color};">${sig.confidence}% <span style="font-size: 0.6rem; font-weight: 400; color: var(--text-muted);">CONF.</span></div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
              <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 4px;">
                <div style="font-size: 0.55rem; color: var(--text-muted);">EV (Edge)</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: ${parseFloat(sig.ev) > 0 ? '#10b981' : '#ef4444'};">${sig.ev}</div>
              </div>
              <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 4px;">
                <div style="font-size: 0.55rem; color: var(--text-muted);">STABILITY</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #fff;">${sig.stability}</div>
              </div>
              <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 4px;">
                <div style="font-size: 0.55rem; color: var(--text-muted);">REGIME</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #3b82f6;">${sig.regime}</div>
              </div>
            </div>

            <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); padding: 0.6rem; border-radius: 4px; margin-bottom: 0.75rem;">
              <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Sequential Probability Ratio (SPRT)</div>
              <div style="font-size: 0.85rem; font-weight: 900; color: var(--color-gold);">${sig.sprt}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-style: italic;">
                FDR (q-value): <span style="color: ${parseFloat(sig.qValue) < 0.1 ? '#10b981' : '#f59e0b'}; font-weight: bold;">${sig.qValue}</span>
              </div>
              <div style="font-size: 0.65rem; color: ${sec.color}; font-weight: bold; text-transform: uppercase;">${sig.risk}</div>
            </div>
          </div>
        `;
      });
    });

    if (html === '') {
      container.innerHTML = '<div class="empty-msg">El Árbitro no detecta señales de confluencia suficientes en este momento.</div>';
    } else {
      container.innerHTML = html;
    }
  } catch (err) {
    console.error("ORION: Error crítico en renderizado:", err);
    container.innerHTML = `<div class="empty-msg" style="color: #ef4444;">Fallo en el Módulo ORION: ${err.message}</div>`;
  }
}

/**
 * Renderizado del gráfico SVG del cilindro (Copia TOTAL de la rutina de Estadísticas)
 */
function renderOrionWheel(tracker) {
  const container = document.getElementById('orion-wheel-container');
  if (!container) return;

  const spins = tracker.getSpins();
  const numCounts = tracker._freq;
  const maxHits = Math.max(...Object.values(numCounts), 1);

  const totalSlices = 38;
  const sliceAngle = 360 / totalSlices;
  const cx = 150;
  const cy = 150;

  // --- ESCALADO ORION: Incremento del 20% en dimensiones visuales ---
  const rOuter = 168; // (Original: 140 * 1.2)
  const rInner = 102; // (Original: 85 * 1.2)
  const rCross = 198; // (Original: 165 * 1.2)
  // ------------------------------------------------------------------

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, innerRadius, outerRadius, startAngle, endAngle) => {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", startOuter.x, startOuter.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  let svgHtml = `<svg viewBox="-60 -60 420 420" width="100%" height="100%">`;
  
  // Grupo principal con rotación y transición suave
  svgHtml += `<g style="transform-origin: 150px 150px; transform: rotate(${orionRotation}deg); transition: transform 0.1s linear;">`;
  
  const offsetAngle = sliceAngle / 2;

  for (let i = 0; i < totalSlices; i++) {
    const num = AMERICAN_WHEEL_ORDER[i];
    const startAngle = (i * sliceAngle) - offsetAngle + 180;
    const endAngle = ((i + 1) * sliceAngle) - offsetAngle + 180;
    
    // Color base (Estadísticas style)
    let baseColor = '#1e293b'; 
    if (num === '0' || num === '00') baseColor = '#16a34a';
    else if (RED_NUMBERS.includes(num)) baseColor = '#dc2626';

    const hits = numCounts[num] || 0;
    const heatFactor = hits / maxHits;
    const fillOpacity = (hits === 0 && spins.length > 0) ? 0.3 : 1;

    // Segmento Principal con Tooltip nativo
    svgHtml += `
      <g class="wheel-segment" data-num="${num}" style="cursor: pointer;">
        <title>Nº ${num}: ${hits} hits (${((hits/Math.max(spins.length,1))*100).toFixed(1)}%)</title>
        <path d="${describeArc(cx, cy, rInner, rOuter, startAngle, endAngle)}" 
              fill="${baseColor}" fill-opacity="${fillOpacity}" 
              stroke="#121418" stroke-width="1.5" />
    `;

    // Capa de Calor (Dorado) con mix-blend-mode
    if (hits > 0) {
      const overlayOpacity = 0.3 + (heatFactor * 0.7); 
      svgHtml += `<path d="${describeArc(cx, cy, rInner, rOuter, startAngle, endAngle)}" 
                        fill="rgba(212, 175, 55, ${overlayOpacity})" 
                        style="mix-blend-mode: screen;" pointer-events="none"/>`;
    }

    // Texto del Número (Estadísticas style)
    const textRadius = (rInner + rOuter) / 2;
    const textAngle = startAngle + (sliceAngle / 2);
    const textPos = polarToCartesian(cx, cy, textRadius, textAngle);

    svgHtml += `
        <text transform="translate(${textPos.x}, ${textPos.y}) rotate(${textAngle}) scale(1, 1.2)" 
              fill="#ffffff" font-size="13" font-family="'Roboto Mono', monospace" font-weight="900" 
              text-anchor="middle" dominant-baseline="middle" 
              style="pointer-events: none;">
          ${num}
        </text>
      </g>
    `;
  }

  // 2. Gráfico de Ranuras Centrales Proporcionales (Radio Variable)
  const rPieMax = rInner - 5;
  const sliceAngleFixed = 360 / totalSlices;
  let startAnglePie = -(sliceAngleFixed / 2) + 180; 

  AMERICAN_WHEEL_ORDER.forEach((num) => {
    const hits = numCounts[num] || 0;
    const rProportional = (rPieMax * 0.2) + (rPieMax * 0.8 * (hits / maxHits)); 
    const endAnglePie = startAnglePie + sliceAngleFixed;
    
    svgHtml += `<path d="${describeArc(cx, cy, 0, rProportional, startAnglePie, endAnglePie)}" 
                      fill="var(--roulette-red)" fill-opacity="0.6" 
                      stroke="rgba(212, 175, 55, 0.4)" stroke-width="0.5" />`;
    startAnglePie = endAnglePie;
  });

  // 3. Círculo central "Donut"
  svgHtml += `<circle cx="${cx}" cy="${cy}" r="${rPieMax * 0.3}" fill="#121418" stroke="var(--color-gold)" stroke-width="1.5"/>`;
  svgHtml += `<text x="${cx}" y="${cy + 5}" fill="var(--color-gold)" font-weight="bold" font-size="10" text-anchor="middle">ORION v4</text>`;

  svgHtml += `</g>`; // CIERRE DEL GRUPO DE ROTACIÓN

  // 4. Cruz Azul de Cuadrantes (FIJA, NO ROTA)
  svgHtml += `<line x1="${cx}" y1="${cy - rCross}" x2="${cx}" y2="${cy + rCross}" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.8" pointer-events="none"/>`;
  svgHtml += `<line x1="${cx - rCross}" y1="${cy}" x2="${cx + rCross}" y2="${cy}" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.8" pointer-events="none"/>`;

  // 5. Marcador Fijo Norte (N)
  svgHtml += `<text x="${cx}" y="-45" fill="var(--color-gold)" font-size="18" font-weight="bold" text-anchor="middle">N</text>`;
  svgHtml += `<line x1="${cx}" y1="-35" x2="${cx}" y2="5" stroke="var(--roulette-red)" stroke-width="4"/>`;

  svgHtml += `</svg>`;
  container.innerHTML = svgHtml;
}

/**
 * Cálculo y renderizado de la zona física caliente
 */
function renderOrionHotZone(tracker, totalSpins) {
  const container = document.getElementById('orion-hotzone-info');
  if (!container) return;

  const freqs = tracker._freq;
  let maxSum = -1;
  let bestCenter = '-';
  let members = [];

  for (let i = 0; i < AMERICAN_WHEEL_ORDER.length; i++) {
    let sum = 0;
    let tempMembers = [];
    for (let j = -2; j <= 2; j++) {
      const idx = (i + j + 38) % 38;
      const num = AMERICAN_WHEEL_ORDER[idx];
      sum += (freqs[num] || 0);
      tempMembers.push(num);
    }
    if (sum > maxSum) {
      maxSum = sum;
      bestCenter = AMERICAN_WHEEL_ORDER[i];
      members = tempMembers;
    }
  }

  const pct = totalSpins > 0 ? ((maxSum / totalSpins) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 1.5rem; font-weight: 900; color: #10b981;">${bestCenter}</div>
      <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Centro de Impacto</div>
    </div>
    <div style="background: rgba(16, 185, 129, 0.1); padding: 0.5rem; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.2);">
      <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
        <span style="color: var(--text-muted);">Frecuencia Sector:</span>
        <span style="color: #10b981; font-weight: bold;">${maxSum} hits (${pct}%)</span>
      </div>
      <div style="margin-top: 0.4rem; display: flex; gap: 0.2rem; justify-content: center;">
        ${members.map(n => `<span style="font-size: 0.65rem; background: #000; padding: 0.1rem 0.3rem; border-radius: 2px; color: ${RED_NUMBERS.includes(n)?'#ef4444':(n==='0'||n==='00'?'#10b981':'#fff')}">${n}</span>`).join('')}
      </div>
    </div>
    <div style="font-size: 0.6rem; color: var(--text-muted); font-style: italic; margin-top: 0.2rem;">
      * Sector de 5 números (±2 del centro).
    </div>
  `;
}

/**
 * Tablero de Comando Estratégico (Inspirado en la imagen del usuario)
 */
function renderOrionStrategyBoard(tracker, matrix) {
  const board = document.getElementById('orion-strategy-board');
  const favorites = document.getElementById('orion-favorites-container');
  if (!board) return;

  const spins = tracker.getSpins();
  const absData = calculateAbsences(spins);
  const abs = absData.cur;
  const maxAbs = absData.max;
  
  // Extraer todas las señales de alta confianza para resaltar el tablero
  const activeSignals = [...matrix.CRITICAL, ...matrix.STABLE].map(s => s.name);

  // Función para generar celda con estilo dinámico
  const getCell = (label, absKey, orionName, color = '#1e293b') => {
    const isActive = activeSignals.some(s => s.toLowerCase().includes(orionName.toLowerCase()));
    const delay = abs[absKey] || 0;
    const maxDelay = maxAbs[absKey] || 0;

    let textColor = '#fff';
    let borderColor = 'rgba(255,255,255,0.05)';
    let shadow = 'none';

    if (spins.length > 0 && delay === 0) {
      textColor = 'var(--color-gold)';
      borderColor = 'var(--color-gold)';
      shadow = '0 0 8px rgba(212, 175, 55, 0.4)';
    } else if (delay > 0 && delay === maxDelay) {
      textColor = '#a855f7';
      borderColor = '#a855f7';
      shadow = '0 0 8px rgba(168, 85, 247, 0.6)';
    }

    // Orion signals have the highest priority for the border/shadow
    if (isActive) {
      borderColor = 'var(--color-gold)';
      shadow = '0 0 10px rgba(212, 175, 55, 0.4)';
      textColor = 'var(--color-gold)';
    }

    return `
      <div style="
        background: ${color};
        border: 2px solid ${borderColor};
        border-radius: 4px;
        padding: 0.5rem;
        text-align: center;
        flex: 1;
        position: relative;
        box-shadow: ${shadow};
      ">
        <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">${label}</div>
        <div style="font-size: 0.8rem; font-weight: 800; color: ${textColor}; white-space: nowrap;">
          [${delay} / ${maxDelay}]
        </div>
        ${isActive ? '<div style="position: absolute; top: -4px; right: -4px; font-size: 0.5rem;">⭐</div>' : ''}
      </div>
    `;
  };

  board.innerHTML = `
    <!-- Fila 1: 0, 00, Negro, Rojo -->
    <div style="display: flex; gap: 4px;">
      ${getCell('0', 'zero', 'N_0', 'var(--roulette-green)')}
      ${getCell('00', 'doubleZero', 'N_00', 'var(--roulette-green)')}
      ${getCell('Negro', 'black', 'Negro', 'var(--roulette-black)')}
      ${getCell('Rojo', 'red', 'Rojo', 'var(--roulette-red)')}
    </div>
    <!-- Fila 2: Impar, Pares, Numbers Area -->
    <div style="display: flex; gap: 4px;">
      ${getCell('Impar', 'odd', 'Impar')}
      ${getCell('Pares', 'even', 'Par')}
      <div style="flex: 1.5; background: rgba(16, 185, 129, 0.1); border: 2px dashed #10b981; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; min-height: 40px;">
         <span style="position: absolute; top: 2px; left: 4px; font-size: 0.45rem; color: #10b981; font-weight: 900; letter-spacing: 0.5px;">SUGERIDO</span>
         <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center; margin-top: 4px;">
           ${matrix.CRITICAL.length > 0 
             ? matrix.CRITICAL.slice(0, 3).map(s => `
                 <span style="font-weight: 900; color: #fff; background: #10b981; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.85rem; box-shadow: 0 0 5px #10b981;">
                   ${s.name.split('_')[1] || s.name}
                 </span>
               `).join('')
             : '<span style="font-size: 0.6rem; color: #10b981; font-weight: bold; opacity: 0.7;">Esperando mas datos</span>'
           }
         </div>
      </div>
    </div>
    <!-- Fila 3: 1-18, 19-36 -->
    <div style="display: flex; gap: 4px;">
      ${getCell('1-18', 'low', 'Menor')}
      ${getCell('19-36', 'high', 'Mayor')}
    </div>
    <!-- Fila 4: Docenas -->
    <div style="display: flex; gap: 4px;">
      ${getCell('1st 12', 'd1', 'Docena 1')}
      ${getCell('2nd 12', 'd2', 'Docena 2')}
      ${getCell('3rd 12', 'd3', 'Docena 3')}
    </div>
    <!-- Fila 5: Columnas -->
    <div style="display: flex; gap: 4px;">
      ${getCell('Col 1', 'c1', 'Columna 1')}
      ${getCell('Col 2', 'c2', 'Columna 2')}
      ${getCell('Col 3', 'c3', 'Columna 3')}
    </div>
  `;

  // Renderizar Favoritos
  if (favorites) {
    const topNumbers = [...matrix.CRITICAL, ...matrix.STABLE]
      .filter(s => s.name.startsWith('N_') || s.name.startsWith('S_'))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
      
    if (topNumbers.length === 0) {
      favorites.innerHTML = '<span style="font-size: 0.6rem; color: var(--text-muted);">Calculando confluencias...</span>';
    } else {
      favorites.innerHTML = topNumbers.map(n => `
        <div style="background: #000; border: 1px solid var(--color-gold); border-radius: 4px; padding: 0.2rem 0.6rem; font-size: 0.8rem; font-weight: 900; color: var(--color-gold);">
          ${n.name.replace('N_','').replace('S_','')}
        </div>
      `).join('');
    }
  }
}

function calculateAbsences(spins) {
  const cur = { red:0, black:0, zero:0, doubleZero:0, even:0, odd:0, low:0, high:0, d1:0, d2:0, d3:0, c1:0, c2:0, c3:0 };
  const max = { red:0, black:0, zero:0, doubleZero:0, even:0, odd:0, low:0, high:0, d1:0, d2:0, d3:0, c1:0, c2:0, c3:0 };
  
  const NUM_META = {
    "0": { color: "green" }, "00": { color: "green" },
    "1": { color: "red", parity: "odd", hl: "low", dozen: 1, column: 1 },
    "2": { color: "black", parity: "even", hl: "low", dozen: 1, column: 2 },
    "3": { color: "red", parity: "odd", hl: "low", dozen: 1, column: 3 },
    "4": { color: "black", parity: "even", hl: "low", dozen: 1, column: 1 },
    "5": { color: "red", parity: "odd", hl: "low", dozen: 1, column: 2 },
    "6": { color: "black", parity: "even", hl: "low", dozen: 1, column: 3 },
    "7": { color: "red", parity: "odd", hl: "low", dozen: 1, column: 1 },
    "8": { color: "black", parity: "even", hl: "low", dozen: 1, column: 2 },
    "9": { color: "red", parity: "odd", hl: "low", dozen: 1, column: 3 },
    "10": { color: "black", parity: "even", hl: "low", dozen: 1, column: 1 },
    "11": { color: "black", parity: "odd", hl: "low", dozen: 1, column: 2 },
    "12": { color: "red", parity: "even", hl: "low", dozen: 1, column: 3 },
    "13": { color: "black", parity: "odd", hl: "low", dozen: 2, column: 1 },
    "14": { color: "red", parity: "even", hl: "low", dozen: 2, column: 2 },
    "15": { color: "black", parity: "odd", hl: "low", dozen: 2, column: 3 },
    "16": { color: "red", parity: "even", hl: "low", dozen: 2, column: 1 },
    "17": { color: "black", parity: "odd", hl: "low", dozen: 2, column: 2 },
    "18": { color: "red", parity: "even", hl: "low", dozen: 2, column: 3 },
    "19": { color: "red", parity: "odd", hl: "high", dozen: 2, column: 1 },
    "20": { color: "black", parity: "even", hl: "high", dozen: 2, column: 2 },
    "21": { color: "red", parity: "odd", hl: "high", dozen: 2, column: 3 },
    "22": { color: "black", parity: "even", hl: "high", dozen: 2, column: 1 },
    "23": { color: "red", parity: "odd", hl: "high", dozen: 2, column: 2 },
    "24": { color: "black", parity: "even", hl: "high", dozen: 2, column: 3 },
    "25": { color: "red", parity: "odd", hl: "high", dozen: 3, column: 1 },
    "26": { color: "black", parity: "even", hl: "high", dozen: 3, column: 2 },
    "27": { color: "red", parity: "odd", hl: "high", dozen: 3, column: 3 },
    "28": { color: "black", parity: "even", hl: "high", dozen: 3, column: 1 },
    "29": { color: "black", parity: "odd", hl: "high", dozen: 3, column: 2 },
    "30": { color: "red", parity: "even", hl: "high", dozen: 3, column: 3 },
    "31": { color: "black", parity: "odd", hl: "high", dozen: 3, column: 1 },
    "32": { color: "red", parity: "even", hl: "high", dozen: 3, column: 2 },
    "33": { color: "black", parity: "odd", hl: "high", dozen: 3, column: 3 },
    "34": { color: "red", parity: "even", hl: "high", dozen: 3, column: 1 },
    "35": { color: "black", parity: "odd", hl: "high", dozen: 3, column: 2 },
    "36": { color: "red", parity: "even", hl: "high", dozen: 3, column: 3 }
  };

  const update = (key, isHit) => {
    if (isHit) {
      if (cur[key] > max[key]) max[key] = cur[key];
      cur[key] = 0;
    } else {
      cur[key]++;
    }
  };

  for (const spin of spins) {
    const m = NUM_META[spin.number];
    if (!m) continue;
    
    update('zero', spin.number === '0');
    update('doubleZero', spin.number === '00');
    
    if (m.color !== 'green') {
      update('red', m.color === 'red');
      update('black', m.color === 'black');
    } else {
      cur.red++; cur.black++;
    }

    if (m.parity) {
      update('even', m.parity === 'even');
      update('odd', m.parity === 'odd');
    } else {
      cur.even++; cur.odd++;
    }

    if (m.hl) {
      update('low', m.hl === 'low');
      update('high', m.hl === 'high');
    } else {
      cur.low++; cur.high++;
    }

    if (m.dozen) {
      update('d1', m.dozen === 1);
      update('d2', m.dozen === 2);
      update('d3', m.dozen === 3);
    } else {
      cur.d1++; cur.d2++; cur.d3++;
    }

    if (m.column) {
      update('c1', m.column === 1);
      update('c2', m.column === 2);
      update('c3', m.column === 3);
    } else {
      cur.c1++; cur.c2++; cur.c3++;
    }
  }

  // Final check
  for (const k in cur) {
    if (cur[k] > max[k]) max[k] = cur[k];
  }

  return { cur, max };
}

/**
 * Inicializa los eventos de la pestaña ORION (Botones de Demo y Calibración)
 */
export function initOrionEvents(tracker, updateUICallback) {
  const btnDebugBias = document.getElementById('btn-debug-bias');
  if (btnDebugBias) {
    btnDebugBias.addEventListener('click', () => {
      const targetNums = ["5", "23", "31", "32", "33"]; // S_32
      const totalSpins = 200;
      
      if (!confirm(`Se inyectarán ${totalSpins} tiradas con sesgo del 40% en S_32 para validar el motor ORION. ¿Continuar?`)) return;
      
      // Limpiar historial previo para ver el efecto claro
      tracker.clearSession();
      
      for (let i = 0; i < totalSpins; i++) {
        let num;
        const r = Math.random();
        if (r < 0.40) {
          num = targetNums[Math.floor(Math.random() * targetNums.length)];
        } else {
          num = AMERICAN_WHEEL_ORDER[Math.floor(Math.random() * AMERICAN_WHEEL_ORDER.length)];
        }
        tracker.addSpin(num);
      }
      
      if (typeof updateUICallback === 'function') updateUICallback();
      alert("✅ Sesgo inyectado. Revisa la pestaña de ORION para ver el cambio de régimen y señales.");
    });
  }

  // Control de Rotación del Cilindro (Regla Horizontal)
  const sliderRotation = document.getElementById('orion-wheel-rotation');
  const rotationValue = document.getElementById('orion-rotation-value');
  
  if (sliderRotation) {
    sliderRotation.addEventListener('input', (e) => {
      const deg = parseInt(e.target.value);
      orionRotation = deg;
      
      // Actualizar visor de grados
      if (rotationValue) rotationValue.textContent = `${deg}°`;
      
      // Re-renderizamos solo la pestaña para efecto inmediato
      if (typeof updateUICallback === 'function') updateUICallback();
    });
  }
}
