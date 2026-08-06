/**
 * TOMADOR RENDERER MODULE
 * Encapsula la lógica del teclado táctico y la entrada de datos de sesión.
 */

import { RED_NUMBERS, AMERICAN_WHEEL_ORDER, ROULETTE_NUMBERS } from './src/utils/numberMeta.js';
import { getColor, getParity, getHighLow, getDozen, getColumn, getWheelDistance } from './src/utils/numberMeta.js';
import { tomadorStateStore } from './tomadorStateStore.js';
import {
  COLUMN_ARROW_COLORS,
  getColumnArrowStyle,
  getDozenBlockStyle,
  getTomadorClothSurfaceStyleScaled,
  TOMADOR_COLORS,
  TOMADOR_SURFACE_COLORS,
  getNumberHighlightStyle,
} from './tomadorColorRules.js';

const TOMADOR_LAYOUT_SCALE = 0.75;
const TOMADOR_SURFACE_SCALE = 1.5;
const scalePx = (value) => `${Math.max(1, Math.round(value * TOMADOR_LAYOUT_SCALE))}px`;
const surfacePx = (value) => `${Math.max(1, Math.round(value * TOMADOR_SURFACE_SCALE))}px`;

export class TomadorRenderer {
  constructor(tracker, options = {}) {
    this.tracker = tracker;
    this.onSpinAdded = options.onSpinAdded || null;
    this._storedState = tomadorStateStore.getSnapshot();
    this.mode = this._storedState.mode || 'grid';
    this.buttonWidth = this._storedState.panoScale || 42;
    this.sortMode = 'atraso'; // 'atraso', 'az', 'historial'
    this._dom = {};
    this._dozenArrows = {};
    this._dozenGrids = {};
    this._columnArrows = {};
    this._historyPanelDrag = null;
    this._historyPanelHandlers = null;
    this._sessionPanelDrag = null;
    this._seriesPanelDrag = null;
    this._keypadPanelDrag = null;
    this._editingSpinId = null;
    this.init();
  }

  init() {
    this._cacheDom();
    this.renderKeypad();
    this.setupEventListeners();
    this.ready = this._hydrateStoredState()
      .catch((e) => {
        console.warn('No se pudo hidratar el estado del tomador:', e);
      })
      .then(() => {
        this.setupSessionInputs();
        this.setupKeypadPanel();
        this.setupHistoryPanel();
        this.setupSessionPanel();
        this.setupSeriesPanel();
        this._syncModeUI();
        this.update();
      });
  }

  _cacheDom() {
    this._dom.numberGrid = document.getElementById('number-grid');
    this._dom.rowZeroes = document.querySelector('.row-zeroes');
    this._dom.btnClearData = document.getElementById('btn-clear-data');
    this._dom.inputModeGrid = document.getElementById('input-mode-grid');
    this._dom.inputModeWheel = document.getElementById('input-mode-wheel');
    this._dom.inputWheelContainer = document.getElementById('input-wheel-container');
    this._dom.inputWheelRotation = document.getElementById('input-wheel-rotation');
    this._dom.btnToggleInput = document.getElementById('btn-toggle-input');
    this._dom.sessionInputs = this._getSessionInputs();
    this._dom.historyPanel = document.getElementById('history-panel-draggable');
    this._dom.historyHeader = document.getElementById('history-panel-header');
    this._dom.historyList = document.getElementById('history-list');
    this._dom.btnExportSession = document.getElementById('btn-export-session');
    this._dom.editModal = document.getElementById('edit-spin-modal');
    this._dom.editLabel = document.getElementById('edit-spin-label');
    this._dom.editSelect = document.getElementById('edit-spin-select');
    this._dom.editSaveBtn = document.getElementById('edit-spin-save');
    this._dom.editCancelBtn = document.getElementById('edit-spin-cancel');
    this._dom.seriesPanel = document.getElementById('series-panel-draggable');
    this._dom.seriesHeader = document.getElementById('series-panel-header');
    this._dom.seriesList = document.getElementById('series-floating-list');
    this._dom.btnSortSeries = document.getElementById('btn-sort-series-floating');
    this._dom.btnSortSeriesHistorial = document.getElementById('btn-sort-series-historial');
  }

  renderKeypad() {
    const numberGrid = this._dom.numberGrid;
    if (!numberGrid) return;

    numberGrid.innerHTML = '';
    const gridContainer = this._ensureKeypadGridContainer(numberGrid);
    this._applyTomadorSurfaceStyles();
    gridContainer.replaceChildren();

    const boxes = this._createDozenBoxes();
    boxes.forEach(box => gridContainer.appendChild(box.container));

    for (let i = 1; i <= 36; i++) {
      const numStr = i.toString();
      const dozenIdx = Math.ceil(i / 12) - 1;
      boxes[dozenIdx].grid.appendChild(this._createNumberButton(numStr));
    }

    const columnArrowsRow = this._createColumnArrowsRow();
    if (columnArrowsRow) {
      numberGrid.appendChild(columnArrowsRow);
    }
  }

  _applyTomadorSurfaceStyles() {
    if (this._dom.inputModeGrid) {
      Object.assign(this._dom.inputModeGrid.style, getTomadorClothSurfaceStyleScaled(TOMADOR_SURFACE_SCALE));
      this._dom.inputModeGrid.style.width = '100%';
      this._dom.inputModeGrid.style.display = 'flex';
      this._dom.inputModeGrid.style.flexDirection = 'column';
      this._dom.inputModeGrid.style.gap = surfacePx(6);
      this._dom.inputModeGrid.style.minHeight = '0';
      this._dom.inputModeGrid.style.flex = '1';
      this._dom.inputModeGrid.style.overflowY = 'auto';
      this._dom.inputModeGrid.style.overflowX = 'auto';
      this._dom.inputModeGrid.style.paddingRight = '6px';
    }

    if (this._dom.inputModeWheel) {
      this._dom.inputModeWheel.style.flex = '1';
      this._dom.inputModeWheel.style.overflowY = 'auto';
      this._dom.inputModeWheel.style.overflowX = 'auto';
      this._dom.inputModeWheel.style.width = '100%';
      this._dom.inputModeWheel.style.minHeight = '0';
    }

    if (this._dom.rowZeroes) {
      this._dom.rowZeroes.style.marginBottom = surfacePx(5);
      this._dom.rowZeroes.style.width = '100%';
      this._dom.rowZeroes.style.maxWidth = 'none';
      this._dom.rowZeroes.style.display = 'flex';
      this._dom.rowZeroes.style.alignItems = 'center';
      this._dom.rowZeroes.style.gap = surfacePx(4);
    }

    const zeroesContainer = document.querySelector('.zeroes-container');
    const zeroesLabel = document.querySelector('.zeroes-label');
    if (zeroesContainer) {
      zeroesContainer.style.border = `2px solid ${TOMADOR_SURFACE_COLORS.zeroesBorder}`;
      zeroesContainer.style.background = TOMADOR_SURFACE_COLORS.zeroesBackground;
      zeroesContainer.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.08)';

      const gapVal = Math.max(1, Math.round(2 * TOMADOR_SURFACE_SCALE));
      const padVal = Math.max(1, Math.round(2 * TOMADOR_SURFACE_SCALE));
      const gridOuterWidth = 3 * this.buttonWidth + 2 * gapVal + 2 * padVal + 4;

      zeroesContainer.style.width = `${gridOuterWidth}px`;
      zeroesContainer.style.flexShrink = '0';
      zeroesContainer.style.display = 'grid';
      zeroesContainer.style.gridTemplateColumns = '1fr 1fr';
      zeroesContainer.style.padding = surfacePx(1);
      zeroesContainer.style.gap = surfacePx(1);
    }

    if (zeroesLabel) {
      zeroesLabel.style.height = `${this.buttonWidth}px`;
    }

    document.querySelectorAll('.row-zeroes .key-btn').forEach(btn => {
      btn.style.height = `${this.buttonWidth}px`;
      const fontSize = Math.max(0.8, Math.min(1.5, this.buttonWidth * 0.028));
      btn.style.fontSize = `${fontSize}rem`;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
    });

    const keypadGridContainer = document.getElementById('keypad-grid-container');
    if (keypadGridContainer) {
      keypadGridContainer.style.width = '100%';
      keypadGridContainer.style.maxWidth = 'none';
      keypadGridContainer.style.alignItems = 'stretch';
      keypadGridContainer.style.gap = surfacePx(5);
    }

    if (this._dom.numberGrid) {
      this._dom.numberGrid.style.width = '100%';
      this._dom.numberGrid.style.display = 'flex';
      this._dom.numberGrid.style.flexDirection = 'column';
      this._dom.numberGrid.style.gap = surfacePx(5);
      this._dom.numberGrid.style.minHeight = '0';
      this._dom.numberGrid.style.flex = '1';
    }
  }

  setupEventListeners() {
    this._bindZeroButtons();
    this._bindInputModeToggle();
    this._bindInputWheelEvents();
    this._bindPanoScaleSlider();
  }

  setupSessionInputs() {
    this.resetSessionInputs();
    this._applySessionToTracker(this._storedState.session);
    this._bindSessionInputChanges(this._dom.sessionInputs);
  }

  _handleNumberClick(numStr) {
    if (this.onSpinAdded) this.onSpinAdded(numStr);
    const btn = document.querySelector(`.key-btn[data-num="${numStr}"]`);
    if (btn) {
      btn.classList.add('hit-flash');
      setTimeout(() => btn.classList.remove('hit-flash'), 200);
    }
  }

  _updateHighlights() {
    const settings = this.tracker.settings;
    const totalSpins = this.tracker.getSpins().length;
    if (settings.showHighlights === false) {
      this.clearHighlights();
      return;
    }
    if (totalSpins === 0) {
      this.clearHighlights();
      return;
    }

    const highlightState = this._buildHighlightState();

    document.querySelectorAll('.key-btn[data-num]').forEach(btn => {
      this._applyHighlightToButton(btn, highlightState);
    });
  }

  update() {
    this.resetSessionInputs();
    this._syncModeUI();
    this._syncVisibility();
    this._syncArrowStates();
    this._syncHistoryPanel();
    this._syncSeriesPanel();
    if (this.mode === 'wheel') {
      this._renderInputWheel();
    }
    this._updateHighlights();
  }

  setMode(mode) {
    if (mode !== 'grid' && mode !== 'wheel') return false;
    if (this.mode === mode) return false;
    this.mode = mode;
    this._syncModeUI();
    if (mode === 'wheel') {
      this._renderInputWheel();
    }
    void tomadorStateStore.setMode(mode);
    return true;
  }

  resetSessionInputs() {
    this._syncSessionInputs(this._dom.sessionInputs || this._getSessionInputs());
  }

  setupKeypadPanel() {
    const panel = document.getElementById('keypad-panel-draggable');
    const header = document.getElementById('keypad-panel-header');

    if (!panel || !header) return;

    this._bindKeypadPanelEvents(panel, header);
  }

  setupHistoryPanel() {
    const panel = this._dom.historyPanel;
    const header = this._dom.historyHeader;

    if (!panel || !header) return;

    this._bindHistoryPanelEvents(panel, header);
    this._bindHistoryPanelInteractions();
    this._applyStoredHistoryPanelState();
    this._syncHistoryPanel();
  }

  setupSessionPanel() {
    const panel = document.getElementById('session-panel-draggable');
    const header = document.getElementById('session-panel-header');

    if (!panel || !header) return;

    this._bindSessionPanelEvents(panel, header);
  }

  destroy() {
    if (this._dom.btnToggleInput) this._dom.btnToggleInput.onclick = null;
    if (this._dom.inputWheelRotation) this._dom.inputWheelRotation.oninput = null;
    if (this._dom.inputWheelContainer) this._dom.inputWheelContainer.onclick = null;
    if (this._dom.btnExportSession) this._dom.btnExportSession.onclick = null;
    if (this._dom.historyHeader) this._dom.historyHeader.onmousedown = null;

    const sessionHeader = document.getElementById('session-panel-header');
    if (sessionHeader) sessionHeader.onmousedown = null;

    const keypadHeader = document.getElementById('keypad-panel-header');
    if (keypadHeader) keypadHeader.onmousedown = null;

    if (this._keypadPanelDrag) {
      const { onMove, onUp, onBeforeUnload, resizeObserver } = this._keypadPanelDrag;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (resizeObserver) resizeObserver.disconnect();
      this._keypadPanelDrag = null;
    }

    if (this._historyPanelDrag) {
      const { onMove, onUp, onBeforeUnload, resizeObserver } = this._historyPanelDrag;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (resizeObserver) resizeObserver.disconnect();
      this._historyPanelDrag = null;
    }
    if (this._sessionPanelDrag) {
      const { onMove, onUp, onBeforeUnload, resizeObserver } = this._sessionPanelDrag;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (resizeObserver) resizeObserver.disconnect();
      this._sessionPanelDrag = null;
    }
    if (this._seriesPanelDrag) {
      const { onMove, onUp, onBeforeUnload, resizeObserver } = this._seriesPanelDrag;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (resizeObserver) resizeObserver.disconnect();
      this._seriesPanelDrag = null;
    }
    if (this._dom.seriesHeader) this._dom.seriesHeader.onmousedown = null;
    if (this._dom.btnSortSeries) this._dom.btnSortSeries.onclick = null;
    if (this._dom.btnSortSeriesHistorial) this._dom.btnSortSeriesHistorial.onclick = null;
    if (this._historyPanelHandlers) {
      const { onHistoryClick, onEditSave, onEditCancel, onEditBackdrop } = this._historyPanelHandlers;
      if (this._dom.historyList) this._dom.historyList.removeEventListener('click', onHistoryClick);
      if (this._dom.editSaveBtn) this._dom.editSaveBtn.removeEventListener('click', onEditSave);
      if (this._dom.editCancelBtn) this._dom.editCancelBtn.removeEventListener('click', onEditCancel);
      if (this._dom.editModal) this._dom.editModal.removeEventListener('click', onEditBackdrop);
      this._historyPanelHandlers = null;
    }
    const inputs = this._dom.sessionInputs || {};
    Object.values(inputs).forEach(el => {
      if (el) el.oninput = null;
    });
  }

  _ensureKeypadGridContainer(numberGrid) {
    let gridContainer = document.getElementById('keypad-grid-container');
    if (!gridContainer) {
      gridContainer = document.createElement('div');
      gridContainer.id = 'keypad-grid-container';
      gridContainer.style.width = '100%';
      gridContainer.style.display = 'flex';
      gridContainer.style.flexDirection = 'column';
      gridContainer.style.gap = surfacePx(5);
      gridContainer.style.alignItems = 'stretch';
      numberGrid.prepend(gridContainer);
    }
    return gridContainer;
  }

  _createDozenBoxes() {
    return [
      this._createDozenBox(1, '[1st 12]'),
      this._createDozenBox(2, '[2nd 12]'),
      this._createDozenBox(3, '[3rd 12]')
    ];
  }

  _createDozenBox(id, labelTitle) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = surfacePx(4);
    container.style.width = '100%';
    container.style.maxWidth = 'none';
    container.style.alignItems = 'center';

    const gapVal = Math.max(1, Math.round(2 * TOMADOR_SURFACE_SCALE));
    const padVal = Math.max(1, Math.round(2 * TOMADOR_SURFACE_SCALE));
    const gridOuterWidth = 3 * this.buttonWidth + 2 * gapVal + 2 * padVal + 4;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(3, ${this.buttonWidth}px)`;
    grid.style.gap = surfacePx(2);
    grid.style.width = `${gridOuterWidth}px`;
    grid.style.flexShrink = '0';
    grid.style.border = `2px solid ${TOMADOR_SURFACE_COLORS.clothBorder}`;
    grid.style.borderRadius = surfacePx(4);
    grid.style.padding = surfacePx(2);
    grid.style.background = TOMADOR_SURFACE_COLORS.clothBackground;

    const label = document.createElement('div');
    label.className = 'key-btn key-dozen';
    label.textContent = labelTitle;
    label.style.width = '30px';
    label.style.fontSize = '0.55rem';
    label.style.flexShrink = '0';
    /* =========================================================================
       [CÁLCULO DE LA ALTURA DE LA DOCENA EN EL PAÑO]
       - Se ajusta automáticamente según la escala seleccionada en el slider (this.buttonWidth)
       - Fórmula: 4 botones + espacio entre ellos (gapVal) + bordes internos (padVal).
       ========================================================================= */
    label.style.height = `${4 * this.buttonWidth + 3 * gapVal + 2 * padVal}px`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'center';
    label.style.writingMode = 'vertical-rl';
    label.style.textTransform = 'uppercase';
    label.style.opacity = '0.8';

    const arrow = document.createElement('div');
    arrow.id = `arrow-d${id}`;
    arrow.innerHTML = '←';
    arrow.style.color = TOMADOR_COLORS.white;
    arrow.style.fontSize = '1.2rem';
    arrow.style.width = 'auto';
    arrow.style.minWidth = '65px';
    arrow.style.flexShrink = '0';
    arrow.style.textAlign = 'left';
    arrow.style.fontWeight = 'bold';
    arrow.style.marginLeft = '5px';

    this._dozenArrows[`d${id}`] = arrow;
    this._dozenGrids[`d${id}`] = grid;

    container.appendChild(grid);
    container.appendChild(label);
    container.appendChild(arrow);
    return { container, grid };
  }

  _createNumberButton(numStr) {
    const btn = document.createElement('button');
    const color = RED_NUMBERS.includes(numStr) ? 'red' : 'black';

    btn.className = `key-btn key-${color}`;
    btn.dataset.num = numStr;
    btn.textContent = numStr;
    /* =========================================================================
       [TAMAÑO Y ESCALA DE LOS NÚMEROS INDIVIDUALES DEL PAÑO]
       - width / height: Ancho y alto de cada botón de número, igual a this.buttonWidth.
       - fontSize: Tamaño de letra dinámico proporcional al tamaño del botón.
         Si deseas números más grandes o pequeños, puedes modificar el multiplicador '0.028'.
       ========================================================================= */
    btn.style.height = `${this.buttonWidth}px`;
    btn.style.width = `${this.buttonWidth}px`;
    const fontSize = Math.max(0.8, Math.min(1.5, this.buttonWidth * 0.028));
    btn.style.fontSize = `${fontSize}rem`;
    btn.style.position = 'relative';
    btn.addEventListener('click', () => this._handleNumberClick(numStr));

    return btn;
  }

  _bindZeroButtons() {
    document.querySelectorAll('.row-zeroes .key-btn').forEach(btn => {
      btn.onclick = () => this._handleNumberClick(btn.dataset.num);
    });
  }

  _bindPanoScaleSlider() {
    const slider = document.getElementById('input-pano-scale');
    const label = document.getElementById('pano-scale-value');
    if (!slider) return;

    slider.value = this.buttonWidth;
    if (label) label.textContent = `${this.buttonWidth}px`;

    slider.oninput = (e) => {
      const val = parseInt(e.target.value, 10);
      if (label) label.textContent = `${val}px`;

      /* =========================================================================
         [ACTUALIZACIÓN EN TIEMPO REAL DESDE EL SLIDER]
         - Asigna el tamaño en píxeles (val) al ancho de botón actual (this.buttonWidth).
         - Guarda el estado en IndexedDB y vuelve a renderizar el paño e historial.
         ========================================================================= */
      this.buttonWidth = val;
      this._storedState.panoScale = val;
      void tomadorStateStore.setPanoScale(val);
      this.renderKeypad();
      this._syncHistoryPanel();
    };
  }

  _bindInputModeToggle() {
    const btnToggle = this._dom.btnToggleInput;
    if (!btnToggle) return;

    btnToggle.onclick = () => {
      const nextMode = this.mode === 'grid' ? 'wheel' : 'grid';
      this.setMode(nextMode);
    };
  }

  _bindInputWheelEvents() {
    if (this._dom.inputWheelRotation) {
      this._dom.inputWheelRotation.oninput = (e) => {
        const deg = e.target.value;
        const group = document.getElementById('input-wheel-svg-group');
        if (group) group.style.transform = `rotate(${deg}deg)`;
      };
    }

    if (this._dom.inputWheelContainer) {
      this._dom.inputWheelContainer.onclick = (e) => {
        const target = e.target;
        if (target && target.classList && target.classList.contains('wheel-input-btn')) {
          const num = target.getAttribute('data-num');
          this._handleNumberClick(num);
          target.style.opacity = '0.5';
          setTimeout(() => {
            target.style.opacity = '1';
          }, 150);
        }
      };
    }
  }

  _getSessionInputs() {
    return {
      casino: document.getElementById('session-casino'),
      crupier: document.getElementById('session-crupier'),
      table: document.getElementById('session-table')
    };
  }

  _syncSessionInputs(inputs) {
    if (inputs.casino) inputs.casino.value = this.tracker.settings.casinoName || '';
    if (inputs.crupier) inputs.crupier.value = this.tracker.settings.crupierName || '';
    if (inputs.table) inputs.table.value = this.tracker.settings.tableName || '';
  }

  _bindSessionInputChanges(inputs) {
    Object.entries(inputs).forEach(([key, el]) => {
      if (!el) return;
      el.oninput = () => {
        const sessionPatch = { [`${key}Name`]: el.value };
        this._applySessionToTracker(sessionPatch);
        void tomadorStateStore.setSession(this._storedState.session);
      };
    });
  }

  _applySessionToTracker(sessionPatch = {}) {
    const nextSession = {
      casinoName: this.tracker.settings.casinoName || '',
      crupierName: this.tracker.settings.crupierName || '',
      tableName: this.tracker.settings.tableName || '',
      ...sessionPatch,
    };

    this.tracker.updateSettings(nextSession);
    this._storedState = {
      ...this._storedState,
      session: {
        ...this._storedState.session,
        ...nextSession,
      },
    };
  }

  _applyStoredState() {
    if (this._storedState.session) {
      this._applySessionToTracker(this._storedState.session);
      this.resetSessionInputs();
    }
  }

  async _hydrateStoredState() {
    const state = await tomadorStateStore.load();
    this._storedState = state;

    if (state.mode) {
      this.mode = state.mode;
    }
    if (state.panoScale) {
      this.buttonWidth = state.panoScale;
      const slider = document.getElementById('input-pano-scale');
      const label = document.getElementById('pano-scale-value');
      if (slider) slider.value = state.panoScale;
      if (label) label.textContent = `${state.panoScale}px`;
      this.renderKeypad();
    }
  }

  _createColumnArrowsRow() {
    const numberGrid = this._dom.numberGrid;
    if (!numberGrid) return null;

    const arrowRow = document.createElement('div');
    arrowRow.id = 'column-arrows-row';
    arrowRow.style.display = 'flex';
    arrowRow.style.width = '100%';
    arrowRow.style.maxWidth = 'none';
    arrowRow.style.marginTop = '2px';
    arrowRow.style.marginBottom = '8px';
    arrowRow.style.overflow = 'visible';
    arrowRow.style.alignItems = 'center';
    arrowRow.style.gap = `${surfacePx(4)}px`;

    const gapVal = Math.max(1, Math.round(2 * TOMADOR_SURFACE_SCALE));
    const padVal = Math.max(1, Math.round(2 * TOMADOR_SURFACE_SCALE));
    const arrowGridWidth = 3 * this.buttonWidth + 2 * gapVal;

    const arrowGrid = document.createElement('div');
    arrowGrid.style.display = 'grid';
    arrowGrid.style.gridTemplateColumns = `repeat(3, ${this.buttonWidth}px)`;
    arrowGrid.style.gap = surfacePx(2);
    arrowGrid.style.width = `${arrowGridWidth}px`;
    arrowGrid.style.flexShrink = '0';
    arrowGrid.style.paddingLeft = `${2 + padVal}px`;
    arrowGrid.style.boxSizing = 'content-box';

    for (let i = 0; i < 3; i++) {
      const arrow = document.createElement('div');
      arrow.innerHTML = '↑';
      arrow.style.color = COLUMN_ARROW_COLORS[i];
      arrow.style.fontSize = '1.8rem';
      arrow.style.textAlign = 'center';
      arrow.style.fontWeight = 'bold';
      arrow.style.textShadow = `0 0 5px ${COLUMN_ARROW_COLORS[i]}44`;
      arrow.style.display = 'flex';
      arrow.style.flexDirection = 'column';
      arrow.style.alignItems = 'center';
      this._columnArrows['c' + (i + 1)] = arrow;
      arrowGrid.appendChild(arrow);
    }

    const colLabel = document.createElement('div');
    colLabel.className = 'key-btn key-dozen';
    colLabel.textContent = '[Columnas]';
    colLabel.style.width = '30px';
    colLabel.style.fontSize = '0.55rem';
    colLabel.style.flexShrink = '0';
    colLabel.style.height = `${this.buttonWidth}px`;
    colLabel.style.display = 'flex';
    colLabel.style.alignItems = 'center';
    colLabel.style.justifyContent = 'center';
    colLabel.style.writingMode = 'vertical-rl';
    colLabel.style.textTransform = 'uppercase';
    colLabel.style.opacity = '0.8';
    colLabel.style.marginLeft = '4px';

    const colArrowPlaceholder = document.createElement('div');
    colArrowPlaceholder.style.width = 'auto';
    colArrowPlaceholder.style.minWidth = '65px';
    colArrowPlaceholder.style.flexShrink = '0';
    colArrowPlaceholder.style.marginLeft = '5px';

    arrowRow.appendChild(arrowGrid);
    arrowRow.appendChild(colLabel);
    arrowRow.appendChild(colArrowPlaceholder);
    return arrowRow;
  }

  _syncModeUI() {
    const grid = this._dom.inputModeGrid;
    const wheel = this._dom.inputModeWheel;
    const btnToggle = this._dom.btnToggleInput;
    const scaleGroup = document.getElementById('pano-scale-control-group');

    if (grid && wheel) {
      const isGrid = this.mode === 'grid';
      grid.style.display = isGrid ? 'flex' : 'none';
      wheel.style.display = isGrid ? 'none' : 'flex';
      if (scaleGroup) {
        scaleGroup.style.display = isGrid ? 'flex' : 'none';
      }
    }

    if (btnToggle) {
      btnToggle.textContent = this.mode === 'grid' ? 'Modo Cilindro' : 'Modo Paño';
    }
  }

  _renderInputWheel() {
    const container = this._dom.inputWheelContainer;
    if (!container) return;

    const existingGroup = document.getElementById('input-wheel-svg-group');
    if (existingGroup) return;

    const totalSlices = 38;
    const sliceAngle = 360 / totalSlices;
    const cx = 150;
    const cy = 150;
    const rOuter = 140;
    const rInner = 85;

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
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      return [
        'M', startOuter.x, startOuter.y,
        'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        'L', endInner.x, endInner.y,
        'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        'Z'
      ].join(' ');
    };

    const currentRotation = this._dom.inputWheelRotation ? this._dom.inputWheelRotation.value : 0;
    let svgHtml = `<svg viewBox="-20 -20 340 340" width="100%" height="100%">`;
    
    // Definición de gradiente radial dorado metálico para las esferas 3D
    svgHtml += `
      <defs>
        <radialGradient id="gold-gradient" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fff5cc" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="${TOMADOR_COLORS.gold}"/>
          <stop offset="85%" stop-color="#ab8211"/>
          <stop offset="100%" stop-color="#694f06"/>
        </radialGradient>
      </defs>
    `;

    svgHtml += `<g id="input-wheel-svg-group" style="transform-origin: 150px 150px; transform: rotate(${currentRotation}deg); transition: transform 0.1s linear;">`;

    const offsetAngle = sliceAngle / 2;
    for (let i = 0; i < totalSlices; i++) {
      const num = AMERICAN_WHEEL_ORDER[i];
      const startAngle = (i * sliceAngle) - offsetAngle + 180;
      const endAngle = ((i + 1) * sliceAngle) - offsetAngle + 180;

      const c = getColor(num);
      let baseColor = TOMADOR_COLORS.wheelDark;
      if (c === 'red') baseColor = TOMADOR_COLORS.red;
      else if (c === 'green') baseColor = TOMADOR_COLORS.green;

      svgHtml += `<path class="wheel-input-btn" data-num="${num}" d="${describeArc(cx, cy, rInner, rOuter, startAngle, endAngle)}" fill="${baseColor}" stroke="${TOMADOR_SURFACE_COLORS.wheelStroke}" stroke-width="1.5" style="cursor: pointer; transition: opacity 0.1s;" />`;

      const textRadius = (rInner + rOuter) / 2;
      const textAngle = startAngle + (sliceAngle / 2);
      const textPos = polarToCartesian(cx, cy, textRadius, textAngle);
      svgHtml += `
        <text class="wheel-input-btn" data-num="${num}" transform="translate(${textPos.x}, ${textPos.y}) rotate(${textAngle}) scale(1, 1.2)" fill="${TOMADOR_SURFACE_COLORS.wheelText}" font-size="13" font-family="Arial, sans-serif" font-weight="900"
              text-anchor="middle" dominant-baseline="middle"
              style="cursor: pointer; pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
          ${num}
        </text>`;
    }

    svgHtml += `</g>`;

    // --- DETALLE DE LA ZONA CENTRAL Y DIVISIÓN INTERNA ---

    // Fondo del centro del plato
    svgHtml += `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="${TOMADOR_SURFACE_COLORS.wheelCenterFill}" stroke="${TOMADOR_SURFACE_COLORS.wheelCenterStroke}" stroke-width="2"/>`;
    
    // 8 líneas radiales divisorias en la zona interna (de r=14 a r=rInner)
    for (let j = 0; j < 8; j++) {
      const angleDeg = j * 45;
      const angleRad = (angleDeg - 90) * Math.PI / 180;
      const xStart = cx + 14 * Math.cos(angleRad);
      const yStart = cy + 14 * Math.sin(angleRad);
      const xEnd = cx + rInner * Math.cos(angleRad);
      const yEnd = cy + rInner * Math.sin(angleRad);
      svgHtml += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="${TOMADOR_COLORS.gold}" stroke-width="1" stroke-opacity="0.25" pointer-events="none"/>`;
    }

    // División interna (anillo dorado intermedio que separa la torreta de los textos)
    svgHtml += `<circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="${TOMADOR_COLORS.gold}" stroke-width="1.5" stroke-opacity="0.35"/>`;
    
    // Textos "TOCA NÚMERO" en el anillo intermedio
    svgHtml += `<text x="${cx}" y="${cy - 66}" fill="${TOMADOR_COLORS.gold}" font-weight="900" font-size="9" letter-spacing="2" text-anchor="middle" dominant-baseline="middle" style="opacity: 0.85; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">TOCA</text>`;
    svgHtml += `<text x="${cx}" y="${cy + 68}" fill="${TOMADOR_COLORS.gold}" font-weight="900" font-size="9" letter-spacing="2" text-anchor="middle" dominant-baseline="middle" style="opacity: 0.85; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">NÚMERO</text>`;
    
    // Torreta de ruleta real (Spindle dorado de 8 brazos)
    // 4 radios diagonales finos con bolitas terminales
    svgHtml += `<line x1="${cx}" y1="${cy}" x2="${cx + 34}" y2="${cy - 34}" stroke="${TOMADOR_COLORS.gold}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    svgHtml += `<line x1="${cx}" y1="${cy}" x2="${cx + 34}" y2="${cy + 34}" stroke="${TOMADOR_COLORS.gold}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    svgHtml += `<line x1="${cx}" y1="${cy}" x2="${cx - 34}" y2="${cy + 34}" stroke="${TOMADOR_COLORS.gold}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    svgHtml += `<line x1="${cx}" y1="${cy}" x2="${cx - 34}" y2="${cy - 34}" stroke="${TOMADOR_COLORS.gold}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    
    svgHtml += `<circle cx="${cx + 34}" cy="${cy - 34}" r="2" fill="${TOMADOR_COLORS.gold}"/>`;
    svgHtml += `<circle cx="${cx + 34}" cy="${cy + 34}" r="2" fill="${TOMADOR_COLORS.gold}"/>`;
    svgHtml += `<circle cx="${cx - 34}" cy="${cy + 34}" r="2" fill="${TOMADOR_COLORS.gold}"/>`;
    svgHtml += `<circle cx="${cx - 34}" cy="${cy - 34}" r="2" fill="${TOMADOR_COLORS.gold}"/>`;

    // 4 brazos principales gruesos (N, S, E, O)
    svgHtml += `<rect x="${cx - 2}" y="${cy - 41}" width="4" height="27" fill="${TOMADOR_COLORS.gold}" rx="1"/>`;
    svgHtml += `<rect x="${cx - 2}" y="${cy + 14}" width="4" height="27" fill="${TOMADOR_COLORS.gold}" rx="1"/>`;
    svgHtml += `<rect x="${cx - 41}" y="${cy - 2}" width="27" height="4" fill="${TOMADOR_COLORS.gold}" rx="1"/>`;
    svgHtml += `<rect x="${cx + 14}" y="${cy - 2}" width="27" height="4" fill="${TOMADOR_COLORS.gold}" rx="1"/>`;
    
    // Bolas doradas 3D en los extremos de los radios principales
    svgHtml += `<circle cx="${cx}" cy="${cy - 41}" r="5.5" fill="url(#gold-gradient)" stroke="#9c760e" stroke-width="1"/>`;
    svgHtml += `<circle cx="${cx}" cy="${cy + 41}" r="5.5" fill="url(#gold-gradient)" stroke="#9c760e" stroke-width="1"/>`;
    svgHtml += `<circle cx="${cx - 41}" cy="${cy}" r="5.5" fill="url(#gold-gradient)" stroke="#9c760e" stroke-width="1"/>`;
    svgHtml += `<circle cx="${cx + 41}" cy="${cy}" r="5.5" fill="url(#gold-gradient)" stroke="#9c760e" stroke-width="1"/>`;

    // Núcleo / Hub central dorado con brillo
    svgHtml += `<circle cx="${cx}" cy="${cy}" r="14" fill="${TOMADOR_COLORS.gold}" stroke="#9c760e" stroke-width="1.5"/>`;
    svgHtml += `<circle cx="${cx}" cy="${cy}" r="6" fill="#fcf0c0"/>`;

    // Líneas del cursor/punto de mira
    const rCross = 165;
    svgHtml += `<line x1="${cx}" y1="${cy - rCross}" x2="${cx}" y2="${cy + rCross}" stroke="${TOMADOR_SURFACE_COLORS.wheelCross}" stroke-width="3" stroke-opacity="0.8" pointer-events="none"/>`;
    svgHtml += `<line x1="${cx - rCross}" y1="${cy}" x2="${cx + rCross}" y2="${cy}" stroke="${TOMADOR_SURFACE_COLORS.wheelCross}" stroke-width="3" stroke-opacity="0.8" pointer-events="none"/>`;
    
    // Indicador N superior (Norte)
    svgHtml += `<text x="${cx}" y="-10" fill="${TOMADOR_SURFACE_COLORS.wheelHint}" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">N</text>`;
    svgHtml += `<line x1="${cx}" y1="-2" x2="${cx}" y2="15" stroke="${TOMADOR_SURFACE_COLORS.wheelHint}" stroke-width="3"/>`;
    svgHtml += `</svg>`;

    container.innerHTML = svgHtml;
  }

  _syncVisibility() {
    const settings = this.tracker.settings;

    if (this._dom.rowZeroes) {
      this._dom.rowZeroes.style.display = settings.showZeroes === false ? 'none' : 'flex';
    }

    if (this._dom.btnClearData) {
      this._dom.btnClearData.style.display = settings.showClear === false ? 'none' : 'block';
    }

    const colArrowRow = document.getElementById('column-arrows-row');
    if (colArrowRow) {
      colArrowRow.style.display = settings.showColumnDelays === false ? 'none' : 'flex';
    }

    [1, 2, 3].forEach(n => {
      const arrow = this._dozenArrows['d' + n];
      if (arrow) {
        arrow.style.visibility = settings.showDozenDelays === false ? 'hidden' : 'visible';
      }
    });
  }

  _buildHighlightState() {
    const dDelays = [1, 2, 3].map(n => this.tracker.getDozenDelay(n));
    const cDelays = [1, 2, 3].map(n => this.tracker.getColumnDelay(n));

    return {
      maxDozDelay: Math.max(...dDelays),
      maxColDelay: Math.max(...cDelays)
    };
  }

  _syncArrowStates() {
    const settings = this.tracker.settings;

    const c1Delay = this.tracker.getColumnDelay(1);
    const c2Delay = this.tracker.getColumnDelay(2);
    const c3Delay = this.tracker.getColumnDelay(3);
    const maxColDelay = Math.max(c1Delay, c2Delay, c3Delay);

    [1, 2, 3].forEach(n => {
      const arrow = this._columnArrows['c' + n];
      if (!arrow) return;
      const delay = this.tracker.getColumnDelay(n);
      const max = this.tracker.getColumnMaxDelay(n);
      const isMostDelayed = (settings.showHighlights !== false && maxColDelay > 0 && delay === maxColDelay);
      const style = getColumnArrowStyle({ delay, maxDelay: max, mostDelayed: isMostDelayed });
      arrow.style.color = style.color;
      arrow.style.textShadow = style.textShadow;

      // =========================================================================
      // CONTROL DE TAMAÑO DE LAS FLECHAS DE LAS COLUMNAS:
      // - Flecha (↑): Actualmente es '1.8rem'. Puedes aumentarla (ej: '2.5rem') o disminuirla.
      // - Paréntesis (delay/max): Actualmente es '0.75rem'. Puedes cambiarlo (ej: '1.0rem').
      // =========================================================================
      const tamanoFlechaCol = '1.0rem';       // Modifica aquí para cambiar el tamaño de la flecha ↑
      const tamanoParentesisCol = '0.60rem';  // Modifica aquí para cambiar el tamaño de los números (delay/max)

      arrow.innerHTML = `<span style="font-size:${tamanoFlechaCol}; line-height: 1; vertical-align: middle; display: inline-block;">↑</span><span style="font-size:${tamanoParentesisCol}; vertical-align: middle; font-weight: bold;">(${delay}/${max})</span>`;
    });

    const d1Delay = this.tracker.getDozenDelay(1);
    const d2Delay = this.tracker.getDozenDelay(2);
    const d3Delay = this.tracker.getDozenDelay(3);
    const maxDelay = Math.max(d1Delay, d2Delay, d3Delay);

    [1, 2, 3].forEach(n => {
      const grid = this._dozenGrids['d' + n];
      const arrow = this._dozenArrows['d' + n];
      if (!grid) return;

      const delay = this.tracker.getDozenDelay(n);
      const max = this.tracker.getDozenMaxDelay(n);
      const isMostDelayed = (settings.showHighlights !== false && maxDelay > 0 && delay === maxDelay);
      const style = getDozenBlockStyle({ delay, maxDelay: max, mostDelayed: isMostDelayed });
      grid.style.borderColor = style.borderColor;
      grid.style.boxShadow = style.boxShadow;
      if (arrow) arrow.style.color = style.arrowColor;

      if (arrow) {
        // =========================================================================
        // CONTROL DE TAMAÑO DE LAS FLECHAS DE LAS DOCENAS:
        // - Flecha (←): Actualmente es '1.7rem'. Puedes aumentarla (ej: '2.0rem') o disminuirla.
        // - Paréntesis (delay/max): Actualmente es '0.85rem'. Puedes cambiarlo (ej: '1.0rem').
        // =========================================================================
        const tamanoFlecha = '2.0rem';       // Modifica aquí para cambiar el tamaño de la flecha ←
        const tamanoParentesis = '0.65rem';  // Modifica aquí para cambiar el tamaño de los números (delay/max)

        arrow.innerHTML = `<span style="font-size: ${tamanoFlecha}; line-height: 1; vertical-align: middle; display: inline-block; margin-right: 4px; transform: translateY(-1px);">←</span><span style="font-size: ${tamanoParentesis}; vertical-align: middle; font-weight: bold;">(${delay}/${max})</span>`;
        arrow.style.whiteSpace = 'nowrap';
      }
    });
  }

  _applyHighlightToButton(btn, highlightState) {
    const numStr = btn.dataset.num;
    const n = parseInt(numStr, 10);
    if (Number.isNaN(n) && numStr !== '0' && numStr !== '00') return;

    const numDelay = this.tracker.getNumberDelay(numStr);
    const numMaxDelay = this.tracker.getNumberMaxDelay(numStr);

    let col = 0;
    let doz = 0;
    if (numStr !== '0' && numStr !== '00') {
      col = n % 3 === 1 ? 1 : (n % 3 === 2 ? 2 : 3);
      doz = Math.ceil(n / 12);
    }

    const colDelay = col > 0 ? this.tracker.getColumnDelay(col) : -1;
    const dozDelay = doz > 0 ? this.tracker.getDozenDelay(doz) : -1;
    const isColPurple = col > 0 && highlightState.maxColDelay > 0 && colDelay === highlightState.maxColDelay;
    const isDozPurple = doz > 0 && highlightState.maxDozDelay > 0 && dozDelay === highlightState.maxDozDelay;
    const isNumPurple = numMaxDelay > 0 && numDelay === numMaxDelay;
    const isColYellow = col > 0 && colDelay === 0;
    const isDozYellow = doz > 0 && dozDelay === 0;
    const isNumHot = numMaxDelay > 0 && numDelay === numMaxDelay;

    this._resetHighlightBase(btn);
    const style = getNumberHighlightStyle({
      isColPurple,
      isDozPurple,
      isNumPurple,
      isColYellow,
      isDozYellow,
      isNumHot,
    });

    if (!style) return;

    Object.assign(btn.style, style);
  }

  _resetHighlightBase(btn) {
    btn.style.border = 'none';
    btn.style.boxShadow = '0 2px 0 rgba(0,0,0,0.5)';
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.style.zIndex = '1';
  }

  clearHighlights() {
    document.querySelectorAll('.key-btn[data-num]').forEach(btn => {
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.border = '';
      btn.style.boxShadow = '';
      btn.style.zIndex = '';
    });
  }

  _bindKeypadPanelEvents(panel, header) {
    const isKeypadPanelVisible = () => {
      if (!panel.isConnected) return false;
      const rect = panel.getBoundingClientRect();
      const computed = window.getComputedStyle(panel);
      return rect.width > 0 && rect.height > 0 && computed.display !== 'none' && computed.visibility !== 'hidden';
    };

    const applyKeypadPanelState = (state) => {
      if (!state) return;

      try {
        const { left, top, width, height } = state;
        if (width != null) panel.style.width = width;
        if (height != null) panel.style.height = height;
        const rect = panel.getBoundingClientRect();
        const panelWidth = rect.width || parseInt(width, 10) || 460;
        const panelHeight = rect.height || parseInt(height, 10) || 640;
        const maxLeft = Math.max(0, window.innerWidth - panelWidth - 8);
        const maxTop = Math.max(0, window.innerHeight - panelHeight - 8);
        if (left != null) {
          const parsedLeft = parseInt(left, 10);
          panel.style.left = `${Math.max(0, Math.min(Number.isFinite(parsedLeft) ? parsedLeft : 20, maxLeft))}px`;
        }
        if (top != null) {
          const parsedTop = parseInt(top, 10);
          panel.style.top = `${Math.max(0, Math.min(Number.isFinite(parsedTop) ? parsedTop : 100, maxTop))}px`;
        }
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.position = 'fixed';
        panel.style.zIndex = '1000';
      } catch (e) {
        console.warn('No se pudo restaurar el keypad panel:', e);
      }
    };

    const persistKeypadPanelState = () => {
      if (!isKeypadPanelVisible()) return;

      const rect = panel.getBoundingClientRect();
      const state = {
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.top)}px`,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`
      };

      applyKeypadPanelState(state);
      this._storedState = {
        ...this._storedState,
        keypadPanel: state
      };
      void tomadorStateStore.update({ keypadPanel: state });
    };

    const scheduleSaveKeypadPanelState = (() => {
      let rafId = 0;
      return () => {
        if (!isKeypadPanelVisible()) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          persistKeypadPanelState();
        });
      };
    })();

    const snapshot = this._storedState.keypadPanel;
    applyKeypadPanelState(snapshot);

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      scheduleSaveKeypadPanelState();
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.opacity = '1';
      panel.style.transition = 'box-shadow 0.3s ease';
      persistKeypadPanelState();
    };

    const onBeforeUnload = () => persistKeypadPanelState();

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button') || e.target.tagName.toLowerCase() === 'input' || e.target.closest('input')) return;
      isDragging = true;
      panel.style.transition = 'none';
      panel.style.position = 'fixed';

      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.opacity = '0.9';
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('beforeunload', onBeforeUnload);

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (!isDragging) scheduleSaveKeypadPanelState();
      });
      resizeObserver.observe(panel);
    }

    this._keypadPanelDrag = {
      onMove,
      onUp,
      onBeforeUnload,
      resizeObserver,
    };
  }

  _bindHistoryPanelEvents(panel, header) {
    const isHistoryPanelVisible = () => {
      if (!panel.isConnected) return false;
      const rect = panel.getBoundingClientRect();
      const computed = window.getComputedStyle(panel);
      return rect.width > 0 && rect.height > 0 && computed.display !== 'none' && computed.visibility !== 'hidden';
    };

    const applyHistoryPanelState = (state) => {
      if (!state) return;

      try {
        const { left, top, width, height } = state;
        if (width != null) panel.style.width = width;
        if (height != null) panel.style.height = height;
        const rect = panel.getBoundingClientRect();
        const panelWidth = rect.width || parseInt(width, 10) || 400;
        const panelHeight = rect.height || parseInt(height, 10) || 500;
        const maxLeft = Math.max(0, window.innerWidth - panelWidth - 8);
        const maxTop = Math.max(0, window.innerHeight - panelHeight - 8);
        if (left != null) {
          const parsedLeft = parseInt(left, 10);
          panel.style.left = `${Math.max(0, Math.min(Number.isFinite(parsedLeft) ? parsedLeft : 20, maxLeft))}px`;
        }
        if (top != null) {
          const parsedTop = parseInt(top, 10);
          panel.style.top = `${Math.max(0, Math.min(Number.isFinite(parsedTop) ? parsedTop : 100, maxTop))}px`;
        }
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.position = 'fixed';
        panel.style.zIndex = '1000';
      } catch (e) {
        console.warn('No se pudo restaurar el history panel:', e);
      }
    };

    const persistHistoryPanelState = () => {
      if (!isHistoryPanelVisible()) return;

      const rect = panel.getBoundingClientRect();
      const state = {
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.top)}px`,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`
      };

      applyHistoryPanelState(state);
      this._storedState = {
        ...this._storedState,
        historyPanel: state
      };
      void tomadorStateStore.setHistoryPanel(state);
    };

    const scheduleSaveHistoryPanelState = (() => {
      let rafId = 0;
      return () => {
        if (!isHistoryPanelVisible()) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          persistHistoryPanelState();
        });
      };
    })();

    const snapshot = this._storedState.historyPanel;
    applyHistoryPanelState(snapshot);

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      scheduleSaveHistoryPanelState();
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.opacity = '1';
      panel.style.transition = 'box-shadow 0.3s ease';
      persistHistoryPanelState();
    };

    const onBeforeUnload = () => persistHistoryPanelState();

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
      isDragging = true;
      panel.style.transition = 'none';
      panel.style.position = 'fixed';

      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.opacity = '0.9';
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('beforeunload', onBeforeUnload);

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        const rect = panel.getBoundingClientRect();
        if (rect.height && rect.height < 70) {
          panel.classList.add('collapsed-title-only');
        } else if (rect.height && rect.height >= 70) {
          panel.classList.remove('collapsed-title-only');
        }
        if (!isDragging) scheduleSaveHistoryPanelState();
      });
      resizeObserver.observe(panel);
    }

    if (this._dom.btnExportSession) {
      this._dom.btnExportSession.addEventListener('click', () => {
        this.exportSession();
      });
    }

    this._historyPanelDrag = {
      onMove,
      onUp,
      onBeforeUnload,
      resizeObserver,
    };
  }

  _bindSessionPanelEvents(panel, header) {
    const isSessionPanelVisible = () => {
      if (!panel.isConnected) return false;
      const rect = panel.getBoundingClientRect();
      const computed = window.getComputedStyle(panel);
      return rect.width > 0 && rect.height > 0 && computed.display !== 'none' && computed.visibility !== 'hidden';
    };

    const applySessionPanelState = (state) => {
      if (!state) return;

      try {
        const { left, top, width, height } = state;
        if (width != null) panel.style.width = width;
        if (height != null) panel.style.height = height;
        const rect = panel.getBoundingClientRect();
        const panelWidth = rect.width || parseInt(width, 10) || 400;
        const panelHeight = rect.height || parseInt(height, 10) || 120;
        const maxLeft = Math.max(0, window.innerWidth - panelWidth - 8);
        const maxTop = Math.max(0, window.innerHeight - panelHeight - 8);
        if (left != null) {
          const parsedLeft = parseInt(left, 10);
          panel.style.left = `${Math.max(0, Math.min(Number.isFinite(parsedLeft) ? parsedLeft : 20, maxLeft))}px`;
        }
        if (top != null) {
          const parsedTop = parseInt(top, 10);
          panel.style.top = `${Math.max(0, Math.min(Number.isFinite(parsedTop) ? parsedTop : 620, maxTop))}px`;
        }
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.position = 'fixed';
        panel.style.zIndex = '1000';
      } catch (e) {
        console.warn('No se pudo restaurar el session panel:', e);
      }
    };

    const persistSessionPanelState = () => {
      if (!isSessionPanelVisible()) return;

      const rect = panel.getBoundingClientRect();
      const state = {
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.top)}px`,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`
      };

      applySessionPanelState(state);
      this._storedState = {
        ...this._storedState,
        sessionPanel: state
      };
      void tomadorStateStore.setSessionPanel(state);
    };

    const scheduleSaveSessionPanelState = (() => {
      let rafId = 0;
      return () => {
        if (!isSessionPanelVisible()) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          persistSessionPanelState();
        });
      };
    })();

    const snapshot = this._storedState.sessionPanel;
    if (snapshot) {
      applySessionPanelState(snapshot);
    } else {
      panel.style.position = 'fixed';
      panel.style.top = '620px';
      panel.style.right = '20px';
      panel.style.left = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = '400px';
      panel.style.height = '120px';
    }

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      scheduleSaveSessionPanelState();
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.opacity = '1';
      panel.style.transition = 'box-shadow 0.3s ease';
      persistSessionPanelState();
    };

    const onBeforeUnload = () => persistSessionPanelState();

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
      isDragging = true;
      panel.style.transition = 'none';
      panel.style.position = 'fixed';

      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.opacity = '0.9';
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('beforeunload', onBeforeUnload);

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        const rect = panel.getBoundingClientRect();
        if (rect.height && rect.height < 70) {
          panel.classList.add('collapsed-title-only');
        } else if (rect.height && rect.height >= 70) {
          panel.classList.remove('collapsed-title-only');
        }
        if (!isDragging) scheduleSaveSessionPanelState();
      });
      resizeObserver.observe(panel);
    }

    this._sessionPanelDrag = {
      onMove,
      onUp,
      onBeforeUnload,
      resizeObserver,
    };
  }

  _bindHistoryPanelInteractions() {
    const historyList = this._dom.historyList;
    const editModal = this._dom.editModal;
    const editLabel = this._dom.editLabel;
    const editSelect = this._dom.editSelect;
    const editSaveBtn = this._dom.editSaveBtn;
    const editCancelBtn = this._dom.editCancelBtn;

    if (!historyList && !editModal && !editSaveBtn && !editCancelBtn) return;

    if (editSelect && editSelect.options.length === 0) {
      ROULETTE_NUMBERS.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        editSelect.appendChild(opt);
      });
    }

    const onHistoryClick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const spinId = parseInt(btn.dataset.spinId, 10);
      if (btn.dataset.action === 'delete') {
        this.tracker.deleteSpin(spinId);
        this.update();
      } else if (btn.dataset.action === 'edit') {
        this.openEditModal(spinId);
      }
    };

    const onEditSave = () => {
      if (this._editingSpinId === null) return;
      this.tracker.updateSpin(this._editingSpinId, editSelect ? editSelect.value : '');
      this.closeEditModal();
      this.update();
    };

    const onEditCancel = () => this.closeEditModal();
    const onEditBackdrop = (e) => {
      if (e.target === editModal) this.closeEditModal();
    };

    if (historyList) historyList.addEventListener('click', onHistoryClick);
    if (editSaveBtn) editSaveBtn.addEventListener('click', onEditSave);
    if (editCancelBtn) editCancelBtn.addEventListener('click', onEditCancel);
    if (editModal) editModal.addEventListener('click', onEditBackdrop);

    this._historyPanelHandlers = {
      onHistoryClick,
      onEditSave,
      onEditCancel,
      onEditBackdrop,
    };

    this._dom.editLabel = editLabel;
    this._dom.editSelect = editSelect;
  }

  openEditModal(spinId) {
    const editModal = this._dom.editModal;
    const editLabel = this._dom.editLabel;
    const editSelect = this._dom.editSelect;
    const spin = this.tracker.getSpins().find(s => s.id === spinId);
    if (!editModal || !editLabel || !editSelect || !spin) return;

    this._editingSpinId = spinId;
    editLabel.textContent = `Tirada #${spinId} — valor actual: ${spin.number}`;
    editSelect.value = spin.number;
    editModal.style.display = 'flex';
  }

  closeEditModal() {
    if (this._dom.editModal) this._dom.editModal.style.display = 'none';
    this._editingSpinId = null;
  }

  _applyStoredHistoryPanelState(state) {
    const panel = this._dom.historyPanel;
    if (!panel || !state) return;

    try {
      const { left, top, width, height } = state;
      if (width != null) panel.style.width = width;
      if (height != null) panel.style.height = height;
      const rect = panel.getBoundingClientRect();
      const panelWidth = rect.width || parseInt(width, 10) || 400;
      const panelHeight = rect.height || parseInt(height, 10) || 500;
      const maxLeft = Math.max(0, window.innerWidth - panelWidth - 8);
      const maxTop = Math.max(0, window.innerHeight - panelHeight - 8);
      if (left != null) {
        const parsedLeft = parseInt(left, 10);
        panel.style.left = `${Math.max(0, Math.min(Number.isFinite(parsedLeft) ? parsedLeft : 20, maxLeft))}px`;
      }
      if (top != null) {
        const parsedTop = parseInt(top, 10);
        panel.style.top = `${Math.max(0, Math.min(Number.isFinite(parsedTop) ? parsedTop : 100, maxTop))}px`;
      }
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.position = 'fixed';
      panel.style.zIndex = '1000';
    } catch (e) {
      console.warn('No se pudo restaurar el history panel:', e);
    }
  }

  _syncHistoryPanel() {
    const list = this._dom.historyList;
    if (!list) return;

    const spins = this.tracker.getSpins();
    if (spins.length === 0) {
      list.innerHTML = '<p class="empty-msg">No hay tiradas registradas.</p>';
      return;
    }

    const mode = this.tracker.settings.visualMode || 'analisis';
    const table = document.createElement('table');
    table.className = `history-board mode-${mode}`;

    const cellWidth = Math.max(16, Math.round(this.buttonWidth * 0.57));
    const cellFontSize = Math.max(0.55, Math.min(1.2, cellWidth * 0.0325));
    const cellStyle = `width: ${cellWidth}px; height: ${cellWidth}px; font-size: ${cellFontSize}rem; line-height: ${cellWidth}px;`;

    const thead = document.createElement('thead');
    if (mode === 'elegante') {
      thead.innerHTML = `
        <tr>
          <th class="col-seq">Seq</th>
          <th colspan="3">Resultado</th>
          <th class="col-actions"></th>
        </tr>`;
    } else if (mode === 'dozen' || mode === 'column') {
      const s = this.tracker.settings;
      thead.innerHTML = `
        <tr>
          <th class="col-seq">Seq</th>
          ${s.showColDozens !== false ? `
            <th class="col-attr">D1</th>
            <th class="col-attr">D2</th>
            <th class="col-attr">D3</th>
          ` : ''}
          ${s.showColColumns !== false ? `
            <th class="col-attr">C1</th>
            <th class="col-attr">C2</th>
            <th class="col-attr">C3</th>
          ` : ''}
          <th class="col-actions"></th>
        </tr>`;
    } else {
      const s = this.tracker.settings;
      thead.innerHTML = `
        <tr>
          <th class="col-seq">Seq</th>
          ${(s.showColZero !== false && mode !== 'dozen' && mode !== 'column') ? `<th class="col-zero">${mode === 'custom' ? '🟢' : 'Zero'}</th>` : ''}
          ${(s.showColColor !== false && mode !== 'dozen' && mode !== 'column') ? `
            <th class="col-black">${mode === 'custom' ? '⚫' : 'Negro'}</th>
            <th class="col-red">${mode === 'custom' ? '🔴' : 'Rojo'}</th>
          ` : ''}
          ${(s.showColParity !== false && mode !== 'dozen' && mode !== 'column') ? `
            <th class="col-attr">${mode === 'custom' ? '⚖️' : 'Imp'}</th>
            <th class="col-attr">${mode === 'custom' ? '⚖️' : 'Par'}</th>
          ` : ''}
          ${(s.showColRange !== false && mode !== 'dozen' && mode !== 'column') ? `
            <th class="col-attr">${mode === 'custom' ? '📏' : 'Menor'}</th>
            <th class="col-attr">${mode === 'custom' ? '📏' : 'Mayor'}</th>
          ` : ''}
          ${s.showColDozens !== false ? `
            <th class="col-attr">D1</th>
            <th class="col-attr">D2</th>
            <th class="col-attr">D3</th>
          ` : ''}
          ${s.showColColumns !== false ? `
            <th class="col-attr">C1</th>
            <th class="col-attr">C2</th>
            <th class="col-attr">C3</th>
          ` : ''}
          <th class="col-actions"></th>
        </tr>`;
    }
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const reversedSpins = [...spins].reverse().slice(0, 200);

    reversedSpins.forEach((spin, idx) => {
      const num = spin.number;
      const color = getColor(num);
      const parity = getParity(num);
      const hl = getHighLow(num);
      const dozen = getDozen(num);
      const column = getColumn(num);

      const prevSpin = reversedSpins[idx + 1];
      const dist = prevSpin ? getWheelDistance(prevSpin.number, num) : null;
      const distLabel = dist !== null ? `<span class="seq-meta seq-dist">±${dist}</span>` : '';
      const dealerLabel = spin.dealer ? `<span class="seq-meta seq-dealer">${spin.dealer}</span>` : '';
      const seqInline = `<div class="seq-inline"><span class="seq-main">${spin.id}</span>${distLabel}${dealerLabel}</div>`;

      const tr = document.createElement('tr');
      tr.dataset.spinId = spin.id;

      if (mode === 'elegante') {
        const colorClass = color === 'green' ? 'num-green' : color === 'red' ? 'num-red' : 'num-black';
        tr.innerHTML = `
          <td class="col-seq">${seqInline}</td>
          <td colspan="3">
            <div style="display:flex; align-items:center; gap:1rem; padding-left:1rem;">
              <div class="num-cell ${colorClass}" style="${cellStyle} margin:0;">${num}</div>
              <div style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">
                ${parity === 'even' ? 'Par' : 'Impar'} • ${hl === 'low' ? 'Menor' : 'Mayor'} ${dist !== null ? `• ±${dist}` : ''}
              </div>
            </div>
          </td>
          <td class="actions-cell">
            <button class="btn-hist-action" data-action="edit" data-spin-id="${spin.id}">✎</button>
            <button class="btn-hist-action delete" data-action="delete" data-spin-id="${spin.id}">✕</button>
          </td>
        `;
      } else if (mode === 'dozen' || mode === 'column') {
        const colorClass = color === 'green' ? 'num-green' : color === 'red' ? 'num-red' : 'num-black';
        const numBadge = `<div class="num-cell ${colorClass}" style="${cellStyle}">${num}</div>`;
        tr.innerHTML = `
          <td class="col-seq">${seqInline}</td>
          ${this.tracker.settings.showColDozens !== false ? `
            <td class="col-attr ${dozen === 1 ? 'active' : ''}">${dozen === 1 ? numBadge : ''}</td>
            <td class="col-attr ${dozen === 2 ? 'active' : ''}">${dozen === 2 ? numBadge : ''}</td>
            <td class="col-attr ${dozen === 3 ? 'active' : ''}">${dozen === 3 ? numBadge : ''}</td>
          ` : ''}
          ${this.tracker.settings.showColColumns !== false ? `
            <td class="col-attr ${column === 1 ? 'active' : ''}">${column === 1 ? numBadge : ''}</td>
            <td class="col-attr ${column === 2 ? 'active' : ''}">${column === 2 ? numBadge : ''}</td>
            <td class="col-attr ${column === 3 ? 'active' : ''}">${column === 3 ? numBadge : ''}</td>
          ` : ''}
          <td class="actions-cell">
            <button class="btn-hist-action" data-action="edit" data-spin-id="${spin.id}">✎</button>
            <button class="btn-hist-action delete" data-action="delete" data-spin-id="${spin.id}">✕</button>
          </td>
        `;
      } else {
        const colorClass = color === 'green' ? 'num-green' : color === 'red' ? 'num-red' : 'num-black';
        const numBadge = `<div class="num-cell ${colorClass}" style="${cellStyle}">${num}</div>`;
        tr.innerHTML = `
          <td class="col-seq">${seqInline}</td>
          ${(this.tracker.settings.showColZero !== false && mode !== 'dozen' && mode !== 'column') ? `<td class="col-zero ${num === 0 || num === '00' ? 'active' : ''}">${num === 0 || num === '00' ? numBadge : ''}</td>` : ''}
          ${(this.tracker.settings.showColColor !== false && mode !== 'dozen' && mode !== 'column') ? `
            <td class="col-black ${color === 'black' ? 'active' : ''}">${color === 'black' ? numBadge : ''}</td>
            <td class="col-red ${color === 'red' ? 'active' : ''}">${color === 'red' ? numBadge : ''}</td>
          ` : ''}
          ${(this.tracker.settings.showColParity !== false && mode !== 'dozen' && mode !== 'column') ? `
            <td class="col-attr ${parity === 'odd' ? 'active' : ''}">${parity === 'odd' ? numBadge : ''}</td>
            <td class="col-attr ${parity === 'even' ? 'active' : ''}">${parity === 'even' ? numBadge : ''}</td>
          ` : ''}
          ${(this.tracker.settings.showColRange !== false && mode !== 'dozen' && mode !== 'column') ? `
            <td class="col-attr ${hl === 'low' ? 'active' : ''}">${hl === 'low' ? numBadge : ''}</td>
            <td class="col-attr ${hl === 'high' ? 'active' : ''}">${hl === 'high' ? numBadge : ''}</td>
          ` : ''}
          ${this.tracker.settings.showColDozens !== false ? `
            <td class="col-attr ${dozen === 1 ? 'active' : ''}">${dozen === 1 ? numBadge : ''}</td>
            <td class="col-attr ${dozen === 2 ? 'active' : ''}">${dozen === 2 ? numBadge : ''}</td>
            <td class="col-attr ${dozen === 3 ? 'active' : ''}">${dozen === 3 ? numBadge : ''}</td>
          ` : ''}
          ${this.tracker.settings.showColColumns !== false ? `
            <td class="col-attr ${column === 1 ? 'active' : ''}">${column === 1 ? numBadge : ''}</td>
            <td class="col-attr ${column === 2 ? 'active' : ''}">${column === 2 ? numBadge : ''}</td>
            <td class="col-attr ${column === 3 ? 'active' : ''}">${column === 3 ? numBadge : ''}</td>
          ` : ''}
          <td class="actions-cell">
            <button class="btn-hist-action" data-action="edit" data-spin-id="${spin.id}">✎</button>
            <button class="btn-hist-action delete" data-action="delete" data-spin-id="${spin.id}">✕</button>
          </td>
        `;
      }
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    list.innerHTML = '';
    list.appendChild(table);
  }

  exportSession() {
    const spins = this.tracker.getSpins();
    if (spins.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const dataStr = spins.map(s => s.number).join('\n');
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sesion_ruleta_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  setupSeriesPanel() {
    const panel = this._dom.seriesPanel;
    const header = this._dom.seriesHeader;

    if (!panel || !header) return;

    this._bindSeriesPanelEvents(panel, header);
    this._applyStoredSeriesPanelState();
    
    // Configurar listener para ordenar
    const btnSort = this._dom.btnSortSeries;
    const btnSortHistorial = this._dom.btnSortSeriesHistorial;
    
    const updateSortUI = () => {
      if (btnSort) btnSort.textContent = this.sortMode === 'az' ? 'Orden AZ' : 'Atraso ↓';
      if (btnSort) btnSort.style.opacity = this.sortMode === 'historial' ? '0.5' : '1';
      if (btnSortHistorial) btnSortHistorial.style.opacity = this.sortMode === 'historial' ? '1' : '0.5';
    };

    if (btnSort) {
      btnSort.onclick = () => {
        if (this.sortMode === 'atraso') this.sortMode = 'az';
        else this.sortMode = 'atraso';
        updateSortUI();
        this._syncSeriesPanel();
      };
    }
    
    if (btnSortHistorial) {
      btnSortHistorial.onclick = () => {
        this.sortMode = 'historial';
        updateSortUI();
        this._syncSeriesPanel();
      };
    }
    
    updateSortUI();

    // Configurar Tooltip Global Instantáneo
    const list = this._dom.seriesList;
    if (list) {
      let tooltip = document.getElementById('global-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        document.body.appendChild(tooltip);
      }

      list.addEventListener('mouseover', (e) => {
        const pill = e.target.closest('[data-tip]');
        if (pill) {
          tooltip.innerHTML = pill.getAttribute('data-tip');
          tooltip.style.display = 'block';
          tooltip.offsetHeight; // force layout
          tooltip.style.opacity = '1';
          
          const rect = pill.getBoundingClientRect();
          tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
          tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        }
      });

      list.addEventListener('mousemove', (e) => {
        const pill = e.target.closest('[data-tip]');
        if (pill) {
          const rect = pill.getBoundingClientRect();
          const leftVal = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
          const topVal = rect.top - tooltip.offsetHeight - 8;
          
          const finalLeft = Math.max(8, Math.min(leftVal, window.innerWidth - tooltip.offsetWidth - 8));
          const finalTop = Math.max(8, Math.min(topVal, window.innerHeight - tooltip.offsetHeight - 8));
          
          tooltip.style.left = `${finalLeft}px`;
          tooltip.style.top = `${finalTop}px`;
        }
      });

      list.addEventListener('mouseout', (e) => {
        const pill = e.target.closest('[data-tip]');
        if (pill) {
          tooltip.style.opacity = '0';
          tooltip.style.display = 'none';
        }
      });
    }

    this._syncSeriesPanel();
  }

  _bindSeriesPanelEvents(panel, header) {
    const isVisible = () => {
      if (!panel.isConnected) return false;
      const rect = panel.getBoundingClientRect();
      const style = window.getComputedStyle(panel);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };

    const restore = (pos) => {
      if (pos) {
        try {
          const { left, top, width, height } = pos;
          if (width != null) panel.style.width = width;
          if (height != null) panel.style.height = height;

          const rect = panel.getBoundingClientRect();
          const w = rect.width || parseInt(width) || 330;
          const h = rect.height || parseInt(height) || 380;

          const maxLeft = Math.max(0, window.innerWidth - w - 8);
          const maxTop = Math.max(0, window.innerHeight - h - 8);

          if (left != null) {
            const leftVal = parseInt(left);
            panel.style.left = `${Math.max(0, Math.min(Number.isFinite(leftVal) ? leftVal : 500, maxLeft))}px`;
          }
          if (top != null) {
            const topVal = parseInt(top);
            panel.style.top = `${Math.max(0, Math.min(Number.isFinite(topVal) ? topVal : 250, maxTop))}px`;
          }
          panel.style.right = 'auto';
          panel.style.bottom = 'auto';
          panel.style.position = 'fixed';
          panel.style.zIndex = '1000';
        } catch (e) {
          console.warn('No se pudo restaurar el series panel:', e);
        }
      }
    };

    const save = () => {
      if (!isVisible()) return;
      const rect = panel.getBoundingClientRect();
      const pos = {
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.top)}px`,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`
      };
      restore(pos);
      this._storedState = { ...this._storedState, seriesPanel: pos };
      tomadorStateStore.setSeriesPanel(pos);
    };

    const debounceSave = (() => {
      let timer = 0;
      return () => {
        if (isVisible()) {
          if (timer) cancelAnimationFrame(timer);
          timer = requestAnimationFrame(() => {
            timer = 0;
            save();
          });
        }
      };
    })();

    const state = this._storedState.seriesPanel;
    if (state) {
      restore(state);
    } else {
      panel.style.position = 'fixed';
      panel.style.top = '250px';
      panel.style.left = '500px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = '330px';
      panel.style.height = '380px';
    }

    let active = false;
    let startX = 0, startY = 0;

    const onMove = (e) => {
      if (!active) return;
      e.preventDefault();
      const x = e.clientX - startX;
      const y = e.clientY - startY;

      const maxLeft = window.innerWidth - panel.offsetWidth;
      const maxTop = window.innerHeight - panel.offsetHeight;

      const nextLeft = Math.max(0, Math.min(x, maxLeft));
      const nextTop = Math.max(0, Math.min(y, maxTop));

      panel.style.left = `${nextLeft}px`;
      panel.style.top = `${nextTop}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      debounceSave();
    };

    const onUp = () => {
      if (active) {
        active = false;
        panel.style.opacity = '1';
        panel.style.transition = 'box-shadow 0.3s ease';
        save();
      }
    };

    const onBeforeUnload = () => save();

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
      active = true;
      panel.style.transition = 'none';
      panel.style.position = 'fixed';
      const rect = panel.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      panel.style.opacity = '0.9';
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('beforeunload', onBeforeUnload);

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        const rect = panel.getBoundingClientRect();
        if (rect.height && rect.height < 70) {
          panel.classList.add('collapsed-title-only');
        } else if (rect.height && rect.height >= 70) {
          panel.classList.remove('collapsed-title-only');
        }
        if (!active) debounceSave();
      });
      resizeObserver.observe(panel);
    }

    this._seriesPanelDrag = { onMove, onUp, onBeforeUnload, resizeObserver };
  }

  _applyStoredSeriesPanelState() {
    const panel = this._dom.seriesPanel;
    const state = this._storedState.seriesPanel;
    if (!panel || !state) return;
    try {
      const { left, top, width, height } = state;
      if (width != null) panel.style.width = width;
      if (height != null) panel.style.height = height;

      const rect = panel.getBoundingClientRect();
      const w = rect.width || parseInt(width) || 330;
      const h = rect.height || parseInt(height) || 380;

      const maxLeft = Math.max(0, window.innerWidth - w - 8);
      const maxTop = Math.max(0, window.innerHeight - h - 8);

      if (left != null) {
        const leftVal = parseInt(left);
        panel.style.left = `${Math.max(0, Math.min(Number.isFinite(leftVal) ? leftVal : 500, maxLeft))}px`;
      }
      if (top != null) {
        const topVal = parseInt(top);
        panel.style.top = `${Math.max(0, Math.min(Number.isFinite(topVal) ? topVal : 250, maxTop))}px`;
      }
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.position = 'fixed';
      panel.style.zIndex = '1000';
    } catch (e) {
      console.warn('No se pudo restaurar el series panel:', e);
    }
  }

  _syncSeriesPanel() {
    const list = this._dom.seriesList;
    if (!list) return;

    const spins = this.tracker.getSpins();
    const customSeries = this.tracker.settings.customSeries || [];
    const activeCustom = customSeries.filter(s => s.active !== false && s.numbers && s.numbers.length > 0);

    // Listado base de series
    let listToEvaluate = [];
    if (activeCustom.length > 0) {
      listToEvaluate = activeCustom.map(s => ({ name: s.name, numbers: s.numbers }));
    } else {
      // Usar series por defecto
      const defaultSeries = {
        S1:  ["1", "27", "2", "26", "7"],
        S11: ["12", "19", "11", "17", "34"],
        S14: ["15", "24", "16", "14", "28"],
        S5:  ["32", "5", "31", "33", "23"],
        S0:  ["00", "10", "0", "30", "20"],
        S3:  ["3", "4", "6", "8", "9", "13", "18"],
        S21: ["21", "22", "25", "29", "35", "36"],
        S71: ["1", "27", "2", "26", "7", "13", "9"],
        S72: ["12", "19", "11", "17", "34", "8", "29"],
        S73: ["15", "24", "16", "14", "28", "3", "36"],
        S74: ["00", "10", "0", "30", "20", "25", "22"],
        S81: ["32", "5", "31", "33", "23", "4", "35", "18"],
        S82: ["13", "18", "21", "22", "25", "29", "35", "36"],
        S91: ["00", "10", "0", "30", "20", "32", "5", "31", "33", "23"],
        S92: ["1", "27", "2", "26", "7", "12", "19", "11", "17", "34"],
        S93: ["15", "24", "16", "14", "28", "3", "4", "6", "8", "9"],
        S99: ["3", "4", "6", "8", "9", "13", "18", "21", "22", "25", "29", "35", "36"]
      };
      listToEvaluate = Object.entries(defaultSeries).map(([name, numbers]) => ({ name, numbers }));
    }

    // Calcular atraso actual y atraso histórico máximo para cada serie
    const seriesWithAtraso = listToEvaluate.map(s => {
      let currentAtraso = 0;
      let maxHistAtraso = 0;
      let tempAtraso = 0;
      
      // Calcular atraso histórico máximo (recorriendo desde el principio de la sesión)
      for (let i = 0; i < spins.length; i++) {
        if (s.numbers.map(String).includes(String(spins[i].number))) {
          if (tempAtraso > maxHistAtraso) maxHistAtraso = tempAtraso;
          tempAtraso = 0;
        } else {
          tempAtraso++;
        }
      }
      // Considerar el atraso que quedó abierto al final
      if (tempAtraso > maxHistAtraso) maxHistAtraso = tempAtraso;
      
      // El atraso actual es exactamente lo que quedó en tempAtraso
      currentAtraso = spins.length === 0 ? 0 : tempAtraso;

      return {
        name: s.name,
        numbers: s.numbers,
        atraso: currentAtraso,
        historialMax: maxHistAtraso
      };
    });

    // Ordenar series
    if (this.sortMode === 'atraso') {
      seriesWithAtraso.sort((a, b) => b.atraso - a.atraso);
    } else if (this.sortMode === 'historial') {
      seriesWithAtraso.sort((a, b) => b.historialMax - a.historialMax);
    } else {
      seriesWithAtraso.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }

    // Atraso máximo entre todas las series
    const maxAtraso = seriesWithAtraso.length > 0 ? Math.max(...seriesWithAtraso.map(s => s.atraso)) : 0;

    if (seriesWithAtraso.length === 0) {
      list.innerHTML = '<p class="empty-msg">No hay series configuradas.</p>';
      return;
    }

    // Generar HTML premium
    list.innerHTML = '';
    seriesWithAtraso.forEach(s => {
      const item = document.createElement('div');
      item.className = 'series-floating-item';

      const isTopSeries = (s.atraso === maxAtraso && maxAtraso > 0);

      // Color de fondo basado en el atraso (concordancia de color del sistema)
      let delayBg = '#1e293b'; // por defecto gris oscuro
      let delayColor = '#94a3b8';
      
      if (isTopSeries) {
        delayBg = 'rgba(168, 85, 247, 0.35)';
        delayColor = '#e9d5ff'; // light purple
      } else {
        if (s.atraso >= 1 && s.atraso <= 9) {
          delayBg = 'rgba(255, 255, 255, 0.15)';
          delayColor = '#ffffff';
        } else if (s.atraso >= 10 && s.atraso <= 18) {
          delayBg = 'rgba(135, 206, 235, 0.2)';
          delayColor = '#87ceeb';
        } else if (s.atraso >= 19 && s.atraso <= 30) {
          delayBg = 'rgba(255, 255, 0, 0.2)';
          delayColor = '#ffff00';
        } else if (s.atraso >= 31 && s.atraso <= 40) {
          delayBg = 'rgba(255, 165, 0, 0.25)';
          delayColor = '#ffa500';
        } else if (s.atraso > 40) {
          delayBg = 'rgba(255, 0, 0, 0.3)';
          delayColor = '#ff3b30';
        }
      }

      // Generar pastillas de números para todas las series, detectando los nunca debutados y resaltando el más atrasado activo en morado
      const numberDelays = s.numbers.map(num => {
        let d = 0;
        let found = false;
        for (let i = spins.length - 1; i >= 0; i--) {
          if (String(spins[i].number) === String(num)) {
            found = true;
            break;
          }
          d++;
        }
        return { 
          num, 
          delay: spins.length === 0 ? 0 : d,
          neverHit: (spins.length > 0 && !found)
        };
      });
      
      // Encontrar el atraso máximo de los números que SÍ han debutado
      const hitNumbers = numberDelays.filter(nd => !nd.neverHit);
      const maxHitNumDelay = hitNumbers.length > 0 ? Math.max(...hitNumbers.map(nd => nd.delay)) : 0;

      const pillsHTML = numberDelays.map(nd => {
        if (nd.neverHit) {
          return `<span class="number-pill-never" data-tip="NUNCA HA SALIDO EN LA SESIÓN (${nd.delay} tiros sin aparecer)">⚠ ${nd.num}</span>`;
        }
        if (nd.delay === maxHitNumDelay && maxHitNumDelay > 0) {
          return `<span class="number-pill-purple" data-tip="Atraso individual: ${nd.delay} tiros (MÁXIMO ACTIVO DE LA SERIE)">${nd.num}</span>`;
        }
        return `<span class="number-pill-normal" data-tip="Atraso individual: ${nd.delay} tiros">${nd.num}</span>`;
      }).join('');

      let metricHtml = '';
      if (this.sortMode === 'historial') {
        metricHtml = `
          <div style="font-size: 0.6rem; opacity: 0.8; line-height: 1; text-align: center;">Act: ${s.atraso}</div>
          <div style="font-size: 1rem; font-weight: bold; line-height: 1; margin-top: 3px; text-align: center;" data-tip="Atraso Histórico Máximo">M: ${s.historialMax}</div>
        `;
      } else {
        metricHtml = `${s.atraso}`;
      }

      item.innerHTML = `
        <div style="flex: 1; min-width: 0; overflow: hidden; margin-right: 8px;">
          <div class="series-floating-name">${s.name}</div>
          <div class="series-floating-numbers">${pillsHTML}</div>
        </div>
        <div class="series-floating-delay" style="background: ${delayBg}; color: ${delayColor}; border: 1px solid ${delayColor}50; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; min-width: 45px;">
          ${metricHtml}
        </div>
      `;
      list.appendChild(item);
    });
  }
}
