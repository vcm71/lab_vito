/**
 * Tests de integración: Bootstrap.init.
 * Verifica que Bootstrap cree correctamente el Domain Tracker,
 * los servicios y los motores con las dependencias correctas.
 *
 * Boundary: se mockean stores (IndexedDB), engines y renderers.
 * El dominio (TrackerState, managers, RouletteTracker) se prueba real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks para dependencias externas ──────────────────────────────
vi.mock('../../rouletteSettingsStore.js', () => ({
  rouletteSettingsStore: {
    load: vi.fn().mockResolvedValue({ settings: { casinoName: 'Test' }, source: 'empty' }),
    refresh: vi.fn().mockResolvedValue({ settings: { casinoName: 'Test' }, source: 'empty' }),
    setSettings: vi.fn().mockResolvedValue({}),
    getSnapshot: vi.fn().mockReturnValue({ casinoName: 'Test' }),
  },
  createDefaultRouletteSettings: vi.fn(() => ({
    casinoName: '',
    crupierName: '',
    tableName: '',
    visualMode: 'analisis',
    customSeries: [],
    moduleThresholds: {},
  })),
}));

vi.mock('../../tomadorStateStore.js', () => ({
  tomadorStateStore: {
    load: vi.fn().mockResolvedValue({}),
    setState: vi.fn().mockResolvedValue(),
  },
}));

vi.mock('../../controlador_de_la_vista_lab.js', () => ({
  LabRenderer: function LabRendererMock() {
    return {
      init: () => {},
      update: () => {},
    };
  },
}));

vi.mock('../../src/engines/WinWin/index.js', () => ({
  WinWinEngine: function WinWinMock() { return { initialize: () => {}, start: () => {}, stop: () => {} }; },
  WinWinStore: function() {},
  getConfig: () => ({}),
  DEFAULT_CONFIG: {},
  WinWinMetadata: function() {},
}));

vi.mock('../../src/engines/DA/index.js', () => ({
  DAEngine: function DAMock() { return { initialize: () => {}, start: () => {}, stop: () => {} }; },
}));

vi.mock('../../src/engines/Orion/index.js', () => ({
  LogicEngine: function LogicMock() { return { initialize: () => {}, start: () => {}, stop: () => {} }; },
}));

vi.mock('../../src/engines/Sesgo97/index.js', () => ({
  Sesgo97Logic: function Sesgo97Mock() { return { initialize: () => {}, start: () => {}, stop: () => {} }; },
}));

vi.mock('../../src/engines/Chi/index.js', () => ({
  ChiAnalysisEngine: function ChiMock() { return { initialize: () => {}, start: () => {}, stop: () => {} }; },
}));

vi.mock('../../src/engines/Kelly/index.js', () => ({
  KellyManager: function KellyMock() { return { initialize: () => {}, start: () => {}, stop: () => {} }; },
}));

// Ahora importamos Bootstrap (después de los mocks)
import { Bootstrap } from '../../src/core/Bootstrap.js';
import { ServiceContainer } from '../../src/core/ServiceContainer.js';
import { EventBus } from '../../src/core/EventBus.js';
import { RouletteTracker } from '../../src/tracker/RouletteTracker.js';
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';
import { SessionManager } from '../../src/tracker/SessionManager.js';
import { HistoryManager } from '../../src/tracker/HistoryManager.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';

describe('Integration: Bootstrap Initialization', () => {
  let container;

  beforeEach(() => {
    vi.clearAllMocks();
    container = new ServiceContainer();
    container.register('eventBus', new EventBus());
  });

  it('should create domainTracker with all managers wired', async () => {
    const result = await Bootstrap.init(container);

    expect(result.domainTracker).toBeInstanceOf(RouletteTracker);
    expect(result.domainTracker.state).toBeInstanceOf(TrackerState);
    expect(result.domainTracker.spinManager).toBeInstanceOf(SpinManager);
    expect(result.domainTracker.sessionManager).toBeInstanceOf(SessionManager);
    expect(result.domainTracker.historyManager).toBeInstanceOf(HistoryManager);
    expect(result.domainTracker.settingsManager).toBeInstanceOf(SettingsManager);
  });

  it('should wire DelayManager to the domainTracker', async () => {
    const result = await Bootstrap.init(container);

    // DelayManager should be set (injected via setDelayManager)
    expect(result.domainTracker.getDozenDelay(1)).toBe(0); // no spins yet
    expect(result.domainTracker.getNumberDelay('17')).toBe(0);
  });

  it('should register domainTracker in the container', async () => {
    await Bootstrap.init(container);

    const resolved = container.resolve('domainTracker');
    expect(resolved).toBeInstanceOf(RouletteTracker);
    expect(resolved.getSpins).toBeDefined();
    expect(resolved.startSession).toBeDefined();
  });

  it('should register all engines', async () => {
    const result = await Bootstrap.init(container);

    expect(result.engines).toHaveLength(6);
    expect(result.engines.map(e => e.name)).toEqual([
      'winWin', 'da', 'orion', 'sesgo97', 'chi', 'kelly'
    ]);
    result.engines.forEach(e => {
      expect(e.instance).toBeDefined();
      expect(typeof e.instance.initialize).toBe('function');
    });
  });

  it('should register services in container (settingsStore, tomadorStateStore)', async () => {
    await Bootstrap.init(container);

    expect(container.resolve('settingsStore')).toBeDefined();
    expect(container.resolve('tomadorStateStore')).toBeDefined();
    expect(container.resolve('labRenderer')).toBeDefined();
  });

  it('should return both tracker and domainTracker as same instance', async () => {
    const result = await Bootstrap.init(container);

    expect(result.tracker).toBe(result.domainTracker);
    expect(result.tracker).toBe(container.resolve('domainTracker'));
  });
});
