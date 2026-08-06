/**
 * CalibrationLeakageDetector — detects data leakage between training, validation,
 * and testing sets.
 *
 * Checks:
 *  1. Intersection detection (exact duplicate records by stable key)
 *  2. Temporal leakage (test timestamps < train timestamps)
 *  3. Group-level leakage (same groupId across partitions)
 *  4. Overlap ratio report
 *
 * Returns a LeakageReport: { leaked: boolean, findings: Array<{code, severity, message}>,
 *   trainTestIntersection, trainValIntersection, valTestIntersection,
 *   trainSize, valSize, testSize, summary }
 */

export class CalibrationLeakageDetector {
  constructor(options = {}) {
    this.strict = options.strict ?? true;
  }

  /**
   * Check group-level leakage: any groupId appearing in more than one partition.
   *
   * @param {import('./CalibrationDataset.js').CalibrationDataset} train
   * @param {import('./CalibrationDataset.js').CalibrationDataset} [validation]
   * @param {import('./CalibrationDataset.js').CalibrationDataset} [test]
   * @param {string} [groupField='groupId']
   * @returns {Object} { leaked: boolean, sharedGroups: string[], summary: string }
   */
  checkByGroups(train, validation = null, test = null, groupField = 'groupId') {
    const getGroupSet = (records) => {
      const s = new Set();
      for (const r of records) {
        const gid = r[groupField] ?? r.__groupId;
        if (gid !== undefined && gid !== null) s.add(String(gid));
      }
      return s;
    };

    const trainGroups = getGroupSet(train.records);
    const valGroups = validation ? getGroupSet(validation.records) : new Set();
    const testGroups = test ? getGroupSet(test.records) : new Set();

    const shared = [];
    for (const g of trainGroups) {
      if (testGroups.has(g)) shared.push(g);
    }
    if (validation) {
      for (const g of trainGroups) {
        if (valGroups.has(g) && !shared.includes(g)) shared.push(g);
      }
      for (const g of valGroups) {
        if (testGroups.has(g) && !shared.includes(g)) shared.push(g);
      }
    }

    return {
      leaked: shared.length > 0,
      sharedGroups: shared,
      summary: shared.length === 0
        ? 'CLEAN — no group appears in multiple partitions.'
        : `LEAK: ${shared.length} group(s) shared across partitions: ${shared.slice(0, 5).join(', ')}${shared.length > 5 ? '...' : ''}.`,
      trainGroupCount: trainGroups.size,
      valGroupCount: valGroups.size,
      testGroupCount: testGroups.size,
    };
  }

  /**
   * @param {import('./CalibrationDataset.js').CalibrationDataset} train
   * @param {import('./CalibrationDataset.js').CalibrationDataset} [validation]
   * @param {import('./CalibrationDataset.js').CalibrationDataset} [test]
   * @param {Object} [options]
   * @param {number} [options.tolerancePct=1] — % overlap tolerated before warning
   * @returns {Object} LeakageReport
   */
  check(train, validation = null, test = null, options = {}) {
    const tolerancePct = options.tolerancePct ?? 1;
    const findings = [];

    const trainKeys = buildKeySet(train.records);
    const valKeys = validation ? buildKeySet(validation.records) : new Set();
    const testKeys = test ? buildKeySet(test.records) : new Set();

    // 1. Intersection check
    const trainTestIntersection = countIntersection(trainKeys, testKeys, train.records.length);
    const trainValIntersection = validation ? countIntersection(trainKeys, valKeys, train.records.length) : 0;
    const valTestIntersection = (validation && test) ? countIntersection(valKeys, testKeys, validation.records.length) : 0;

    if (trainTestIntersection > 0 && (trainTestIntersection / Math.min(train.records.length, test ? test.records.length : 1)) * 100 > tolerancePct) {
      findings.push({ code: 'TRAIN_TEST_INTERSECTION', severity: this.strict ? 'error' : 'warning', message: `${trainTestIntersection} record(s) shared between training and testing sets.`, count: trainTestIntersection });
    }

    if (trainValIntersection > 0 && (trainValIntersection / Math.min(train.records.length, validation ? validation.records.length : 1)) * 100 > tolerancePct) {
      findings.push({ code: 'TRAIN_VAL_INTERSECTION', severity: 'warning', message: `${trainValIntersection} record(s) shared between training and validation sets.`, count: trainValIntersection });
    }

    if (valTestIntersection > 0 && (valTestIntersection / Math.min(validation ? validation.records.length : 1, test ? test.records.length : 1)) * 100 > tolerancePct) {
      findings.push({ code: 'VAL_TEST_INTERSECTION', severity: 'warning', message: `${valTestIntersection} record(s) shared between validation and testing sets.`, count: valTestIntersection });
    }

    // 2. Temporal leakage check
    if (test && train) {
      const maxTrainTs = maxTimestamp(train.records);
      const minTestTs = minTimestamp(test.records);
      if (maxTrainTs !== null && minTestTs !== null && maxTrainTs > minTestTs) {
        findings.push({ code: 'TEMPORAL_LEAKAGE', severity: 'warning', message: `Training data has timestamp (${maxTrainTs}) after earliest test timestamp (${minTestTs}).`, maxTrainTs, minTestTs });
      }
    }

    const leaked = findings.some(f => f.severity === 'error');
    let summary = 'CLEAN';

    if (findings.length === 0) {
      summary = 'No leakage detected.';
    } else if (leaked) {
      summary = `BLOCKED: ${findings.filter(f => f.severity === 'error').length} error(s), ${findings.filter(f => f.severity === 'warning').length} warning(s).`;
    } else {
      summary = `PASS with warnings: ${findings.length} warning(s).`;
    }

    return {
      leaked,
      findings,
      trainTestIntersection,
      trainValIntersection,
      valTestIntersection,
      trainSize: train.records.length,
      valSize: validation ? validation.records.length : 0,
      testSize: test ? test.records.length : 0,
      summary,
    };
  }
}

function stableKey(record) {
  return `${record.rawConsensusScore?.toFixed(8) ?? 'null'}|${record.observedOutcome ? 1 : 0}|${record.timestamp ?? ''}`;
}

function buildKeySet(records) {
  const s = new Set();
  for (const r of records) s.add(stableKey(r));
  return s;
}

function countIntersection(setA, setB, refSize) {
  let count = 0;
  for (const key of setA) {
    if (setB.has(key)) count++;
  }
  return count;
}

function maxTimestamp(records) {
  let max = null;
  for (const r of records) {
    if (r.timestamp !== undefined && r.timestamp !== null && r.timestamp !== '') {
      const t = typeof r.timestamp === 'number' ? r.timestamp : Date.parse(r.timestamp);
      if (!isNaN(t) && (max === null || t > max)) max = t;
    }
  }
  return max;
}

function minTimestamp(records) {
  let min = null;
  for (const r of records) {
    if (r.timestamp !== undefined && r.timestamp !== null && r.timestamp !== '') {
      const t = typeof r.timestamp === 'number' ? r.timestamp : Date.parse(r.timestamp);
      if (!isNaN(t) && (min === null || t < min)) min = t;
    }
  }
  return min;
}
