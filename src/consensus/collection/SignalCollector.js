import {
  AMERICAN_ROULETTE_NUMBERS,
  CONSENSUS_SOURCE_ENGINES,
  WARNING_SEVERITY,
} from '../constants/consensusConstants.js';
import { validateConsensusSignal } from '../validators/validateConsensusSignal.js';
import { cloneConsensusSignal } from '../utils/cloneConsensusSignal.js';

// ── Mode constants ──────────────────────────────────────────────────────────
const MODE_STRICT = 'strict';
const MODE_TOLERANT = 'tolerant';
const VALID_MODES = new Set([MODE_STRICT, MODE_TOLERANT]);

// ── Warning codes ───────────────────────────────────────────────────────────
const WARN_CODES = {
  ENGINE_FAILED: 'SIGNAL_COLLECTOR_ENGINE_FAILED',
  INVALID_COLLECTION: 'SIGNAL_COLLECTOR_INVALID_COLLECTION',
  INVALID_SIGNAL: 'SIGNAL_COLLECTOR_INVALID_SIGNAL',
  DUPLICATE_NUMBER: 'SIGNAL_COLLECTOR_DUPLICATE_NUMBER',
  MISSING_NUMBER: 'SIGNAL_COLLECTOR_MISSING_NUMBER',
  UNKNOWN_NUMBER: 'SIGNAL_COLLECTOR_UNKNOWN_NUMBER',
  SOURCE_MISMATCH: 'SIGNAL_COLLECTOR_SOURCE_MISMATCH',
  INCOMPLETE_NUMBER: 'SIGNAL_COLLECTOR_INCOMPLETE_NUMBER',
};

// ── Engine-to-adapter mapping ───────────────────────────────────────────────
const ENGINE_TO_ADAPTER_KEY = {
  [CONSENSUS_SOURCE_ENGINES.LAB_CON]: 'labConAdapter',
  [CONSENSUS_SOURCE_ENGINES.LAB_CON_1]: 'labCon1Adapter',
  [CONSENSUS_SOURCE_ENGINES.AT_REP]: 'atRepAdapter',
};

const ADAPTER_ENGINE_NAMES = Object.freeze({
  labConAdapter: CONSENSUS_SOURCE_ENGINES.LAB_CON,
  labCon1Adapter: CONSENSUS_SOURCE_ENGINES.LAB_CON_1,
  atRepAdapter: CONSENSUS_SOURCE_ENGINES.AT_REP,
});

const ALL_ENGINES = Object.freeze(Object.values(CONSENSUS_SOURCE_ENGINES));

// ── Helpers ─────────────────────────────────────────────────────────────────
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildWarning(code, message, engine = null, number = null, severity = WARNING_SEVERITY.ERROR) {
  return {
    code,
    message,
    severity,
    source: 'SignalCollector',
    engine,
    number,
  };
}

/**
 * Validates that a value looks like an adapter contract — has an `adapt`
 * method that is a function.
 */
function validateAdapterShape(adapter, label) {
  if (!adapter || typeof adapter !== 'object') {
    throw new TypeError(`SignalCollector: ${label} must be an adapter object.`);
  }
  if (typeof adapter.adapt !== 'function') {
    throw new TypeError(`SignalCollector: ${label} must expose an adapt() method.`);
  }
}

/**
 * Tries to extract a valid roulette number from a signal.
 * Returns the normalized string or null.
 */
function extractNumber(signal) {
  if (!isPlainObject(signal)) {
    return null;
  }
  const num = signal.number;
  if (typeof num !== 'string') {
    return null;
  }
  if (num === '0' || num === '00') {
    return num;
  }
  if (/^(?:[1-9]|[12]\d|3[0-6])$/.test(num)) {
    return num;
  }
  return null;
}

/**
 * Fully clones a signal array for deep immutability.
 */
function cloneSignalArray(signals) {
  if (!Array.isArray(signals)) {
    return [];
  }
  return signals.map(signal => cloneConsensusSignal(signal));
}

// ── SignalCollector ────────────────────────────────────────────────────────
export class SignalCollector {
  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.labConAdapter   — LabConAdapter instance
   * @param {Object} dependencies.labCon1Adapter  — LabCon1Adapter instance
   * @param {Object} dependencies.atRepAdapter    — AtRepAdapter instance
   */
  constructor({ labConAdapter, labCon1Adapter, atRepAdapter } = {}) {
    if (!isPlainObject(arguments[0])) {
      throw new TypeError('SignalCollector: constructor expects a plain object with { labConAdapter, labCon1Adapter, atRepAdapter }.');
    }

    validateAdapterShape(labConAdapter, 'labConAdapter');
    validateAdapterShape(labCon1Adapter, 'labCon1Adapter');
    validateAdapterShape(atRepAdapter, 'atRepAdapter');

    this._adapters = Object.freeze({
      labConAdapter,
      labCon1Adapter,
      atRepAdapter,
    });

    // Default clock — can be overridden per collect() call via options.clock
    this._defaultClock = () => new Date().toISOString();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Collect signals from all adapters.
   *
   * @param {Object} [options={}]
   * @param {string} [options.mode='tolerant']  — 'strict' | 'tolerant'
   * @param {Function} [options.clock]          — () => ISO-8601 string
   * @returns {Object} { numbers, metadata }
   */
  collect(options = {}) {
    if (!isPlainObject(options)) {
      throw new TypeError('SignalCollector.collect: options must be a plain object.');
    }

    const mode = this._resolveMode(options.mode);
    const clock = typeof options.clock === 'function' ? options.clock : this._defaultClock;

    const warnings = [];
    const engineStatus = this._initEngineStatus();

    // 1. Execute each adapter
    for (const [adapterKey, engineName] of Object.entries(ADAPTER_ENGINE_NAMES)) {
      try {
        const adapter = this._adapters[adapterKey];
        const rawSignals = adapter.adapt();
        engineStatus.results[engineName] = rawSignals;
        engineStatus.completed.push(engineName);
      } catch (error) {
        engineStatus.failed.push(engineName);
        engineStatus.errors.set(engineName, {
          message: error instanceof Error ? error.message : String(error),
          type: error instanceof Error ? error.constructor.name : typeof error,
        });
        warnings.push(buildWarning(
          WARN_CODES.ENGINE_FAILED,
          `${adapterKey} failed during signal collection: ${error instanceof Error ? error.message : String(error)}`,
          engineName,
          null,
          WARNING_SEVERITY.ERROR,
        ));

        if (mode === MODE_STRICT) {
          const error = new Error(
            `SignalCollector: strict mode — ${adapterKey} (${engineName}) failed.`,
          );
          error.engine = engineName;
          error.adapterKey = adapterKey;
          throw error;
        }
      }
    }

    // 2. Validate and group each completed engine's signals
    for (const engineName of engineStatus.completed) {
      const rawSignals = engineStatus.results[engineName];

      // Validate the collection is an array
      if (!Array.isArray(rawSignals)) {
        warnings.push(buildWarning(
          WARN_CODES.INVALID_COLLECTION,
          `${engineName} returned a non-array collection: ${typeof rawSignals}.`,
          engineName,
          null,
          WARNING_SEVERITY.ERROR,
        ));
        // Move from completed to failed
        engineStatus.completed = engineStatus.completed.filter(e => e !== engineName);
        engineStatus.failed.push(engineName);
        engineStatus.errors.set(engineName, {
          message: `Non-array collection: ${typeof rawSignals}`,
          type: 'InvalidCollection',
        });
        engineStatus.results[engineName] = null;
        continue;
      }

      // Detect empty array
      if (rawSignals.length === 0) {
        warnings.push(buildWarning(
          WARN_CODES.INVALID_COLLECTION,
          `${engineName} returned an empty array.`,
          engineName,
          null,
          WARNING_SEVERITY.WARNING,
        ));
      }

      // Validate each signal
      const validated = [];
      const seenNumbers = new Set();

      for (const signal of rawSignals) {
        // Check structural validity
        if (!isPlainObject(signal)) {
          warnings.push(buildWarning(
            WARN_CODES.INVALID_SIGNAL,
            `${engineName} returned a non-object signal.`,
            engineName,
            null,
            WARNING_SEVERITY.ERROR,
          ));
          continue;
        }

        const validation = validateConsensusSignal(signal);
        if (!validation.valid) {
          warnings.push(buildWarning(
            WARN_CODES.INVALID_SIGNAL,
            `${engineName} signal failed structural validation: ${validation.errors.map(e => e.message).join('; ')}.`,
            engineName,
            extractNumber(signal) || null,
            WARNING_SEVERITY.ERROR,
          ));
          continue;
        }

        // Check number belongs to American universe
        const num = extractNumber(signal);
        if (num === null || !AMERICAN_ROULETTE_NUMBERS.includes(num)) {
          warnings.push(buildWarning(
            WARN_CODES.UNKNOWN_NUMBER,
            `${engineName} returned a signal with unknown number: ${JSON.stringify(signal.number)}.`,
            engineName,
            typeof signal.number === 'string' ? signal.number : null,
            WARNING_SEVERITY.ERROR,
          ));
          continue;
        }

        // Check duplicate within same engine
        if (seenNumbers.has(num)) {
          warnings.push(buildWarning(
            WARN_CODES.DUPLICATE_NUMBER,
            `${engineName} returned duplicate signal for number "${num}".`,
            engineName,
            num,
            WARNING_SEVERITY.ERROR,
          ));
          // In tolerant mode, skip the duplicate; in strict, skip and warn
          continue;
        }

        seenNumbers.add(num);

        // Check source engine consistency
        const declaredEngines = signal.sourceEngines;
        if (!Array.isArray(declaredEngines) || !declaredEngines.includes(engineName)) {
          warnings.push(buildWarning(
            WARN_CODES.SOURCE_MISMATCH,
            `${engineName} signal for "${num}" declares sourceEngines ${JSON.stringify(declaredEngines)} but was collected from ${engineName}.`,
            engineName,
            num,
            WARNING_SEVERITY.ERROR,
          ));

          if (mode === MODE_STRICT) {
            const error = new Error(
              `SignalCollector: strict mode — source mismatch in ${engineName} for number "${num}".`,
            );
            error.engine = engineName;
            error.number = num;
            throw error;
          }
          // In tolerant mode, still accept but warn
        }

        // Deep clone for immutability
        validated.push(cloneConsensusSignal(signal));
      }

      // Check for missing numbers
      for (const expectedNum of AMERICAN_ROULETTE_NUMBERS) {
        if (!seenNumbers.has(expectedNum)) {
          warnings.push(buildWarning(
            WARN_CODES.MISSING_NUMBER,
            `${engineName} did not return a signal for number "${expectedNum}".`,
            engineName,
            expectedNum,
            WARNING_SEVERITY.WARNING,
          ));
        }
      }

      engineStatus.results[engineName] = validated;
    }

    // 3. Build the grouped output by number
    const numbers = {};
    for (const num of AMERICAN_ROULETTE_NUMBERS) {
      const signals = {};

      for (const engineName of ALL_ENGINES) {
        if (engineStatus.failed.includes(engineName)) {
          signals[engineName] = null;
          continue;
        }

        const engineResults = engineStatus.results[engineName];
        if (!Array.isArray(engineResults)) {
          signals[engineName] = null;
          continue;
        }

        const found = engineResults.find(signal => signal.number === num) || null;
        signals[engineName] = found;
      }

      numbers[num] = {
        number: num,
        signals,
      };
    }

    // 4. Compute metadata
    const totalSignals = Object.values(numbers).reduce((count, entry) => {
      let entryCount = 0;
      for (const engineName of ALL_ENGINES) {
        if (entry.signals[engineName] !== null) {
          entryCount += 1;
        }
      }
      return count + entryCount;
    }, 0);

    const completeNumbers = Object.values(numbers).filter(entry => {
      for (const engineName of ALL_ENGINES) {
        if (entry.signals[engineName] === null) {
          return false;
        }
      }
      return true;
    }).length;

    const incompleteNumbers = AMERICAN_ROULETTE_NUMBERS.length - completeNumbers;

    const metadata = {
      collectedAt: clock(),
      enginesRequested: [...ALL_ENGINES],
      enginesCompleted: [...engineStatus.completed],
      enginesFailed: [...engineStatus.failed],
      totalNumbers: AMERICAN_ROULETTE_NUMBERS.length,
      totalSignals,
      completeNumbers,
      incompleteNumbers,
      warnings: [...warnings],
      provenance: {
        collector: 'SignalCollector',
        adapters: ['LabConAdapter', 'LabCon1Adapter', 'AtRepAdapter'],
      },
    };

    return { numbers, metadata };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  _resolveMode(mode) {
    if (mode === undefined) {
      return MODE_TOLERANT;
    }
    if (typeof mode !== 'string') {
      throw new TypeError('SignalCollector.collect: mode must be a string.');
    }
    const normalized = mode.toLowerCase();
    if (!VALID_MODES.has(normalized)) {
      throw new RangeError(`SignalCollector.collect: mode must be 'strict' or 'tolerant', got '${mode}'.`);
    }
    return normalized;
  }

  _initEngineStatus() {
    return {
      results: {},
      completed: [],
      failed: [],
      errors: new Map(),
    };
  }
}
