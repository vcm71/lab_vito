/**
 * CHI RENDERER MODULE
 * Encapsula la visualización de la pestaña CHI con termómetros de color.
 */

export function renderChiTab(data) {
  const seriesContainer = document.getElementById('chi-series-container');
  const externalsContainer = document.getElementById('chi-externals-container');

  if (!seriesContainer || !externalsContainer) return;

  const renderTable = (items, container) => {
    if (items.length === 0) {
      container.innerHTML = '<p class="empty-msg">Sin datos suficientes.</p>';
      return;
    }

    let html = `
      <table class="chi-table" style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
            <th style="text-align: left; padding: 5px;">GRUPO</th>
            <th style="text-align: center; padding: 5px;">O / E</th>
            <th style="text-align: right; padding: 5px;">χ² / CONF.</th>
            <th style="text-align: center; padding: 5px; width: 80px;">ESTADO</th>
          </tr>
        </thead>
        <tbody>
    `;

    items.forEach(item => {
      const stats = item.stats;
      const confidencePct = (stats.confidence * 100).toFixed(0);
      const isPositive = stats.observed >= stats.expected;
      
      // Cálculo del color del "termómetro"
      // Usamos la confianza para la intensidad y la dirección (O vs E) para el color
      let barColor = 'rgba(255,255,255,0.1)';
      let barWidth = Math.min(100, (stats.observed / (stats.expected * 2)) * 100);
      
      if (isPositive) {
        if (stats.confidence > 0.95) barColor = '#ef4444'; // Rojo (Sesgo Positivo fuerte)
        else if (stats.confidence > 0.90) barColor = '#f59e0b'; // Naranja
        else barColor = '#10b981'; // Verde (Levemente caliente)
      } else {
        if (stats.confidence > 0.90) barColor = '#3b82f6'; // Azul (Frío significativo)
        else barColor = '#64748b'; // Gris (Normal-Frío)
      }

      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 8px 5px;">
            <div style="font-weight: bold; color: ${isPositive && stats.confidence > 0.90 ? '#ff9f43' : 'white'};">${item.name}</div>
            <div style="font-size: 0.6rem; color: var(--text-muted);">${item.numbers.length} números</div>
          </td>
          <td style="text-align: center; padding: 8px 5px;">
            <div style="font-size: 0.8rem;">${stats.observed} / ${stats.expected.toFixed(1)}</div>
            <div style="font-size: 0.65rem; color: ${stats.deviation >= 0 ? '#10b981' : '#ef4444'};">
              ${stats.deviation >= 0 ? '+' : ''}${stats.deviation.toFixed(1)}%
            </div>
          </td>
          <td style="text-align: right; padding: 8px 5px;">
            <div style="font-weight: bold; color: var(--color-gold);">${stats.chi.toFixed(2)}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted);">${confidencePct}% Conf.</div>
          </td>
          <td style="padding: 8px 5px;">
            <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
              <div style="width: ${barWidth}%; height: 100%; background: ${barColor}; transition: width 0.3s ease; box-shadow: 0 0 8px ${barColor}66;"></div>
            </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  };

  renderTable(data.series, seriesContainer);
  renderTable(data.externals, externalsContainer);

  // Renderizar Media Ruleta
  renderHalfWheels(data.halfWheels, data.confluence);

  // Renderizar Presión de Reversión
  renderReversionSection(data.reversion);
}

function renderReversionSection(reversionData) {
  const container = document.getElementById('chi-reversion-container');
  if (!container) return;

  if (!reversionData || reversionData.length === 0) {
    container.innerHTML = '<p class="empty-msg">No se detectan sectores con presión crítica de reversión.</p>';
    return;
  }

  container.innerHTML = reversionData.map(item => {
    let color = '#f59e0b'; // Naranja (Media)
    if (item.pressure > 80) color = '#ef4444'; // Rojo (Crítica)
    else if (item.pressure > 50) color = '#fbbf24'; // Amarillo/Naranja (Alta)

    return `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid ${color}44; border-radius: 8px; padding: 0.75rem; position: relative; overflow: hidden;">
        <!-- Indicador de fondo (brillo) -->
        <div style="position: absolute; top: 0; right: 0; width: 40px; height: 40px; background: ${color}11; border-radius: 50%; filter: blur(20px);"></div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="font-weight: 800; color: white; font-size: 0.85rem;">${item.name}</span>
          <span style="color: ${color}; font-weight: bold; font-size: 0.9rem;">${item.pressure}%</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.65rem;">
            <span style="color: var(--text-muted);">Atraso Actual:</span>
            <span style="color: #fff; font-weight: bold;">${item.delay} <span style="font-size: 0.55rem;">(x${item.cycleFactor})</span></span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.65rem;">
            <span style="color: var(--text-muted);">Anomalía χ²:</span>
            <span style="color: var(--color-gold); font-weight: bold;">${item.chi}</span>
          </div>
        </div>

        <div style="margin-top: 0.6rem;">
          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
            <div style="width: ${item.pressure}%; height: 100%; background: ${color}; box-shadow: 0 0 10px ${color}aa;"></div>
          </div>
        </div>
        <div style="margin-top: 0.4rem; font-size: 0.55rem; color: ${color}; text-align: center; font-weight: bold; text-transform: uppercase;">
          ${item.pressure > 80 ? '⚠️ REVERSIÓN INMINENTE' : item.pressure > 50 ? 'ALTA TENSIÓN' : 'TENSIÓN MEDIA'}
        </div>
      </div>
    `;
  }).join('');
}

function renderHalfWheels(halfData, confluence) {
  const container = document.getElementById('chi-half-wheel-container');
  if (!container || !halfData) return;

  const createCard = (title, data, color, correlatedSeries, seriesLabel) => {
    const stats = data.stats;
    const barWidth = Math.min(100, (stats.observed / (stats.expected * 2)) * 100);
    
    // HTML para la serie sugerida
    let seriesHtml = '';
    if (correlatedSeries) {
      seriesHtml = `
        <div style="margin-top: 1rem; padding: 0.5rem; background: ${color}15; border: 1px dashed ${color}44; border-radius: 6px;">
          <div style="font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase;">${seriesLabel}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: white; font-size: 0.8rem;">${correlatedSeries.name}</span>
            <span style="color: ${color}; font-size: 0.7rem; font-weight: bold;">${correlatedSeries.stats.deviation >= 0 ? '+' : ''}${correlatedSeries.stats.deviation.toFixed(1)}%</span>
          </div>
          <div style="font-size: 0.55rem; color: var(--text-muted);">Ubicación: ${correlatedSeries.overlapPct.toFixed(0)}% dentro de este sector</div>
        </div>
      `;
    }

    return `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">${title}</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: ${color};">Sector ${data.startNum} a ${data.endNum}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-gold);">${stats.chi.toFixed(2)} <span style="font-size: 0.6rem;">χ²</span></div>
            <div style="font-size: 0.65rem; color: var(--text-muted);">${(stats.confidence * 100).toFixed(0)}% Confianza</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px; text-align: center;">
            <div style="font-size: 0.6rem; color: var(--text-muted);">HITS REALES</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: white;">${stats.observed}</div>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px; text-align: center;">
            <div style="font-size: 0.6rem; color: var(--text-muted);">ESPERADOS</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: white;">${stats.expected.toFixed(1)}</div>
          </div>
        </div>

        <div style="margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 0.25rem;">
            <span style="color: var(--text-muted);">Nivel de saturación</span>
            <span style="color: ${color}; font-weight: bold;">${stats.deviation >= 0 ? '+' : ''}${stats.deviation.toFixed(1)}%</span>
          </div>
          <div style="width: 100%; height: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
            <div style="width: ${barWidth}%; height: 100%; background: ${color}; transition: width 0.5s ease; box-shadow: 0 0 15px ${color}44;"></div>
          </div>
        </div>
        
        <div style="font-size: 0.55rem; color: var(--text-muted); overflow-wrap: break-word; margin-bottom: 0.5rem;">
          Nums: ${data.numbers.join(', ')}
        </div>

        ${seriesHtml}
      </div>
    `;
  };

  container.innerHTML = `
    ${createCard('Media Ruleta más Caliente 🔥', halfData.hot, '#ef4444', confluence?.hotSeries, 'Serie en Confluencia (Caliente)')}
    ${createCard('Media Ruleta más Fría ❄️', halfData.cold, '#3b82f6', confluence?.coldSeries, 'Serie en Confluencia (Fría)')}
  `;
}
