import { deepFreeze } from './immutable.js';

export class EvidenceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'EvidenceError';
    this.code = code;
  }
}

export class InvalidNumberError extends EvidenceError {
  constructor(received) {
    super('INVALID_NUMBER', `Invalid roulette number: ${JSON.stringify(received)}.`);
    this.name = 'InvalidNumberError';
    this.received = received;
  }
}

export class InvalidWinningNumberError extends EvidenceError {
  constructor(received) {
    super('INVALID_WINNING_NUMBER', `Invalid winning number: ${JSON.stringify(received)}.`);
    this.name = 'InvalidWinningNumberError';
    this.received = received;
  }
}

export class InvalidPredictionTargetError extends EvidenceError {
  constructor(received) {
    super('INVALID_PREDICTION_TARGET', `Invalid prediction target: ${JSON.stringify(received)}.`);
    this.name = 'InvalidPredictionTargetError';
    this.received = received;
  }
}

export class InvalidConsensusScoreError extends EvidenceError {
  constructor(received) {
    super('INVALID_CONSENSUS_SCORE', `Invalid consensus score: ${JSON.stringify(received)}.`);
    this.name = 'InvalidConsensusScoreError';
    this.received = received;
  }
}

export class DuplicatePredictionError extends EvidenceError {
  constructor(detail = 'duplicate prediction') {
    super('DUPLICATE_PREDICTION', detail);
    this.name = 'DuplicatePredictionError';
    this.detail = detail;
  }
}

export class DuplicateOutcomeError extends EvidenceError {
  constructor(detail = 'duplicate outcome') {
    super('DUPLICATE_OUTCOME', detail);
    this.name = 'DuplicateOutcomeError';
    this.detail = detail;
  }
}

export class ContradictoryOutcomeError extends EvidenceError {
  constructor(detail = 'contradictory outcome') {
    super('CONTRADICTORY_OUTCOME', detail);
    this.name = 'ContradictoryOutcomeError';
    this.detail = detail;
  }
}

export class SpinNotFoundError extends EvidenceError {
  constructor(spinId) {
    super('SPIN_NOT_FOUND', `Spin not found: ${JSON.stringify(spinId)}.`);
    this.name = 'SpinNotFoundError';
    this.spinId = spinId;
  }
}

export class TemporalEvidenceLeakageError extends EvidenceError {
  constructor(spinId, predictionCreatedAt, outcomeRecordedAt) {
    super(
      'TEMPORAL_EVIDENCE_LEAKAGE',
      `Temporal evidence leakage for spin ${JSON.stringify(spinId)}: predictionCreatedAt=${JSON.stringify(
        predictionCreatedAt,
      )} outcomeRecordedAt=${JSON.stringify(outcomeRecordedAt)}.`,
    );
    this.name = 'TemporalEvidenceLeakageError';
    this.spinId = spinId;
    this.predictionCreatedAt = predictionCreatedAt;
    this.outcomeRecordedAt = outcomeRecordedAt;
  }
}

export class InvalidMetadataError extends EvidenceError {
  constructor(detail = 'invalid metadata') {
    super('INVALID_METADATA', detail);
    this.name = 'InvalidMetadataError';
    this.detail = detail;
  }
}

export class UnsupportedPredictionTargetError extends EvidenceError {
  constructor(received, supportedTargets = undefined) {
    super('UNSUPPORTED_PREDICTION_TARGET', `Unsupported prediction target: ${JSON.stringify(received)}.`);
    this.name = 'UnsupportedPredictionTargetError';
    this.received = received;
    this.supportedTargets = supportedTargets;
  }
}

export class EvidenceSpinMismatchError extends EvidenceError {
  constructor(detail = 'spin mismatch') {
    super('EVIDENCE_SPIN_MISMATCH', detail);
    this.name = 'EvidenceSpinMismatchError';
    this.detail = detail;
  }
}

export class InvalidObservationIdError extends EvidenceError {
  constructor(received) {
    super('INVALID_OBSERVATION_ID', `Invalid observation id: ${JSON.stringify(received)}.`);
    this.name = 'InvalidObservationIdError';
    this.received = received;
  }
}

export class DuplicateCalibrationObservationError extends EvidenceError {
  constructor(detail = 'duplicate calibration observation') {
    super('DUPLICATE_OBSERVATION', detail);
    this.name = 'DuplicateCalibrationObservationError';
    this.detail = detail;
  }
}

export class InvalidCalibrationObservationError extends EvidenceError {
  constructor(detail = 'invalid calibration observation') {
    super('INVALID_CALIBRATION_OBSERVATION', detail);
    this.name = 'InvalidCalibrationObservationError';
    this.detail = detail;
  }
}

export class InvalidConsensusOutputError extends EvidenceError {
  constructor(detail = 'invalid consensus output', code = 'INVALID_CONSENSUS_OUTPUT') {
    super(code, detail);
    this.name = 'InvalidConsensusOutputError';
    this.detail = detail;
    this.code = code;
  }
}

export class DatasetError extends EvidenceError {
  constructor(code, message) {
    super(code, message);
    this.name = 'DatasetError';
  }
}

export class InvalidDatasetIdError extends DatasetError {
  constructor(received) {
    super('INVALID_DATASET_ID', `Invalid dataset id: ${JSON.stringify(received)}.`);
    this.name = 'InvalidDatasetIdError';
    this.received = received;
  }
}

export class InvalidDatasetTimestampError extends DatasetError {
  constructor(field, received) {
    super('INVALID_DATASET_TIMESTAMP', `Invalid ${field}: ${JSON.stringify(received)}.`);
    this.name = 'InvalidDatasetTimestampError';
    this.field = field;
    this.received = received;
  }
}

export class InvalidDatasetOptionsError extends DatasetError {
  constructor(detail = 'invalid dataset options') {
    super('INVALID_DATASET_OPTIONS', detail);
    this.name = 'InvalidDatasetOptionsError';
    this.detail = detail;
  }
}

export class InvalidDatasetObservationError extends DatasetError {
  constructor(detail = 'invalid dataset observation', observationId = undefined) {
    super(
      'INVALID_DATASET_OBSERVATION',
      `Invalid dataset observation — ${detail}${observationId !== undefined ? ` (observationId ${JSON.stringify(observationId)})` : ''}.`,
    );
    this.name = 'InvalidDatasetObservationError';
    this.detail = detail;
    this.observationId = observationId;
  }
}

export class UnsupportedObservationSchemaError extends DatasetError {
  constructor(received, expected, observationId = null) {
    super(
      'UNSUPPORTED_OBSERVATION_SCHEMA',
      `Unsupported observation schema ${JSON.stringify(received)}${
        observationId ? ` for observation ${JSON.stringify(observationId)}` : ''
      } (expected ${JSON.stringify(expected)}).`,
    );
    this.name = 'UnsupportedObservationSchemaError';
    this.receivedSchema = received;
    this.expectedSchema = expected;
    this.observationId = observationId;
  }
}

export class DuplicateDatasetObservationError extends DatasetError {
  /**
   * @param {string} duplicateType — IDENTITY_DUPLICATE | IDENTITY_CONFLICT | LOGICAL_DUPLICATE | PREDICTION_DUPLICATE
   * @param {string} detail — deterministic, developer-facing description
   */
  constructor(duplicateType, detail) {
    super('DUPLICATE_DATASET_OBSERVATION', `Duplicate observation in dataset — ${detail}.`);
    this.name = 'DuplicateDatasetObservationError';
    this.duplicateType = duplicateType;
    this.detail = detail;
  }
}

export class EmptyHistoricalDatasetError extends DatasetError {
  /** @param {string} detail */
  constructor(detail = 'dataset would be empty') {
    super('EMPTY_HISTORICAL_DATASET', `Cannot assemble dataset — ${detail}.`);
    this.name = 'EmptyHistoricalDatasetError';
    this.detail = detail;
  }
}

export class InvalidDatasetVersionError extends DatasetError {
  /**
   * @param {string} detail — deterministic description of the invalid component
   * @param {*} [value] — the offending value, when applicable
   */
  constructor(detail, value) {
    super(
      'INVALID_DATASET_VERSION',
      `Invalid dataset version — ${detail}${value !== undefined ? ` (received ${JSON.stringify(value)})` : ''}.`,
    );
    this.name = 'InvalidDatasetVersionError';
    this.detail = detail;
    this.value = value;
  }
}

export class IncompatibleDatasetVersionError extends DatasetError {
  /**
   * @param {string} current — canonical current (consumer) version
   * @param {string} other — canonical other (artifact) version
   */
  constructor(current, other) {
    super(
      'INCOMPATIBLE_DATASET_VERSION',
      `Dataset version ${JSON.stringify(current)} is incompatible with ${JSON.stringify(other)} (major versions differ).`,
    );
    this.name = 'IncompatibleDatasetVersionError';
    this.current = current;
    this.other = other;
  }
}

export class InvalidDatasetIdentityError extends DatasetError {
  /** @param {string} detail */
  constructor(detail) {
    super('INVALID_DATASET_IDENTITY', `Invalid dataset identity — ${detail}.`);
    this.name = 'InvalidDatasetIdentityError';
    this.detail = detail;
  }
}

export class InvalidSnapshotDescriptorError extends DatasetError {
  /** @param {string} detail */
  constructor(detail) {
    super('INVALID_SNAPSHOT_DESCRIPTOR', `Invalid dataset snapshot descriptor — ${detail}.`);
    this.name = 'InvalidSnapshotDescriptorError';
    this.detail = detail;
  }
}

export class InvalidIntegrityVerificationInputError extends DatasetError {
  constructor(detail = 'invalid integrity verification input') {
    super('INVALID_INTEGRITY_VERIFICATION_INPUT', detail);
    this.name = 'InvalidIntegrityVerificationInputError';
    this.detail = detail;
  }
}

export class InvalidIntegrityVerificationOptionsError extends DatasetError {
  constructor(detail = 'invalid integrity verification options') {
    super('INVALID_INTEGRITY_VERIFICATION_OPTIONS', detail);
    this.name = 'InvalidIntegrityVerificationOptionsError';
    this.detail = detail;
  }
}

export class UnsupportedIntegrityCheckError extends DatasetError {
  constructor(checkId, detail = 'unsupported integrity check') {
    super('UNSUPPORTED_INTEGRITY_CHECK', detail);
    this.name = 'UnsupportedIntegrityCheckError';
    this.checkId = checkId;
    this.detail = detail;
  }
}

export class IncompleteIntegrityVerificationError extends DatasetError {
  constructor(detail = 'incomplete integrity verification') {
    super('INCOMPLETE_INTEGRITY_VERIFICATION', detail);
    this.name = 'IncompleteIntegrityVerificationError';
    this.detail = detail;
  }
}

export class InvalidDatasetComparisonInputError extends DatasetError {
  constructor(detail = 'invalid dataset comparison input') {
    super('INVALID_DATASET_COMPARISON_INPUT', detail);
    this.name = 'InvalidDatasetComparisonInputError';
    this.detail = detail;
  }
}

export class InvalidDatasetComparisonOptionsError extends DatasetError {
  constructor(detail = 'invalid dataset comparison options') {
    super('INVALID_DATASET_COMPARISON_OPTIONS', detail);
    this.name = 'InvalidDatasetComparisonOptionsError';
    this.detail = detail;
  }
}

export class UnsupportedDatasetComparisonModeError extends DatasetError {
  constructor(received) {
    super('UNSUPPORTED_DATASET_COMPARISON_MODE', `Unsupported dataset comparison mode: ${JSON.stringify(received)}.`);
    this.name = 'UnsupportedDatasetComparisonModeError';
    this.received = received;
  }
}

export class InvalidDatasetLineageInputError extends DatasetError {
  constructor(detail = 'invalid dataset lineage input') {
    super('INVALID_DATASET_LINEAGE_INPUT', detail);
    this.name = 'InvalidDatasetLineageInputError';
    this.detail = detail;
  }
}

export class InvalidDatasetLineageOptionsError extends DatasetError {
  constructor(detail = 'invalid dataset lineage options') {
    super('INVALID_DATASET_LINEAGE_OPTIONS', detail);
    this.name = 'InvalidDatasetLineageOptionsError';
    this.detail = detail;
  }
}

export class InvalidDatasetLineageRelationError extends DatasetError {
  constructor(detail = 'invalid dataset lineage relation') {
    super('INVALID_DATASET_LINEAGE_RELATION', detail);
    this.name = 'InvalidDatasetLineageRelationError';
    this.detail = detail;
  }
}

export class InvalidDatasetLineageResolutionError extends DatasetError {
  constructor(detail = 'invalid dataset lineage resolution') {
    super('INVALID_DATASET_LINEAGE_RESOLUTION', detail);
    this.name = 'InvalidDatasetLineageResolutionError';
    this.detail = detail;
  }
}

export class InvalidPartitionTypeError extends DatasetError {
  constructor(received) {
    super('INVALID_PARTITION_TYPE', `Invalid partition type: ${JSON.stringify(received)}.`);
    this.name = 'InvalidPartitionTypeError';
    this.received = received;
  }
}

export class InvalidSplitPeriodError extends DatasetError {
  constructor(detail = 'invalid split period') {
    super('INVALID_SPLIT_PERIOD', detail);
    this.name = 'InvalidSplitPeriodError';
    this.detail = detail;
  }
}

export class InvalidSplitMetadataError extends DatasetError {
  constructor(detail = 'invalid split metadata') {
    super('INVALID_SPLIT_METADATA', detail);
    this.name = 'InvalidSplitMetadataError';
    this.detail = detail;
  }
}

export class InvalidDatasetPartitionError extends DatasetError {
  constructor(detail = 'invalid dataset partition') {
    super('INVALID_DATASET_PARTITION', detail);
    this.name = 'InvalidDatasetPartitionError';
    this.detail = detail;
  }
}

export class InvalidGroupedTemporalSplitError extends DatasetError {
  constructor(detail = 'invalid grouped temporal split') {
    super('INVALID_GROUPED_TEMPORAL_SPLIT', detail);
    this.name = 'InvalidGroupedTemporalSplitError';
    this.detail = detail;
  }
}

export class InvalidGroupedTemporalSplitConfigurationError extends DatasetError {
  constructor(detail = 'invalid grouped temporal split configuration') {
    super('INVALID_GROUPED_TEMPORAL_SPLIT_CONFIGURATION', detail);
    this.name = 'InvalidGroupedTemporalSplitConfigurationError';
    this.detail = detail;
  }
}

export class DatasetSplitInputError extends DatasetError {
  constructor(detail = 'invalid dataset split input') {
    super('DATASET_SPLIT_INPUT', detail);
    this.name = 'DatasetSplitInputError';
    this.detail = detail;
  }
}

export class UnassignedSpinGroupError extends DatasetError {
  constructor(detail = 'unassigned spin group') {
    super('UNASSIGNED_SPIN_GROUP', detail);
    this.name = 'UnassignedSpinGroupError';
    this.detail = detail;
  }
}

export class AmbiguousSpinTimestampError extends DatasetError {
  constructor(detail = 'ambiguous spin timestamp') {
    super('AMBIGUOUS_SPIN_TIMESTAMP', detail);
    this.name = 'AmbiguousSpinTimestampError';
    this.detail = detail;
  }
}

export class EmptyDatasetPartitionError extends DatasetError {
  constructor(detail = 'empty dataset partition') {
    super('EMPTY_DATASET_PARTITION', detail);
    this.name = 'EmptyDatasetPartitionError';
    this.detail = detail;
  }
}

export class GroupedTemporalSplitExecutionError extends DatasetError {
  constructor(detail = 'grouped temporal split execution failed') {
    super('GROUPED_TEMPORAL_SPLIT_EXECUTION', detail);
    this.name = 'GroupedTemporalSplitExecutionError';
    this.detail = detail;
  }
}

export class InvalidDatasetSplitLeakageInputError extends DatasetError {
  constructor(detail = 'invalid dataset split leakage input') {
    super('INVALID_DATASET_SPLIT_LEAKAGE_INPUT', detail);
    this.name = 'InvalidDatasetSplitLeakageInputError';
    this.detail = detail;
  }
}

export class UnsupportedDatasetSplitValidationModeError extends DatasetError {
  constructor(received) {
    super('UNSUPPORTED_DATASET_SPLIT_VALIDATION_MODE', `Unsupported dataset split validation mode: ${JSON.stringify(received)}`);
    this.name = 'UnsupportedDatasetSplitValidationModeError';
    this.received = received;
  }
}

export class DatasetSplitLeakageDetectionError extends DatasetError {
  constructor(detail = 'dataset split leakage detection failed') {
    super('DATASET_SPLIT_LEAKAGE_DETECTION', detail);
    this.name = 'DatasetSplitLeakageDetectionError';
    this.detail = detail;
  }
}
