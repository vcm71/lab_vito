/**
 * @fileoverview Type contracts for the consensus infrastructure.
 *
 * This module intentionally contains only JSDoc typedefs so the runtime bundle
 * stays minimal and the canonical shape can be shared across the factory,
 * validator and tests without pulling in browser-specific dependencies.
 */

/**
 * @typedef {Object} ConsensusSignalWarning
 * @property {string} code
 * @property {string} message
 * @property {'INFO'|'WARNING'|'ERROR'} severity
 * @property {string} [source]
 */

/**
 * @typedef {Object} ConsensusSignalProvenance
 * @property {'Lab_Con'|'Lab_Con1'|'AtRep'} engine
 * @property {string} file
 * @property {string} method
 * @property {string|null} [version]
 */

/**
 * @typedef {Object} ConsensusDelaySignal
 * @property {number} actualDelay
 * @property {number} maxDelay
 * @property {number|null} delayRatio
 * @property {number|null} delayScore
 * @property {number|null} probabilityDelay
 * @property {number|null} pressure
 * @property {string[]} activeSets
 */

/**
 * @typedef {Object} ConsensusWinWinSignal
 * @property {number} atraso
 * @property {number} threshold
 * @property {string|null} level
 * @property {boolean} isActive
 * @property {number} streakLength
 * @property {number|null} streakBonus
 * @property {number|null} recencyBonus
 * @property {number|null} winWinScore
 */

/**
 * @typedef {Object} ConsensusPciBySet
 * @property {string} set
 * @property {number|null} pci
 */

/**
 * @typedef {Object} ConsensusPciSignal
 * @property {number} occurrences
 * @property {number|null} meanDist
 * @property {number|null} expectedDist
 * @property {number|null} pciIndividual
 * @property {number|null} pciCombined
 * @property {ConsensusPciBySet[]} pciBySet
 */

/**
 * @typedef {Object} ConsensusRawSignals
 * @property {ConsensusDelaySignal|null} delay
 * @property {ConsensusWinWinSignal|null} winWin
 * @property {ConsensusPciSignal|null} pci
 */

/**
 * @typedef {Object} ConsensusEvidence
 * @property {number} occurrences
 * @property {number} sampleSize
 * @property {string[]} activeSets
 * @property {number} windowSize
 * @property {number} historyLength
 * @property {number} supportCount
 * @property {'INSUFFICIENT'|'LOW'|'MEDIUM'|'HIGH'} signalQuality
 */

/**
 * @typedef {Object} ConsensusMetadata
 * @property {string|null} generatedAt
 * @property {boolean} valid
 * @property {ConsensusSignalWarning[]} warnings
 * @property {string[]} missingSignals
 * @property {ConsensusSignalProvenance[]} provenance
 */

/**
 * @typedef {Object} ConsensusSignal
 * @property {'1.0.0'} schemaVersion
 * @property {'0'|'00'|string} number
 * @property {Array<'Lab_Con'|'Lab_Con1'|'AtRep'>} sourceEngines
 * @property {ConsensusRawSignals} rawSignals
 * @property {ConsensusEvidence} evidence
 * @property {ConsensusMetadata} metadata
 */

export {};
