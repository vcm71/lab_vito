import {
  canonicalSortObservations,
  createDatasetPartition,
  createGroupedTemporalSplit,
  createSplitMetadata,
  createSplitPeriod,
  DatasetPartitionType,
  GROUPED_TEMPORAL_GROUPING_KEY,
  GROUPED_TEMPORAL_SPLIT_STRATEGY,
  GROUPED_TEMPORAL_TEMPORAL_KEY,
} from '../domain/index.js';
import { DatasetIntegrityVerifier, DATASET_INTEGRITY_CHECK_IDS } from './DatasetIntegrityVerifier.js';
import {
  createGroupedTemporalSplitConfiguration,
  isGroupedTemporalSplitConfiguration,
} from './GroupedTemporalSplitConfiguration.js';
import {
  AmbiguousSpinTimestampError,
  DatasetSplitInputError,
  EmptyDatasetPartitionError,
  GroupedTemporalSplitExecutionError,
  UnassignedSpinGroupError,
  InvalidGroupedTemporalSplitConfigurationError,
} from '../domain/errors.js';

const INTEGRITY_CHECKS = Object.freeze([
  DATASET_INTEGRITY_CHECK_IDS.CONTENT_HASH,
  DATASET_INTEGRITY_CHECK_IDS.MANIFEST_HASH,
  DATASET_INTEGRITY_CHECK_IDS.DATASET_SCHEMA,
  DATASET_INTEGRITY_CHECK_IDS.OBSERVATION_SCHEMA,
  DATASET_INTEGRITY_CHECK_IDS.CANONICAL_ORDER,
  DATASET_INTEGRITY_CHECK_IDS.DUPLICATES,
  DATASET_INTEGRITY_CHECK_IDS.CHRONOLOGY,
  DATASET_INTEGRITY_CHECK_IDS.STATISTICS,
  DATASET_INTEGRITY_CHECK_IDS.SCIENTIFIC_STRUCTURE,
  DATASET_INTEGRITY_CHECK_IDS.DATASET_IDENTITY,
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertDataset(dataset) {
  if (!isPlainObject(dataset)) {
    throw new DatasetSplitInputError('dataset must be a plain object');
  }
  if (!Array.isArray(dataset.observations)) {
    throw new DatasetSplitInputError('dataset.observations must be an array');
  }
  if (dataset.observations.length === 0) {
    throw new DatasetSplitInputError('dataset.observations must not be empty');
  }
}

function assertConfiguration(configuration) {
  if (isGroupedTemporalSplitConfiguration(configuration)) {
    return configuration;
  }
  try {
    return createGroupedTemporalSplitConfiguration(configuration ?? {});
  } catch (error) {
    if (error instanceof InvalidGroupedTemporalSplitConfigurationError) {
      throw error;
    }
    throw new InvalidGroupedTemporalSplitConfigurationError(
      error instanceof Error ? error.message : 'invalid grouped temporal split configuration',
    );
  }
}

function compareStrings(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function observationTimestamp(observation) {
  if (typeof observation.predictionCreatedAt !== 'string' || observation.predictionCreatedAt.length === 0) {
    throw new DatasetSplitInputError(
      `observation ${JSON.stringify(observation.observationId ?? '<unknown>')} is missing predictionCreatedAt`,
    );
  }
  return observation.predictionCreatedAt;
}

function observationSpinId(observation) {
  if (typeof observation.spinId !== 'string' || observation.spinId.length === 0) {
    throw new UnassignedSpinGroupError(
      `observation ${JSON.stringify(observation.observationId ?? '<unknown>')} is missing spinId`,
    );
  }
  return observation.spinId;
}

function buildGroup(observations) {
  if (observations.length === 0) {
    throw new DatasetSplitInputError('spin groups cannot be empty');
  }

  const spinId = observationSpinId(observations[0]);
  const timestamp = observationTimestamp(observations[0]);
  for (const observation of observations) {
    const currentSpinId = observationSpinId(observation);
    if (currentSpinId !== spinId) {
      throw new UnassignedSpinGroupError(
        `observations for the same group cannot mix spinIds (${JSON.stringify(spinId)} vs ${JSON.stringify(currentSpinId)})`,
      );
    }
    const currentTimestamp = observationTimestamp(observation);
    if (currentTimestamp !== timestamp) {
      throw new AmbiguousSpinTimestampError(
        `spin ${JSON.stringify(spinId)} has multiple predictionCreatedAt values (${JSON.stringify(timestamp)} vs ${JSON.stringify(currentTimestamp)})`,
      );
    }
  }

  const canonicalObservations = canonicalSortObservations([...observations]);
  const observationIds = canonicalObservations.map((observation) => observation.observationId);
  const uniqueSpinIds = [spinId];

  return {
    spinId,
    timestamp,
    observations: canonicalObservations,
    observationIds,
    spinIds: uniqueSpinIds,
  };
}

function groupObservationsBySpin(observations) {
  const grouped = new Map();
  for (const observation of observations) {
    const spinId = observationSpinId(observation);
    const existing = grouped.get(spinId);
    if (existing === undefined) {
      grouped.set(spinId, [observation]);
      continue;
    }
    existing.push(observation);
  }

  const groups = [];
  for (const observationsForSpin of grouped.values()) {
    groups.push(buildGroup(observationsForSpin));
  }

  return groups.sort((left, right) => {
    const timestampComparison = compareStrings(left.timestamp, right.timestamp);
    if (timestampComparison !== 0) return timestampComparison;
    return compareStrings(left.spinId, right.spinId);
  });
}

function buildPartition({ partitionType, groups, sourceDatasetIdentity }) {
  if (groups.length === 0) {
    throw new EmptyDatasetPartitionError(`${partitionType} partition would be empty`);
  }

  const firstTimestamp = groups[0].timestamp;
  const lastTimestamp = groups[groups.length - 1].timestamp;
  const observations = groups.flatMap((group) => group.observations);
  const observationIds = observations.map((observation) => observation.observationId);
  const spinIds = groups.map((group) => group.spinId);

  return createDatasetPartition({
    partitionType,
    period: createSplitPeriod({ from: firstTimestamp, to: lastTimestamp }),
    sourceDatasetIdentity,
    observationIds,
    spinIds,
  });
}

function partitionGroups(groups, configuration) {
  const trainGroups = [];
  const validationGroups = [];
  const testGroups = [];

  for (const group of groups) {
    if (group.timestamp <= configuration.trainUntil) {
      trainGroups.push(group);
      continue;
    }
    if (configuration.validationUntil !== null && group.timestamp <= configuration.validationUntil) {
      validationGroups.push(group);
      continue;
    }
    testGroups.push(group);
  }

  return { trainGroups, validationGroups, testGroups };
}

function assertPartitionCoverage(partitions, hasValidation) {
  const required = hasValidation
    ? [
        ['TRAIN', partitions.trainGroups],
        ['VALIDATION', partitions.validationGroups],
        ['TEST', partitions.testGroups],
      ]
    : [
        ['TRAIN', partitions.trainGroups],
        ['TEST', partitions.testGroups],
      ];

  for (const [name, groups] of required) {
    if (groups.length === 0) {
      throw new EmptyDatasetPartitionError(`${name} partition would be empty`);
    }
  }
}

export class GroupedTemporalDatasetSplitter {
  constructor({ integrityVerifier = new DatasetIntegrityVerifier() } = {}) {
    this.integrityVerifier = integrityVerifier;
  }

  split({ dataset, configuration, splitId, createdAt }) {
    assertDataset(dataset);
    const safeConfiguration = assertConfiguration(configuration);

    if (typeof splitId !== 'string' || splitId.length === 0) {
      throw new DatasetSplitInputError('splitId must be a non-empty string');
    }
    if (typeof createdAt !== 'string' || createdAt.length === 0) {
      throw new DatasetSplitInputError('createdAt must be a non-empty ISO timestamp');
    }

    const verification = this.integrityVerifier?.verify;
    if (typeof verification !== 'function') {
      throw new DatasetSplitInputError('integrityVerifier must expose a verify(input, options) function');
    }

    const integrityReport = verification.call(
      this.integrityVerifier,
      {
        dataset,
        identity: safeConfiguration.sourceDatasetIdentity,
      },
      {
        mode: 'FULL',
        checks: INTEGRITY_CHECKS,
      },
    );

    if (integrityReport.status !== 'VALID') {
      throw new GroupedTemporalSplitExecutionError(
        `dataset integrity verification failed with status ${JSON.stringify(integrityReport.status)}`,
      );
    }

    const groups = groupObservationsBySpin(dataset.observations);
    const partitions = partitionGroups(groups, safeConfiguration);
    assertPartitionCoverage(partitions, safeConfiguration.validationUntil !== null);

    const splitMetadata = createSplitMetadata({
      sourceDatasetIdentity: safeConfiguration.sourceDatasetIdentity,
      createdAt,
      splitId,
      strategy: GROUPED_TEMPORAL_SPLIT_STRATEGY,
      groupingKey: GROUPED_TEMPORAL_GROUPING_KEY,
      temporalKey: GROUPED_TEMPORAL_TEMPORAL_KEY,
    });

    const outputPartitions = [
      buildPartition({
        partitionType: DatasetPartitionType.TRAIN,
        groups: partitions.trainGroups,
        sourceDatasetIdentity: safeConfiguration.sourceDatasetIdentity,
      }),
    ];

    if (safeConfiguration.validationUntil !== null) {
      outputPartitions.push(
        buildPartition({
          partitionType: DatasetPartitionType.VALIDATION,
          groups: partitions.validationGroups,
          sourceDatasetIdentity: safeConfiguration.sourceDatasetIdentity,
        }),
      );
    }

    outputPartitions.push(
      buildPartition({
        partitionType: DatasetPartitionType.TEST,
        groups: partitions.testGroups,
        sourceDatasetIdentity: safeConfiguration.sourceDatasetIdentity,
      }),
    );

    return createGroupedTemporalSplit({
      metadata: splitMetadata,
      partitions: outputPartitions,
    });
  }
}
