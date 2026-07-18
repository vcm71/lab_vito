import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

const chartInstances = {};

/**
 * Histograma de distancias físicas entre tiradas consecutivas.
 * Barras azules = observado, línea dorada = esperado teórico (uniforme).
 * @param {HTMLCanvasElement} canvas
 * @param {{ counts, expected, labels, dealerIndex, dealerInterpretation }} histData
 */
export function renderDistanceChart(canvas, histData) {
  if (!canvas || !histData) return;
  const ctx = canvas.getContext('2d');
  const id  = canvas.id || 'dist-histogram';

  if (chartInstances[id]) {
    chartInstances[id].data.labels                  = histData.labels;
    chartInstances[id].data.datasets[0].data        = histData.counts;
    chartInstances[id].data.datasets[1].data        = histData.expected;
    chartInstances[id].update('none');
    return;
  }

  chartInstances[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: histData.labels,
      datasets: [
        {
          label: 'Observado',
          data: histData.counts,
          backgroundColor: histData.counts.map((_, i) =>
            i >= 1 && i <= 5 ? 'rgba(59,130,246,0.85)' : 'rgba(59,130,246,0.45)'
          ),
          borderColor: 'rgba(59,130,246,0.9)',
          borderWidth: 1,
          order: 2,
        },
        {
          label: 'Esperado (uniforme)',
          data: histData.expected,
          type: 'line',
          borderColor: 'rgba(212,175,55,0.9)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [4, 3],
          pointRadius: 0,
          tension: 0,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 9 } },
        },
        y: {
          beginAtZero: true,
          max: id === 'series-distance-histogram-canvas' ? 38 : undefined,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { size: 9 } },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#94a3b8', font: { size: 9 }, boxWidth: 12 },
        },
        zoom: {
          pan: { enabled: true, mode: 'x' },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          callbacks: {
            afterLabel: ctx => {
              if (ctx.datasetIndex === 0) {
                const exp = histData.expected[ctx.dataIndex];
                const obs = ctx.parsed.y;
                const dev = exp > 0 ? (((obs - exp) / exp) * 100).toFixed(1) : '0';
                return `Esperado: ${exp}  (${dev > 0 ? '+' : ''}${dev}%)`;
              }
            },
          },
        },
      },
    },
  });
}

/**
 * Resetea el zoom de cualquier instancia de gráfico mediante su ID de canvas.
 */
export function resetChartZoom(canvasId) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].resetZoom();
  }
}

/**
 * Renderiza los gráficos de series utilizando Chart.js con funcionalidades de trading.
 * @param {HTMLElement} container - Contenedor donde se insertarán los gráficos.
 * @param {Array} seriesData - Datos procesados por el tracker.
 */
export function renderSeriesCharts(container, seriesData) {
  if (!container) return;
  
  console.log("Rendering Series Charts. Count:", seriesData ? seriesData.length : 0);

  if (!seriesData || seriesData.length === 0) {
    container.innerHTML = '<p class="empty-msg" style="padding: 2rem; text-align: center; color: var(--text-muted);">Activa series en la pestaña Ajustes para ver el análisis DA.</p>';
    // Limpiar instancias huerfanas
    Object.keys(chartInstances).forEach(id => {
      if (id !== 'dist-histogram') {
        chartInstances[id].destroy();
        delete chartInstances[id];
      }
    });
    return;
  }

  // 1. Identificar y eliminar gráficos de series que ya no están activas
  const activeIds = seriesData.map(s => (s.id || s.name).replace(/\s+/g, '-'));
  const currentChartIds = Object.keys(chartInstances).filter(id => id !== 'dist-histogram');

  currentChartIds.forEach(id => {
    // No destruir gráficos combinados ni el histograma principal
    if (id.startsWith('combined-')) return;
    
    if (!activeIds.includes(id)) {
      const canvas = document.getElementById(`chart-${id}`);
      if (canvas) {
        const card = canvas.closest('.series-chart-item');
        if (card) card.remove();
      }
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  });

  // 2. Renderizar o actualizar los activos
  seriesData.forEach(series => {

    const safeId = (series.id || series.name).replace(/\s+/g, '-');
    let canvas = document.getElementById(`chart-${safeId}`);
    
    // Si el gráfico no existe, creamos la estructura
    if (!canvas) {
      const card = document.createElement('div');
      card.className = 'series-chart-item panel trader-view';
      card.style.marginBottom = '1.5rem';
      card.style.background = '#1a1d24';
      card.style.padding = '15px';
      card.style.border = '1px solid #2a2f3a';
      card.style.borderRadius = '8px';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '12px';

      const title = document.createElement('h3');
      title.style.fontSize = '0.85rem';
      title.style.margin = '0';
      title.style.color = '#ffffff';
      title.style.borderLeft = '3px solid #0072db';
      title.style.paddingLeft = '8px';
      title.textContent = `${series.name}: [${series.numbers.join(',')}]`;

      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset Zoom';
      resetBtn.className = 'btn-outline';
      resetBtn.style.padding = '2px 8px';
      resetBtn.style.fontSize = '0.65rem';
      resetBtn.onclick = () => {
        if (chartInstances[safeId]) chartInstances[safeId].resetZoom();
      };

      header.appendChild(title);
      header.appendChild(resetBtn);
      card.appendChild(header);

      const wrapper = document.createElement('div');
      wrapper.style.height = '240px';
      wrapper.style.position = 'relative';

      canvas = document.createElement('canvas');
      canvas.id = `chart-${safeId}`;
      
      wrapper.appendChild(canvas);
      card.appendChild(wrapper);
      container.appendChild(card);
    }

    const labels = series.history.map(h => `H${h.hitNumber} (T${h.spinId})`);
    const dataValues = series.history.map(h => h.da);

    if (chartInstances[safeId]) {
      // Actualización rápida
      chartInstances[safeId].data.labels = labels;
      chartInstances[safeId].data.datasets[0].data = dataValues;
      chartInstances[safeId].update('none'); 
    } else {
      // Inicialización de Chart.js
      const ctx = canvas.getContext('2d');
      chartInstances[safeId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Atraso (DA)',
            data: dataValues,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true,
            pointBackgroundColor: '#ffffff',
            pointRadius: 4,
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'monospace' } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#ffffff', font: { size: 9 }, autoSkip: true }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#0072db'
            },
            zoom: {
              pan: { enabled: true, mode: 'x' },
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: 'x'
              }
            }
          }
        }
      });
    }
  });
}

/**
 * Renderiza un gráfico combinado (múltiples datasets) para comparar tendencias DA.
 */
export function renderCombinedDAChart(container, combinedData, chartId, titleText) {
  if (!container || !combinedData || combinedData.length === 0) return;

  const safeId = chartId.replace(/\s+/g, '-');
  let canvas = document.getElementById(`chart-${safeId}`);
  
  if (!canvas) {
    const card = document.createElement('div');
    card.className = 'series-chart-item panel trader-view combined-view';
    card.style.marginBottom = '1.5rem';
    card.style.background = '#1a1d24';
    card.style.padding = '15px';
    card.style.border = '1px solid var(--accent-gold)';
    card.style.borderRadius = '8px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';

    const title = document.createElement('h3');
    title.style.fontSize = '0.9rem';
    title.style.margin = '0';
    title.style.color = 'var(--accent-gold)';
    title.textContent = titleText;

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Zoom';
    resetBtn.className = 'btn-outline';
    resetBtn.style.padding = '2px 8px';
    resetBtn.style.fontSize = '0.65rem';
    resetBtn.onclick = () => {
      if (chartInstances[safeId]) chartInstances[safeId].resetZoom();
    };

    header.appendChild(title);
    header.appendChild(resetBtn);
    card.appendChild(header);

    const wrapper = document.createElement('div');
    wrapper.style.height = '300px';
    wrapper.style.position = 'relative';

    canvas = document.createElement('canvas');
    canvas.id = `chart-${safeId}`;
    
    wrapper.appendChild(canvas);
    card.appendChild(wrapper);
    container.insertBefore(card, container.firstChild); // Ponerlo al inicio
  }

  // Encontrar el eje X común más largo
  let maxLen = 0;
  combinedData.forEach(d => { if (d.history.length > maxLen) maxLen = d.history.length; });
  const labels = Array.from({length: maxLen}, (_, i) => `H${i+1}`);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  const datasets = combinedData.map((d, i) => ({
    label: d.name,
    data: d.history.map(h => h.da),
    borderColor: colors[i % colors.length],
    backgroundColor: 'transparent',
    borderWidth: 2,
    tension: 0.1,
    pointRadius: 3
  }));

  if (chartInstances[safeId]) {
    chartInstances[safeId].data.labels = labels;
    chartInstances[safeId].data.datasets = datasets;
    chartInstances[safeId].update('none');
  } else {
    const ctx = canvas.getContext('2d');
    chartInstances[safeId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#ffffff', font: { size: 9 } }
          }
        },
        plugins: {
          legend: { display: true, labels: { color: '#94a3b8' } },
          zoom: {
            pan: { enabled: true, mode: 'x' },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x'
            }
          }
        }
      }
    });
  }
}

/**
 * Elimina todos los gráficos combinados del contenedor.
 */
export function clearCombinedCharts(container) {
  if (!container) return;
  const combinedItems = container.querySelectorAll('.combined-view');
  combinedItems.forEach(item => {
    const canvas = item.querySelector('canvas');
    if (canvas && chartInstances[canvas.id.replace('chart-', '')]) {
      chartInstances[canvas.id.replace('chart-', '')].destroy();
      delete chartInstances[canvas.id.replace('chart-', '')];
    }
    item.remove();
  });
}
