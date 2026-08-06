/**
 * Tests unitarios — AtRepRenderer.
 *
 * Verifica el comportamiento del renderizador:
 * - Constructor y configuración
 * - toggleSet y activeSets
 * - update() maneja contenedor ausente
 * - Integración con ViewModel (incrementa, no reemplaza)
 *
 * NOTA: El renderer depende de DOM (document.getElementById, createElement).
 * Los tests de DOM se realizan con stubs manuales. Tests de render
 * visual profundo requerirían jsdom (no disponible en este proyecto).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtRepRenderer } from '../atRepRenderer.js';
import {
  invalidateCache
} from '../atRepEngine.js';

// ── Helpers ────────────────────────────────────────────────

function createMockTracker(spins = [], settings = {}) {
  return {
    getSpins: () => spins,
    getSettings: () => ({
      atrasosMaxWindow: settings.atrasosMaxWindow ?? 200,
      ...settings
    })
  };
}

function makeSpins(numbers) {
  const baseTime = Date.now() - numbers.length * 1000;
  return numbers.map((num, i) => ({
    id: i + 1,
    number: String(num),
    timestamp: baseTime + i * 1000
  }));
}

/**
 * Stub básico de document para permitir que el renderer
 * ejecute update() sin lanzar error.
 */
function stubDocument() {
  const stubEl = {
    innerHTML: '',
    style: { cssText: '' },
    appendChild: vi.fn().mockReturnThis(),
    setAttribute: vi.fn(),
    addEventListener: vi.fn(),
    textContent: ''
  };
  const docStub = {
    createElement: vi.fn(() => {
      // Cada createElement devuelve un elemento con los métodos mínimos
      const el = { ...stubEl };
      el.appendChild = vi.fn(() => el);
      el.cloneNode = vi.fn(() => ({ ...el }));
      el.querySelector = vi.fn(() => null);
      el.querySelectorAll = vi.fn(() => []);
      el.getAttribute = vi.fn(() => null);
      el.removeEventListener = vi.fn();
      return el;
    }),
    getElementById: vi.fn((id) => {
      if (id === 'view-at-rep') return { ...stubEl, innerHTML: '', appendChild: vi.fn().mockReturnThis() };
      return null;
    })
  };
  vi.stubGlobal('document', docStub);
  return docStub;
}

// ── Tests ──────────────────────────────────────────────────

describe('AtRepRenderer — Configuración', () => {

  let renderer;
  let tracker;

  beforeEach(() => {
    invalidateCache();
    tracker = createMockTracker(makeSpins([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]));
    renderer = new AtRepRenderer('view-at-rep', tracker);
  });

  it('Constructor crea engine y mantiene referencias', () => {
    expect(renderer).toBeInstanceOf(AtRepRenderer);
    expect(renderer.containerId).toBe('view-at-rep');
    expect(renderer.tracker).toBe(tracker);
    expect(renderer.engine).toBeDefined();
    expect(typeof renderer.engine.refresh).toBe('function');
    expect(renderer._initialized).toBe(false);
  });

  it('init() configura conjuntos por defecto (12 conjuntos)', () => {
    renderer.init();
    expect(renderer._initialized).toBe(true);
    expect(renderer._selectedSetNames.size).toBe(12);
    expect(renderer.activeSets).toContain('Rojo');
    expect(renderer.activeSets).toContain('Negro');
    expect(renderer.activeSets).toContain('Par');
    expect(renderer.activeSets).toContain('Docena1');
    expect(renderer.activeSets).toContain('Columna2');
  });

  it('init() es idempotente (no duplica si ya initialized)', () => {
    renderer.init();
    renderer.init(); // segunda llamada
    expect(renderer.activeSets).toHaveLength(12);
  });

  it('toggleSet() alterna conjuntos y activeSets los refleja', () => {
    renderer.init();
    const initialSize = renderer.activeSets.length;

    // Agregar Sixena1
    renderer.toggleSet('Sixena1');
    expect(renderer.activeSets).toHaveLength(initialSize + 1);
    expect(renderer.activeSets).toContain('Sixena1');

    // Quitar Sixena1
    renderer.toggleSet('Sixena1');
    expect(renderer.activeSets).toHaveLength(initialSize);
    expect(renderer.activeSets).not.toContain('Sixena1');

    // toggleSet sin init también funciona (aunque sin defaults)
    const r2 = new AtRepRenderer('view-at-rep', tracker);
    expect(r2.activeSets).toHaveLength(0);
    r2.toggleSet('Rojo');
    expect(r2.activeSets).toHaveLength(1);
  });
});

describe('AtRepRenderer — update() con DOM stub', () => {

  let renderer;
  let tracker;
  let docStub;

  beforeEach(() => {
    invalidateCache();
    docStub = stubDocument();

    tracker = createMockTracker(makeSpins([
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    ]));
    renderer = new AtRepRenderer('view-at-rep', tracker);
    renderer.init();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('update() maneja contenedor ausente sin lanzar error', () => {
    docStub.getElementById = vi.fn(() => null);
    const r2 = new AtRepRenderer('view-nonexistent', tracker);
    expect(() => r2.update()).not.toThrow();
  });

  it('update() construye ViewModel y renderiza cuando contenedor existe', () => {
    // update() llama _buildLayout → crea engine.refresh() + ViewModel
    expect(() => renderer.update()).not.toThrow();

    // Después de update, el contenedor debe tener innerHTML limpiado
    const doc = document;
    expect(doc.getElementById).toHaveBeenCalledWith('view-at-rep');
  });

  it('toggleSet() + update() re-render completa (test de no-crash)', () => {
    // Actualizar
    expect(() => renderer.update()).not.toThrow();

    // Hacer toggle + update
    expect(() => {
      renderer.toggleSet('Sixena1');
      renderer.update();
    }).not.toThrow();
  });
});

describe('AtRepRenderer — Integración con ViewModel', () => {

  it('_buildLayout crea ViewModel y lo almacena en _vm', () => {
    const tracker = createMockTracker(makeSpins([1, 3, 5]));
    const renderer = new AtRepRenderer('view-at-rep', tracker);
    renderer.init();

    stubDocument();

    renderer.update();

    // update() construye el layout que crea el ViewModel
    expect(renderer._vm).toBeDefined();
    expect(renderer._vm).toHaveProperty('summaryCards');
    expect(renderer._vm).toHaveProperty('scoreGrid');
    expect(renderer._vm).toHaveProperty('setDetails');
    expect(renderer._vm).toHaveProperty('intersections');

    vi.unstubAllGlobals();
  });

  it('Los labels del header usan LABELS del ViewModel (lenguaje seguro)', () => {
    const tracker = createMockTracker(makeSpins([1, 3, 5]));
    const renderer = new AtRepRenderer('view-at-rep', tracker);
    renderer.init();

    stubDocument();
    renderer.update();

    expect(renderer._vm.title).toBe('AtRep');

    // Verificar disclaimer en el VM
    expect(renderer._vm.disclaimer).toContain('No predice próximos resultados');

    vi.unstubAllGlobals();
  });
});
