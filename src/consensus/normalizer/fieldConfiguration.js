/**
 * Default field-to-strategy configuration.
 *
 * Maps each ConsensusSignal field (family.fieldName) to a normalization
 * strategy name and optional parameters.
 *
 * Families:
 *   delay  — from Lab_Con (numerical delays, scores, ratios)
 *   winWin — from Lab_Con1 (streaks, bonuses, boolean isActive)
 *   pci    — from AtRep (occurrences, distances, PCI indices)
 *
 * Strategy choices:
 *   - PERCENTILE      for unbounded or skewed numerical signals
 *   - MIN_MAX         for signals with known finite range
 *   - ROBUST_MIN_MAX  for signals with known outliers (not used by default)
 *   - Z_SCORE         for signals where standard deviations matter
 *   - IDENTITY        for already-normalized ratios (probabilities, PCI)
 *   - BINARY          for boolean fields
 *   - CATEGORICAL     for string fields (level, verdict)
 */

export const DEFAULT_FIELD_CONFIGURATION = Object.freeze({
  // ── delay family (Lab_Con) ──────────────────────────────────────────
  'delay.actualDelay':      { strategy: 'PERCENTILE' },
  'delay.maxDelay':          { strategy: 'MIN_MAX' },
  'delay.delayRatio':        { strategy: 'IDENTITY' },     // Already [0, 1]
  'delay.delayScore':        { strategy: 'PERCENTILE' },
  'delay.probabilityDelay':  { strategy: 'IDENTITY' },     // Already [0, 1]
  'delay.pressure':          { strategy: 'PERCENTILE' },
  'delay.activeSets':        { strategy: 'CATEGORICAL' },  // String array — skip

  // ── winWin family (Lab_Con1) ────────────────────────────────────────
  'winWin.atraso':        { strategy: 'PERCENTILE' },
  'winWin.threshold':     { strategy: 'MIN_MAX' },
  'winWin.level':         { strategy: 'CATEGORICAL' },
  'winWin.isActive':      { strategy: 'BINARY' },
  'winWin.streakLength':  { strategy: 'PERCENTILE' },
  'winWin.streakBonus':   { strategy: 'PERCENTILE' },
  'winWin.recencyBonus':  { strategy: 'PERCENTILE' },
  'winWin.winWinScore':   { strategy: 'PERCENTILE' },

  // ── pci family (AtRep) ──────────────────────────────────────────────
  'pci.occurrences':    { strategy: 'PERCENTILE' },
  'pci.meanDist':       { strategy: 'PERCENTILE' },   // Lower = more attraction
  'pci.expectedDist':   { strategy: 'IDENTITY' },      // Theoretical constant
  'pci.pciIndividual':  { strategy: 'IDENTITY' },      // Already a ratio
  'pci.pciCombined':    { strategy: 'IDENTITY' },      // Already a ratio
  'pci.pciBySet':       { strategy: 'CATEGORICAL' },   // Array of objects — skip
});

/**
 * Keys are engine names as they appear in SignalCollector output.
 * Values are the family names as they appear in rawSignals.
 */
export const ENGINE_TO_FAMILY = Object.freeze({
  'Lab_Con':  'delay',
  'Lab_Con1': 'winWin',
  'AtRep':    'pci',
});

/**
 * List of fields that should be skipped entirely (not normalizable).
 * These are either arrays of objects or non-numeric aggregate fields.
 */
export const SKIP_FIELDS = Object.freeze(new Set([
  'delay.activeSets',
  'pci.pciBySet',
]));
