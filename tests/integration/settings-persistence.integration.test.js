/**
 * Tests de integración: SettingsManager — operaciones de configuración.
 * Verifica el ciclo load → get → set → update → reset en el dominio.
 *
 * Boundary: el SettingsManager real usa rouletteSettingsStore (IndexedDB).
 * En entorno node, IndexedDB no está disponible → el store retorna null silenciosamente.
 * El test verifica el comportamiento del dominio cuando settings están pre-cargados.
 *
 * La persistencia real (IndexedDB) se considera boundary verificado
 * por el módulo rouletteSettingsStore.js, no por estas pruebas de integración del dominio.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';
import { createDefaultRouletteSettings } from '../../rouletteSettingsStore.js';

describe('Integration: Settings Persistence', () => {
  let state;
  let settingsManager;

  beforeEach(() => {
    state = new TrackerState();
    // Pre-load settings in state (simula load exitoso)
    state.settings = createDefaultRouletteSettings();
    settingsManager = new SettingsManager(state);
  });

  it('should get settings with defaults', () => {
    const settings = settingsManager.get();

    expect(settings).toBeDefined();
    expect(settings.casinoName).toBe('');
    expect(settings.crupierName).toBe('');
    expect(settings.tableName).toBe('');
    expect(settings.visualMode).toBe('analisis');
    expect(settings.customSeries).toBeInstanceOf(Array);
    expect(settings.customSeries.length).toBeGreaterThan(0);
    expect(settings.moduleThresholds).toBeDefined();
    expect(settings.laboratory).toEqual({ enabled: false });
  });

  it('should update partial settings and sync state', async () => {
    await settingsManager.update({ casinoName: 'Monte Carlo', crupierName: 'James', laboratory: { enabled: true } });

    const current = settingsManager.get();
    expect(current.casinoName).toBe('Monte Carlo');
    expect(current.crupierName).toBe('James');
    expect(current.laboratory).toEqual({ enabled: true });

    // Unchanged fields preserved
    expect(current.tableName).toBe('');
    expect(current.visualMode).toBe('analisis');
  });

  it('should set individual keys', async () => {
    await settingsManager.set('crupierName', 'Robert');
    await settingsManager.set('tableName', 'Table-7');
    await settingsManager.set('visualMode', 'estadisticas');

    const current = settingsManager.get();
    expect(current.crupierName).toBe('Robert');
    expect(current.tableName).toBe('Table-7');
    expect(current.visualMode).toBe('estadisticas');
  });

  it('should reset to defaults', async () => {
    await settingsManager.update({ casinoName: 'Venetian', visualMode: 'estadisticas' });
    expect(settingsManager.get().casinoName).toBe('Venetian');

    await settingsManager.reset();
    const defaults = createDefaultRouletteSettings();

    expect(settingsManager.get().casinoName).toBe(defaults.casinoName);
    expect(settingsManager.get().visualMode).toBe(defaults.visualMode);
    expect(settingsManager.get().customSeries).toEqual(defaults.customSeries);
    expect(settingsManager.get().laboratory).toEqual(defaults.laboratory);
  });

  it('should merge settings (shallow top-level merge)', async () => {
    const customThresholds = {
      moduleThresholds: {
        docenas: { limit: 3, critical: 6 },
        columnas: { limit: 4, critical: 8 },
      },
    };

    await settingsManager.merge(customThresholds);

    const current = settingsManager.get();
    expect(current.moduleThresholds.docenas.limit).toBe(3);
    expect(current.moduleThresholds.docenas.critical).toBe(6);
    expect(current.moduleThresholds.columnas.limit).toBe(4);

    // Shallow merge replaces the entire moduleThresholds key
    // (not deep-merged into existing defaults)
    expect(current.moduleThresholds.plenos).toBeUndefined();
    expect(current.moduleThresholds.suertesSencillas).toBeUndefined();
  });
});
