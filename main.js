import { LabRenderer } from './controlador_de_la_vista_lab.js';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
Chart.register(zoomPlugin);
import { LogicEngine } from './ORION_logicEngine.js';
import { renderOrionTab, initOrionEvents } from './orionRenderer.js';
import { RouletteTracker, RED_NUMBERS, AMERICAN_WHEEL_ORDER } from './rouletteTracker.js';
import { renderDistanceChart, renderSeriesCharts, renderCombinedDAChart, clearCombinedCharts, resetChartZoom } from './seriesRenderer.js';
import { WinWinEngine } from './3_WinWin_Atrasos_CHI_Estrategias.js';
import { KellyManager } from './kellyManager.js';
import { DAEngine } from './daEngine.js';
import { Sesgo97Logic } from './sesgo97Logic.js';
import { renderSesgo97Tab } from './sesgo97Renderer.js';
import { TomadorRenderer } from './tomadorRenderer.js';
import { tomadorStateStore } from './tomadorStateStore.js';
import { rouletteSettingsStore } from './rouletteSettingsStore.js';
import { ChiAnalysisEngine } from './chiLogic.js';
import { renderChiTab } from './chiRenderer.js';
import { renderAtrasosTab } from './atrasosRenderer.js';
import { renderAtaqueTab } from './ataqueRenderer.js';
document.addEventListener('DOMContentLoaded', () => {
  const tracker = new RouletteTracker();

// [Orion Lab] Inicialización segura del Laboratorio Analítico
const labRenderer = new LabRenderer('view-lab', tracker);
labRenderer.init();

if (typeof tracker !== 'undefined' && typeof tracker.on === 'function') {
    tracker.on('update', () => labRenderer.update());
} else {
    console.warn('[Orion Lab] Event bus no encontrado, aplicando fallback por interceptación.');
}
  let tomador = null;
  const winWinEngine = new WinWinEngine(tracker);
  const daEngine = new DAEngine(tracker);
  const orion = new LogicEngine(tracker, winWinEngine);
  const sesgo97Engine = new Sesgo97Logic(tracker);
  const chiEngine = new ChiAnalysisEngine(tracker);
  
  let currentCHIWindow = 'total';
  const readyState = { tracker: false, winWin: false, kelly: false, tomador: false };
  let initialBootstrapDone = false;

  const maybeRunInitialBootstrap = async () => {
    if (initialBootstrapDone) return;
    if (!readyState.tracker || !readyState.winWin || !readyState.kelly || !readyState.tomador) return;
    initialBootstrapDone = true;
    await syncSettingsForm();
    updateQuickToggleStates();
    updateUI();
  };

  tracker.ready?.then(() => {
    readyState.tracker = true;
    maybeRunInitialBootstrap();
  });

  winWinEngine.ready?.then(() => {
    readyState.winWin = true;
    maybeRunInitialBootstrap();
  });

  // Inicializar eventos de ORION
  initOrionEvents(tracker, updateUI);
  
  let daSortEnabled = false;
  let editingSeriesName = null;
  let currentDAWindow = 'total'; // Ventana de muestra por defecto

  async function syncSettingsForm() {
    const { settings } = await rouletteSettingsStore.refresh();

    if (inputSeriesAlert) inputSeriesAlert.value = settings.seriesAlert || 10;
    if (inputAtrasosLimit) inputAtrasosLimit.value = settings.atrasosLimit ?? 5;
    if (inputAtrasosCritical) inputAtrasosCritical.value = settings.atrasosCritical ?? 9;
    if (inputAtrasosMaxWindow) inputAtrasosMaxWindow.value = settings.atrasosMaxWindow ?? 100;
    if (inputSheetUrl) inputSheetUrl.value = settings.sheetUrl || '';
    if (inputSheetName) inputSheetName.value = settings.sheetName || '';
    if (inputSheetColumn) inputSheetColumn.value = settings.sheetColumn || '';
    if (inputVisualMode) inputVisualMode.value = settings.visualMode || 'analisis';

    if (inputConfColors) {
      inputConfColors.value = settings.confidenceColors || 95;
      if (labelConfColors) labelConfColors.textContent = `${inputConfColors.value}%`;
    }
    if (inputConfParity) {
      inputConfParity.value = settings.confidenceParity || 95;
      if (labelConfParity) labelConfParity.textContent = `${inputConfParity.value}%`;
    }
    if (inputConfRange) {
      inputConfRange.value = settings.confidenceRange || 95;
      if (labelConfRange) labelConfRange.textContent = `${inputConfRange.value}%`;
    }
    if (inputConfDozens) {
      inputConfDozens.value = settings.confidenceDozens || 95;
      if (labelConfDozens) labelConfDozens.textContent = `${inputConfDozens.value}%`;
    }
    if (inputConfColumns) {
      inputConfColumns.value = settings.confidenceColumns || 95;
      if (labelConfColumns) labelConfColumns.textContent = `${inputConfColumns.value}%`;
    }

    const orionFreq = document.getElementById('set-orion-weight-freq');
    const orionAbs = document.getElementById('set-orion-weight-abs');
    const orionChi = document.getElementById('set-orion-weight-chi');
    const orionThreshold = document.getElementById('set-orion-threshold');
    const orionFreqLabel = document.getElementById('label-orion-weight-freq');
    const orionAbsLabel = document.getElementById('label-orion-weight-abs');
    const orionChiLabel = document.getElementById('label-orion-weight-chi');
    const orionThresholdLabel = document.getElementById('label-orion-threshold');
    if (orionFreq) {
      orionFreq.value = settings.orionWFreq || 30;
      if (orionFreqLabel) orionFreqLabel.textContent = `${orionFreq.value}%`;
    }
    if (orionAbs) {
      orionAbs.value = settings.orionWAbs || 25;
      if (orionAbsLabel) orionAbsLabel.textContent = `${orionAbs.value}%`;
    }
    if (orionChi) {
      orionChi.value = settings.orionWChi || 45;
      if (orionChiLabel) orionChiLabel.textContent = `${orionChi.value}%`;
    }
    if (orionThreshold) {
      orionThreshold.value = settings.orionThreshold || 2.4;
      if (orionThresholdLabel) orionThresholdLabel.textContent = `${orionThreshold.value}`;
    }

    if (inputShowZeroes) inputShowZeroes.checked = settings.showZeroes !== false;
    if (inputShowClear) inputShowClear.checked = settings.showClear !== false;
    if (inputShowDozenDelays) inputShowDozenDelays.checked = settings.showDozenDelays !== false;
    if (inputShowColumnDelays) inputShowColumnDelays.checked = settings.showColumnDelays !== false;
    if (inputShowHighlights) inputShowHighlights.checked = settings.showHighlights !== false;

    if (inputColZero) inputColZero.checked = settings.showColZero !== false;
    if (inputColColor) inputColColor.checked = settings.showColColor !== false;
    if (inputColParity) inputColParity.checked = settings.showColParity !== false;
    if (inputColRange) inputColRange.checked = settings.showColRange !== false;
    if (inputColDozens) inputColDozens.checked = settings.showColDozens !== false;
    if (inputColColumns) inputColColumns.checked = settings.showColColumns !== false;

    if (input97SectorSize) input97SectorSize.value = settings.sesgo97SectorSize || 5;
    if (input97TopSectorSize) input97TopSectorSize.value = settings.sesgo97TopSectorSize || 5;
    if (input97TopRanking) input97TopRanking.value = settings.sesgo97TopRanking || 10;
    if (input97StartRow) input97StartRow.value = settings.sesgo97StartRow || 1;
    if (input97EndRow) input97EndRow.value = settings.sesgo97EndRow || 0;

    const currentRangeChi = settings.rangeCHI ?? settings.rangeChi ?? 100;
    if (inputRangeExt)  inputRangeExt.value  = settings.rangeExt  || 100;
    if (inputRangeDoc)  inputRangeDoc.value  = settings.rangeDoc  || 100;
    if (inputRangeChi)  inputRangeChi.value  = currentRangeChi;
    if (inputRangeLey)  inputRangeLey.value  = settings.rangeLey  || 37;
    if (inputRangeWW)   inputRangeWW.value   = settings.rangeWW   || 200;
    if (inputRangeAtr)  inputRangeAtr.value  = settings.rangeAtr  || 500;
    if (inputRangeSeis) inputRangeSeis.value = settings.rangeSeis || 100;

    if (inputWeaknessDist) inputWeaknessDist.value = settings.weaknessDistCount || 3;

    if (inputColor) inputColor.value = settings.colorAlert;
    if (inputParity) inputParity.value = settings.parityAlert;
    if (inputDozen) inputDozen.value = settings.dozenAlert;
    if (inputColumn) inputColumn.value = settings.columnAlert;
    if (inputHighLow) inputHighLow.value = settings.highLowAlert;
    
    if (inputSeisenaAlert) inputSeisenaAlert.value = settings.seisenaAlert ?? 7;
    if (inputSeisenaCritical) inputSeisenaCritical.value = settings.seisenaCritical ?? 10;
    if (inputAtaqueOrange) inputAtaqueOrange.value = settings.ataqueOrange ?? -2;
    if (inputAtaqueRed) inputAtaqueRed.value = settings.ataqueRed ?? 0;
  }

  // El sistema ahora respetará tus cambios manuales en la pestaña de ajustes
  const kelly   = new KellyManager();
  kelly.ready?.then(() => {
    readyState.kelly = true;
    try {
      maybeRunInitialBootstrap();
    } catch {}
  });
  let currentWindowSize = 50;

  // ─── Web Worker ────────────────────────────────────────────────────────────
  let statsWorker = null;
  try {
    statsWorker = new Worker(new URL('./statsWorker.js', import.meta.url), { type: 'module' });
    statsWorker.onmessage = ({ data }) => {
      if (data.type === 'RUNS_ALL_RESULT')     renderRunsTest(data.result);
      if (data.type === 'WINDOW_STATS_RESULT') renderWindowStats(data.result);
      if (data.type === 'DIST_HIST_RESULT')    renderDistHist(data.result);
    };
    statsWorker.onerror = () => { statsWorker = null; }; // fallback a main thread
  } catch { statsWorker = null; }

  function workerRequest(type, payload) {
    if (statsWorker) {
      statsWorker.postMessage({ type, payload, id: Date.now() });
    } else {
      // Fallback síncrono
      if (type === 'RUNS_ALL') {
        renderRunsTest({
          color:   tracker.runsTest('color'),
          parity:  tracker.runsTest('parity'),
          highlow: tracker.runsTest('highlow'),
        });
      }
      if (type === 'WINDOW_STATS') renderWindowStats(tracker.getWindowStats(payload.windowSize));
      if (type === 'DIST_HIST')    renderDistHist(tracker.getDistanceHistogram());
    }
  }

  // DOM Elements
  const gridContainer = document.getElementById('number-grid');
  const btnClearData = document.getElementById('btn-clear-data');
  const btnClearSession = document.getElementById('btn-clear-session');

  const probContainer = document.getElementById('prob-container');
  const alertsContainer = document.getElementById('alerts-container');
  const strategyContainer = document.getElementById('strategy-container');
  const seriesChartsContainer = document.getElementById('series-charts-container');
  const wheelContainer = document.getElementById('wheel-container');
  const wheelRotation = document.getElementById('wheel-rotation');
  const wheelDegLabel = document.getElementById('wheel-deg-label');

  const settingsForm = document.getElementById('settings-form');
  const inputColor = document.getElementById('set-color');
  const inputParity = document.getElementById('set-parity');
  const inputDozen = document.getElementById('set-dozen');
  const inputColumn = document.getElementById('set-column');
  const inputHighLow = document.getElementById('set-highlow');
  const inputConfColors  = document.getElementById('set-conf-colors');
  const labelConfColors  = document.getElementById('set-conf-colors-label');
  const inputConfParity  = document.getElementById('set-conf-parity');
  const labelConfParity  = document.getElementById('set-conf-parity-label');
  const inputConfRange   = document.getElementById('set-conf-range');
  const labelConfRange   = document.getElementById('set-conf-range-label');
  const inputConfDozens  = document.getElementById('set-conf-dozens');
  const labelConfDozens  = document.getElementById('set-conf-dozens-label');
  const inputConfColumns = document.getElementById('set-conf-columns');
  const labelConfColumns = document.getElementById('set-conf-columns-label');
  
  const inputSeriesAlert = document.getElementById('set-series-alert');
  const inputAtrasosLimit = document.getElementById('set-atrasos-limit');
  const inputAtrasosCritical = document.getElementById('set-atrasos-critical');
  const inputAtrasosMaxWindow = document.getElementById('set-atrasos-max-window');
  const seriesContainer  = document.getElementById('custom-series-list');
  const inputSeriesName  = document.getElementById('new-series-name');
  const inputSeriesNums  = document.getElementById('new-series-nums');
  const btnAddSeries     = document.getElementById('btn-add-series');
  
  const inputSheetUrl = document.getElementById('set-sheet-url');
  const inputSheetName = document.getElementById('set-sheet-name');
  const inputSheetColumn = document.getElementById('set-sheet-column');
  const inputVisualMode = document.getElementById('set-visual-mode');
  
  const inputShowZeroes = document.getElementById('set-show-zeroes');
  const inputShowClear = document.getElementById('set-show-clear');
  const inputShowDozenDelays = document.getElementById('set-show-dozen-delays');
  const inputShowColumnDelays = document.getElementById('set-show-column-delays');
  const inputShowHighlights = document.getElementById('set-show-highlights');

  const inputColZero = document.getElementById('set-col-zero');
  const inputColColor = document.getElementById('set-col-color');
  const inputColParity = document.getElementById('set-col-parity');
  const inputColRange = document.getElementById('set-col-range');
  const inputColDozens = document.getElementById('set-col-dozens');
  const inputColColumns = document.getElementById('set-col-columns');
   
  // --- 97 SESGO SETTINGS ---
  const input97SectorSize = document.getElementById('set-97-sector-size');
  const input97TopSectorSize = document.getElementById('set-97-top-sector-size');
  const input97TopRanking = document.getElementById('set-97-top-ranking');
  const input97StartRow = document.getElementById('set-97-start-row');
  const input97EndRow = document.getElementById('set-97-end-row');
  
  const inputSeisenaAlert = document.getElementById('set-seisena-alert');
  const inputSeisenaCritical = document.getElementById('set-seisena-critical');
  const inputAtaqueOrange = document.getElementById('set-ataque-orange');
  const inputAtaqueRed = document.getElementById('set-ataque-red');

  const btnImportLocal = document.getElementById('btn-import-local');
  const fileImportLocal = document.getElementById('file-import-local');
  const btnImportSheets = document.getElementById('btn-import-sheets');

  const statTotal = document.getElementById('stat-total');
  const statRed = document.getElementById('stat-red');
  const statBlack = document.getElementById('stat-black');
  const statGreen = document.getElementById('stat-green');
  
  const statEven = document.getElementById('stat-even');
  const statOdd = document.getElementById('stat-odd');
  
  const statLow = document.getElementById('stat-low');
  const statHigh = document.getElementById('stat-high');
  
  const statD1 = document.getElementById('stat-d1');
  const statD2 = document.getElementById('stat-d2');
  const statD3 = document.getElementById('stat-d3');
  
  const statC1 = document.getElementById('stat-c1');
  const statC2 = document.getElementById('stat-c2');
  const statC3 = document.getElementById('stat-c3');

  // Advanced Stats Elements
  const statHotzoneCenter = document.getElementById('stat-hotzone-center');
  const statHotzoneMembers = document.getElementById('stat-hotzone-members');
  const statChiValue = document.getElementById('stat-chi-value');
  const statChiDiag = document.getElementById('stat-chi-diag');
  const statMeanRed = document.getElementById('stat-mean-red');
  const statMeanBlack = document.getElementById('stat-mean-black');

  // --- 1. Tab Navigation Logic ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const activateTab = (targetId, { persist = false } = {}) => {
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
    tabContents.forEach(tc => tc.classList.toggle('active', tc.id === targetId));

    if (persist) {
      void tomadorStateStore.setActiveTab(targetId);
    }

    if (targetId === 'tab-series') {
      updateUI(); // Forzar renderizado de gráficos
    }
    if (targetId === 'tab-lab-con') {
      labRenderer.update();
    }
    if (targetId === 'tab-series-tablas') {
      renderDATables();
    }
    if (targetId === 'tab-97-sesgo') {
      renderSesgo97Tab(sesgo97Engine.analizar());
    }
    if (targetId === 'tab-chi') {
      renderChiTab(chiEngine.getAnalysis(currentCHIWindow));
    }
    if (targetId === 'tab-tester') {
      if (typeof renderTesterTable === 'function') renderTesterTable();
    }
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.target, { persist: true });
    });
  });

  void tomadorStateStore.load().then(state => {
    const activeTab = state.activeTab === 'tab-lab' || state.activeTab === 'view-lab'
      ? 'tab-lab-con'
      : state.activeTab;
    if (activeTab && activeTab !== 'tab-tomador') {
      activateTab(activeTab, { persist: false });
    }
  });

  // Listeners para botones de ventana en CHI
  const btnChiWindowGroup = document.querySelectorAll('.btn-window-chi');
  btnChiWindowGroup.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCHIWindow = btn.dataset.window;
      btnChiWindowGroup.forEach(b => {
        b.classList.toggle('active', b.dataset.window === currentCHIWindow);
      });
      renderChiTab(chiEngine.getAnalysis(currentCHIWindow));
    });
  });

  const seriesChartConceptSelect = document.getElementById('series-chart-concept-select');
  if (seriesChartConceptSelect) {
    seriesChartConceptSelect.addEventListener('change', () => {
      updateUI();
    });
  }

  const btnResetZoomDistance = document.getElementById('btn-reset-zoom-distance');
  if (btnResetZoomDistance) {
    btnResetZoomDistance.addEventListener('click', () => {
      resetChartZoom('series-distance-histogram-canvas');
    });
  }

  // Listeners para botones de ventana en Series
  const btnWindowGroup = document.querySelectorAll('.btn-window');
  btnWindowGroup.forEach(btn => {
    btn.addEventListener('click', () => {
      currentDAWindow = btn.dataset.window;
      // Sincronizar clases en todos los botones de todas las pestañas
      btnWindowGroup.forEach(b => {
        b.classList.toggle('active', b.dataset.window === currentDAWindow);
      });
      updateUI(); 
    });
  });

  // --- Quick Toggles en History Panel (Sincronización Total) ---
  const quickToggles = document.querySelectorAll('.btn-quick-toggle');
  const settingToIdMap = {
    'showColZero': 'set-col-zero',
    'showColParity': 'set-col-parity',
    'showColRange': 'set-col-range',
    'showColDozens': 'set-col-dozens',
    'showColColumns': 'set-col-columns',
    'showColColor': 'set-col-color'
  };

  function updateQuickToggleStates() {
    quickToggles.forEach(btn => {
      const settingKey = btn.dataset.setting;
      const isActive = tracker.settings[settingKey] !== false; 
      btn.classList.toggle('active', isActive);
      
      // Sincronizar hacia los checkboxes de Ajustes
      const checkboxId = settingToIdMap[settingKey];
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) checkbox.checked = isActive;
    });
  }

  // Listener para los botones del Tomador
  quickToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const settingKey = btn.dataset.setting;
      const nextValue = !(tracker.settings[settingKey] !== false);
      tracker.updateSettings({ [settingKey]: nextValue });
      updateQuickToggleStates();
      updateUI();
    });
  });

  // Listener para los checkboxes de Ajustes (Sincronización inversa)
  Object.entries(settingToIdMap).forEach(([settingKey, checkboxId]) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        tracker.updateSettings({ [settingKey]: checkbox.checked });
        updateQuickToggleStates();
        updateUI();
      });
    }
  });

  // --- 2. Cargar Ajustes en Formulario ---
  const inputRangeExt  = document.getElementById('set-range-ext');
  const inputRangeDoc  = document.getElementById('set-range-doc');
  const inputRangeChi  = document.getElementById('set-range-chi');
  const inputRangeLey  = document.getElementById('set-range-ley');
  const inputRangeWW   = document.getElementById('set-range-ww');
  const inputRangeAtr  = document.getElementById('set-range-atr');
  const inputRangeSeis = document.getElementById('set-range-seis');
  const inputWeaknessDist = document.getElementById('set-weakness-dist');

  const setupSlider = (input, label, key) => {
    if (!input) return;
    input.value = tracker.settings[key] || 95;
    if (label) label.textContent = `${input.value}${input.id.includes('threshold') ? '' : '%'}`;
    input.addEventListener('input', () => {
      if (label) label.textContent = `${input.value}${input.id.includes('threshold') ? '' : '%'}`;
      
      // Actualización dinámica de parámetros ORION si aplica
      if (input.id.includes('orion')) {
        const orionWeights = {
          zScore: (parseInt(document.getElementById('set-orion-weight-freq').value) || 30) / 100,
          absence: (parseInt(document.getElementById('set-orion-weight-abs').value) || 25) / 100,
          chiSquare: (parseInt(document.getElementById('set-orion-weight-chi').value) || 45) / 100
        };
        const threshold = parseFloat(document.getElementById('set-orion-threshold').value) || 2.4;
        
        if (orion) {
          orion.params.weightHistory = orionWeights.zScore;
          orion.params.weightDelay = orionWeights.absence;
          orion.params.weightMath = orionWeights.chiSquare;
          orion.params.thresholdRisk = threshold; // Se asume este mapeo
        }
      }
    });
  };

  setupSlider(inputConfColors,  labelConfColors,  'confidenceColors');
  setupSlider(inputConfParity,  labelConfParity,  'confidenceParity');
  setupSlider(inputConfRange,   labelConfRange,   'confidenceRange');
  setupSlider(inputConfDozens,  labelConfDozens,  'confidenceDozens');
  setupSlider(inputConfColumns, labelConfColumns, 'confidenceColumns');

  // Sliders ORION
  setupSlider(document.getElementById('set-orion-weight-freq'), document.getElementById('label-orion-weight-freq'), 'orionWFreq');
  setupSlider(document.getElementById('set-orion-weight-abs'),  document.getElementById('label-orion-weight-abs'),  'orionWAbs');
  setupSlider(document.getElementById('set-orion-weight-chi'),  document.getElementById('label-orion-weight-chi'),  'orionWChi');
  setupSlider(document.getElementById('set-orion-threshold'),   document.getElementById('label-orion-threshold'),   'orionThreshold');

  const btnAutocalibrate = document.getElementById('btn-orion-autocalibrate');
  const calibrationStatus = document.getElementById('orion-calibration-status');

  if (btnAutocalibrate) {
    btnAutocalibrate.addEventListener('click', () => {
      btnAutocalibrate.disabled = true;
      if (calibrationStatus) calibrationStatus.style.display = 'block';
      
      workerRequest('ORION_AUTOCALIBRATE', {});
    });
  }

  // Escuchar resultados de autocalibración en el worker (se añade a onmessage)
  if (statsWorker) {
    const originalOnMessage = statsWorker.onmessage;
    statsWorker.onmessage = (e) => {
      const { data } = e;
      if (data.type === 'ORION_AUTOCALIBRATE_RESULT') {
        const { freq, abs, math, threshold } = data.result;
        
        // Actualizar UI
        document.getElementById('set-orion-weight-freq').value = freq * 100;
        document.getElementById('set-orion-weight-abs').value = abs * 100;
        document.getElementById('set-orion-weight-chi').value = math * 100;
        document.getElementById('set-orion-threshold').value = threshold;
        
        // Disparar eventos de input para actualizar labels y motor orion
        ['set-orion-weight-freq', 'set-orion-weight-abs', 'set-orion-weight-chi', 'set-orion-threshold'].forEach(id => {
          document.getElementById(id).dispatchEvent(new Event('input'));
        });

        if (btnAutocalibrate) btnAutocalibrate.disabled = false;
        if (calibrationStatus) {
           calibrationStatus.textContent = '¡Calibración exitosa! ✅';
           setTimeout(() => { calibrationStatus.style.display = 'none'; calibrationStatus.textContent = 'Calibrando motor... 📊'; }, 2000);
        }
      }
      if (originalOnMessage) originalOnMessage(e);
    };
  }

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await tracker.updateSettings({
      colorAlert: parseInt(inputColor.value, 10),
      parityAlert: parseInt(inputParity.value, 10),
      highLowAlert: inputHighLow ? parseInt(inputHighLow.value, 10) : 5,
      seriesAlert: inputSeriesAlert ? parseInt(inputSeriesAlert.value, 10) : 10,
      seisenaAlert: inputSeisenaAlert ? parseInt(inputSeisenaAlert.value, 10) : 7,
      seisenaCritical: inputSeisenaCritical ? parseInt(inputSeisenaCritical.value, 10) : 10,
      atrasosLimit: inputAtrasosLimit ? parseInt(inputAtrasosLimit.value, 10) : 5,
      atrasosCritical: inputAtrasosCritical ? parseInt(inputAtrasosCritical.value, 10) : 9,
      atrasosMaxWindow: inputAtrasosMaxWindow ? parseInt(inputAtrasosMaxWindow.value, 10) : 100,
      ataqueOrange: inputAtaqueOrange ? parseInt(inputAtaqueOrange.value, 10) : -2,
      ataqueRed: inputAtaqueRed ? parseInt(inputAtaqueRed.value, 10) : 0,
      dozenAlert: parseInt(inputDozen.value, 10),
      columnAlert: parseInt(inputColumn.value, 10),
      confidenceColors:  inputConfColors  ? parseInt(inputConfColors.value, 10)  : 95,
      confidenceParity:  inputConfParity  ? parseInt(inputConfParity.value, 10)  : 95,
      confidenceRange:   inputConfRange   ? parseInt(inputConfRange.value, 10)   : 95,
      confidenceDozens:  inputConfDozens  ? parseInt(inputConfDozens.value, 10)  : 95,
      confidenceColumns: inputConfColumns ? parseInt(inputConfColumns.value, 10) : 95,
      rangeExt:  inputRangeExt  ? parseInt(inputRangeExt.value, 10)  : 100,
      rangeDoc:  inputRangeDoc  ? parseInt(inputRangeDoc.value, 10)  : 100,
      rangeCHI:  inputRangeChi  ? parseInt(inputRangeChi.value, 10)  : 100,
      rangeChi:  inputRangeChi  ? parseInt(inputRangeChi.value, 10)  : 100,
      rangeLey:  inputRangeLey  ? parseInt(inputRangeLey.value, 10)  : 37,
      rangeWW:   inputRangeWW   ? parseInt(inputRangeWW.value, 10)   : 200,
      rangeAtr:  inputRangeAtr  ? parseInt(inputRangeAtr.value, 10)  : 500,
      rangeSeis: inputRangeSeis ? parseInt(inputRangeSeis.value, 10) : 100,
      weaknessDistCount: inputWeaknessDist ? parseInt(inputWeaknessDist.value, 10) : 3,
      sheetUrl: inputSheetUrl ? inputSheetUrl.value.trim() : '',
      sheetName: inputSheetName ? inputSheetName.value.trim() : '',
      sheetColumn: inputSheetColumn ? inputSheetColumn.value.trim().toUpperCase() : '',
      visualMode: inputVisualMode ? inputVisualMode.value : 'analisis',
      showZeroes: inputShowZeroes ? inputShowZeroes.checked : true,
      showClear: inputShowClear ? inputShowClear.checked : true,
      showDozenDelays: inputShowDozenDelays ? inputShowDozenDelays.checked : true,
      showColumnDelays: inputShowColumnDelays ? inputShowColumnDelays.checked : true,
      showHighlights: inputShowHighlights ? inputShowHighlights.checked : true,
      showColZero: inputColZero ? inputColZero.checked : true,
      showColColor: inputColColor ? inputColColor.checked : true,
      showColParity: inputColParity ? inputColParity.checked : true,
      showColRange: inputColRange ? inputColRange.checked : true,
      showColDozens: inputColDozens ? inputColDozens.checked : true,
      showColColumns: inputColColumns ? inputColColumns.checked : true,
      sesgo97SectorSize: input97SectorSize ? parseInt(input97SectorSize.value, 10) : 5,
      sesgo97TopSectorSize: input97TopSectorSize ? parseInt(input97TopSectorSize.value, 10) : 5,
      sesgo97TopRanking: input97TopRanking ? parseInt(input97TopRanking.value, 10) : 10,
      sesgo97StartRow: input97StartRow ? parseInt(input97StartRow.value, 10) : 1,
      sesgo97EndRow: input97EndRow ? parseInt(input97EndRow.value, 10) : 0
    });
    
    // Feedback visual opcional o simplemente recargar UI
    const btn = settingsForm.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = '¡Guardado!';
    btn.style.background = 'var(--roulette-green)';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = 'var(--color-gold)';
      btn.style.color = 'var(--bg-dark)';
    }, 2000);

    syncSettingsForm();
    updateUI();
  });

  const btnRealRadiography = document.getElementById('btn-real-radiography');
  const btnRescan = document.getElementById('btn-rescan-history');

  if (btnRealRadiography) {
    btnRealRadiography.addEventListener('click', () => {
      // Obtenemos las tiradas directamente de la memoria del tracker
      const spins = tracker.spins || [];
      
      if (spins.length < 5) {
        alert("Necesitas al menos 5 tiradas reales para generar una radiografía.");
        return;
      }
      const hitMap = {};
      spins.forEach(s => {
        const n = (s && typeof s === 'object') ? s.number : s;
        if (n !== undefined) hitMap[n] = (hitMap[n] || 0) + 1;
      });

      renderHeatMap(hitMap, 'real-radiography-container');
      
      btnRealRadiography.textContent = "✅ RADIOGRAFÍA GENERADA";
      setTimeout(() => { btnRealRadiography.textContent = "GENERAR RADIOGRAFÍA ACTUAL"; }, 2000);
    });
  }

  if (btnRescan) {
    btnRescan.addEventListener('click', () => {
      if (confirm('¿Deseas analizar TODO el historial para reconstruir los récords máximos? Esto sobrescribirá tus récords actuales.')) {
        winWinEngine.rescanFullHistory(tracker.spins, tracker.settings.customSeries || []);
        
        const originalText = btnRescan.textContent;
        btnRescan.textContent = '¡Récords Actualizados!';
        btnRescan.style.background = 'var(--roulette-green)';
        btnRescan.style.color = '#fff';
        
        setTimeout(() => {
          btnRescan.textContent = originalText;
          btnRescan.style.background = 'transparent';
          btnRescan.style.color = 'var(--color-gold)';
        }, 3000);
        
        updateUI();
      }
    });
  }

  // --- Gestor de Series ---
  function renderSeries() {
    if (!seriesContainer) return;
    const seriesList = [...(tracker.settings.customSeries || [])];
    const countLabel = document.getElementById('series-count-label');
    const tabCountLabel = document.getElementById('series-tab-count-label');
    const spins = tracker.getSpins();
    const activeSeries = seriesList.filter(s => s.active !== false && s.numbers && s.numbers.length > 0);
    const atrasoStats = winWinEngine.analyzeSeriesAtrasadas(
      spins,
      activeSeries,
      tracker.settings.rangeAtr || 500,
      tracker.settings.seriesAlert || 10,
      tracker.settings.weaknessDistCount || 3
    );
    const atrasoMap = new Map(atrasoStats.map(item => [item.label, item]));
    
    if (countLabel) countLabel.textContent = `(${seriesList.length})`;
    if (tabCountLabel) tabCountLabel.textContent = `(${seriesList.length})`;
    
    seriesList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    let html = '';
    seriesList.forEach((s, idx) => {
      const isActive = s.active !== false;
      const stats = atrasoMap.get(s.name);
      const atrasoValue = stats ? stats.atraso : 0;
      const historyValue = stats ? stats.maxHist : 0;
      html += `
        <div class="series-card ${isActive ? 'active' : ''}" style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; padding: 0.15rem 0.5rem;">
          <div style="font-weight: 800; color: var(--color-gold); font-size: 0.85rem; min-width: 60px; white-space: nowrap;">
            [${s.name}]
          </div>
          <div style="flex: 1; color: #4444ff; font-family: 'Roboto Mono', monospace; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: rgba(0,0,0,0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">
            ${s.numbers.join(', ')}
          </div>
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; font-size: 0.65rem; white-space: nowrap;">
            <span style="background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.28); color: var(--color-gold); padding: 0.18rem 0.45rem; border-radius: 999px;">
              Atraso ${atrasoValue}
            </span>
            <span style="background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.28); color: #60a5fa; padding: 0.18rem 0.45rem; border-radius: 999px;">
              History ${historyValue}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
            <div class="status-toggle ${isActive ? 'on' : 'off'} btn-toggle-series" data-idx="${idx}" style="padding: 0.2rem 0.5rem; font-size: 0.6rem; min-width: 45px; text-align: center;">
              <span>${isActive ? 'ON' : 'OFF'}</span>
            </div>
            <div class="action-icon btn-edit-series" data-idx="${idx}" title="Editar" style="width: 24px; height: 24px; font-size: 0.7rem; background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
              <i class="fas fa-pencil-alt"></i>
            </div>
            <div class="action-icon delete btn-delete-series" data-idx="${idx}" title="Eliminar" style="width: 24px; height: 24px; font-size: 0.7rem; background: rgba(239, 68, 68, 0.1); color: #ef4444;">
              <i class="fas fa-eraser"></i>
            </div>
          </div>
        </div>
      `;
    });

    seriesContainer.innerHTML = html || '<div style="text-align:center; padding:1rem; color:var(--text-muted);">No hay series agregadas</div>';

    seriesContainer.querySelectorAll('.btn-toggle-series').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = seriesList[btn.dataset.idx].name;
        const list = [...tracker.settings.customSeries];
        const item = list.find(s => s.name === name);
        if (item) {
          item.active = !item.active;
          tracker.updateSettings({ customSeries: list });
          renderSeries();
          updateUI();
        }
      });
    });

    seriesContainer.querySelectorAll('.btn-edit-series').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = seriesList[btn.dataset.idx];
        inputSeriesName.value = s.name;
        inputSeriesNums.value = s.numbers.join(',');
        editingSeriesName = s.name; 
        if (btnAddSeries) {
          btnAddSeries.textContent = 'ACTUALIZAR';
          btnAddSeries.style.background = '#f59e0b';
        }
      });
    });

    seriesContainer.querySelectorAll('.btn-delete-series').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar esta serie?')) {
          const s = seriesList[btn.dataset.idx];
          const list = tracker.settings.customSeries.filter(item => item.name !== s.name);
          tracker.updateSettings({ customSeries: list });
          renderSeries();
          updateUI();
        }
      });
    });

    // Actualizar botones del Tester
    const testerContainer = document.getElementById('tester-series-container');
    if (testerContainer) {
      const activeSeries = seriesList.filter(s => s.active !== false);
      if (activeSeries.length === 0) {
        testerContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">-- Sin series configuradas/activas --</span>';
      } else {
        testerContainer.innerHTML = '';
        activeSeries.forEach(s => {
          const btn = document.createElement('button');
          const isSelected = window.testerSelectedSeries.has(s.name);
          btn.textContent = s.name;
          btn.style.padding = '0.3rem 0.8rem';
          btn.style.borderRadius = '4px';
          btn.style.fontSize = '0.8rem';
          btn.style.fontWeight = 'bold';
          btn.style.border = '1px solid ' + (isSelected ? '#3b82f6' : '#475569');
          btn.style.cursor = 'pointer';
          btn.style.backgroundColor = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent';
          btn.style.color = isSelected ? '#60a5fa' : '#94a3b8';
          btn.addEventListener('click', () => {
            if (window.testerSelectedSeries.has(s.name)) {
              window.testerSelectedSeries.delete(s.name);
              window.testerVisibleCharts.delete(s.name); // También quitar de visibles
            } else {
              window.testerSelectedSeries.add(s.name);
              window.testerVisibleCharts.add(s.name); // Mostrar por defecto al seleccionar
            }
            renderSeries();
            if (typeof renderTesterTable === 'function') renderTesterTable();
          });
          testerContainer.appendChild(btn);
        });
      }
    }

    // Volver a renderizar la tabla si cambió la serie activa
    if (typeof renderTesterTable === 'function') renderTesterTable();
  }

  // --- LÓGICA DE LA PESTAÑA TESTER ---
  const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
  function getFibonacciBet(betNumber) {
    if (betNumber <= 0) return 0;
    if (betNumber > FIBONACCI.length) return FIBONACCI[FIBONACCI.length - 1];
    return FIBONACCI[betNumber - 1];
  }

  window.testerCharts = {};
  window.testerSelectedSeries = new Set();
  window.testerVisibleCharts = new Set();
  window.testerLast100Mode = false;

  function renderTesterTable() {
    const tbody = document.getElementById('tester-events-body');
    const tbodyL1 = document.getElementById('tester-table-body');
    const theadL1 = document.getElementById('tester-visual-head');
    if (!tbody || !tbodyL1 || !theadL1) return;

    if (window.testerSelectedSeries.size === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding: 1rem; color: var(--text-muted);">Selecciona al menos una serie.</td></tr>';
      tbodyL1.innerHTML = '<tr><td colspan="5" style="padding: 1rem; color: var(--text-muted);">Selecciona al menos una serie.</td></tr>';
      theadL1.innerHTML = `
        <th style="padding: 0.4rem; border: 1px solid #c2410c;">N°C</th>
        <th style="padding: 0.4rem; border: 1px solid #c2410c;">Giros</th>
        <th style="padding: 0.4rem; border: 1px solid #c2410c;">Status</th>
        <th style="padding: 0.4rem; border: 1px solid #c2410c;">Histórico</th>
      `;
      // Limpiar gráficos
      Object.values(window.testerCharts).forEach(c => c.destroy());
      window.testerCharts = {};
      const chartsContainer = document.getElementById('tester-charts-container');
      if (chartsContainer) chartsContainer.innerHTML = '';
      const togglesContainer = document.getElementById('tester-chart-toggles');
      if (togglesContainer) togglesContainer.innerHTML = '';
      return;
    }

    const selectedSeriesDefs = (tracker.settings.customSeries || []).filter(s => window.testerSelectedSeries.has(s.name));
    
    let theadHtml = `
      <th style="padding: 0.4rem; border: 1px solid #c2410c;">N°C</th>
      <th style="padding: 0.4rem; border: 1px solid #c2410c;">Giros</th>
    `;
    selectedSeriesDefs.forEach(s => {
      theadHtml += `<th style="padding: 0.4rem; border: 1px solid #c2410c;">Status [${s.name}]</th>`;
    });
    theadHtml += `<th style="padding: 0.4rem; border: 1px solid #c2410c;">Histórico</th>`;
    theadL1.innerHTML = theadHtml;
    
    // Leer config
    const isFibonacci = document.getElementById('tester-cfg-fibonacci')?.checked || false;
    const baseUnits = parseInt(document.getElementById('tester-cfg-units')?.value) || 1;
    const maxAttempts = parseInt(document.getElementById('tester-cfg-max-attempts')?.value) || 5;
    const spinsForFailure = parseInt(document.getElementById('tester-cfg-spins-failure')?.value) || 5;
    const maxWinWinDist = parseInt(document.getElementById('tester-cfg-winwin-dist')?.value) || 6;
    
    // Parámetros derivados
    const payout = 35; 

    let spins = tracker.getSpins();
    if (typeof currentDAWindow !== 'undefined' && currentDAWindow !== 'total') {
      const limit = parseInt(currentDAWindow);
      spins = spins.slice(-limit);
    }

    if (spins.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding: 1rem; color: var(--text-muted);">No hay giros registrados en el histórico (Muestra: ' + currentDAWindow + ').</td></tr>';
      tbodyL1.innerHTML = '<tr><td colspan="5" style="padding: 1rem; color: var(--text-muted);">No hay giros registrados en el histórico (Muestra: ' + currentDAWindow + ').</td></tr>';
    }

    const htmlL1Array = [];
    let totalApostado = 0;
    let totalGanado = 0;
    const eventsHtmlArray = [];

    const states = {};
    selectedSeriesDefs.forEach(s => {
      states[s.name] = {
        name: s.name,
        targetNums: new Set(s.numbers.map(n => n.toString())),
        betUnitsMultiplier: s.numbers.length,
        balance: 0,
        winCount: 0,
        lossCount: 0,
        step: 0,
        hasFirstWin: false,
        isWinWinActive: false,
        lastWinIndex: -1,
        eventCounter: 1, // Contador individual por serie
        chartData: [],
        chartWins: [],
        chartLosses: []
      };
    });

    const totalSpins = spins.length;
    const VISUAL_LIMIT = 200; // Solo renderizar los últimos 200 giros en la tabla L1
    
    spins.forEach((spin, index) => {
      const isVisibleInTable = (totalSpins - index) <= VISUAL_LIMIT;
      
      let trHtml = '';
      if (isVisibleInTable) {
        trHtml = `
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 0.4rem;">T${spin.id}</td>
            <td style="padding: 0.4rem;">${spin.number}</td>
        `;
      }

      selectedSeriesDefs.forEach(sDef => {
        const state = states[sDef.name];
        state.step++;
        const isHit = state.targetNums.has(spin.number.toString());
        let statusText = '';
        let statusStyle = '';

        if (state.hasFirstWin && (index - state.lastWinIndex) >= maxWinWinDist) {
          if (state.isWinWinActive) {
            state.lossCount++;
            let costOfFailure = 0;
            for (let i = 1; i <= spinsForFailure; i++) {
              const spinBet = isFibonacci ? getFibonacciBet(i) : baseUnits;
              costOfFailure += spinBet * state.betUnitsMultiplier;
            }
            state.balance -= costOfFailure;
            totalApostado += costOfFailure;
            
            eventsHtmlArray.push(`
              <tr style="border-bottom: 1px solid #475569;">
                <td style="padding: 0.3rem;">${state.eventCounter}</td>
                <td style="padding: 0.3rem; color: #ef4444;">[${state.name}] Fallo</td>
                <td style="padding: 0.3rem; color: #60a5fa;">${costOfFailure}</td>
                <td style="padding: 0.3rem; color: #ef4444;">${costOfFailure}</td>
                <td style="padding: 0.3rem; color: #10b981;">0</td>
                <td style="padding: 0.3rem; font-weight: bold; color: ${state.balance >= 0 ? '#34d399' : '#f87171'};">${state.balance}</td>
              </tr>
            `);
            state.chartData.push({x: state.eventCounter, y: state.balance});
            state.chartLosses.push({x: state.eventCounter, y: state.balance});
            state.eventCounter++;
          }
          state.hasFirstWin = false;
          state.isWinWinActive = false;
        }

        if (isHit) {
          let isWinWinText = false;
          if (!state.hasFirstWin) {
            state.hasFirstWin = true; 
            state.isWinWinActive = false;
          } else {
            if (!state.isWinWinActive) {
              state.isWinWinActive = true; 
            } else {
              isWinWinText = true; 
            }
          }

          if (isWinWinText) {
            state.winCount++;
            let totalCost = 0;
            for (let i = 1; i <= state.step; i++) {
              const spinBet = isFibonacci ? getFibonacciBet(i) : baseUnits;
              totalCost += spinBet * state.betUnitsMultiplier;
            }
            const currentUnitBet = isFibonacci ? getFibonacciBet(state.step) : baseUnits;
            const winPayout = payout * currentUnitBet;
            const balanceNeto = winPayout - totalCost;
            
            state.balance += balanceNeto;
            totalApostado += totalCost;
            totalGanado += winPayout;
            
            eventsHtmlArray.push(`
              <tr style="border-bottom: 1px solid #475569;">
                <td style="padding: 0.3rem;">${state.eventCounter}</td>
                <td style="padding: 0.3rem; color: #10b981;">[${state.name}] WIN-WIN (${state.step})</td>
                <td style="padding: 0.3rem; color: #60a5fa;">${totalCost}</td>
                <td style="padding: 0.3rem; color: #ef4444;">${totalCost}</td>
                <td style="padding: 0.3rem; color: #10b981;">${winPayout}</td>
                <td style="padding: 0.3rem; font-weight: bold; color: ${state.balance >= 0 ? '#34d399' : '#f87171'};">${state.balance}</td>
              </tr>
            `);
            state.chartData.push({x: state.eventCounter, y: state.balance});
            state.chartWins.push({x: state.eventCounter, y: state.balance});
            state.eventCounter++;
          }

          state.lastWinIndex = index;
          if (isWinWinText) {
            statusText = `WIN-WIN:${state.step}`;
            statusStyle = 'font-weight: bold; color: var(--color-gold);';
          } else {
            statusText = `WIN:${state.step}`;
            statusStyle = 'font-weight: bold; color: var(--text-main);';
          }
          state.step = 0;
        } else {
          statusText = `${state.step}`;
          statusStyle = 'color: var(--text-muted);';
        }

        if (isVisibleInTable) {
          trHtml += `<td style="padding: 0.4rem; ${statusStyle}">${statusText}</td>`;
        }
      });

      if (isVisibleInTable) {
        trHtml += `<td style="padding: 0.4rem;">${spin.number}</td></tr>`;
        htmlL1Array.push(trHtml);
      }
    });

    tbody.innerHTML = eventsHtmlArray.length > 0 ? eventsHtmlArray.join('') : '<tr><td colspan="6" style="padding: 1rem; color: var(--text-muted);">Esperando rachas WIN-WIN o Fallos...</td></tr>';
    tbodyL1.innerHTML = htmlL1Array.join('');

    let totalNet = totalGanado - totalApostado;
    
    let totalLossesCount = 0;
    selectedSeriesDefs.forEach(s => totalLossesCount += states[s.name].lossCount);
    
    document.getElementById('tester-total-losses').textContent = totalLossesCount;
    document.getElementById('tester-total-bet').textContent = totalApostado;
    document.getElementById('tester-total-won').textContent = totalGanado;
    
    const netEl = document.getElementById('tester-net-result');
    netEl.textContent = totalNet;
    netEl.style.color = totalNet > 0 ? '#34d399' : (totalNet < 0 ? '#f87171' : '#fbbf24');

    const togglesContainer = document.getElementById('tester-chart-toggles');
    const chartsContainer = document.getElementById('tester-charts-container');
    
    if (togglesContainer && chartsContainer) {
      togglesContainer.innerHTML = '<span style="font-size:0.7rem; color:var(--text-muted); align-self:center; margin-right:0.5rem;">Ver Gráficos:</span>';
      
      selectedSeriesDefs.forEach(sDef => {
        const sName = sDef.name;
        // Botón toggle para el gráfico
        const btn = document.createElement('button');
        const isVisible = window.testerVisibleCharts.has(sName);
        btn.textContent = `Gráfico ${sName}`;
        btn.style.padding = '0.2rem 0.6rem';
        btn.style.borderRadius = '4px';
        btn.style.fontSize = '0.7rem';
        btn.style.border = '1px solid ' + (isVisible ? '#10b981' : '#475569');
        btn.style.backgroundColor = isVisible ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
        btn.style.color = isVisible ? '#34d399' : '#94a3b8';
        btn.style.cursor = 'pointer';
        
        btn.addEventListener('click', () => {
          if (window.testerVisibleCharts.has(sName)) {
            window.testerVisibleCharts.delete(sName);
          } else {
            window.testerVisibleCharts.add(sName);
          }
          renderTesterTable(); // Re-renderizar para mostrar/ocultar
        });
        togglesContainer.appendChild(btn);
      });

      // Botón para modo Últimos 100
      const btn100 = document.createElement('button');
      btn100.textContent = window.testerLast100Mode ? '📈 Ver Todo' : '🕒 Últimos 100';
      btn100.style.padding = '0.2rem 0.6rem';
      btn100.style.borderRadius = '4px';
      btn100.style.fontSize = '0.7rem';
      btn100.style.fontWeight = 'bold';
      btn100.style.marginLeft = 'auto';
      btn100.style.border = '1px solid ' + (window.testerLast100Mode ? '#f59e0b' : '#475569');
      btn100.style.backgroundColor = window.testerLast100Mode ? 'rgba(245, 158, 11, 0.2)' : 'transparent';
      btn100.style.color = window.testerLast100Mode ? '#fbbf24' : '#94a3b8';
      btn100.style.cursor = 'pointer';
      btn100.addEventListener('click', () => {
        window.testerLast100Mode = !window.testerLast100Mode;
        renderTesterTable();
      });
      togglesContainer.appendChild(btn100);

      selectedSeriesDefs.forEach(sDef => {
        const sName = sDef.name;
        const isVisible = window.testerVisibleCharts.has(sName);
        
        // Crear contenedor del gráfico si es visible
        if (isVisible) {
          let chartBox = document.getElementById(`tester-chart-box-${sName}`);
          if (!chartBox) {
            chartBox = document.createElement('div');
            chartBox.id = `tester-chart-box-${sName}`;
            chartBox.className = 'tester-chart-box';
            chartBox.style.height = '320px';
            chartBox.style.position = 'relative';
            chartBox.innerHTML = `
              <canvas id="tester-canvas-${sName}"></canvas>
              <button class="btn-outline" style="position:absolute; top:10px; right:10px; padding:2px 6px; font-size:0.6rem; z-index:10;" 
                onclick="window.testerCharts['${sName}'].resetZoom()">
                Reset Zoom
              </button>
            `;
            chartsContainer.appendChild(chartBox);
          }

          const state = states[sName];
          if (!state) return;

          const canvas = document.getElementById(`tester-canvas-${sName}`);
          if (canvas) {
            const state = states[sName];
            if (!state) return;

            // Procesar datos para el gráfico
            const eventCount = state.eventCounter;
            const lineData = Array(eventCount).fill(null);
            const winsData = Array(eventCount).fill(null);
            const lossData = Array(eventCount).fill(null);

            lineData[0] = 0;
            state.chartData.forEach(pt => { lineData[pt.x] = pt.y; });
            for(let i=1; i<eventCount; i++) {
              if(lineData[i] === null) lineData[i] = lineData[i-1];
            }
            state.chartWins.forEach(pt => { winsData[pt.x] = pt.y; });
            state.chartLosses.forEach(pt => { lossData[pt.x] = pt.y; });

            const finalLabels = [];
            for(let i=0; i<eventCount; i++) finalLabels.push(i);

            let slicedLabels = finalLabels;
            let slicedLine = lineData;
            let slicedWins = winsData;
            let slicedLoss = lossData;

            if (window.testerLast100Mode && eventCount > 100) {
              const start = eventCount - 100;
              slicedLabels = finalLabels.slice(start);
              slicedLine = lineData.slice(start);
              slicedWins = winsData.slice(start);
              slicedLoss = lossData.slice(start);
            }

            if (window.testerCharts[sName]) {
              const chart = window.testerCharts[sName];
              chart.data.labels = slicedLabels;
              chart.data.datasets[0].data = slicedLine;
              chart.data.datasets[1].data = slicedWins;
              chart.data.datasets[2].data = slicedLoss;
              chart.update('none'); 
            } else {
              window.testerCharts[sName] = new Chart(canvas, {
                data: {
                  labels: slicedLabels,
                  datasets: [
                    {
                      type: 'line',
                      label: `Balance [${sName}]`,
                      data: slicedLine,
                      borderColor: '#f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      borderWidth: 3,
                      tension: 0.3,
                      pointRadius: 0,
                      fill: true
                    },
                    {
                      type: 'scatter',
                      label: 'Acierto',
                      data: slicedWins,
                      backgroundColor: '#10b981',
                      pointRadius: 6,
                      pointStyle: 'circle',
                      borderWidth: 2,
                      borderColor: '#fff'
                    },
                    {
                      type: 'scatter',
                      label: 'Fallo',
                      data: slicedLoss,
                      backgroundColor: '#ef4444',
                      pointRadius: 6,
                      pointStyle: 'crossRot',
                      borderWidth: 2,
                      borderColor: '#fff'
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } },
                    title: { display: true, text: `EVOLUCIÓN ESTRATEGIA: ${sName}`, color: '#d4af37', font: { size: 14, weight: '800' } },
                    zoom: { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } }
                  },
                  scales: {
                    x: { ticks: { display: true, color: '#475569', font: { size: 8 } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8', font: { size: 9, family: 'monospace' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  }
                }
              });
            }

            // Si no hay eventos, mostrar mensaje
            if (eventCount <= 1) {
              const ctx = canvas.getContext('2d');
              ctx.save();
              ctx.fillStyle = '#94a3b8';
              ctx.font = 'italic 12px Inter';
              ctx.textAlign = 'center';
              ctx.fillText('Esperando eventos críticos para graficar...', canvas.width/2, canvas.height/2);
              ctx.restore();
            }
          }
        } else {
          // Ocultar si existe
          const chartBox = document.getElementById(`tester-chart-box-${sName}`);
          if (chartBox) {
            if (window.testerCharts[sName]) window.testerCharts[sName].destroy();
            delete window.testerCharts[sName];
            chartBox.remove();
          }
        }
      });
    }
  }

  // (Eliminado listener de tester-series-select inexistente)

  const inputs = ['tester-cfg-fibonacci', 'tester-cfg-units', 'tester-cfg-max-attempts', 'tester-cfg-spins-failure', 'tester-cfg-winwin-dist'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (typeof renderTesterTable === 'function') renderTesterTable();
    });
  });

  if (btnAddSeries) {
    btnAddSeries.addEventListener('click', () => {
      const name = inputSeriesName.value.trim();
      const val  = inputSeriesNums.value.trim();
      if (!name || !val) return;

      const nums = val.split(/[\s,.-]+/).map(n => n.trim()).filter(n => n !== '');
      const currentList = [...(tracker.settings.customSeries || [])];
      
      let targetIdx = -1;
      if (editingSeriesName) {
        targetIdx = currentList.findIndex(s => s.name.toLowerCase() === editingSeriesName.toLowerCase());
        const collisionIdx = currentList.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
        if (collisionIdx > -1 && collisionIdx !== targetIdx) {
          alert('Ya existe otra serie con ese nombre.');
          return;
        }
      } else {
        targetIdx = currentList.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
      }

      if (targetIdx > -1) {
        currentList[targetIdx].numbers = nums;
        currentList[targetIdx].name = name; 
      } else {
        currentList.push({ name: name, numbers: nums, active: true });
      }
      
      tracker.updateSettings({ customSeries: currentList });
      inputSeriesName.value = '';
      inputSeriesNums.value = '';
      editingSeriesName = null;
      btnAddSeries.textContent = 'GUARDAR';
      btnAddSeries.style.background = 'var(--color-gold)';
      renderSeries();
      updateUI();
    });
  }
  renderSeries();
// --- Tablas DA (Series_Tablas) ---
  const daConceptSelect = document.getElementById('da-concept-select');
  if (daConceptSelect) {
    daConceptSelect.addEventListener('change', () => {
      renderDATables();
    });
  }

  const btnDaSort = document.getElementById('btn-da-sort');
  if (btnDaSort) {
    btnDaSort.addEventListener('click', () => {
      daSortEnabled = !daSortEnabled;
      btnDaSort.style.background = daSortEnabled ? 'var(--accent-gold)' : 'transparent';
      btnDaSort.style.color = daSortEnabled ? '#000' : 'var(--accent-gold)';
      renderDATables();
    });
  }

  function renderDATables() {
    const container = document.getElementById('da-tables-container');
    const concept = daConceptSelect ? daConceptSelect.value : 'series';
    
    if (!container) return;
    
    const allData = daEngine.getAllTableData();
    const data = allData[concept];
    
    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = '<p class="empty-msg">No hay datos para mostrar.</p>';
      return;
    }

    // Nombres de los conceptos (columnas)
    let keys = Object.keys(data);

    // Calcular cuántas filas DA necesitamos (el máximo de todas las secuencias)
    let maxDistances = 0;
    keys.forEach(key => {
      if (data[key].history.length > maxDistances) {
        maxDistances = data[key].history.length;
      }
    });

    const rowCount = Math.max(12, maxDistances);

    // Invertir orden si el botón está activo
    let renderRange = [];
    if (daSortEnabled) {
      for (let r = rowCount - 1; r >= 0; r--) renderRange.push(r);
    } else {
      for (let r = 0; r < rowCount; r++) renderRange.push(r);
    }

    let html = `
      <table class="da-table">
        <thead>
          <tr>
            <th class="da-label-cell">Etiqueta</th>
            ${keys.map(key => `<th title="${data[key].numbers.join(', ')}">${data[key].name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <!-- Fila de DA Máxima (Resumen al inicio) -->
          <tr style="border-bottom: 2px solid var(--accent-gold);">
            <td class="da-label-cell" style="color: var(--accent-gold);">DA Máxima</td>
            ${keys.map(key => {
              const sequence = data[key].history;
              const maxVal = sequence.length > 0 ? Math.max(...sequence.map(h => h.da)) : 0;
              return `<td style="background-color: #0f172a; color: var(--accent-gold); font-weight: 900; text-align: center; font-size: 1.1rem;">${maxVal}</td>`;
            }).join('')}
          </tr>
    `;

    for (const r of renderRange) {
      const label = `DA_${String(r + 1).padStart(3, '0')}`;
      html += `
        <tr>
          <td class="da-label-cell">${label}</td>
          ${keys.map(key => {
            const sequence = data[key].history;
            const val = sequence[r] !== undefined ? sequence[r].da : '';
            const color = daEngine.getDAColor(val);
            const textColor = (color === '#ffffff' || color === '#87ceeb' || color === '#ffff00') ? '#000' : '#fff';
            return `<td style="background-color: ${color}; color: ${textColor}; font-weight: 700; text-align: center;">${val}</td>`;
          }).join('')}
        </tr>
      `;
    }


    html += `</tbody></table>`;
    container.innerHTML = html;
  }



  // --- 3. Rotación Manual del Cilindro (Estadísticas) ---
  if (wheelRotation) {
    wheelRotation.addEventListener('input', (e) => {
      const deg = e.target.value;
      if (wheelDegLabel) wheelDegLabel.textContent = `${deg}°`;
      const wheelGroup = document.getElementById('wheel-svg-group');
      if (wheelGroup) {
        wheelGroup.style.transform = `rotate(${deg}deg)`;
      }
    });
  }

  // Inicializar el Tomador (Desacoplado - Paso Final de UI)
  tomador = new TomadorRenderer(tracker, {
    onSpinAdded: (numStr) => {
      addSpin(numStr);
      if (orion && typeof orion.recordResult === 'function') {
        orion.recordResult(numStr);
      }
    }
  });
  tomador.ready?.then(() => {
    readyState.tomador = true;
    maybeRunInitialBootstrap();
  });
  maybeRunInitialBootstrap();

  const clearSessionAction = () => {
    if(confirm('¿Estás seguro de que quieres borrar el historial actual y empezar una nueva sesión?')) {
      tracker.clearSession();
      updateUI();
    }
  };

  btnClearSession.addEventListener('click', clearSessionAction);
  if (btnClearData) {
    btnClearData.addEventListener('click', clearSessionAction);
  }

  // --- 3. Actualizar Interfaz ---
  function updateUI() {
    const spins = tracker.getSpins();
    const stats = tracker.getStats();

    // 1. ESTADÍSTICAS BÁSICAS (Siempre funcionan)
    if (statTotal) statTotal.textContent = stats.total;
    if (statRed) statRed.textContent = `${stats.colorsPct.red}%`;
    if (statBlack) statBlack.textContent = `${stats.colorsPct.black}%`;
    if (statGreen) statGreen.textContent = `${stats.colorsPct.green}%`;
    if (statEven) statEven.textContent = `${stats.parityPct.even}%`;
    if (statOdd) statOdd.textContent = `${stats.parityPct.odd}%`;
    if (statLow && stats.highLowPct) statLow.textContent = `${stats.highLowPct.low}%`;
    if (statHigh && stats.highLowPct) statHigh.textContent = `${stats.highLowPct.high}%`;
    if (statD1) statD1.textContent = `${stats.dozensPct.d1}%`;
    if (statD2) statD2.textContent = `${stats.dozensPct.d2}%`;
    if (statD3) statD3.textContent = `${stats.dozensPct.d3}%`;
    if (statC1) statC1.textContent = `${stats.columnsPct.c1}%`;
    if (statC2) statC2.textContent = `${stats.columnsPct.c2}%`;
    if (statC3) statC3.textContent = `${stats.columnsPct.c3}%`;

    if (tomador) tomador.update();

    // 2. RENDERIZADO DE MÓDULOS ORIGINALES (Aislados)
    try { renderWheel(tracker); } catch(e) {}
    try { renderProbabilities(tracker.getProbabilities()); } catch(e) {}
    try { renderConfidenceIntervals(tracker.getConfidenceIntervals()); } catch(e) {}
    try { renderAlerts(tracker.getAlerts()); } catch(e) {}
    try { renderWinWinTab(tracker, winWinEngine); } catch(e) {}
    try { renderStrategy(tracker.getStrategy()); } catch(e) {}
    try { renderAtrasosTab(tracker); } catch(e) {}
    try { renderAtaqueTab(tracker); } catch(e) {}
    
    // 3. GRÁFICOS DE SERIES (Aislado)
    try {
      if (seriesChartsContainer) {
        const chartConceptSelect = document.getElementById('series-chart-concept-select');
        const concept = chartConceptSelect ? chartConceptSelect.value : 'series';
        
        // Controlar visibilidad del gráfico de saltos del cilindro en la pestaña Series
        const seriesDistHistSection = document.getElementById('series-distance-histogram-section');
        if (seriesDistHistSection) {
          if (concept === 'jumps') {
            seriesDistHistSection.style.display = 'flex';
            try {
              const histData = tracker.getDistanceHistogram();
              renderDistHist(histData);
            } catch (err) {}
          } else {
            seriesDistHistSection.style.display = 'none';
          }
        }

        const allData = daEngine.getAllTableData(currentDAWindow);
        const dataMap = allData[concept] || {};
        
        // Convertir el mapa de datos en un array para el renderizador
        const seriesDataArray = Object.values(dataMap);
        
        if (concept === 'jumps') {
          clearCombinedCharts(seriesChartsContainer);
          seriesChartsContainer.innerHTML = '';
        } else {
          // Limpiar gráficos combinados previos
          clearCombinedCharts(seriesChartsContainer);

          // Si es Docenas/Columnas o Externas, añadir gráfico combinado al inicio
          if (concept === 'groups') {
            const dozens = seriesDataArray.filter(s => ['D1', 'D2', 'D3'].includes(s.name));
            if (dozens.length > 0) renderCombinedDAChart(seriesChartsContainer, dozens, 'combined-dozens', 'Comparativa Docenas D1-D2-D3');
            
            const columns = seriesDataArray.filter(s => ['C1', 'C2', 'C3'].includes(s.name));
            if (columns.length > 0) renderCombinedDAChart(seriesChartsContainer, columns, 'combined-columns', 'Comparativa Columnas C1-C2-C3');
          } else if (concept === 'externals') {
            const colors = seriesDataArray.filter(s => ['Rojo', 'Negro'].includes(s.name));
            if (colors.length > 0) renderCombinedDAChart(seriesChartsContainer, colors, 'combined-colors', 'Comparativa Rojo vs Negro');
          }

          renderSeriesCharts(seriesChartsContainer, seriesDataArray);
        }
      }
      // Actualizar Tablas DA si están visibles
      const daTab = document.getElementById('tab-series-tablas');
      if (daTab && daTab.classList.contains('active')) {
        renderDATables();
      }
    } catch (e) {}

    // 4. ANALISIS AVANZADO (Aislado)
    try {
      const advStats = tracker.getAdvancedStats();
      if (statHotzoneCenter) {
        statHotzoneCenter.textContent = advStats.hotZone.center;
        statHotzoneMembers.textContent = advStats.hotZone.members.length > 0 ? `[ ${advStats.hotZone.members.join(' • ')} ]` : '-';
        statChiValue.textContent = advStats.chiSquare;
        statChiDiag.textContent = advStats.chiDiagnosis;
        statMeanRed.textContent = advStats.meanDelays.red;
        statMeanBlack.textContent = advStats.meanDelays.black;
      }
      workerRequest('RUNS_ALL',     { spins });
      workerRequest('WINDOW_STATS', { spins, windowSize: currentWindowSize });
      workerRequest('DIST_HIST',    { spins });
    } catch (e) {}

    // 5. KELLY (Funciona con datos base, el ORION es opcional)
    try {
      const orionSignals = (orion && typeof orion.getBestOpportunities === 'function') ? orion.getBestOpportunities() : [];
      renderKelly(kelly.analyze(tracker, orionSignals));
    } catch (e) {
      // Fallback si ORION falla: Kelly analiza solo con datos base
      renderKelly(kelly.analyze(tracker, []));
    }

    // 6. EL ORION (ÚLTIMO Y TOTALMENTE AISLADO)
    try {
      if (typeof renderOrionTab === 'function') {
        renderOrionTab(tracker, orion);
      }
    } catch (err) {
      console.warn("Módulo ORION en modo espera/error:", err.message);
    }

    // 7. SESGO 97
    try {
      const display97Total = document.getElementById('display-97-total-sample');
      if (display97Total) {
        display97Total.textContent = tracker.getSpins().length;
      }

      const tab97 = document.getElementById('tab-97-sesgo');
      if (tab97 && tab97.classList.contains('active')) {
        renderSesgo97Tab(sesgo97Engine.analizar());
      }
    } catch (err) {
      console.error("SESGO 97: Error en renderizado:", err);
    }

    // 8. TESTER
    if (typeof renderTesterTable === 'function') {
      const tabTester = document.getElementById('tab-tester');
      if (tabTester && tabTester.classList.contains('active')) {
        renderTesterTable();
      }
    }

    // 9. CHI (Análisis de Grupos)
    const tabChi = document.getElementById('tab-chi');
    if (tabChi && tabChi.classList.contains('active')) {
      renderChiTab(chiEngine.getAnalysis(currentCHIWindow));
    }
  }

  // Optimización Profesor_Orion: Refresco asíncrono para evitar lentitud
  let uiRefreshTimeout = null;
  function addSpin(number) {
    if (!number && number !== 0) return;
    
    // 1. Registro instantáneo en memoria
    tracker.addSpin(number);
    
    // 2. Cálculo diferido (para no trabar el teclado)
    if (uiRefreshTimeout) clearTimeout(uiRefreshTimeout);
    uiRefreshTimeout = setTimeout(() => {
      updateUI();
    }, 50); 
  }

  function renderWheel(tracker) {
    if (!wheelContainer) return;
    
    const spins = tracker.getSpins();
    const numCounts = {};
    AMERICAN_WHEEL_ORDER.forEach(n => numCounts[n] = 0);
    spins.forEach(s => {
      if (numCounts[s.number] !== undefined) numCounts[s.number]++;
    });

    let maxHits = Math.max(...Object.values(numCounts), 1);

    const totalSlices = 38;
    const sliceAngle = 360 / totalSlices;
    const cx = 150;
    const cy = 150;
    const rOuter = 140;
    const rInner = 85;

    let svgHtml = `<svg viewBox="-20 -20 340 340" width="100%" height="100%">`;

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

    const currentRotation = wheelRotation ? wheelRotation.value : 0;
    svgHtml += `<g id="wheel-svg-group" style="transform-origin: 150px 150px; transform: rotate(${currentRotation}deg); transition: transform 0.1s linear;">`;

    const offsetAngle = sliceAngle / 2;

    for (let i = 0; i < totalSlices; i++) {
      const num = AMERICAN_WHEEL_ORDER[i];
      const startAngle = (i * sliceAngle) - offsetAngle + 180;
      const endAngle = ((i + 1) * sliceAngle) - offsetAngle + 180;
      
      const c = RouletteTracker.getColor(num);
      let baseColor = '#1e293b'; // Slate 800 for Black to make contrast better
      if (c === 'red') baseColor = '#dc2626'; 
      else if (c === 'green') baseColor = '#16a34a';

      const hits = numCounts[num];
      const heatFactor = hits / maxHits;
      
      let fillOpacity = hits === 0 && spins.length > 0 ? 0.3 : 1; // Oscurecer los que no salieron

      svgHtml += `<path d="${describeArc(cx, cy, rInner, rOuter, startAngle, endAngle)}" fill="${baseColor}" fill-opacity="${fillOpacity}" stroke="#121418" stroke-width="1.5" />`;

      // Efecto dorado (Mapa de calor)
      if (hits > 0) {
        const overlayOpacity = 0.3 + (heatFactor * 0.7); 
        svgHtml += `<path d="${describeArc(cx, cy, rInner, rOuter, startAngle, endAngle)}" fill="rgba(212, 175, 55, ${overlayOpacity})" style="mix-blend-mode: screen;" pointer-events="none"/>`;
      }

      // Añadir texto girado hacia el centro
      const textRadius = (rInner + rOuter) / 2;
      const textAngle = startAngle + (sliceAngle / 2);
      const textPos = polarToCartesian(cx, cy, textRadius, textAngle);
      
      svgHtml += `
        <text transform="translate(${textPos.x}, ${textPos.y}) rotate(${textAngle}) scale(1, 1.2)" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="900" 
              text-anchor="middle" dominant-baseline="middle" 
              style="text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
          ${num}
        </text>`;


    }
    
    // (El cierre del grupo se ha movido al final para incluir el centro)



    // --- Gráfico de Ranuras Centrales Proporcionales (Radio Variable) ---
    const totalSpins = spins.length || 1;
    const rPieMax = rInner - 5;
    const sliceAngleFixed = 360 / totalSlices;
    // Alineamos el CENTRO de la primera ranura (el 0) al Norte (180 grados de corrección)
    let startAnglePie = -(sliceAngleFixed / 2) + 180; 

    AMERICAN_WHEEL_ORDER.forEach((num, idx) => {
      const hits = numCounts[num] || 0;
      // El radio es proporcional a los impactos (mínimo 20% para que se vea el color)
      const rProportional = (rPieMax * 0.2) + (rPieMax * 0.8 * (hits / maxHits)); 
      
      const endAnglePie = startAnglePie + sliceAngleFixed;
      const sliceColor = '#dc2626'; // Rojo vibrante para todas las ranuras

      // Dibujar la ranura proporcional
      svgHtml += `<path d="${describeArc(cx, cy, 0, rProportional, startAnglePie, endAnglePie)}" 
                        fill="${sliceColor}" fill-opacity="0.7" 
                        stroke="rgba(212, 175, 55, 0.4)" stroke-width="0.5" />`;
      
      startAnglePie = endAnglePie;
    });

    // 8 líneas radiales divisorias en la zona interna (de r = rPieMax * 0.3 a r = rInner)
    const rStartPie = rPieMax * 0.3;
    for (let j = 0; j < 8; j++) {
      const angleDeg = j * 45;
      const angleRad = (angleDeg - 90) * Math.PI / 180;
      const xStart = cx + rStartPie * Math.cos(angleRad);
      const yStart = cy + rStartPie * Math.sin(angleRad);
      const xEnd = cx + rInner * Math.cos(angleRad);
      const yEnd = cy + rInner * Math.sin(angleRad);
      svgHtml += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="var(--color-gold)" stroke-width="1.5" stroke-opacity="0.5" pointer-events="none"/>`;
    }

    // Círculo central "Donut" para limpieza visual
    svgHtml += `<circle cx="${cx}" cy="${cy}" r="${rPieMax * 0.3}" fill="#121418" stroke="var(--color-gold)" stroke-width="1"/>`;
    svgHtml += `<text x="${cx}" y="${cy + 4}" fill="var(--color-gold)" font-weight="bold" font-size="8" text-anchor="middle">ORION v4</text>`;

    svgHtml += `</g>`; // --- CIERRE DEL GRUPO DE ROTACIÓN ---

    // Cruz Azul de Cuadrantes (No rota, alineada con el Norte de la pantalla)
    const rCross = 165;
    svgHtml += `<line x1="${cx}" y1="${cy - rCross}" x2="${cx}" y2="${cy + rCross}" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.8" pointer-events="none"/>`;
    svgHtml += `<line x1="${cx - rCross}" y1="${cy}" x2="${cx + rCross}" y2="${cy}" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.8" pointer-events="none"/>`;


    // Marcador Fijo Norte (N) - Fuera del grupo de rotación
    svgHtml += `<text x="${cx}" y="-10" fill="var(--color-gold)" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">N</text>`;
    svgHtml += `<line x1="${cx}" y1="-2" x2="${cx}" y2="15" stroke="var(--roulette-red)" stroke-width="3"/>`;

    svgHtml += `</svg>`;
    wheelContainer.innerHTML = svgHtml;
  }

  function renderProbabilities(probData) {
    if (!probContainer) return;
    
    const buildBar = (item) => {
      const diff = (item.actual - item.theoretical).toFixed(1);
      const color = diff > 0 ? 'var(--roulette-green)' : (diff < 0 ? 'var(--roulette-red)' : 'var(--text-muted)');
      const diffStr = diff > 0 ? `+${diff}%` : `${diff}%`;
      return `
        <div style="margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
            <span style="color: var(--text-muted);">${item.label} (Teórico: ${item.theoretical}%)</span>
            <span style="color: ${color}; font-weight: bold;">Real: ${item.actual}% (${diffStr})</span>
          </div>
          <div style="background: #2a2f3a; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: var(--color-gold); width: ${item.actual}%; height: 100%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    };

    let html = `
      <h4 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 0.9rem;">Colores</h4>
      ${probData.colors.map(buildBar).join('')}
      <h4 style="margin: 1rem 0 0.5rem; color: var(--text-main); font-size: 0.9rem;">Paridad</h4>
      ${probData.parity.map(buildBar).join('')}
      <h4 style="margin: 1rem 0 0.5rem; color: var(--text-main); font-size: 0.9rem;">Docenas</h4>
      ${probData.dozens.map(buildBar).join('')}
    `;

    probContainer.innerHTML = html;
  }

  function renderAlerts(alerts) {
    if (!alertsContainer) return;
    if (alerts.length === 0) {
      alertsContainer.innerHTML = '<p class="empty-msg">No hay alertas. La mesa está estable.</p>';
      return;
    }

    let html = alerts.map(a => `
      <div style="background: rgba(220, 38, 38, 0.1); border-left: 3px solid var(--roulette-red); padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 4px;">
        <span style="font-size: 0.85rem; color: var(--text-main);">${a.msg}</span>
      </div>
    `).join('');
    alertsContainer.innerHTML = html;
  }

  function renderStrategy(suggestions) {
    if (!strategyContainer) return;
    if (suggestions.length === 0) {
      strategyContainer.innerHTML = '<p class="empty-msg">Sin sugerencias. Espera a que se generen alertas.</p>';
      return;
    }

    let html = suggestions.map(s => `
      <div style="background: rgba(212, 175, 55, 0.1); border-left: 3px solid var(--color-gold); padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 4px;">
        <span style="font-size: 0.85rem; color: var(--text-main); font-weight: bold;">💡 ${s}</span>
      </div>
    `).join('');
    strategyContainer.innerHTML = html;
  }

  // ─── Monte Carlo Validation UI ───────────────────────────────────────────
  const btnMCRun     = document.getElementById('btn-mc-run');
  const mcProgress   = document.getElementById('mc-progress-panel');
  const mcProgBar    = document.getElementById('mc-progress-bar');
  const mcProgLabel  = document.getElementById('mc-progress-label');

  // Registrar handler del worker para MC
  if (statsWorker) {
    const _origOnMessage = statsWorker.onmessage;
    statsWorker.onmessage = ({ data }) => {
      if (data.type === 'MONTE_CARLO_PROGRESS') {
        const pct = Math.round((data.step / data.total) * 100);
        if (mcProgBar)   mcProgBar.style.width  = `${pct}%`;
        if (mcProgLabel) mcProgLabel.textContent = `${data.label || ''} (${pct}%)`;
        return;
      }
      if (data.type === 'MONTE_CARLO_RESULT') {
        renderMCResult(data.result);
        if (btnMCRun)  { btnMCRun.disabled = false; btnMCRun.textContent = '▶ Ejecutar Validación Monte Carlo'; }
        return;
      }
      if (_origOnMessage) _origOnMessage({ data });
    };
  }

  if (btnMCRun) {
    btnMCRun.addEventListener('click', () => {
      const config = {
        iterations:  parseInt(document.getElementById('mc-iterations').value, 10) || 500,
        threshold:   parseFloat(document.getElementById('mc-threshold').value.replace(',', '.'))    || 0.50,
        seed:        parseInt(document.getElementById('mc-seed').value, 10)       || 42,
        windowSizes: [50, 100, 200],
        biasConfig: {
          type:      document.getElementById('mc-bias-type').value,
          target:    document.getElementById('mc-bias-target').value.trim(),
          biasProb:  parseFloat(document.getElementById('mc-bias-prob').value) || 0.10,
        }
      };

      btnMCRun.disabled     = true;
      btnMCRun.textContent  = '⏳ Ejecutando...';
      if (mcProgress) mcProgress.style.display = '';
      if (mcProgBar)  mcProgBar.style.width     = '0%';
      if (mcProgLabel) mcProgLabel.textContent  = 'Iniciando simulación...';

      if (statsWorker) {
        statsWorker.postMessage({ type: 'MONTE_CARLO', payload: { config }, id: Date.now() });
      } else {
        // Fallback síncrono (bloqueante — solo si el worker no está disponible)
        import('./monteCarloValidator.js').then(({ batchRunner }) => {
          const result = batchRunner(config, (step, total, label) => {
            const pct = Math.round((step / total) * 100);
            if (mcProgBar)   mcProgBar.style.width  = `${pct}%`;
            if (mcProgLabel) mcProgLabel.textContent = `${label} (${pct}%)`;
          });
          renderMCResult(result);
          if (btnMCRun) { btnMCRun.disabled = false; btnMCRun.textContent = '▶ Ejecutar Validación Monte Carlo'; }
        });
      }
    });
  }

  function renderHeatMap(hitMap, containerId = 'mc-heatmap-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Convertimos el mapa a una lista ordenada por impactos
    const sorted = Object.entries(hitMap)
      .map(([num, hits]) => ({ num, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 12); // Los 12 más calientes

    container.innerHTML = sorted.map(item => `
      <div style="background:#1e293b; border:1px solid var(--color-gold); border-radius:4px; padding:0.5rem; text-align:center; min-width:50px;">
        <div style="font-size:0.9rem; font-weight:bold; color:var(--text-main);">${item.num}</div>
        <div style="font-size:0.7rem; color:var(--color-gold);">${item.hits}</div>
      </div>
    `).join('');
  }

  function renderMCResult(r) {
    if (!r) return;
    if (mcProgress) mcProgress.style.display = 'none';

    // 1. Criterios de Aceptación (v4)
    const accPanel = document.getElementById('mc-acceptance-panel');
    const accList  = document.getElementById('mc-acceptance-list');
    if (accPanel && accList) {
      accPanel.style.display = '';
      accList.innerHTML = (r.acceptance_criteria || []).map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center;
                    background:${c.passed ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)'};
                    border-left:3px solid ${c.passed ? 'var(--roulette-green)' : 'var(--roulette-red)'};
                    border-radius:4px; padding:0.5rem 0.75rem;">
          <span style="font-size:0.75rem; color:var(--text-main);">${c.criterion}</span>
          <span style="font-size:0.75rem; font-weight:bold; color:${c.passed ? 'var(--roulette-green)' : 'var(--roulette-red)'};">
            ${(c.value * 100).toFixed(1)}% ${c.passed ? '✓' : '✗'}
          </span>
        </div>`).join('');
    }

    // 2. Métricas Clave (v4 Dashboard)
    const metricsPanel = document.getElementById('mc-metrics-panel');
    const metricsGrid  = document.getElementById('mc-metrics-grid');
    if (metricsPanel && metricsGrid) {
      metricsPanel.style.display = '';
      const metrics = [
        { label: 'FPR (Azar)',    value: r.fpr,       good: v => v <= 0.05 },
        { label: 'TPR (Sesgo)',   value: r.tpr,       good: v => v >= 0.70 },
        { label: 'TPR (Drift)',   value: r.drift_tpr, good: v => v >= 0.50 },
        { label: 'Precisión',     value: r.precision, good: v => v >= 0.85 },
      ];
      metricsGrid.innerHTML = metrics.map(m => {
        const isGood = m.good(m.value);
        return `
          <div style="background:rgba(15,23,42,0.5); border:1px solid ${isGood ? '#16a34a33' : '#dc262633'}; border-radius:8px; padding:0.8rem; text-align:center;">
            <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:0.3rem; text-transform:uppercase;">${m.label}</div>
            <div style="font-size:1.1rem; font-weight:900; color:${isGood ? 'var(--roulette-green)' : 'var(--roulette-red)'};">${(m.value * 100).toFixed(1)}%</div>
          </div>`;
      }).join('');
    }

    // 3. Tabla por ventana
    const byWPanel = document.getElementById('mc-bywindow-panel');
    const tbody    = document.getElementById('mc-window-tbody');
    if (byWPanel && tbody && r.by_window_size) {
      byWPanel.style.display = '';
      tbody.innerHTML = Object.entries(r.by_window_size).map(([ws, d]) => {
        const fprOk  = d.fpr <= 0.05;
        const tprOk  = d.tpr >= 0.70;
        return `
          <tr style="border-bottom:1px solid #1e293b;">
            <td style="padding:0.4rem; color:var(--color-gold); font-weight:bold;">${ws}</td>
            <td style="padding:0.4rem; text-align:center; color:${fprOk ? 'var(--roulette-green)' : 'var(--roulette-red)'};">${(d.fpr*100).toFixed(1)}%</td>
            <td style="padding:0.4rem; text-align:center; color:${tprOk ? 'var(--roulette-green)' : 'var(--roulette-red)'};">${(d.tpr*100).toFixed(1)}%</td>
            <td style="padding:0.4rem; text-align:center; color:var(--text-main);">${(d.precision*100).toFixed(1)}%</td>
            <td style="padding:0.4rem; text-align:center; font-size:1rem;">${fprOk && tprOk ? '✅' : '⚠️'}</td>
          </tr>`;
      }).join('');
    }

    // 4. Mapa de Calor (H1: Sector)
    const heatmapPanel = document.getElementById('mc-heatmap-panel');
    const heatmapCont  = document.getElementById('mc-heatmap-container');
    if (heatmapPanel && heatmapCont && r.h1_hit_map) {
      heatmapPanel.style.display = '';
      const entries = Object.entries(r.h1_hit_map);
      const maxHits = Math.max(...entries.map(e => e[1]));
      
      // Ordenar por frecuencia (Top 12 más calientes)
      const topHits = entries.sort((a,b) => b[1] - a[1]).slice(0, 12);
      
      heatmapCont.innerHTML = topHits.map(([num, count]) => {
        const intensity = count / maxHits;
        const color = `rgba(212, 175, 55, ${0.2 + intensity * 0.8})`; 
        return `
          <div style="display:flex; flex-direction:column; align-items:center; background:rgba(0,0,0,0.2); padding:0.4rem; border-radius:4px; min-width:45px; border-bottom:3px solid ${color};">
            <span style="font-size:0.8rem; font-weight:bold; color:var(--text-main);">${num}</span>
            <span style="font-size:0.6rem; color:var(--text-muted);">${count}</span>
          </div>`;
      }).join('');
    }
  }

  // ─── Ventana Deslizante ───────────────────────────────────────────────────
  const windowSlider    = document.getElementById('window-size-slider');
  const windowLabel     = document.getElementById('window-size-label');

  if (windowSlider) {
    windowSlider.addEventListener('input', () => {
      currentWindowSize = parseInt(windowSlider.value, 10);
      windowLabel.textContent = currentWindowSize;
      workerRequest('WINDOW_STATS', { spins: tracker.getSpins(), windowSize: currentWindowSize });
    });
  }

  // ─── Renders de nuevos paneles ────────────────────────────────────────────

  function renderRunsTest(results) {
    const container = document.getElementById('runs-test-container');
    if (!container) return;
    if (!results) { container.innerHTML = '<p class="empty-msg">Sin datos.</p>'; return; }

    const cats = [
      { key: 'color',   label: 'Color (Rojo/Negro)',   labels: ['Rojo','Negro'] },
      { key: 'parity',  label: 'Paridad (Par/Impar)',   labels: ['Par','Impar'] },
      { key: 'highlow', label: 'Alto/Bajo (19-36/1-18)',labels: ['19-36','1-18'] },
    ];

    container.innerHTML = cats.map(cat => {
      const r = results[cat.key];
      if (!r || r.z === null) {
        return `<div style="background:#2a2f3a; border-radius:4px; padding:0.6rem; font-size:0.75rem;">
          <strong style="color:var(--text-muted);">${cat.label}</strong>
          <span style="float:right; color:var(--text-muted);">${r?.interpretation || 'Sin datos'}</span>
        </div>`;
      }
      const absZ = Math.abs(r.z);
      const sigColor = absZ >= 1.96 ? 'var(--roulette-red)' : absZ >= 1.645 ? 'var(--color-gold)' : 'var(--roulette-green)';
      const sigLabel = absZ >= 1.96 ? 'SIGNIFICATIVO' : absZ >= 1.645 ? 'BORDERLINE' : 'NORMAL';

      return `
        <div style="background:#2a2f3a; border-left:3px solid ${sigColor}; border-radius:4px; padding:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <strong style="font-size:0.8rem; color:var(--text-main);">${cat.label}</strong>
            <span style="font-size:0.65rem; background:${sigColor}22; color:${sigColor}; padding:2px 6px; border-radius:3px; font-weight:bold;">${sigLabel}</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.25rem; font-size:0.72rem; color:var(--text-muted);">
            <span>Rachas: <strong style="color:var(--text-main);">${r.runs}</strong></span>
            <span>μ esperada: <strong>${r.muR}</strong></span>
            <span>Z = <strong style="color:${sigColor};">${r.z}</strong></span>
            <span>${cat.labels[0]}: <strong>${r.n1}</strong></span>
            <span>${cat.labels[1]}: <strong>${r.n2}</strong></span>
            <span>n: <strong>${r.n}</strong></span>
          </div>
          <div style="margin-top:0.4rem; font-size:0.75rem; color:${sigColor}; font-style:italic;">${r.interpretation}</div>
        </div>`;
    }).join('');
  }

  function renderWindowStats(result) {
    const container = document.getElementById('window-stats-container');
    if (!container) return;
    if (!result) { container.innerHTML = '<p class="empty-msg">Sin datos suficientes.</p>'; return; }

    const chiColor = result.chiSquare > 52 ? 'var(--roulette-red)'
                   : result.chiSquare > 40 ? 'var(--color-gold)'
                   : 'var(--roulette-green)';

    const top5html = result.top5.map(t =>
      `<span style="background:#1a2035; padding:2px 6px; border-radius:3px; font-size:0.75rem;">
        <strong style="color:var(--color-gold);">${t.num}</strong>
        <span style="color:var(--text-muted);"> ×${t.cnt} (${t.pct}%)</span>
       </span>`
    ).join('');

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
        <div style="background:#2a2f3a; border-radius:4px; padding:0.6rem; text-align:center;">
          <div style="font-size:0.7rem; color:var(--text-muted);">χ² ventana</div>
          <div style="font-size:1.1rem; font-weight:bold; color:${chiColor};">${result.chiSquare}</div>
          <div style="font-size:0.65rem; color:${chiColor};">${result.chiDiagnosis}</div>
        </div>
        <div style="background:#2a2f3a; border-radius:4px; padding:0.6rem; text-align:center;">
          <div style="font-size:0.7rem; color:var(--text-muted);">Zona Hot</div>
          <div style="font-size:1.1rem; font-weight:bold; color:var(--color-gold);">${result.hotZone.center}</div>
          <div style="font-size:0.65rem; color:var(--text-muted);">[${result.hotZone.members.join('·')}]</div>
        </div>
      </div>
      <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.3rem;">Top 5 en ventana:</div>
      <div style="display:flex; flex-wrap:wrap; gap:0.3rem;">${top5html}</div>`;
  }

  function renderDistHist(histData) {
    if (!histData || histData.total === 0) return;

    // 1. Histograma Principal (Pestaña Estadísticas)
    const canvas = document.getElementById('distance-histogram-canvas');
    const badge  = document.getElementById('dist-dealer-badge');
    if (canvas) {
      if (badge) {
        const di = histData.dealerIndex;
        const isAlert = Math.abs(di) > 10;
        badge.style.display = '';
        badge.style.background = isAlert ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)';
        badge.style.border     = `1px solid ${isAlert ? 'var(--roulette-red)' : 'var(--roulette-green)'}`;
        badge.style.color      = isAlert ? 'var(--roulette-red)' : 'var(--roulette-green)';
        badge.textContent      = `Dealer Index: ${di > 0 ? '+' : ''}${di}% — ${histData.dealerInterpretation}`;
      }
      renderDistanceChart(canvas, histData);
    }

    // 2. Histograma de Pestaña Series
    const seriesCanvas = document.getElementById('series-distance-histogram-canvas');
    const seriesBadge  = document.getElementById('series-dist-dealer-badge');
    if (seriesCanvas) {
      if (seriesBadge) {
        const di = histData.dealerIndex;
        const isAlert = Math.abs(di) > 10;
        seriesBadge.style.display = '';
        seriesBadge.style.background = isAlert ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)';
        seriesBadge.style.border     = `1px solid ${isAlert ? 'var(--roulette-red)' : 'var(--roulette-green)'}`;
        seriesBadge.style.color      = isAlert ? 'var(--roulette-red)' : 'var(--roulette-green)';
        seriesBadge.textContent      = `Dealer Index: ${di > 0 ? '+' : ''}${di}% — ${histData.dealerInterpretation}`;
      }
      renderDistanceChart(seriesCanvas, histData);
    }
  }

  function renderConfidenceIntervals(ciData) {
    const container = document.getElementById('ci-container');
    const title = document.getElementById('wilson-ci-title');
    if (!container) return;
    
    if (!ciData) {
      container.innerHTML = '<p class="empty-msg">Ingresa tiradas para ver intervalos de confianza.</p>';
      return;
    }

    if (title) {
      title.textContent = `📐 Intervalos de Confianza Wilson (Paramétricos)`;
    }

    const html = Object.entries(ciData.groups).map(([key, group]) => {
      // Función Wilson local para cada grupo usando su propio Z
      const wilson = (count, total, z) => {
        if (total === 0) return { pct: 0, lower: 0, upper: 0 };
        const p = count / total;
        const z2 = z * z;
        const den = 1 + z2 / total;
        const ctr = (p + z2 / (2 * total)) / den;
        const mg  = (z / den) * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total));
        return {
          pct:   +(p * 100).toFixed(1),
          lower: +Math.max(0, (ctr - mg) * 100).toFixed(1),
          upper: +Math.min(100, (ctr + mg) * 100).toFixed(1),
        };
      };

      const itemsHtml = Object.entries(group.items).map(([name, count]) => {
        const labels = {
          red: 'Rojo', black: 'Negro', even: 'Par', odd: 'Impar',
          low: '1-18', high: '19-36', d1: 'Docena 1', d2: 'Docena 2', d3: 'Docena 3',
          c1: 'Columna 1', c2: 'Columna 2', c3: 'Columna 3'
        };
        
        const d = { ...wilson(count, ciData.total, group.z), label: labels[name], theoretical: group.theo };
        const outsideCI = d.theoretical < d.lower || d.theoretical > d.upper;
        const barColor  = outsideCI ? 'var(--roulette-red)' : 'var(--color-gold)';

        return `
          <div style="margin-bottom:0.65rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; margin-bottom:0.2rem;">
              <span style="color:var(--text-muted);">${d.label}</span>
              <span style="color:${outsideCI ? 'var(--roulette-red)' : 'var(--text-muted)'}; font-size:0.65rem;">
                IC${group.conf}%: [${d.lower}%, ${d.upper}%] — teórico: ${d.theoretical}%
                ${outsideCI ? ' ⚠️' : ''}
              </span>
            </div>
            <div style="position:relative; background:#1a2035; height:8px; border-radius:4px; overflow:visible;">
              <div style="position:absolute; top:0; left:${d.lower}%; width:${d.upper - d.lower}%; height:100%;
                          background:${barColor}33; border-radius:4px;"></div>
              <div style="position:absolute; top:-2px; left:${d.pct}%; width:3px; height:12px;
                          background:${barColor}; border-radius:2px; transform:translateX(-50%);"></div>
              <div style="position:absolute; top:-3px; left:${d.theoretical}%; width:2px; height:14px;
                          background:rgba(255,255,255,0.3); border-radius:1px; transform:translateX(-50%);"></div>
            </div>
          </div>`;
      }).join('');

      return `
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 0.75rem; color: var(--color-gold); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between;">
            <span>${group.label}</span>
            <span style="font-size: 0.6rem; opacity: 0.7; font-weight: normal;">Confianza: ${group.conf}%</span>
          </h4>
          ${itemsHtml}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="display:flex; gap:1rem; font-size:0.65rem; color:var(--text-muted); margin-bottom:0.75rem;">
        <span><span style="display:inline-block;width:8px;height:8px;background:var(--color-gold);border-radius:1px;margin-right:3px;"></span>Observado</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:rgba(255,255,255,0.3);border-radius:1px;margin-right:3px;"></span>Teórico</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:var(--color-gold);border-radius:1px;opacity:0.2;margin-right:3px;"></span>IC (Variable)</span>
      </div>
      ${html}`;
  }


  // --- Kelly Manager UI ---
  const kellyBankrollInput  = document.getElementById('kelly-bankroll');
  const kellyFractionInput  = document.getElementById('kelly-fraction');
  const kellyStopLossInput  = document.getElementById('kelly-stoploss');
  const kellyTakeProfitInput= document.getElementById('kelly-takeprofit');
  const kellyMinConfInput   = document.getElementById('kelly-minconf');
  const kellyMinConfLabel   = document.getElementById('kelly-minconf-label');
  const btnKellyCalc        = document.getElementById('btn-kelly-calc');

  if (kellyBankrollInput) {
    kellyBankrollInput.value  = kelly.bankroll;
    kellyFractionInput.value  = kelly.fraction;
    kellyStopLossInput.value  = Math.round(kelly.stopLossPct * 100);
    kellyTakeProfitInput.value= Math.round(kelly.takeProfitPct * 100);
    kellyMinConfInput.value   = Math.round(kelly.minConfidence * 100);
    kellyMinConfLabel.textContent = `${Math.round(kelly.minConfidence * 100)}%`;

    kellyMinConfInput.addEventListener('input', () => {
      kellyMinConfLabel.textContent = `${kellyMinConfInput.value}%`;
    });

    btnKellyCalc.addEventListener('click', () => {
      kelly.bankroll       = parseFloat(kellyBankrollInput.value)  || 100;
      kelly.fraction       = parseFloat(kellyFractionInput.value)  || 0.25;
      kelly.stopLossPct    = (parseInt(kellyStopLossInput.value)   || 20) / 100;
      kelly.takeProfitPct  = (parseInt(kellyTakeProfitInput.value) || 30) / 100;
      kelly.minConfidence  = (parseInt(kellyMinConfInput.value)    || 30) / 100;
      kelly.save();
      const signals = (orion && typeof orion.getBestOpportunities === 'function') ? orion.getBestOpportunities() : [];
      renderKelly(kelly.analyze(tracker, signals));
    });
  }

  function renderKelly(result) {
    const confPanel   = document.getElementById('kelly-confidence-panel');
    const limitsPanel = document.getElementById('kelly-limits-panel');
    const recsPanel   = document.getElementById('kelly-recs-panel');
    const insuffMsg   = document.getElementById('kelly-insufficient-msg');
    const recsList    = document.getElementById('kelly-recs-list');

    if (!confPanel) return;

    confPanel.style.display   = '';
    limitsPanel.style.display = '';
    recsPanel.style.display   = '';

    // Confianza
    document.getElementById('kelly-total').textContent     = result.total;
    document.getElementById('kelly-chi').textContent       = result.chiSquare;
    document.getElementById('kelly-chidiag').textContent   = result.chiDiagnosis;
    document.getElementById('kelly-conf-pct').textContent  = `${result.confidence}%`;
    document.getElementById('kelly-conf-bar').style.width  = `${result.confidence}%`;

    // Límites
    document.getElementById('kelly-stoploss-amt').textContent   = `$${result.stopLossAmount}`;
    document.getElementById('kelly-takeprofit-amt').textContent = `$${result.takeProfitAmount}`;

    // Insuficiente
    if (result.insufficient) {
      insuffMsg.style.display = '';
      insuffMsg.textContent   = `Necesitas al menos ${result.needed} tiradas. Tienes: ${result.total}.`;
      recsList.innerHTML = '';
      return;
    }
    insuffMsg.style.display = 'none';

    // Recomendaciones
    const fractionLabel = result.fractionLabel || 'Kelly';
    const viables   = result.recommendations.filter(r => r.viable);
    const noViables = result.recommendations.filter(r => !r.viable);

    let html = '';

    if (viables.length === 0) {
      html += `<div style="background:rgba(212,175,55,0.08); border:1px solid #334155; border-radius:4px; padding:0.75rem; text-align:center; font-size:0.8rem; color:var(--text-muted);">
        No hay apuestas con ventaja detectada suficiente. Confianza actual: ${result.confidence}% (mínimo: ${result.minConfidence}%).
      </div>`;
    }

    const renderRec = (r, dimmed) => {
      const edgeColor   = r.edge > 0 ? 'var(--roulette-green)' : 'var(--roulette-red)';
      const edgeSign    = r.edge > 0 ? '+' : '';
      const borderColor = r.viable ? 'var(--roulette-green)' : '#334155';
      const opacity     = dimmed ? '0.45' : '1';

      return `
        <div style="background:#1e293b; border-left:3px solid ${borderColor}; border-radius:4px; padding:0.75rem; opacity:${opacity};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span style="font-weight:bold; color:var(--text-main); font-size:0.9rem;">${r.label}</span>
            <span style="font-size:0.75rem; color:${edgeColor}; font-weight:bold;">${edgeSign}${r.edge}% ventaja</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem 0.75rem; font-size:0.72rem; color:var(--text-muted);">
            <span>Observado: <strong style="color:var(--text-main);">${r.pObs}%</strong></span>
            <span>Teórico: <strong>${r.pTheo}%</strong></span>
            <span>Full Kelly: <strong style="color:var(--color-gold);">${r.fullKellyPct}%</strong></span>
            <span>${fractionLabel}: <strong style="color:var(--color-gold);">${r.fracKellyPct}%</strong></span>
            <span>Apuesta: <strong style="color:${r.viable ? 'var(--roulette-green)' : 'var(--text-muted)'}; font-size:0.85rem;">$${r.betAmount}</strong></span>
            <span>Riesgo Ruina: <strong style="color:${parseFloat(r.riskOfRuinPct) > 50 ? 'var(--roulette-red)' : 'var(--text-muted)'};">${r.riskOfRuinPct}%</strong></span>
            <span>Tiros×2: <strong>${r.spinsToDouble}</strong></span>
            <span>Pago: <strong>${r.b}:1</strong></span>
          </div>
          ${r.note ? `<div style="margin-top:0.3rem; font-size:0.65rem; color:var(--text-muted);">${r.note}</div>` : ''}
        </div>
      `;
    };

    viables.forEach(r   => { html += renderRec(r, false); });

    if (noViables.length > 0) {
      html += `<details style="margin-top:0.25rem;">
        <summary style="font-size:0.75rem; color:var(--text-muted); cursor:pointer; padding:0.3rem 0;">
          Ver apuestas sin ventaja (${noViables.length})
        </summary>
        <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.4rem;">
          ${noViables.map(r => renderRec(r, true)).join('')}
        </div>
      </details>`;
    }

    recsList.innerHTML = html;
  }

  // Initial render
  updateUI();

  // --- 7. Lógica de Importación Masiva ---
  const localImportTriggers = document.querySelectorAll('.btn-import-local-trigger');
  if (localImportTriggers.length > 0 && fileImportLocal) {
    localImportTriggers.forEach(btn => {
      btn.addEventListener('click', () => fileImportLocal.click());
    });

    fileImportLocal.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const content = evt.target.result;
        // Parsear números: busca 0, 00, o números del 1 al 36 sueltos en el texto
        const matches = content.match(/\b(00|[0-9]{1,2})\b/g) || [];
        if (matches.length > 0) {
          const report = tracker.importSpins(matches);
          let msg = `✅ Importación completada:\n- Total encontrados: ${report.total}\n- Válidos cargados: ${report.valid}\n- Descartados: ${report.discarded}`;
          if (report.discarded > 0) {
            msg += `\n\nEjemplos de descartados:\n${report.details.join('\n')}`;
          }
          alert(msg);
          updateUI();
        } else {
          alert("No se encontraron números válidos en el archivo.");
        }
        fileImportLocal.value = ''; // Reset
      };
      reader.readAsText(file);
    });
  }

  const sheetsImportTriggers = document.querySelectorAll('.btn-import-sheets-trigger');
  sheetsImportTriggers.forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = tracker.settings.sheetUrl;
      const sheetName = tracker.settings.sheetName;

      if (!url) {
        alert("Primero debes configurar la 'URL de la Planilla' en la pestaña Ajustes.");
        return;
      }

      // Extraer ID de la planilla usando Regex
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        alert("La URL de la planilla no parece válida. Asegúrate de copiar el enlace completo (ej. https://docs.google.com/spreadsheets/d/...).");
        return;
      }

      const sheetId = match[1];
      const sheetColumn = tracker.settings.sheetColumn;
      let fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      
      let queryParams = [];
      if (sheetName) {
        fetchUrl += `&sheet=${encodeURIComponent(sheetName)}`;
      }
      if (sheetColumn) {
        fetchUrl += `&tq=${encodeURIComponent(`select ${sheetColumn}`)}`;
      }

      try {
        btn.textContent = "⏳ Cargando...";
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Error en la conexión con Google Sheets");
        
        const text = await response.text();
        
        // Extraer todos los números del CSV retornado
        const matches = text.match(/\b(00|[0-9]{1,2})\b/g) || [];
        
        if (matches.length > 0) {
          const report = tracker.importSpins(matches);
          let msg = `☁️ Importación desde Sheets completada:\n- Total descargados: ${report.total}\n- Válidos cargados: ${report.valid}\n- Descartados: ${report.discarded}`;
          if (report.discarded > 0) {
            msg += `\n\nEjemplos de descartados:\n${report.details.join('\n')}`;
          }
          alert(msg);
          updateUI();
        } else {
          alert("La planilla se descargó pero no detectamos números válidos. Asegúrate de que los números no estén vacíos y que la planilla tenga el acceso 'Cualquier persona con el enlace puede leer'.");
        }
      } catch (err) {
        console.error(err);
        alert("Error de conexión. Verifica:\n1. Que tienes internet.\n2. Que configuraste el acceso a la planilla como 'Público/Cualquier persona con el enlace puede leer'.\n3. Que la URL es correcta.");
      } finally {
        btn.textContent = "☁️ Importar Sheets";
      }
    });
  });

  function renderWinWinTab(tracker, engine) {
    const spins = tracker.spins;
    const tableBody = document.getElementById('prototipo-table-body');
    if (!tableBody) return;
    if (spins.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="empty-msg" style="padding:2rem;">Ingresa tiradas para activar el motor estratégico.</td></tr>';
      return;
    }

    const settings = tracker.settings;
    const rows = [];

    // --- 1. Apuestas Externas ---
    const ext = engine.analyzeExternals(spins, settings.colorAlert || 5, settings.rangeExt || 100);
    const extAlerts = ext.filter(i => i.atraso >= (settings.colorAlert || 5));
    rows.push({
      label: "Apuestas Externas",
      col1: extAlerts.length > 0 ? `ATRASO: ` + extAlerts.map(i => `${i.label}:${i.atraso}`).join(' | ') : "",
      col2: extAlerts.map(i => `${i.label}= (${i.delta})`).join(' | '),
      col3: `MAX-PERDIDAS: ` + ext.map(i => `${i.label} (${i.maxHist})`).join(', ')
    });

    // --- 2. Docenas / Columnas ---
    const doz = engine.analyzeDozens(spins, settings.dozenAlert || 7, settings.rangeDoc || 100);
    const dozAlerts = doz.filter(i => i.atraso >= (settings.dozenAlert || 7));
    rows.push({
      label: "Docenas",
      col1: dozAlerts.length > 0 ? `ATRASO: ` + dozAlerts.map(i => `${i.label}:${i.atraso}`).join(' | ') : "",
      col2: dozAlerts.map(i => `${i.label}= (${i.delta})`).join(' | '),
      col3: `MAX-PERDIDAS: ` + doz.map(i => `${i.label} (${i.maxHist})`).join(', ')
    });

    // --- 3. CHI- sesgo ---
    const chi = engine.analyzeCHI(spins, settings.rangeCHI || 100, 0.5, 0.2);
    if (chi) {
      rows.push({
        label: "CHI- sesgo",
        col1: chi.nums.map(n => `${n.num}${n.type === 'plus' ? '↑' : '↓'}`).join(', ') || "Normal",
        col2: chi.bets.length > 0 ? chi.bets.map(b => `${b.label}(${b.type === 'plus' ? '+' : '-'})`).join(' | ') : "OK",
        col3: `Ventana ${settings.rangeCHI || 100}`
      });
      // Detalle visual (opcional si ya está en la tabla)
    }

    // --- 4. Ley del Tercio ---
    const rangeLey = settings.rangeLey || 37;
    const ley = engine.analyzeLeyDelTercio(spins, rangeLey);
    if (ley) {
      rows.push({
        label: "Ley del Tercio",
        col1: `Únicos: ${ley.observedUnique}`,
        col2: ley.isAnomalous ? "⚠️ ANOMALÍA" : "OK",
        col3: `Ventana ${rangeLey} (Exp: ${ley.expectedUnique})`
      });
    }

    // --- 5. Win-Win ---
    const allSeries = settings.customSeries || [];
    const activeSeries = allSeries.filter(s => s.active !== false && s.numbers && s.numbers.length > 0);
    const winwin = engine.analyzeWinWin(spins, activeSeries, settings.rangeWW || 200);
    
    rows.push({
      label: "Win-Win",
      col1: winwin.length > 0 ? winwin.map(w => `${w.name}(${w.type})`).join(', ') : "Esperando racha...",
      col2: winwin.length > 0 ? winwin.map(w => {
        const s = allSeries.find(cs => cs.name === w.name);
        return s ? `${w.name}(${s.numbers.join(',')})` : "";
      }).join(' | ') : "Analizando series activas...",
      col3: winwin.length > 0 ? winwin.map(w => {
        const s = allSeries.find(cs => cs.name === w.name);
        if (!s) return "";
        const giros = spins.map(sp => sp.number);
        const dists = engine._calcularDistancias(giros, s.numbers).slice(-8).join(',');
        return `${w.name}(${dists})_(${w.atraso})`;
      }).join(' | ') : `Muestra: ${settings.rangeWW || 200} tiros`
    });

    // --- 6. Series Atrasadas ---
    const seriesThreshold = settings.seriesAlert || 10;
    const atr = engine.analyzeSeriesAtrasadas(spins, activeSeries, settings.rangeAtr || 500, seriesThreshold, settings.weaknessDistCount || 3);
    const criticalAtr = atr.filter(s => s.isAlert || s.isWeak);
    rows.push({
      label: "Series Atrasadas",
      col1: criticalAtr.map(s => `${s.label}(${s.atraso})${s.isWeak?'*DEBIL*':''}`).join(' | ') || "",
      col2: criticalAtr.map(s => `${s.label}= (${s.delta})`).join(' | '),
      col3: `MAX-DISTANCIAS: ` + atr.map(s => {
        const isAct = (allSeries.find(as => as.name === s.label)?.active !== false);
        return `<span style="opacity:${isAct?1:0.3}">${s.label} (${s.maxHist})</span>`;
      }).join(', ')
    });

    // --- 7. Seisenas ---
    const seis = engine.analyzeSeisenas(spins, settings.dozenAlert || 7, settings.rangeSeis || 100);
    const seisAlerts = seis.filter(s => s.atraso >= (settings.dozenAlert || 7));
    rows.push({
      label: "Seisenas",
      col1: seisAlerts.length > 0 ? `ATRASO: ` + seisAlerts.map(s => `${s.label}:${s.atraso}`).join(' | ') : "",
      col2: seisAlerts.map(s => `${s.label}= (${s.atraso - s.maxHist})`).join(' | '),
      col3: `MAX-PERDIDAS: ` + seis.map(s => `${s.label} (${s.maxHist})`).join(', ')
    });

    // Actualizar contador total en ajustes
    const displayTotal = document.getElementById('display-total-spins');
    if (displayTotal) displayTotal.textContent = spins.length;

    // Renderizado final como lista de tarjetas secuenciales
    tableBody.innerHTML = rows.map((r, idx) => `
      <div class="strategy-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid var(--color-gold);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
          <h3 style="color: var(--color-gold); font-size: 1rem; margin: 0;">${r.label}</h3>
          <span style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace; text-transform: uppercase;">Estrategia #${idx + 1}</span>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span style="color: var(--text-muted); font-size: 0.8rem; min-width: 80px;">Atraso:</span>
            <span style="color: var(--roulette-green); font-weight: bold; font-size: 0.85rem; text-align: right; flex: 1;">${r.col1 || "Sin alertas"}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span style="color: var(--text-muted); font-size: 0.8rem; min-width: 80px;">Delta:</span>
            <span style="color: var(--text-main); font-size: 0.85rem; text-align: right; flex: 1;">${r.col2 || "Estable"}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.05);">
            <span style="color: var(--text-muted); font-size: 0.8rem; min-width: 80px;">Máximos:</span>
            <span style="color: var(--text-muted); font-size: 0.75rem; font-family: monospace; text-align: right; flex: 1;">${r.col3}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Actualizar contadores de alertas en el dashboard
    if (document.getElementById('winwin-alert-count')) 
      document.getElementById('winwin-alert-count').textContent = winwin.length;
    if (document.getElementById('atraso-alert-count')) 
      document.getElementById('atraso-alert-count').textContent = seis.filter(s => s.isAlert).length + atr.filter(s => s.isCritical).length;
    if (document.getElementById('chi-alert-count')) 
      document.getElementById('chi-alert-count').textContent = chi ? (chi.nums.length + chi.bets.length) : 0;
  }

}); // Fin de DOMContentLoaded
