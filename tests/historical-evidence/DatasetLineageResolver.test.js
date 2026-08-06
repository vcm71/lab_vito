import { describe, it, expect } from 'vitest';
import {
  DATASET_COMPARISON_CLASSIFICATION,
  DATASET_LINEAGE_RELATION_TYPE,
  DatasetLineageResolver,
  getDatasetLineagePrimaryRelation,
  getDatasetLineageRelation,
  hasDatasetLineageRelationType,
} from '../../src/historical-evidence/index.js';
import { createLineageFixture } from './fixtures/datasetLineageFixture.js';

const resolver = new DatasetLineageResolver();

describe('DatasetLineageResolver', () => {
  it('resolves identical datasets as scientific and operational equivalents', () => {
    const fixture = createLineageFixture();

    const resolution = resolver.resolve({
      left: fixture.exactLeft,
      right: fixture.exactRight,
    });

    expect(resolution.resolved).toBe(true);
    expect(resolution.comparable).toBe(true);
    expect(resolution.comparisonClassification).toBe(DATASET_COMPARISON_CLASSIFICATION.EXACT_MATCH);
    expect(resolution.relationTypes).toEqual([
      DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO,
      DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO,
    ]);
    expect(getDatasetLineagePrimaryRelation(resolution).type).toBe(
      DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO,
    );
    expect(hasDatasetLineageRelationType(resolution, DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO)).toBe(true);
    expect(hasDatasetLineageRelationType(resolution, DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO)).toBe(true);
    expect(getDatasetLineageRelation(resolution, DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO).type).toBe(
      DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO,
    );
    expect(resolution.summary.relationCount).toBe(2);
    expect(resolution.summary.declaredRelationCount).toBe(0);
    expect(resolution.summary.derivedRelationCount).toBe(2);
  });

  it('detects a declared parent relation and superseding replacement', () => {
    const fixture = createLineageFixture();

    const resolution = resolver.resolve({
      left: fixture.child,
      right: fixture.parent,
    });

    expect(resolution.resolved).toBe(true);
    expect(resolution.relationTypes).toEqual(
      expect.arrayContaining([
        DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES,
        DATASET_LINEAGE_RELATION_TYPE.PARENT_OF,
      ]),
    );
    expect(getDatasetLineagePrimaryRelation(resolution).type).toBe(DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES);
    expect(resolution.declaredRelationTypes).toEqual([
      DATASET_LINEAGE_RELATION_TYPE.PARENT_OF,
      DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES,
    ]);
    expect(resolution.derivedRelationTypes).toEqual([
      DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO,
    ]);
    expect(getDatasetLineageRelation(resolution, DATASET_LINEAGE_RELATION_TYPE.PARENT_OF).source).toEqual(fixture.parent.identity);
    expect(getDatasetLineageRelation(resolution, DATASET_LINEAGE_RELATION_TYPE.PARENT_OF).target).toEqual(fixture.child.identity);
    expect(resolution.summary.leftSourceDatasetId).toBe(fixture.parent.identity.datasetId);
  });

  it('marks divergent siblings with a shared source as merge candidates', () => {
    const fixture = createLineageFixture();

    const resolution = resolver.resolve({
      left: fixture.divergentLeft,
      right: fixture.divergentRight,
    });

    expect(resolution.comparisonClassification).toBe(DATASET_COMPARISON_CLASSIFICATION.DIVERGENT);
    expect(resolution.relationTypes).toEqual([DATASET_LINEAGE_RELATION_TYPE.MERGE_CANDIDATE]);
    expect(resolution.summary.sharedSourceDatasetId).toBe('ds-lineage-base');
    expect(resolution.summary.derivedRelationCount).toBe(1);
    expect(getDatasetLineagePrimaryRelation(resolution).type).toBe(DATASET_LINEAGE_RELATION_TYPE.MERGE_CANDIDATE);
  });

  it('falls back to an incompatible relation when integrity cannot be reconciled', () => {
    const fixture = createLineageFixture();

    const resolution = resolver.resolve({
      left: fixture.incompatibleLeft,
      right: fixture.incompatibleRight,
    });

    expect(resolution.comparisonClassification).toBe(DATASET_COMPARISON_CLASSIFICATION.INCOMPATIBLE);
    expect(resolution.relationTypes).toEqual([DATASET_LINEAGE_RELATION_TYPE.INCOMPATIBLE]);
    expect(resolution.resolved).toBe(true);
    expect(resolution.compatible).toBe(false);
    expect(getDatasetLineagePrimaryRelation(resolution).type).toBe(DATASET_LINEAGE_RELATION_TYPE.INCOMPATIBLE);
  });
});
