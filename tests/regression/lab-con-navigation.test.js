/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('chart.js/auto', () => ({
  default: {
    register: vi.fn(),
  },
}));

vi.mock('chartjs-plugin-zoom', () => ({
  default: {},
}));

vi.mock('../../orionRenderer.js', () => ({
  renderOrionTab: vi.fn(),
  initOrionEvents: vi.fn(),
}));

vi.mock('../../src/utils/numberMeta.js', () => ({
  AMERICAN_WHEEL_ORDER: [],
  getColor: vi.fn(() => '#fff'),
}));

vi.mock('../../seriesRenderer.js', () => ({
  renderDistanceChart: vi.fn(),
  renderSeriesCharts: vi.fn(),
  renderCombinedDAChart: vi.fn(),
  clearCombinedCharts: vi.fn(),
  resetChartZoom: vi.fn(),
}));

vi.mock('../../sesgo97Renderer.js', () => ({
  renderSesgo97Tab: vi.fn(),
}));

vi.mock('../../tomadorRenderer.js', () => ({
  TomadorRenderer: function TomadorRendererMock() {
    return {
      init: vi.fn(),
      update: vi.fn(),
    };
  },
}));

vi.mock('../../tomadorStateStore.js', () => ({
  tomadorStateStore: {
    load: vi.fn().mockResolvedValue({ activeTab: 'tab-tomador' }),
    setActiveTab: vi.fn().mockResolvedValue(),
  },
}));

vi.mock('../../chiRenderer.js', () => ({
  renderChiTab: vi.fn(),
}));

vi.mock('../../atrasosRenderer.js', () => ({
  renderAtrasosTab: vi.fn(),
}));

vi.mock('../../ataqueRenderer.js', () => ({
  renderAtaqueTab: vi.fn(),
}));

vi.mock('../../stWinRenderer.js', () => ({
  renderStWinTab: vi.fn(),
}));

vi.mock('../../controlador_de_la_vista_lab.js', () => ({
  LabRenderer: function LabRendererMock() {
    return {
      init: vi.fn(),
      update: vi.fn(),
    };
  },
}));

vi.mock('../../src/analytics/RouletteAnalytics.js', () => ({
  RouletteAnalytics: function RouletteAnalyticsMock() {
    return {
      refresh: vi.fn(),
      getStats: vi.fn(() => ({
        total: 0,
        colorsPct: { red: 0, black: 0, green: 0 },
        parityPct: { even: 0, odd: 0 },
        highLowPct: { low: 0, high: 0 },
        dozensPct: { d1: 0, d2: 0, d3: 0 },
        columnsPct: { c1: 0, c2: 0, c3: 0 },
      })),
      getProbabilities: vi.fn(() => ([])),
      getConfidenceIntervals: vi.fn(() => ([])),
      getAlerts: vi.fn(() => ([])),
      getStrategy: vi.fn(() => ([])),
      getAdvancedStats: vi.fn(() => ({
        hotZone: { center: '-', members: [] },
        chiSquare: 0,
        chiDiagnosis: '-',
        meanDelays: { red: 0, black: 0 },
      })),
      runsTest: vi.fn(),
      getWindowStats: vi.fn(),
      getDistanceHistogram: vi.fn(),
    };
  },
}));

vi.mock('../../src/core/OrionKernel.js', () => {
  const tracker = {
    getSpins: vi.fn(() => []),
    getSettings: vi.fn(() => ({})),
    setAnalytics: vi.fn(),
    initialize: vi.fn().mockResolvedValue(),
  };

  const engineRegistry = new Map([
    ['winWin', { ready: new Promise(() => {}) }],
    ['da', {}],
    ['orion', {}],
    ['sesgo97', { analizar: vi.fn(() => ({})) }],
    ['chi', { getAnalysis: vi.fn(() => ({})) }],
    ['kelly', { ready: new Promise(() => {}), analyze: vi.fn(() => ({
      total: 0,
      chiSquare: 0,
      chiDiagnosis: '-',
      confidence: 0,
      stopLossAmount: 0,
      takeProfitAmount: 0,
      insufficient: true,
      needed: 0,
      recommendations: [],
      minConfidence: 0,
      fractionLabel: 'Kelly',
    })) }],
    ['tomador', { ready: new Promise(() => {}) }],
  ]);

  const container = {
    resolve: vi.fn((name) => {
      if (name === 'labCon1Renderer') {
        return { update: vi.fn() };
      }
      if (name === 'atRepRenderer') {
        return { update: vi.fn() };
      }
      return null;
    }),
  };

  return {
    OrionKernel: function OrionKernelMock() {
      return {
        bootstrap: vi.fn().mockResolvedValue(),
        getTracker: vi.fn(() => tracker),
        engineRegistry,
        container,
      };
    },
  };
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  document.body.innerHTML = '';
});

describe('Lab_Con navigation selector regression', () => {
  it('sólo enlaza la navegación superior y mantiene visible Lab_Con al pulsar una nav interna', async () => {
    document.body.innerHTML = `
      <div class="header-content">
        <nav class="top-nav">
          <button class="nav-btn" data-target="tab-tomador" id="top-tomador">Tomador</button>
          <button class="nav-btn active" data-target="tab-lab-con" id="top-lab-con">Lab_Con</button>
        </nav>
        <button id="btn-clear-session" type="button">Limpiar</button>
      </div>
      <div id="tab-tomador" class="tab-content"></div>
      <div id="tab-lab-con" class="tab-content active">
        <div class="laboratory-shell-nav" role="tablist" aria-label="Laboratory views">
          <button
            type="button"
            class="nav-btn laboratory-shell-nav-btn active"
            role="tab"
            id="lab-tab-comparison"
            aria-controls="laboratory-view-comparison"
            aria-selected="true"
            tabindex="0"
            data-view-id="comparison"
          >Comparison</button>
        </div>
      </div>
      <div id="tab-lab-con1" class="tab-content"></div>
      <div id="tab-at-rep" class="tab-content"></div>
    `;

    const clickBindings = new Map();
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const addEventSpy = vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(function(type, listener, options) {
      if (type === 'click' && this instanceof HTMLButtonElement) {
        const current = clickBindings.get(this) || 0;
        clickBindings.set(this, current + 1);
      }
      return originalAddEventListener.call(this, type, listener, options);
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../main.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flush();
    await flush();

    const topLabConButton = document.getElementById('top-lab-con');
    const topTomadorButton = document.getElementById('top-tomador');
    const innerComparisonButton = document.getElementById('lab-tab-comparison');
    const labConTab = document.getElementById('tab-lab-con');

    expect(clickBindings.get(topLabConButton)).toBe(1);
    expect(clickBindings.get(innerComparisonButton) || 0).toBe(0);
    expect(clickBindings.get(topTomadorButton)).toBe(1);

    innerComparisonButton.click();
    await flush();

    expect(topLabConButton.classList.contains('active')).toBe(true);
    expect(topTomadorButton.classList.contains('active')).toBe(false);
    expect(labConTab.classList.contains('active')).toBe(true);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    addEventSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
