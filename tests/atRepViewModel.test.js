/**
 * Tests unitarios — AtRepViewModel.
 *
 * Verifica que el ViewModel transforma correctamente los datos
 * del engine en un contrato serializable, seguro y descriptivo.
 *
 * No toca DOM. No depende del renderer.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createAtRepViewModel, LABELS } from '../src/viewmodels/atRepViewModel.js';
import {
  AtRepEngine,
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

// ── Tests ──────────────────────────────────────────────────

describe('AtRepViewModel — Contrato serializable', () => {

  let vm;

  beforeEach(() => {
    invalidateCache();
    const spins = makeSpins([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    const engine = new AtRepEngine(tracker);
    engine.refresh();
    vm = createAtRepViewModel(engine, ['Rojo', 'Negro', 'Par', 'Impar']);
  });

  it('Devuelve un objeto plano serializable (sin nodos DOM ni funciones)', () => {
    expect(vm).toBeDefined();
    expect(typeof vm).toBe('object');
    expect(vm).toHaveProperty('title');
    expect(vm).toHaveProperty('subtitle');
    expect(vm).toHaveProperty('referenceText');
    expect(vm).toHaveProperty('disclaimer');
    expect(vm).toHaveProperty('pciTooltip');
    expect(vm).toHaveProperty('summaryCards');
    expect(vm).toHaveProperty('scoreGrid');
    expect(vm).toHaveProperty('setDetails');
    expect(vm).toHaveProperty('intersections');
    expect(vm).toHaveProperty('setSelector');
    expect(vm).toHaveProperty('hasIntersections');

    // Verificar serialización JSON (sin funciones)
    expect(() => JSON.stringify(vm)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(vm));
    expect(parsed.title).toBe('AtRep');
    expect(Array.isArray(parsed.scoreGrid)).toBe(true);
    expect(Array.isArray(parsed.summaryCards)).toBe(true);
    expect(Array.isArray(parsed.setDetails)).toBe(true);
  });

  it('Prepara labels seguros (lenguaje descriptivo, no predictivo)', () => {
    const cards = vm.summaryCards;

    // Buscar las cards por id
    const groupingCard = cards.find(c => c.id === 'observedGrouping');
    expect(groupingCard).toBeDefined();
    expect(groupingCard.label).toBe('Mayor agrupamiento observado');

    const separationCard = cards.find(c => c.id === 'observedSeparation');
    expect(separationCard).toBeDefined();
    expect(separationCard.label).toBe('Mayor separación observada');

    // Verificar labels de intersecciones
    if (vm.hasIntersections) {
      // El título de intersecciones se usa en el renderer, no en el VM
      // Pero el VM expone LABELS.INTERSECCIONES
      expect(LABELS.INTERSECCIONES).toBe('Intersecciones con mayor desviación descriptiva');
    }
  });

  it('Incluye disclaimer no predictivo con formato correcto', () => {
    expect(vm.disclaimer).toBe(LABELS.DISCLAIMER);
    expect(vm.disclaimer).toContain('No predice próximos resultados');
    expect(vm.disclaimer).toContain('descriptiva');

    // El tooltip de chips también debe ser descriptivo
    expect(vm.pciTooltip).toBe(LABELS.PCI_TOOLTIP);
    expect(vm.pciTooltip).toContain('No implica probabilidad futura');
  });

  it('Formatea PCI a 3 decimales en scoreGrid y setDetails', () => {
    // Score grid
    vm.scoreGrid.forEach(score => {
      if (score.pci !== null) {
        expect(score.pciFormatted).toMatch(/^\d+\.\d{3}$/);
      } else {
        expect(score.pciFormatted).toBeNull();
      }
    });

    // Set details
    vm.setDetails.forEach(d => {
      if (d.pci !== null) {
        expect(d.pciFormatted).toMatch(/^\d+\.\d{3}$/);
      } else {
        expect(d.pciFormatted).toBe('—');
      }
    });
  });

  it('Prepara ariaLabel descriptivo para cada número en scoreGrid', () => {
    vm.scoreGrid.forEach(score => {
      expect(score).toHaveProperty('ariaLabel');
      expect(typeof score.ariaLabel).toBe('string');
      expect(score.ariaLabel.length).toBeGreaterThan(10);

      if (score.pci !== null) {
        expect(score.ariaLabel).toContain('PCI');
        expect(score.ariaLabel).toContain('descriptivo');
      } else {
        expect(score.ariaLabel).toContain('Sin datos suficientes');
      }
    });
  });

  it('Maneja caso sin datos (engine con 0 giros) sin lanzar error', () => {
    invalidateCache();
    const tracker = createMockTracker([], { atrasosMaxWindow: 200 });
    const engine = new AtRepEngine(tracker);
    engine.refresh();

    const emptyVm = createAtRepViewModel(engine, ['Rojo']);

    expect(emptyVm.scoreGrid).toHaveLength(38);
    expect(emptyVm.setDetails).toHaveLength(0);
    expect(emptyVm.summaryCards[0].value).toBe(0); // totalSpins = 0
    expect(emptyVm.hasIntersections).toBe(false);

    // No debe lanzar error al serializar
    expect(() => JSON.stringify(emptyVm)).not.toThrow();
  });

  it('Excluye 0 y 00 de observedGrouping y observedSeparation', () => {
    const cards = vm.summaryCards;
    const groupingCard = cards.find(c => c.id === 'observedGrouping');
    const separationCard = cards.find(c => c.id === 'observedSeparation');

    [groupingCard, separationCard].forEach(card => {
      if (card.items && card.items.length > 0) {
        card.items.forEach(item => {
          expect(item.number).not.toBe('0');
          expect(item.number).not.toBe('00');
        });
      }
    });
  });

  // ── Selector combinado: conjuntos + series ──────────────────────────

  it('setSelector incluye type en cada item con catálogo unificado', () => {
    const spins = makeSpins(Array.from({ length: 100 }, () => ~~(Math.random() * 38)));
    const tracker = createMockTracker(spins, {
      atrasosMaxWindow: 100,
      customSeries: [{ name: 'Favoritos', numbers: ['7','17','27'], active: true }]
    });
    const engine = new AtRepEngine(tracker);
    engine.refresh();

    const vm = createAtRepViewModel(engine, ['Rojo', '7']);

    expect(vm.setSelector.length).toBe(engine._allDefinitions.length);
    expect(vm.setSelector.length).toBe(19); // 18 conjuntos + 1 serie

    // Todos los items tienen type
    vm.setSelector.forEach(item => {
      expect(item).toHaveProperty('type');
    });

    // Debe contener un item de tipo 'series'
    const seriesItem = vm.setSelector.find(item => item.type === 'series');
    expect(seriesItem).toBeDefined();

    // El Rojo está seleccionado
    const rojoItem = vm.setSelector.find(item => item.name === 'Rojo');
    expect(rojoItem.selected).toBe(true);
  });

  it('setSelector funciona con engine sin refresh (fallback a SUBCONJUNTOS)', () => {
    const spins = makeSpins([]);
    const tracker = createMockTracker(spins);
    const engine = new AtRepEngine(tracker);
    // Sin llamar a refresh -> _allDefinitions vacío

    const vm = createAtRepViewModel(engine, []);

    // Fallback a SUBCONJUNTOS
    expect(vm.setSelector.length).toBe(18);
    vm.setSelector.forEach(item => {
      expect(item).toHaveProperty('type', 'conjunto');
    });
  });
});
