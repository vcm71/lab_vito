import { describe, it, expect } from 'vitest';
import {
  LaboratoryRegistry,
  defineLaboratoryModuleManifest,
  LaboratoryContext,
  LaboratoryDataset,
  LaboratoryMetric,
  LaboratoryResult,
  LaboratoryRunner,
} from '../../src/laboratory/index.js';

describe('Laboratory foundation', () => {
  it('registers modules and exposes capabilities', () => {
    const registry = new LaboratoryRegistry();
    const module = registry.register({
      id: 'lab.alpha',
      name: 'Alpha Module',
      version: '1.0.0',
      description: 'Test module',
      category: 'experimental',
      capabilities: ['run', 'observe'],
      supportedContracts: ['LaboratoryContext', 'LaboratoryResult'],
    });

    expect(module.manifest.id).toBe('lab.alpha');
    expect(registry.list()).toHaveLength(1);
    expect(registry.getCapabilities('lab.alpha')).toEqual(['run', 'observe']);
    expect(registry.supportsContract('lab.alpha', 'LaboratoryResult')).toBe(true);
  });

  it('creates an immutable context and dataset', () => {
    const manifest = defineLaboratoryModuleManifest({
      id: 'lab.beta',
      name: 'Beta Module',
      version: '1.2.3',
      description: 'Beta',
      capabilities: ['read'],
    });

    const dataset = new LaboratoryDataset({
      id: 'dataset-1',
      datasetVersion: '2026.08',
      records: [{ value: 1 }],
    });

    const context = new LaboratoryContext({
      module: manifest,
      moduleId: manifest.id,
      dataset,
      runId: 'run-1',
      configuration: { mode: 'test' },
      metadata: { owner: 'qa' },
      capabilities: manifest.capabilities,
    });

    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(dataset)).toBe(true);
    expect(context.toJSON().moduleId).toBe('lab.beta');
    expect([...dataset]).toEqual([{ value: 1 }]);
    expect(dataset.slice(0, 1).recordCount).toBe(1);
  });

  it('creates metric and result contracts', () => {
    const metric = new LaboratoryMetric({
      id: 'lab.metric',
      name: 'Laboratory Metric',
      description: 'Checks output',
      compute: () => 42,
      tags: ['lab'],
    });

    const result = new LaboratoryResult({
      runId: 'run-1',
      moduleId: 'lab.alpha',
      status: 'success',
      output: { score: 42 },
      metrics: { lab: 42 },
    });

    expect(metric.compute()).toBe(42);
    expect(metric.toJSON().id).toBe('lab.metric');
    expect(result.ok).toBe(true);
    expect(result.toJSON().output).toEqual({ score: 42 });
  });

  it('runs a module, captures success, and stores results', async () => {
    const sink = [];
    const registry = new LaboratoryRegistry([
      {
        id: 'lab.runner',
        name: 'Runner Module',
        version: '0.1.0',
        description: 'Runnable module',
        category: 'test',
        capabilities: ['execute'],
        run: async ({ context }) => ({
          moduleId: context.moduleId,
          runId: context.runId,
          mode: context.evaluationMode,
        }),
      },
    ]);

    const runner = new LaboratoryRunner({ registry });
    const result = await runner.run('lab.runner', {
      runId: 'run-123',
      resultSink: sink,
      metadata: { source: 'unit-test' },
    });

    expect(result.ok).toBe(true);
    expect(result.moduleId).toBe('lab.runner');
    expect(result.output).toEqual({ moduleId: 'lab.runner', runId: 'run-123', mode: 'execution' });
    expect(sink).toHaveLength(1);
    expect(sink[0].runId).toBe('run-123');
  });

  it('captures module failures without changing behavior upstream', async () => {
    const registry = new LaboratoryRegistry([
      {
        id: 'lab.fail',
        name: 'Failing Module',
        version: '0.1.0',
        description: 'Throws on purpose',
        category: 'test',
        capabilities: ['execute'],
        execute: () => {
          throw new Error('boom');
        },
      },
    ]);

    const runner = new LaboratoryRunner({ registry });
    const result = await runner.run('lab.fail', { runId: 'run-fail' });

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('boom');
    expect(result.moduleId).toBe('lab.fail');
  });
});
