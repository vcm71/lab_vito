import { describe, it, expect } from 'vitest';
import { CalibrationLeakageDetector } from '../../src/calibration/CalibrationLeakageDetector.js';
import { CalibrationDataset } from '../../src/calibration/CalibrationDataset.js';

describe('CalibrationLeakageDetector — group leakage', () => {
  const detector = new CalibrationLeakageDetector({ strict: true });

  describe('checkByGroups', () => {
    it('detects clean split with no shared groups', () => {
      const train = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.5, observedOutcome: 1, groupId: 'g1' },
          { rawConsensusScore: 0.3, observedOutcome: 0, groupId: 'g1' },
        ],
        datasetVersion: 'v1',
      });
      const test = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.7, observedOutcome: 1, groupId: 'g2' },
          { rawConsensusScore: 0.2, observedOutcome: 0, groupId: 'g2' },
        ],
        datasetVersion: 'v1',
      });

      const result = detector.checkByGroups(train, null, test);
      expect(result.leaked).toBe(false);
      expect(result.sharedGroups).toEqual([]);
      expect(result.summary).toContain('CLEAN');
    });

    it('detects group leakage between train and test', () => {
      const train = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.5, observedOutcome: 1, groupId: 'g1' },
          { rawConsensusScore: 0.3, observedOutcome: 0, groupId: 'g2' },
        ],
        datasetVersion: 'v1',
      });
      const test = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.7, observedOutcome: 1, groupId: 'g1' }, // shared!
        ],
        datasetVersion: 'v1',
      });

      const result = detector.checkByGroups(train, null, test);
      expect(result.leaked).toBe(true);
      expect(result.sharedGroups).toContain('g1');
      expect(result.summary).toContain('LEAK');
    });

    it('detects leakage via __groupId field', () => {
      const train = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.5, observedOutcome: 1, __groupId: 'gA' },
        ],
        datasetVersion: 'v1',
      });
      const test = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.6, observedOutcome: 0, __groupId: 'gA' },
        ],
        datasetVersion: 'v1',
      });

      const result = detector.checkByGroups(train, null, test);
      expect(result.leaked).toBe(true);
    });

    it('handles records without groupId gracefully', () => {
      const train = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.5, observedOutcome: 1 },
          { rawConsensusScore: 0.3, observedOutcome: 0 },
        ],
        datasetVersion: 'v1',
      });
      const test = new CalibrationDataset({
        records: [
          { rawConsensusScore: 0.7, observedOutcome: 1 },
        ],
        datasetVersion: 'v1',
      });

      const result = detector.checkByGroups(train, null, test);
      expect(result.leaked).toBe(false);
      expect(result.trainGroupCount).toBe(0);
    });

    it('detects leakage between all three partitions', () => {
      const train = new CalibrationDataset({
        records: [{ rawConsensusScore: 0.5, observedOutcome: 1, groupId: 'shared' }],
        datasetVersion: 'v1',
      });
      const val = new CalibrationDataset({
        records: [{ rawConsensusScore: 0.6, observedOutcome: 0, groupId: 'shared' }],
        datasetVersion: 'v1',
      });
      const test = new CalibrationDataset({
        records: [{ rawConsensusScore: 0.4, observedOutcome: 1, groupId: 'shared' }],
        datasetVersion: 'v1',
      });

      const result = detector.checkByGroups(train, val, test);
      expect(result.leaked).toBe(true);
      expect(result.sharedGroups).toContain('shared');
    });
  });
});
