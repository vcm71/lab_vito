/**
 * CalibrationInputValidator — validates that the input to ProbabilityCalibrator
 * conforms to the ConsensusEngine public contract.
 *
 * Strict mode: throws on first violation.
 * Tolerant mode: returns warnings array, still validates reachable paths.
 */

const VALID_KEYS_ENTRY = [
  'number', 'rawConsensusScore', 'valid', 'invalidReason',
  'engineScores', 'engineContributions', 'agreement',
  'conflicts', 'confidence', 'coverage', 'explanation',
];

const VALID_KEYS_META = [
  'appliedAt', 'schemaVersion', 'mode', 'aggregationStrategy',
  'missingPolicy', 'processedNumbers', 'validNumbers', 'invalidNumbers',
  'configurationVersion', 'configurationSummary', 'warnings',
];

/**
 * @param {Object} input — ConsensusEngine.compute() output
 * @param {'strict'|'tolerant'} [mode='tolerant']
 * @returns {{valid:boolean, warnings:Array<{code:string,message:string}>}}
 * @throws {TypeError|Error} in strict mode
 */
export function validateCalibrationInput(input, mode = 'tolerant') {
  const warnings = [];
  const fail = (msg) => {
    if (mode === 'strict') throw new Error(`CalibrationInputValidator: ${msg}`);
    warnings.push({ code: 'CALIBRATION_INPUT_INVALID', message: msg });
  };

  if (!input || typeof input !== 'object') {
    fail('input must be a non-null object.');
    return { valid: false, warnings };
  }

  // Top-level structure
  if (!input.numbers || typeof input.numbers !== 'object' || Array.isArray(input.numbers)) {
    fail('input.numbers must be a non-null object mapping number keys to entries.');
    return { valid: false, warnings };
  }

  if (!input.metadata || typeof input.metadata !== 'object') {
    fail('input.metadata must be a non-null object.');
    return { valid: false, warnings };
  }

  if (!input.metadata.consensus || typeof input.metadata.consensus !== 'object') {
    fail('input.metadata.consensus must be a non-null object.');
    return { valid: false, warnings };
  }

  // Validate metadata fields
  for (const key of VALID_KEYS_META) {
    if (!(key in input.metadata.consensus)) {
      fail(`input.metadata.consensus.${key} is missing.`);
    }
  }

  // Validate per-number entries
  const numbers = input.numbers;
  for (const [numKey, entry] of Object.entries(numbers)) {
    if (!entry || typeof entry !== 'object') {
      fail(`input.numbers["${numKey}"] must be a non-null object.`);
      continue;
    }

    // Required fields at entry level
    for (const key of VALID_KEYS_ENTRY) {
      if (!(key in entry)) {
        fail(`input.numbers["${numKey}"].${key} is missing.`);
      }
    }

    // rawConsensusScore must be a number or null
    if (entry.rawConsensusScore !== null && typeof entry.rawConsensusScore !== 'number') {
      fail(`input.numbers["${numKey}"].rawConsensusScore must be number or null.`);
    }

    // valid must be boolean
    if (typeof entry.valid !== 'boolean') {
      fail(`input.numbers["${numKey}"].valid must be boolean.`);
    }

    // coverage must have coverageRatio
    if (entry.coverage && typeof entry.coverage.coverageRatio !== 'number') {
      fail(`input.numbers["${numKey}"].coverage.coverageRatio must be a number.`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
