import { describe, expect, it } from 'vitest';
import {
  LaboratoryDataset,
  LaboratoryRegistry,
  LaboratoryRunner,
  LaboratorySessionBuilder,
  createLaboratoryRegistry,
  registerLaboratoryModules,
} from '../../src/laboratory/index.js';

const SAMPLE_RECORDS = [
  { id: 1, number: '1' },
  { id: 2, number: '12' },
  { id: 3, number: 37 },
  { id: 4, number: '90' },
  { id: 5, number: '18' },
  { id: 6, number: '27' },
];

const SAMPLE_CONTEXT = {
  configuration: {
    limit: 3,
    customSeries: [
      { name: 'Serie A', numbers: ['1', '12', '18'] },
      { name: 'Serie B', numbers: ['27', '00', '0'] },
    ],
  },
};

describe('Laboratory module catalog', () => {
  it('registers the official modules and provider', () => {
    const registry = createLaboratoryRegistry();
    const ids = registry.list().map(moduleDefinition => moduleDefinition.manifest.id);

    expect(ids).toEqual(expect.arrayContaining([
      'lab.con',
      'lab.con1',
      'at.rep',
      'win.win',
      'da',
      'historical-evidence.dataset-provider',
    ]));
  });

  it('can register into an existing registry instance', () => {
    const registry = new LaboratoryRegistry();
    registerLaboratoryModules(registry);

    expect(registry.get('lab.con')).toBeTruthy();
    expect(registry.get('historical-evidence.dataset-provider')).toBeTruthy();
  });

  it('can start a session from the Historical Evidence provider and run multiple module modes', async () => {
    const registry = createLaboratoryRegistry();
    const runner = new LaboratoryRunner({ registry });
    const builder = new LaboratorySessionBuilder({ registry });

    const providerResult = await runner.run('historical-evidence.dataset-provider', {
      metadata: {
        datasetId: 'lab-dataset-001',
        createdAt: '2026-08-03T03:29:10Z',
        records: SAMPLE_RECORDS,
      },
      contextOptions: SAMPLE_CONTEXT,
    });

    expect(providerResult.ok).toBe(true);
    expect(providerResult.dataset).toBeInstanceOf(LaboratoryDataset);

    const sequentialSession = builder.fromProvider(providerResult, {
      sessionId: 'session-sequential',
      configuration: SAMPLE_CONTEXT.configuration,
      parameters: { limit: 3 },
      metadata: { scenario: 'sequential' },
      modules: ['lab.con', 'lab.con1', 'at.rep'],
      executionMode: 'sequential',
    });

    expect(sequentialSession.status).toBe('READY');
    expect(sequentialSession.executionPlan).toHaveLength(3);

    const sequentialResult = await runner.run(sequentialSession);
    expect(sequentialResult.ok).toBe(true);
    expect(sequentialResult.sessionId).toBe('session-sequential');
    expect(sequentialResult.modulesExecuted).toEqual(['lab.con', 'lab.con1', 'at.rep']);
    expect(sequentialResult.results).toHaveLength(3);
    expect(sequentialResult.durationMs).not.toBeNull();

    const independentSession = builder.fromProvider(providerResult, {
      sessionId: 'session-independent',
      configuration: SAMPLE_CONTEXT.configuration,
      metadata: { scenario: 'independent' },
      modules: ['win.win', 'da'],
      executionMode: 'independent',
    });

    expect(independentSession.executionMode).toBe('independent');
    expect(independentSession.executionPlan).toHaveLength(1);

    const independentResult = await runner.run(independentSession);
    expect(independentResult.ok).toBe(true);
    expect(independentResult.modulesExecuted).toEqual(['win.win', 'da']);
    expect(independentResult.results).toHaveLength(2);
    expect(independentResult.results[0].moduleId).toBe('win.win');
    expect(independentResult.results[1].moduleId).toBe('da');
  });
});
