/**
 * Tests: CalibrationLeakageDetector.
 */
import { describe, it, expect } from 'vitest';
import { CalibrationLeakageDetector } from '../../src/calibration/CalibrationLeakageDetector.js';
import { CalibrationDatasetBuilder } from '../../src/calibration/CalibrationDatasetBuilder.js';

function makeRecords(n, startTs = '2026-01-01T00:00:00Z', offset = 0) {
  const records = [];
  const base = Date.parse(startTs);
  for (let i = 0; i < n; i++) {
    records.push({
      rawConsensusScore: (i % 10) / 10,
      observedOutcome: i % 2,
      timestamp: new Date(base + (i + offset) * 60000).toISOString(),
    });
  }
  return records;
}

describe('CalibrationLeakageDetector', () => {
  let builder;

  beforeAll(() => {
    builder = new CalibrationDatasetBuilder();
  });

  it('detects no leakage on disjoint sets', () => {
    const detector = new CalibrationLeakageDetector();
    const train = builder.build({ id: 't', datasetVersion: '1.0.0', records: makeRecords(100, '2026-01-01', 0) });
    const test = builder.build({ id: 's', datasetVersion: '1.0.0', records: makeRecords(50, '2026-01-05', 200) });
    const report = detector.check(train, null, test);
    expect(report.leaked).toBe(false);
    expect(report.summary).toContain('No leakage');
  });

  it('detects exact duplicate leakage', () => {
    const detector = new CalibrationLeakageDetector();
    const records = makeRecords(100);
    // Train and test share some records
    const trainRec = records.slice(0, 80);
    const testRec = [...records.slice(70, 100)]; // 10 overlap
    const train = builder.build({ id: 't', datasetVersion: '1.0.0', records: trainRec });
    const test = builder.build({ id: 's', datasetVersion: '1.0.0', records: testRec });
    const report = detector.check(train, null, test, { tolerancePct: 0 });
    expect(report.trainTestIntersection).toBeGreaterThan(0);
  });

  it('detects temporal leakage', () => {
    const detector = new CalibrationLeakageDetector();
    const train = builder.build({ id: 't', datasetVersion: '1.0.0', records: makeRecords(100, '2026-01-05', 0) });
    const test = builder.build({ id: 's', datasetVersion: '1.0.0', records: makeRecords(50, '2026-01-01', 0) });
    const report = detector.check(train, null, test);
    expect(report.leaked).toBe(false);
    const hasTemporal = report.findings.some(f => f.code === 'TEMPORAL_LEAKAGE');
    expect(hasTemporal).toBe(true);
  });

  it('strict mode flags intersection as error', () => {
    const detector = new CalibrationLeakageDetector({ strict: true });
    const records = makeRecords(50);
    const train = builder.build({ id: 't', datasetVersion: '1.0.0', records });
    const test = builder.build({ id: 's', datasetVersion: '1.0.0', records: [...records].reverse() });
    // All records overlap
    const report = detector.check(train, null, test, { tolerancePct: 0 });
    expect(report.leaked).toBe(true);
  });

  it('tolerancePct allows small overlap', () => {
    const detector = new CalibrationLeakageDetector({ strict: false });
    const records = makeRecords(100);
    const trainRec = records.slice(0, 99);
    const testRec = [...records.slice(98, 100)]; // 1 overlap
    const train = builder.build({ id: 't', datasetVersion: '1.0.0', records: trainRec });
    const test = builder.build({ id: 's', datasetVersion: '1.0.0', records: testRec });
    const report = detector.check(train, null, test, { tolerancePct: 2 });
    expect(report.leaked).toBe(false);
  });
});
