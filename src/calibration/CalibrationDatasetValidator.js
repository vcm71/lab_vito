/**
 * CalibrationDatasetValidator — validates historical records for
 * calibration datasets.
 *
 * Checks: ranges, NaN, Infinity, duplicates, out-of-range scores,
 * invalid outcomes, timestamps.
 *
 * Returns { valid, issues[] } — issues are { field, message, severity }.
 */

export class CalibrationDatasetValidator {
  constructor(options = {}) {
    this.mode = options.mode ?? 'tolerant';
  }

  /**
   * @param {Array} records
   * @returns {{ valid: boolean, issues: Array<{field: string, message: string, severity: 'error'|'warning'}> }}
   */
  validate(records) {
    const issues = [];

    if (!Array.isArray(records) || records.length === 0) {
      issues.push({ field: 'records', message: 'Records array is empty or not an array.', severity: 'error' });
      return { valid: false, issues };
    }

    const seenHashes = new Set();

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const prefix = `records[${i}]`;

      // Required fields
      if (r == null || typeof r !== 'object') {
        issues.push({ field: prefix, message: 'Record is null or not an object.', severity: 'error' });
        continue;
      }

      if (r.rawConsensusScore === undefined) {
        issues.push({ field: `${prefix}.rawConsensusScore`, message: 'Missing rawConsensusScore.', severity: 'error' });
      } else if (typeof r.rawConsensusScore !== 'number') {
        issues.push({ field: `${prefix}.rawConsensusScore`, message: `rawConsensusScore is not a number: ${typeof r.rawConsensusScore}.`, severity: 'error' });
      } else if (isNaN(r.rawConsensusScore)) {
        issues.push({ field: `${prefix}.rawConsensusScore`, message: 'rawConsensusScore is NaN.', severity: 'error' });
      } else if (!isFinite(r.rawConsensusScore)) {
        issues.push({ field: `${prefix}.rawConsensusScore`, message: 'rawConsensusScore is Infinity.', severity: 'error' });
      } else if (r.rawConsensusScore < 0 || r.rawConsensusScore > 1) {
        issues.push({ field: `${prefix}.rawConsensusScore`, message: `rawConsensusScore out of [0,1]: ${r.rawConsensusScore}.`, severity: 'error' });
      }

      if (r.observedOutcome === undefined) {
        issues.push({ field: `${prefix}.observedOutcome`, message: 'Missing observedOutcome.', severity: 'error' });
      } else if (r.observedOutcome !== 0 && r.observedOutcome !== 1 && r.observedOutcome !== true && r.observedOutcome !== false) {
        issues.push({ field: `${prefix}.observedOutcome`, message: `observedOutcome must be 0/1: ${r.observedOutcome}.`, severity: 'error' });
      }

      // Timestamp
      if (r.timestamp === undefined || r.timestamp === null) {
        issues.push({ field: `${prefix}.timestamp`, message: 'Missing timestamp.', severity: 'warning' });
      }

      // Duplicate detection (by stable hash of fields)
      const key = `${r.rawConsensusScore}|${r.observedOutcome}|${r.timestamp ?? ''}`;
      if (seenHashes.has(key)) {
        issues.push({ field: prefix, message: 'Duplicate record detected.', severity: 'warning' });
      }
      seenHashes.add(key);
    }

    const hasErrors = issues.some(i => i.severity === 'error');
    return {
      valid: !hasErrors,
      issues,
    };
  }
}
