import { describe, it, expect } from 'vitest';
import {
  DATASET_COMPARISON_CLASSIFICATION,
  DATASET_DIFFERENCE_CATEGORY,
  DATASET_COMPARISON_MODE,
  DatasetComparator,
} from '../../src/historical-evidence/index.js';
import { createComparisonFixture } from './fixtures/datasetComparisonFixture.js';

const comparator = new DatasetComparator();

function differenceCategories(report) {
  return report.differences.map((difference) => difference.category);
}

describe('DatasetComparator', () => {
  it('classifies identical datasets as an exact match in FULL mode', () => {
    const fixture = createComparisonFixture();

    const report = comparator.compare(
      {
        left: fixture.exactLeft,
        right: fixture.exactRight,
      },
      { mode: DATASET_COMPARISON_MODE.FULL },
    );

    expect(report.classification).toBe(DATASET_COMPARISON_CLASSIFICATION.EXACT_MATCH);
    expect(report.isExactMatch()).toBe(true);
    expect(report.isScientificallyEquivalent()).toBe(false);
    expect(report.isOperationallyEquivalent()).toBe(false);
    expect(report.isCompatible()).toBe(true);
    expect(report.comparable).toBe(true);
    expect(report.differences).toHaveLength(0);
    expect(report.summary).toMatchObject({
      scientificEvaluated: true,
      operationalEvaluated: true,
      integrityComparable: true,
    });
  });

  it('classifies matching science with drifted descriptor metadata as scientifically equivalent', () => {
    const fixture = createComparisonFixture();

    const report = comparator.compare(
      {
        left: fixture.scientificLeft,
        right: fixture.scientificRight,
      },
      { mode: DATASET_COMPARISON_MODE.FULL },
    );

    expect(report.classification).toBe(DATASET_COMPARISON_CLASSIFICATION.SCIENTIFICALLY_EQUIVALENT);
    expect(report.isScientificallyEquivalent()).toBe(true);
    expect(report.isExactMatch()).toBe(false);
    expect(report.comparable).toBe(true);
    expect(report.getDifference(DATASET_DIFFERENCE_CATEGORY.DESCRIPTOR)).not.toBeNull();
    expect(report.getScientificDifferences()).toHaveLength(0);
    expect(report.getOperationalDifferences().length).toBeGreaterThan(0);
  });

  it('reports divergent scientific content when one observation changes', () => {
    const fixture = createComparisonFixture();

    const report = comparator.compare(
      {
        left: fixture.divergentLeft,
        right: fixture.divergentRight,
      },
      { mode: DATASET_COMPARISON_MODE.FULL },
    );

    expect(report.classification).toBe(DATASET_COMPARISON_CLASSIFICATION.DIVERGENT);
    expect(report.isCompatible()).toBe(false);
    expect(report.comparable).toBe(true);
    expect(differenceCategories(report)).toContain(DATASET_DIFFERENCE_CATEGORY.OBSERVATIONS);
    expect(report.summary.observationConflictCount).toBe(1);
  });

  it('treats the operational mode as contract-equivalence only', () => {
    const fixture = createComparisonFixture();

    const report = comparator.compare(
      {
        left: fixture.exactLeft,
        right: fixture.exactRight,
      },
      { mode: DATASET_COMPARISON_MODE.OPERATIONAL },
    );

    expect(report.classification).toBe(DATASET_COMPARISON_CLASSIFICATION.OPERATIONALLY_EQUIVALENT);
    expect(report.operationalEvaluated).toBe(true);
    expect(report.scientificEvaluated).toBe(false);
    expect(report.comparable).toBe(true);
  });

  it('flags an integrity failure before claiming equivalence', () => {
    const fixture = createComparisonFixture();
    const corrupted = structuredClone(fixture.exactRight.dataset);
    corrupted.contentHash = '0'.repeat(64);

    const report = comparator.compare(
      {
        left: fixture.exactLeft,
        right: {
          dataset: corrupted,
          identity: fixture.exactRight.identity,
          descriptor: fixture.exactRight.descriptor,
        },
      },
      { mode: DATASET_COMPARISON_MODE.FULL },
    );

    expect(report.classification).toBe(DATASET_COMPARISON_CLASSIFICATION.INCOMPATIBLE);
    expect(report.comparable).toBe(false);
    expect(report.summary.reason).toMatch(/integrity/i);
  });
});
