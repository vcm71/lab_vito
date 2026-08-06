/**
 * Fase 2.2 Part II — Training & Strategy tests.
 */
import { describe, it, expect } from 'vitest';
import {
  CalibrationDataset,
  CalibrationDatasetBuilder,
  CalibrationDatasetValidator,
  CalibrationTrainer,
  CalibrationModel,
  CalibrationModelFactory,
  CalibrationContext,
  CalibrationRepository,
} from '../../../src/calibration/index.js';
import { IdentityCalibration } from '../../../src/calibration/strategies/IdentityCalibration.js';
import { HistogramCalibration } from '../../../src/calibration/strategies/HistogramCalibration.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSampleRecords(n = 100, seed = 42) {
  const rng = mulberry32(seed);
  const records = [];
  for (let i = 0; i < n; i++) {
    const score = rng();
    const outcome = rng() < score ? 1 : 0; // somewhat calibrated
    records.push({
      rawConsensusScore: parseFloat(score.toFixed(4)),
      observedOutcome: outcome,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    });
  }
  return records;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationDataset
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationDataset', () => {
  it('constructs with records', () => {
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records: buildSampleRecords(10) });
    expect(ds.id).toBe('test');
    expect(ds.recordCount).toBe(10);
  });

  it('is immutable', () => {
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records: buildSampleRecords(10) });
    expect(() => { ds.id = 'hacked'; }).toThrow();
  });

  it('iterates records', () => {
    const records = buildSampleRecords(5);
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records });
    const collected = [...ds];
    expect(collected.length).toBe(5);
  });

  it('slice creates subset', () => {
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records: buildSampleRecords(10) });
    const sliced = ds.slice(2, 5);
    expect(sliced.recordCount).toBe(3);
    expect(sliced.metadata.parentDataset).toBe('test');
  });

  it('shuffle produces different ordering deterministically', () => {
    const records = buildSampleRecords(20, 99);
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records });
    const s1 = ds.shuffle(42);
    const s2 = ds.shuffle(42);
    // Same seed → same order
    expect([...s1].map(r => r.rawConsensusScore)).toEqual([...s2].map(r => r.rawConsensusScore));
  });

  it('shuffle different seeds produce different ordering', () => {
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records: buildSampleRecords(50, 77) });
    const s1 = ds.shuffle(1);
    const s2 = ds.shuffle(999);
    const arr1 = [...s1].map(r => r.rawConsensusScore);
    const arr2 = [...s2].map(r => r.rawConsensusScore);
    // Extremely unlikely to be identical
    const identical = arr1.every((v, i) => v === arr2[i]);
    expect(identical).toBe(false);
  });

  it('serializes to JSON-safe object', () => {
    const ds = new CalibrationDataset({ id: 'test', datasetVersion: '1.0.0', records: buildSampleRecords(3) });
    const json = ds.toJSON();
    expect(json.id).toBe('test');
    expect(json.records.length).toBe(3);
    expect(typeof json.createdAt).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationDatasetValidator
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationDatasetValidator', () => {
  it('validates clean records', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate(buildSampleRecords(10));
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it('rejects empty array', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate([]);
    expect(result.valid).toBe(false);
  });

  it('detects NaN rawConsensusScore', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate([{ rawConsensusScore: NaN, observedOutcome: 1, timestamp: 't' }]);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes('NaN'))).toBe(true);
  });

  it('detects Infinity', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate([{ rawConsensusScore: Infinity, observedOutcome: 1, timestamp: 't' }]);
    expect(result.valid).toBe(false);
  });

  it('detects score out of range', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate([{ rawConsensusScore: 1.5, observedOutcome: 1, timestamp: 't' }]);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes('[0,1]'))).toBe(true);
  });

  it('detects invalid observedOutcome', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate([{ rawConsensusScore: 0.5, observedOutcome: 'yes', timestamp: 't' }]);
    expect(result.valid).toBe(false);
  });

  it('detects duplicates', () => {
    const v = new CalibrationDatasetValidator();
    const record = { rawConsensusScore: 0.5, observedOutcome: 1, timestamp: 't' };
    const result = v.validate([record, record]);
    expect(result.issues.some(i => i.message.includes('Duplicate'))).toBe(true);
  });

  it('warns on missing timestamp', () => {
    const v = new CalibrationDatasetValidator();
    const result = v.validate([{ rawConsensusScore: 0.5, observedOutcome: 1 }]);
    expect(result.valid).toBe(true);
    expect(result.issues.some(i => i.severity === 'warning')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationDatasetBuilder
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationDatasetBuilder', () => {
  it('builds valid dataset', () => {
    const builder = new CalibrationDatasetBuilder();
    const ds = builder.build({ id: 'ds1', datasetVersion: '1.0.0', records: buildSampleRecords(10) });
    expect(ds).toBeInstanceOf(CalibrationDataset);
    expect(ds.recordCount).toBe(10);
  });

  it('throws on missing id', () => {
    const builder = new CalibrationDatasetBuilder();
    expect(() => builder.build({ datasetVersion: '1.0.0', records: buildSampleRecords(5) })).toThrow();
  });

  it('strict mode throws on invalid records', () => {
    const builder = new CalibrationDatasetBuilder({ mode: 'strict' });
    expect(() => builder.build({
      id: 'ds1',
      datasetVersion: '1.0.0',
      records: [{ rawConsensusScore: NaN, observedOutcome: 1 }],
    })).toThrow();
  });

  it('tolerant mode passes with warnings in metadata', () => {
    const builder = new CalibrationDatasetBuilder({ mode: 'tolerant' });
    const ds = builder.build({
      id: 'ds1',
      datasetVersion: '1.0.0',
      records: [{ rawConsensusScore: NaN, observedOutcome: 1 }],
    });
    expect(ds).toBeInstanceOf(CalibrationDataset);
    expect(ds.metadata.validated).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationModel
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationModel', () => {
  it('constructs and is immutable', () => {
    const model = new CalibrationModel({
      id: 'm1',
      strategy: 'Histogram',
      parameters: { nBuckets: 10 },
      metrics: { brierScore: 0.1 },
    });
    expect(model.parameters.nBuckets).toBe(10);
    expect(() => { model.parameters.nBuckets = 99; }).toThrow();
  });

  it('computeHash is deterministic', () => {
    const h1 = CalibrationModel.computeHash({ a: 1 }, 'v1', 'Histogram', '1.0.0');
    const h2 = CalibrationModel.computeHash({ a: 1 }, 'v1', 'Histogram', '1.0.0');
    expect(h1).toBe(h2);
  });

  it('computeHash changes with different params', () => {
    const h1 = CalibrationModel.computeHash({ a: 1 }, 'v1', 'Histogram', '1.0.0');
    const h2 = CalibrationModel.computeHash({ a: 2 }, 'v1', 'Histogram', '1.0.0');
    expect(h1).not.toBe(h2);
  });

  it('toJSON returns serializable object', () => {
    const model = new CalibrationModel({ id: 'm1', strategy: 'X', parameters: { k: 1 } });
    const json = model.toJSON();
    expect(json.id).toBe('m1');
    expect(json.parameters.k).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationModelFactory
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationModelFactory', () => {
  it('builds models with unique IDs', () => {
    const factory = new CalibrationModelFactory();
    const m1 = factory.build({ strategy: 'Test', hash: 'abc', trainingSamples: 10 });
    const m2 = factory.build({ strategy: 'Test', hash: 'def', trainingSamples: 10 });
    expect(m1.id).not.toBe(m2.id);
  });

  it('assigns model version', () => {
    const factory = new CalibrationModelFactory();
    const m = factory.build({ strategy: 'Test', strategyVersion: '2.1.3', hash: 'abc' });
    expect(m.strategyVersion).toBe('2.1.3');
    expect(m.modelVersion).toMatch(/^model_2\.1\.3_/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationContext
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationContext', () => {
  it('constructs and freezes', () => {
    const ctx = new CalibrationContext({ strategy: 'Histogram', evaluationMode: 'training' });
    expect(ctx.strategy).toBe('Histogram');
    expect(ctx.evaluationMode).toBe('training');
    expect(() => { ctx.strategy = 'other'; }).toThrow();
  });

  it('serializes to JSON', () => {
    const ctx = new CalibrationContext({ configuration: { k: 1 }, strategy: 'H' });
    const json = ctx.toJSON();
    expect(json.strategy).toBe('H');
    expect(json.configuration.k).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationTrainer
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationTrainer', () => {
  it('trains IdentityCalibration and produces a model', () => {
    const trainer = new CalibrationTrainer();
    const strategy = new IdentityCalibration();
    const ds = new CalibrationDataset({ id: 'ds1', datasetVersion: '1.0.0', records: buildSampleRecords(20) });
    const ctx = new CalibrationContext({ strategy: 'IdentityCalibration', evaluationMode: 'training' });

    const model = trainer.fit(strategy, ds, ctx);
    expect(model).toBeInstanceOf(CalibrationModel);
    expect(model.strategy).toBe('IdentityCalibration');
    expect(model.trainingSamples).toBe(20);
    expect(model.hash).toBeTruthy();
    expect(model.metrics.brierScore).toBeGreaterThanOrEqual(0);
  });

  it('trains HistogramCalibration and produces non-empty table', () => {
    const trainer = new CalibrationTrainer();
    const strategy = new HistogramCalibration({ nBuckets: 5 });
    const ds = new CalibrationDataset({ id: 'ds1', datasetVersion: '1.0.0', records: buildSampleRecords(50) });

    const model = trainer.fit(strategy, ds);
    expect(model.strategy).toBe('HistogramCalibration');
    expect(model.parameters.table.length).toBe(5);
  });

  it('throws if strategy has no fit method', () => {
    const trainer = new CalibrationTrainer();
    const badStrategy = { name: 'Bad' };
    const ds = new CalibrationDataset({ id: 'ds1', datasetVersion: '1.0.0', records: buildSampleRecords(5) });
    expect(() => trainer.fit(badStrategy, ds)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Serialization
// ═══════════════════════════════════════════════════════════════════════════════
describe('Serialization', () => {
  it('IdentityCalibration serialize/deserialize round-trip', () => {
    const s = new IdentityCalibration();
    const data = s.serialize();
    const restored = IdentityCalibration.deserialize(data);
    expect(restored.name).toBe('IdentityCalibration');
    expect(restored.calibrate(0.5).calibratedProbability).toBe(0.5);
  });

  it('HistogramCalibration serialize/deserialize preserves buckets', () => {
    const s = new HistogramCalibration({ nBuckets: 5 });
    const ds = new CalibrationDataset({ id: 'ds1', datasetVersion: '1.0.0', records: buildSampleRecords(30) });
    s.fit(ds);
    const data = s.serialize();
    const restored = HistogramCalibration.deserialize(data);
    expect(restored.nBuckets).toBe(5);
    expect(restored.buckets).toEqual(s.buckets);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalibrationRepository
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationRepository', () => {
  it('stores and retrieves models', () => {
    const repo = new CalibrationRepository();
    const model = new CalibrationModel({ id: 'm1', hash: 'abc', strategy: 'Test' });
    repo.save(model);
    expect(repo.size()).toBe(1);
    expect(repo.getById('m1')).toBe(model);
    expect(repo.getByHash('abc')).toBe(model);
  });

  it('lists all models', () => {
    const repo = new CalibrationRepository();
    repo.save(new CalibrationModel({ id: 'a', hash: 'h1', strategy: 'X' }));
    repo.save(new CalibrationModel({ id: 'b', hash: 'h2', strategy: 'Y' }));
    expect(repo.list().length).toBe(2);
  });

  it('removes by id', () => {
    const repo = new CalibrationRepository();
    const model = new CalibrationModel({ id: 'm1', hash: 'abc', strategy: 'Test' });
    repo.save(model);
    expect(repo.remove('m1')).toBe(true);
    expect(repo.size()).toBe(0);
    expect(repo.getByHash('abc')).toBeNull();
  });

  it('clear empties the store', () => {
    const repo = new CalibrationRepository();
    repo.save(new CalibrationModel({ id: 'x', hash: 'hx', strategy: 'Test' }));
    repo.clear();
    expect(repo.size()).toBe(0);
  });

  it('throws on save without hash', () => {
    const repo = new CalibrationRepository();
    const model = new CalibrationModel({ id: 'x', strategy: 'Test' });
    expect(() => repo.save(model)).toThrow();
  });
});
